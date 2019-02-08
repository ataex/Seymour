#pragma once

// Std. Includes
#include <vector>

// GL Includes
#define GLEW_STATIC
#include <GL/glew.h>

#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>

// Defines several possible options for camera movement. Used as abstraction to stay away from window-system specific input methods
enum Camera_Movement
{
    FORWARD,
    BACKWARD,
    LEFT,
    RIGHT
};

// Default camera values
const GLfloat YAW        = -90.0f;
const GLfloat PITCH      =  0.0f;
const GLfloat SPEED      =  6.0f;
const GLfloat SENSITIVTY =  0.25f;
const GLfloat ZOOM       =  45.0f;

// An abstract camera class that processes input and calculates the corresponding Eular Angles, Vectors and Matrices for use in OpenGL
class Camera
{
public:
    float fov;

    // Constructor with vectors
    Camera( glm::vec3 position = glm::vec3( 0.0f, 0.0f, 0.0f ), float fov = 45.0f ) {
        this->position = position;
        this->fov = fov;

        // this->worldUp = up;
        // this->yaw = yaw;
        // this->pitch = pitch;
        // this->updateCameraVectors( );
    }
    
    // Constructor with scalar values
    Camera( GLfloat posX, GLfloat posY, GLfloat posZ, GLfloat upX, GLfloat upY, GLfloat upZ, GLfloat yaw, GLfloat pitch ) : front( glm::vec3( 0.0f, 0.0f, -1.0f ) ), movementSpeed( SPEED ), mouseSensitivity( SENSITIVTY ), zoom( ZOOM )
    {
        this->position = glm::vec3( posX, posY, posZ );
        this->worldUp = glm::vec3( upX, upY, upZ );
        this->yaw = yaw;
        this->pitch = pitch;
        this->updateCameraVectors( );
    }
    
    // Returns the view matrix calculated using Eular Angles and the LookAt Matrix
    glm::mat4 viewMatrix( )
    {
        return glm::translate( glm::mat4(1.0), glm::vec3(this->position.x * -1.0f, this->position.y * -1.0f, this->position.z * -1.0f));
        //return glm::lookAt( this->position, this->position + this->front, this->up );
    }
    
    glm::mat4 projectionMatrix( int screen_width, int screen_height ) {
        return glm::perspective( this->fov * (float)M_PI/180, ( float )screen_width/( float )screen_height, 0.1f, 2000.0f );
    }

private:
    // Camera Attributes
    glm::vec3 position;
    glm::vec3 front;
    glm::vec3 up;
    glm::vec3 right;
    glm::vec3 worldUp;
    
    // Eular Angles
    GLfloat yaw;
    GLfloat pitch;
    
    // Camera options
    GLfloat movementSpeed;
    GLfloat mouseSensitivity;
    GLfloat zoom;
    
    // Calculates the front vector from the Camera's (updated) Eular Angles
    void updateCameraVectors( )
    {
        // Calculate the new Front vector
        glm::vec3 front;
        front.x = cos( glm::radians( this->yaw ) ) * cos( glm::radians( this->pitch ) );
        front.y = sin( glm::radians( this->pitch ) );
        front.z = sin( glm::radians( this->yaw ) ) * cos( glm::radians( this->pitch ) );
        this->front = glm::normalize( front );
        // Also re-calculate the Right and Up vector
        this->right = glm::normalize( glm::cross( this->front, this->worldUp ) );  // Normalize the vectors, because their length gets closer to 0 the more you look up or down which results in slower movement.
        this->up = glm::normalize( glm::cross( this->right, this->front ) );
    }
};
