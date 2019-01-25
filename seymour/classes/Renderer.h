/* comment from youtube video
 Watch out for:
 -use of a non-standard preprocessor directive (pragma once),
 -use of user-defined type (aistring) before including the library which defines it,
 -inconsistent naming of struct members (in Vertex your members start with caps, in Texture they don't),
 -heavy use of copy assignment instead of pointer types,
 -unnecessary use of a newline before an opening curly brace.﻿
 */
// what is pragma once?
// code adapted from https://www.youtube.com/watch?v=ZbnEMM7vwmU

// Std. Includes
#include <string>
#include <iostream>

// GLEW
#define GLEW_STATIC
#include <GL/glew.h>

// GLFW
#include <GLFW/glfw3.h>

// GL includes
#include "Shader.h"
#include "Camera.h"
#include "Model.h"
#include "Scene.h"

// GLM Mathemtics
#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>
#include <glm/gtc/type_ptr.hpp>
#define GLM_ENABLE_EXPERIMENTAL
#include <glm/gtx/string_cast.hpp>

// Other Libs
#include "SOIL/SOIL.h"


class Renderer {
public:
    /* Renderer Data */
    GLuint width, height;
    int screen_width, screen_height;
    const char* name;
    GLFWwindow* window;
    Shader* shader;
    int useTexture = 1;

    Renderer( int width, int height, string name="Renderer" ) {
        this->width = width;
        this->height = height;
        this->name = name.c_str();

        this->setupRenderer();

        Shader shader( "res/shaders/lighting.vs", "res/shaders/lighting.frag" );
        this->shader = &shader;
    }

    void render( Scene *scene, Camera *camera ) {
        glClearColor( 0.00f, 0.00f, 0.00f, 1.0f ); // make this a property
        glClear( GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT );
        Shader shader( "res/shaders/lighting.vs", "res/shaders/lighting.frag" );
        shader.use( ); // leifchri: does this need to be called every frame?

        // make this a function of the camera
        glm::mat4 projection = camera->projectionMatrix( this->screen_width, this->screen_height );//glm::perspective( 45.0f * (float)M_PI/180, ( float )this->screen_width/( float )this->screen_height, 0.1f, 2000.0f );

        glm::mat4 view = glm::translate(glm::mat4(1.0), glm::vec3(0.0f, 0.0f, -5.0f));

        glUniformMatrix4fv( glGetUniformLocation( shader.Program, "projection" ), 1, GL_FALSE, glm::value_ptr( projection ) );
        glUniformMatrix4fv( glGetUniformLocation( shader.Program, "view" ), 1, GL_FALSE, glm::value_ptr( view ) );

        glUniform1i( glGetUniformLocation( shader.Program, "useTexture" ), this->useTexture );
        glUniform3f( glGetUniformLocation( shader.Program, "fragColor" ), 0.66f, 0.66f, 0.66f );

        // Set material properties
        glUniform1f( glGetUniformLocation( shader.Program, "material.shininess" ), 32.0f );
        // == ==========================
        // Here we set all the uniforms for the 5/6 types of lights we have. We have to set them manually and index
        // the proper PointLight struct in the array to set each uniform variable. This can be done more code-friendly
        // by defining light types as classes and set their values in there, or by using a more efficient uniform approach
        // by using 'Uniform buffer objects', but that is something we discuss in the 'Advanced GLSL' tutorial.
        // == ==========================
        
        // Point light 1
        glUniform3f( glGetUniformLocation( shader.Program, "pointLights[0].position" ), 2.0f, 2.0f, 3.0f );
        glUniform3f( glGetUniformLocation( shader.Program, "pointLights[0].ambient" ), 0.32f, 0.32f, 0.32f );
        glUniform3f( glGetUniformLocation( shader.Program, "pointLights[0].diffuse" ), 1.0f, 1.0f, 1.0f );
        glUniform3f( glGetUniformLocation( shader.Program, "pointLights[0].specular" ), 0.1f, 0.1f, 0.1f );
        glUniform1f( glGetUniformLocation( shader.Program, "pointLights[0].constant" ), 1.0f );
        glUniform1f( glGetUniformLocation( shader.Program, "pointLights[0].linear" ), 0.09f );
        glUniform1f( glGetUniformLocation( shader.Program, "pointLights[0].quadratic" ), 0.032f );

        for ( int i=0; i<scene->children.size(); i++ ) {
            // Draw the loaded model
            glm::mat4 model = scene->children[i]->modelMatrix;
            // std::cout << glm::to_string(model) << std::endl;
            glUniformMatrix4fv( glGetUniformLocation( shader.Program, "model" ), 1, GL_FALSE, glm::value_ptr( model ) );
            scene->children[i]->render( shader );
        }

        // Swap the buffers
        glfwSwapBuffers( this->window );
    }

    void close() {
        glfwTerminate();
    }

private:
    int setupRenderer() {
        // Init GLFW
        glfwInit( );
        // Set all the required options for GLFW
        glfwWindowHint( GLFW_CONTEXT_VERSION_MAJOR, 3 );
        glfwWindowHint( GLFW_CONTEXT_VERSION_MINOR, 3 );
        glfwWindowHint( GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE );
        glfwWindowHint( GLFW_OPENGL_FORWARD_COMPAT, GL_TRUE );
        glfwWindowHint( GLFW_RESIZABLE, GL_FALSE );
        
        // Create a GLFWwindow object that we can use for GLFW's functions
         this->window = glfwCreateWindow( this->width, this->height, this->name, nullptr, nullptr );
        
        if ( nullptr == window )
        {
            std::cout << "Failed to create GLFW window" << std::endl;
            glfwTerminate( );
            
            return EXIT_FAILURE;
        }
        
        glfwMakeContextCurrent( window );
        
        glfwGetFramebufferSize( window, &this->screen_width, &this->screen_height );
        
        // Set the required callback functions
        // glfwSetKeyCallback( window, KeyCallback );
        // glfwSetCursorPosCallback( window, MouseCallback );
        
        // GLFW Options
        
        // Set this to true so GLEW knows to use a modern approach to retrieving function pointers and extensions
        glewExperimental = GL_TRUE;
        // Initialize GLEW to setup the OpenGL Function pointers
        if ( GLEW_OK != glewInit( ) )
        {
            std::cout << "Failed to initialize GLEW" << std::endl;
            return EXIT_FAILURE;
        }
        
        // Define the viewport dimensions
        glViewport( 0, 0, this->screen_width, this->screen_height );
        
        // OpenGL options
        glEnable( GL_DEPTH_TEST );
    }
};