#version 450

layout (binding = 0) uniform sampler2D samplerPositionDepth;
layout (binding = 1) uniform sampler2D samplerNormal;

layout (constant_id = 0) const int HBAO_DIRECTION_NUMS = 8;
layout (constant_id = 1) const int HBAO_STEP_NUMS = 6;

// layout (binding = 3) uniform UBOHBAOKernel
// {
// 	vec4 samples[HBAO_KERNEL_SIZE];
// } uboHBAOKernel;

layout (binding = 2) uniform UBOHBAOSettings
{
	float maxDistance;
	float radius;
	float maxRadiusPixels;
	float angleBias;
	float intensity;
	float distanceFalloff;
	float extendParamA;
	float extendParamB;
} uboHBAOSettings;

// layout (binding = 3) uniform UBO 
// {
// 	mat4 projection;
// } ubo;

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
	return clamp(distanceSqr / max(uboHBAOSettings.radius * uboHBAOSettings.radius, 0.0001), 0.0, 1.0);
}

float GTAO(vec3 fragPos, vec3 stepPos, vec3 normal) {
    vec3 h = stepPos - fragPos;  // horizontal vector
	float VoV = max(dot(h, h), 0.0001);
	float NoV = dot(normal, h) * inversesqrt(VoV);
	return clamp(NoV - uboHBAOSettings.angleBias, 0.0, 1.0) * falloff(VoV);
}

void main() 
{
	// Get G-Buffer values
	vec3 fragPos = texture(samplerPositionDepth, inUV).rgb;
    if (-fragPos.z >= uboHBAOSettings.maxDistance) {
		outFragColor = 1.0;
		return;
	}
	vec3 normal = normalize(texture(samplerNormal, inUV).rgb * 2.0 - 1.0);

	ivec2 screenSize = textureSize(samplerPositionDepth, 0); 
	
	// Calculate occlusion value
	vec2 rand = rand2(inUV);
    float angleDelta = 2.0 * PI / float(HBAO_DIRECTION_NUMS);
    float stepSize = min(-uboHBAOSettings.radius / fragPos.z, uboHBAOSettings.maxRadiusPixels) / float(HBAO_STEP_NUMS + 1.0);

	float occlusion = 0.0f;

	float result = stepSize;

	for (int i = 0; i < HBAO_DIRECTION_NUMS; i++) {
	   float angle = angleDelta * (float(i) + rand.x);
	   vec2 dir = vec2(cos(angle), sin(angle));

       float rayPixels = rand.y * stepSize + 1.0;

	   for (int j = 0; j < HBAO_STEP_NUMS; j++) {
	      vec2 stepUV = round(rayPixels * dir) * screenSize + inUV;
		  vec3 stepPos = texture(samplerPositionDepth, stepUV).rgb;

		  occlusion += GTAO(fragPos, stepPos, normal);
		  rayPixels += stepSize;
	   }
	}
	occlusion *= uboHBAOSettings.intensity / float(HBAO_DIRECTION_NUMS * HBAO_STEP_NUMS);

	float disFactor = clamp((fragPos.z - (uboHBAOSettings.maxDistance - uboHBAOSettings.distanceFalloff)) / uboHBAOSettings.distanceFalloff, 0.0, 1.0);

    float ao = mix(clamp(1.0 - occlusion, 0.0, 1.0), 1.0, disFactor);

	outFragColor = ao;
}

