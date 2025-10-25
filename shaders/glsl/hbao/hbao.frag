#version 450

layout (binding = 0) uniform sampler2D samplerPositionDepth;
layout (binding = 1) uniform sampler2D samplerNormal;

layout (constant_id = 0) const int HBAO_DIRECTION_NUMS = 8;
layout (constant_id = 1) const int HBAO_STEP_NUMS = 6;

layout (binding = 2) uniform UBOHBAOSettings
{
	float radius;
	float intensity;
	float angleBias;
	float pad;
} uboHBAOSettings;

layout (binding = 3) uniform UBO 
{
	mat4 projection;
} ubo;

layout (location = 0) in vec2 inUV;

layout (location = 0) out float outFragColor;

#define PI 3.14159265359

// [0, 1]
float rand(vec2 uv) {
    return fract(sin(dot(uv.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// [0, 1] x [0, 1]
vec2 rand2(vec2 p) {
    return fract(sin(vec2(dot(p,vec2(234234.1,54544.7)), sin(dot(p,vec2(33332.5,18563.3))))) *323434.34344);
}

float falloff(float distanceSqr) {
	return 1.0 - clamp(distanceSqr / max(uboHBAOSettings.radius * uboHBAOSettings.radius, 0.0001), 0.0, 1.0);
}

vec2 projectToScreen(vec3 viewPos) {
	vec4 clipPos = ubo.projection * vec4(viewPos, 1.0);
	return (clipPos.xy / clipPos.w) * 0.5 + 0.5;
}

float computeHorizonAngle(vec3 origin, vec2 direction, float radius) {
	float stepSize = radius / HBAO_STEP_NUMS;
	float horizonAngle = -PI / 2.0;

	for (int i = 1; i <= HBAO_STEP_NUMS; i++) {
		float stepLength = stepSize * float(i);
		vec3 samplePos = origin + vec3(direction * stepLength, 0.0);
		vec2 sampleUV = projectToScreen(samplePos);

        if (sampleUV.x < 0.0 || sampleUV.x > 1.0 || sampleUV.y < 0.0 || sampleUV.y > 1.0) {
			continue;
		}

		vec3 sampleViewPos = texture(samplerPositionDepth, sampleUV).rgb;
		float sampleDepth = -sampleViewPos.z;

		float originDepth = -origin.z;

		float heightDiff = sampleDepth - originDepth;
		if (heightDiff > uboHBAOSettings.angleBias) {
			float angle = atan(heightDiff, stepLength);
			horizonAngle = max(horizonAngle, angle);
		}
	}
	return horizonAngle;
}

void main() 
{
	// Get G-Buffer values
	vec3 viewPos = texture(samplerPositionDepth, inUV).rgb;
    if (-viewPos.z <= 0.0) {
		outFragColor = 1.0;
		return;
	}
	vec3 normal = normalize(texture(samplerNormal, inUV).rgb * 2.0 - 1.0);

	ivec2 screenSize = textureSize(samplerPositionDepth, 0);
	vec2 inScreenSize = vec2(1.0 / float(screenSize.x), 1.0 / float(screenSize.y));
	
    // compute TBN
	vec3 up = abs(normal.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
	vec3 tangent = normalize(cross(up, normal));
	vec3 bitangent = cross(normal, tangent);

	// Calculate occlusion value
	vec2 rand = rand2(inUV);
    float angleDelta = 2.0 * PI / float(HBAO_DIRECTION_NUMS);
	float occlusion = 0.0f;

	for (int i = 0; i < HBAO_DIRECTION_NUMS; i++) {
	   float angle = angleDelta * (float(i) + rand.x);
	   vec2 dir = vec2(cos(angle), sin(angle));

       vec2 worldDir = dir.x * tangent.xy + dir.y * bitangent.xy;

	   float horizonAngle = computeHorizonAngle(viewPos, worldDir, uboHBAOSettings.radius);
	   occlusion += clamp(1.0 - sin(horizonAngle), 0.0, 1.0);
	}
	float ao = 1.0 - (occlusion * uboHBAOSettings.intensity / float(HBAO_DIRECTION_NUMS));

	outFragColor = ao;
}

