#version 450

layout (binding = 0) uniform sampler2D samplerPositionDepth;
layout (binding = 1) uniform sampler2D samplerNormal;

layout (constant_id = 0) const int GTAO_DIRECTION_NUMS = 8;
layout (constant_id = 1) const int GTAO_STEP_NUMS = 6;

layout (binding = 2) uniform UBOGTAOSettings
{
	float radius;
	float intensity;
	float bias;
	float pad1;
} uboGTAOSettings;

layout (binding = 3) uniform UBO 
{
	mat4 projection;
} ubo;

layout (location = 0) in vec2 inUV;

layout (location = 0) out float outFragColor;

#define PI 3.14159265359

vec2 projectToScreen(vec3 viewPos) {
	vec4 clipPos = ubo.projection * vec4(viewPos, 1.0);
	return (clipPos.xy / clipPos.w) * 0.5 + 0.5;
}


float findOcclusionDistance(vec3 origin, vec3 direction, float maxDist) {
	float stepSize = maxDist / float(GTAO_STEP_NUMS);
	for (int i = 1; i <= GTAO_STEP_NUMS; i++) {
		float stepLength = stepSize * float(i);
		vec3 samplePos = origin + direction * stepLength;
		vec2 sampleUV = projectToScreen(samplePos);

		if (sampleUV.x < 0.0 || sampleUV.x > 1.0 || sampleUV.y < 0.0 || sampleUV.y > 1.0) {
			continue;
		}

		vec3 sampleViewPos = texture(samplerPositionDepth, sampleUV).rgb;
		float sampleDepth = -sampleViewPos.z;

		float originDepth = -origin.z;

		if (sampleDepth < originDepth - uboGTAOSettings.bias) {
			return stepLength;
		}
	}
	return -1.0;
}

float computeOcclusionContribution(vec3 viewPos, vec3 normal, vec3 tangent, vec3 bitangent, vec2 dirTS, float radius) {
	vec3 sampleDir = normalize(dirTS.x * tangent + dirTS.y * bitangent + normal);

	float occclusionDist = findOcclusionDistance(viewPos, sampleDir, radius);
    if (occclusionDist < 0.0) {
		return 0.0;
	}

	vec3 occludePos = viewPos + sampleDir * occclusionDist;
	vec3 toOccluder = normalize(occludePos - viewPos);

	float cosTheta = clamp(dot(normal, toOccluder), 0.0, 1.0);
	return 1.0 - cosTheta;
}

void main() 
{
	vec3 viewPos = texture(samplerPositionDepth, inUV).rgb;
	if (-viewPos.z <= 0.0) {
		outFragColor = 1.0;
		return;
	}
	vec3 normal = normalize(texture(samplerNormal, inUV).rgb * 2.0 - 1.0);

	// compute TBN
	vec3 up = abs(normal.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
	vec3 tangent = normalize(cross(up, normal));
	vec3 bitangent = cross(normal, tangent);

	float occlusion = 0.0;
	const float goldenAngle = 2.399963229728653; // ~137.5 degrees

	for (int i = 0; i < GTAO_DIRECTION_NUMS; i++) {
	   float angle = float(i) * goldenAngle;
	   float r = sqrt(float(i + 1) / float(GTAO_DIRECTION_NUMS));
	   vec2 dirTS = vec2(cos(angle), sin(angle));

	   occlusion += computeOcclusionContribution(viewPos, normal, tangent, bitangent, dirTS, uboGTAOSettings.radius);
	}
	float ao = clamp(1.0 - occlusion / float(GTAO_DIRECTION_NUMS) * uboGTAOSettings.intensity, 0.0, 1.0);
    
	outFragColor = ao;
}

