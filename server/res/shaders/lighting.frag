#version 330 core

#define NUMBER_OF_POINT_LIGHTS 4

struct Material
{
    sampler2D diffuse;
    sampler2D specular;
    float shininess;
};

struct DirLight
{
    vec3 direction;
    
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
};

struct PointLight
{
    vec3 position;
    
    float constant;
    float linear;
    float quadratic;
    
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
};

struct SpotLight
{
    vec3 position;
    vec3 direction;
    float cutOff;
    float outerCutOff;
    
    float constant;
    float linear;
    float quadratic;
    
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
};

in vec3 FragPos;
in vec3 Normal;
in vec2 TexCoords;

out vec4 color;

uniform vec3 viewPos;

uniform DirLight dirLight;

uniform PointLight pointLights[NUMBER_OF_POINT_LIGHTS];
uniform bool useLightOne;
uniform bool useLightTwo;
uniform bool useLightThree;
uniform bool useLightFour;

uniform SpotLight spotLight;

uniform Material material;

uniform bool useTexture;

uniform vec3 fragColor;

// uniform sampler2D noiseTexture;

// Function prototypes
vec3 CalcDirLight( DirLight light, vec3 normal, vec3 viewDir );
vec3 CalcPointLight( PointLight light, vec3 normal, vec3 fragPos, vec3 viewDir );
vec3 CalcSpotLight( SpotLight light, vec3 normal, vec3 fragPos, vec3 viewDir );

float blend = 0.97; // blending factor for noise texture

void main( )
{
    // Properties
    vec3 norm = normalize( Normal );
    vec3 viewDir = normalize( viewPos - FragPos );
    
    vec3 result = vec3( 0.0, 0.0, 0.0 );

    // Directional lighting
    //result = CalcDirLight( dirLight, norm, viewDir );
    
    // Point lights
    if ( useLightOne ) {
        result += CalcPointLight( pointLights[0], norm, FragPos, viewDir );
    }
    if ( useLightTwo ) {
        result += CalcPointLight( pointLights[1], norm, FragPos, viewDir );
    }
    if ( useLightThree ) {
        result += CalcPointLight( pointLights[2], norm, FragPos, viewDir );
    }
    if ( useLightFour ) {
        result += CalcPointLight( pointLights[3], norm, FragPos, viewDir );
    }
    
    // Spot light
    //result += CalcSpotLight( spotLight, norm, FragPos, viewDir );
    
    // Test stuff
    //color = (1.0 - blend) * texture( noiseTexture, FragPos.xy ) + blend * vec4( result, 1.0 );
    //color = vec4( 1.0, 0.0, 0.0, 1.0);
    //color = texture( material.specular, TexCoords );
    
    // Normal Map
    // color = vec4( norm, 1.0 );
    // Geometry Mask
    color = vec4( 1.0, 1.0, 1.0, 1.0 );

    // Lit rendering
    //color = vec4( result, 1.0 );
}

// Calculates the color when using a directional light.
vec3 CalcDirLight( DirLight light, vec3 normal, vec3 viewDir )
{
    vec3 lightDir = normalize( -light.direction );
    
    // Diffuse shading
    float diff = max( dot( normal, lightDir ), 0.0 );
    
    // Specular shading
    vec3 reflectDir = reflect( -lightDir, normal );
    float spec = pow( max( dot( viewDir, reflectDir ), 0.0 ), material.shininess );
    
    // Combine results
    vec3 ambient = light.ambient * vec3( texture( material.diffuse, TexCoords ) );
    vec3 diffuse = light.diffuse * diff * vec3( texture( material.diffuse, TexCoords ) );
    vec3 specular = light.specular * spec * vec3( texture( material.specular, TexCoords ) );
    
    return ( ambient + diffuse + specular );
}

// Calculates the color when using a point light.
vec3 CalcPointLight( PointLight light, vec3 normal, vec3 fragPos, vec3 viewDir )
{
    vec3 lightDir = normalize( light.position - fragPos );
    
    // Diffuse shading
    float diff = max( dot( normal, lightDir ), 0.0 );
    
    // Specular shading
    vec3 reflectDir = reflect( -lightDir, normal );
    float spec = pow( max( dot( viewDir, reflectDir ), 0.0 ), material.shininess );
    
    // Attenuation
    float distance = length( light.position - fragPos );
    float attenuation = 1.0f;// / ( light.constant + light.linear * distance + light.quadratic * ( distance * distance ) );
    
    // Combine results
    vec3 ambient, diffuse, specular;
    if (useTexture) {
        ambient = light.ambient * vec3( texture( material.diffuse, TexCoords ) );
        diffuse = light.diffuse * diff * vec3( texture( material.diffuse, TexCoords ) );
        specular = light.specular * spec * vec3( texture( material.specular, TexCoords ) );
    } else {
        ambient = light.ambient * fragColor;
        diffuse = light.diffuse * diff * fragColor;
        specular = light.specular * spec * fragColor;
    }

    ambient *= attenuation;
    diffuse *= attenuation;
    specular *= attenuation;
    
    return ( ambient + diffuse + specular );
}

// Calculates the color when using a spot light.
vec3 CalcSpotLight( SpotLight light, vec3 normal, vec3 fragPos, vec3 viewDir )
{
    vec3 lightDir = normalize( light.position - fragPos );
    
    // Diffuse shading
    float diff = max( dot( normal, lightDir ), 0.0 );
    
    // Specular shading
    vec3 reflectDir = reflect( -lightDir, normal );
    float spec = pow( max( dot( viewDir, reflectDir ), 0.0 ), material.shininess );
    
    // Attenuation
    float distance = length( light.position - fragPos );
    float attenuation = 1.0f / ( light.constant + light.linear * distance + light.quadratic * ( distance * distance ) );
    
    // Spotlight intensity
    float theta = dot( lightDir, normalize( -light.direction ) );
    float epsilon = light.cutOff - light.outerCutOff;
    float intensity = clamp( ( theta - light.outerCutOff ) / epsilon, 0.0, 1.0 );
    
    // Combine results
    vec3 ambient = light.ambient * vec3( texture( material.diffuse, TexCoords ) );
    vec3 diffuse = light.diffuse * diff * vec3( texture( material.diffuse, TexCoords ) );
    vec3 specular = light.specular * spec * vec3( texture( material.specular, TexCoords ) );
    
    ambient *= attenuation * intensity;
    diffuse *= attenuation * intensity;
    specular *= attenuation * intensity;
    
    return ( ambient + diffuse + specular );
}
