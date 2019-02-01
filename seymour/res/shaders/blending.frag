#version 330 core

in vec3 FragPos;
in vec3 Normal;
in vec2 TexCoords;

out vec4 color;

uniform sampler2D noiseTexture;
uniform sampler2D renderedTexture;

float blend = 0.97;

void main( )
{
    color = blend * texture( renderedTexture, TexCoords ) + ( 1.0 - blend ) * texture( noiseTexture, TexCoords );
}