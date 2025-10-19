#version 450

layout (binding = 0) uniform sampler2D samplerHBAO;

layout (location = 0) in vec2 inUV;

layout (location = 0) out float outFragColor;

void main() 
{
	const int blurRange = 2;
	int n = 0;
	vec2 texelSize = 1.0 / vec2(textureSize(samplerHBAO, 0));
	float result = 0.0;
	for (int x = -blurRange; x <= blurRange; x++) 
	{
		for (int y = -blurRange; y <= blurRange; y++) 
		{
			vec2 offset = vec2(float(x), float(y)) * texelSize;
			result += texture(samplerHBAO, inUV + offset).r;
			n++;
		}
	}
	outFragColor = result / (float(n));
}