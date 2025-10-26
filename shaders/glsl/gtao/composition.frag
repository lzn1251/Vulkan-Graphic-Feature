#version 450

layout (binding = 0) uniform sampler2D samplerposition;
layout (binding = 1) uniform sampler2D samplerNormal;
layout (binding = 2) uniform sampler2D samplerAlbedo;
layout (binding = 3) uniform sampler2D samplerGTAO;
layout (binding = 4) uniform sampler2D samplerGTAOBlur;
layout (binding = 5) uniform UBO 
{
	mat4 _dummy;
	int gtao;
	int gtaoOnly;
	int gtaoBlur;
} uboParams;

layout (location = 0) in vec2 inUV;

layout (location = 0) out vec4 outFragColor;

void main() 
{
	vec3 fragPos = texture(samplerposition, inUV).rgb;
	vec3 normal = normalize(texture(samplerNormal, inUV).rgb * 2.0 - 1.0);
	vec4 albedo = texture(samplerAlbedo, inUV);
	 
	float gtao = (uboParams.gtaoBlur == 1) ? texture(samplerGTAOBlur, inUV).r : texture(samplerGTAO, inUV).r;

	vec3 lightPos = vec3(0.0);
	vec3 L = normalize(lightPos - fragPos);
	float NdotL = max(0.5, dot(normal, L));

	if (uboParams.gtaoOnly == 1)
	{
		outFragColor.rgb = gtao.rrr;
	}
	else
	{
		vec3 baseColor = albedo.rgb * NdotL;

		if (uboParams.gtao == 1)
		{
			outFragColor.rgb = gtao.rrr;

			if (uboParams.gtaoOnly != 1)
				outFragColor.rgb *= baseColor;
		}
		else
		{
			outFragColor.rgb = baseColor;
		}
	}
}