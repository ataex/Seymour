/* comment from youtube video
 Watch out for:
 -use of a non-standard preprocessor directive (pragma once),
 -use of user-defined type (aistring) before including the library which defines it,
 -inconsistent naming of struct members (in Vertex your members start with caps, in Texture they don't),
 -heavy use of copy assignment instead of pointer types,
 -unnecessary use of a newline before an opening curly brace.﻿
 */
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
#include "Mesh.h"
#include "MeshFactory.h"

// GLM Mathemtics
#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>
#include <glm/gtc/type_ptr.hpp>
#define GLM_ENABLE_EXPERIMENTAL
#include <glm/gtx/string_cast.hpp>

// Other Libs
#include "SOIL/SOIL.h"

void error_callback(int error, const char* description)
{
    fprintf(stderr, "Error: %s\n", description);
}

class Renderer {
public:
    /* Renderer Data */
    GLuint width, height;
    int screen_width, screen_height;
    const char* name;
    GLFWwindow* window;
    Shader* lightingShader;
    Shader* blendingShader;

    glm::vec4 clearColor;

    float phi;
    float theta;

    int useTexture = 1;

    GLuint renderedFramebuffer;
    GLuint noiseTextureId;
    GLuint renderedTextureId;

    Mesh* renderMesh;

    float camX;
    float camY;
    float camZ;

    glm::mat4 randomMatrix;

    int useLight[4] = {1, 0, 0, 0};
    float lightPosition[4][3] = {
        {2.0f, 2.0f, 3.0f}, 
        {-2.0f, 2.0f, -3.0f}, 
        {0.0f, -3.0f, 0.0f}, 
        {-2.0f, -2.0f, 3.0f}};

    float blendNoisePerc;

    Renderer( int width, int height, string name="Renderer" ) {
        this->width = width;
        this->height = height;
        this->name = name.c_str();

        this->setupRenderer();

        this->lightingShader = new Shader( "res/shaders/lighting.vs", "res/shaders/lighting.frag" );
        this->blendingShader = new Shader( "res/shaders/passthrough.vs", "res/shaders/blending.frag" );

        this->noiseTextureId = TextureLoader::TextureFromFile( "random0.jpg", "res/noise" );
        this->setupRenderToTexture();

        this->camX;
        this->camY;
        this->camZ;

        this->randomMatrix = glm::mat4(1.0);

        this->clearColor = glm::vec4( 0.00f, 1.00f, 0.00f, 1.0f );
        this->blendNoisePerc = 1.00;
    }

    void render( Scene *scene, Camera *camera, Mesh *renderMesh = nullptr ) {
        if (renderMesh == nullptr) {
            // Render to render buffer
            glBindFramebuffer(GL_FRAMEBUFFER, 0);            
        } else {
            // Render to screen
            glBindFramebuffer(GL_FRAMEBUFFER, this->renderedFramebuffer);
        }
https://docs.scipy.org/doc/numpy/reference/generated/numpy.ndarray.size.html
        // std::cerr << "Noise: " << this->blendNoisePerc << std::endl;

        glClearColor( this->clearColor.x, this->clearColor.y, this->clearColor.z, this->clearColor.w ); // make this a property
        glClear( GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT | GL_STENCIL_BUFFER_BIT );
        // Shader shader( "res/shaders/lighting.vs", "res/shaders/lighting.frag" );
        this->lightingShader->use( ); // leifchri: does this need to be called every frame?

        // make this a function of the camera
        glm::mat4 projection = camera->projectionMatrix( this->screen_width, this->screen_height );//glm::perspective( 45.0f * (float)M_PI/180, ( float )this->screen_width/( float )this->screen_height, 0.1f, 2000.0f );

        glm::mat4 view = glm::lookAt(glm::vec3(this->camX, this->camY, this->camZ), glm::vec3(0.0f, 0.0f, 0.0f), glm::vec3(0.0f, 1.0f, 0.0f));

        glUniformMatrix4fv( glGetUniformLocation( this->lightingShader->program, "projection" ), 1, GL_FALSE, glm::value_ptr( projection ) );
        glUniformMatrix4fv( glGetUniformLocation( this->lightingShader->program, "view" ), 1, GL_FALSE, glm::value_ptr( view ) );

        glUniform1i( glGetUniformLocation( this->lightingShader->program, "useTexture" ), this->useTexture );
        glUniform3f( glGetUniformLocation( this->lightingShader->program, "fragColor" ), 0.4f, 0.4f, 0.4f );

        // Set material properties
        glUniform1f( glGetUniformLocation( this->lightingShader->program, "material.shininess" ), 1.0f );
        // == ==========================
        // Here we set all the uniforms for the 5/6 types of lights we have. We have to set them manually and index
        // the proper PointLight struct in the array to set each uniform variable. This can be done more code-friendly
        // by defining light types as classes and set their values in there, or by using a more efficient uniform approach
        // by using 'Uniform buffer objects', but that is something we discuss in the 'Advanced GLSL' tutorial.
        // == ==========================
        
        // Point light 1
        glUniform1i( glGetUniformLocation( this->lightingShader->program, "useLightOne" ), useLight[0] );
        glUniform3f( glGetUniformLocation( this->lightingShader->program, "pointLights[0].position" ), lightPosition[0][0], lightPosition[0][1], lightPosition[0][2] );
        glUniform3f( glGetUniformLocation( this->lightingShader->program, "pointLights[0].ambient" ), 0.0f, 0.0f, 0.0f ); // 0.32f, 0.32f, 0.32f
        glUniform3f( glGetUniformLocation( this->lightingShader->program, "pointLights[0].diffuse" ), 1.0f, 1.0f, 1.0f );
        glUniform3f( glGetUniformLocation( this->lightingShader->program, "pointLights[0].specular" ), 0.5f, 0.5f, 0.5f );
        glUniform1f( glGetUniformLocation( this->lightingShader->program, "pointLights[0].constant" ), 1.0f );
        glUniform1f( glGetUniformLocation( this->lightingShader->program, "pointLights[0].linear" ), 0.09f );
        glUniform1f( glGetUniformLocation( this->lightingShader->program, "pointLights[0].quadratic" ), 0.032f );

        // Point light 2
        glUniform1i( glGetUniformLocation( this->lightingShader->program, "useLightTwo" ), useLight[1] );
        glUniform3f( glGetUniformLocation( this->lightingShader->program, "pointLights[1].position" ), lightPosition[1][0], lightPosition[1][1], lightPosition[1][2] );
        glUniform3f( glGetUniformLocation( this->lightingShader->program, "pointLights[1].ambient" ), 0.0f, 0.0f, 0.0f );
        glUniform3f( glGetUniformLocation( this->lightingShader->program, "pointLights[1].diffuse" ), 1.0f, 1.0f, 1.0f );
        glUniform3f( glGetUniformLocation( this->lightingShader->program, "pointLights[1].specular" ), 0.1f, 0.1f, 0.1f );
        glUniform1f( glGetUniformLocation( this->lightingShader->program, "pointLights[1].constant" ), 1.0f );
        glUniform1f( glGetUniformLocation( this->lightingShader->program, "pointLights[1].linear" ), 0.09f );
        glUniform1f( glGetUniformLocation( this->lightingShader->program, "pointLights[1].quadratic" ), 0.032f );

        // Point light 3
        glUniform1i( glGetUniformLocation( this->lightingShader->program, "useLightThree" ), useLight[2] );
        glUniform3f( glGetUniformLocation( this->lightingShader->program, "pointLights[2].position" ), lightPosition[2][0], lightPosition[2][1], lightPosition[2][2] );
        glUniform3f( glGetUniformLocation( this->lightingShader->program, "pointLights[2].ambient" ), 0.0f, 0.0f, 0.0f );
        glUniform3f( glGetUniformLocation( this->lightingShader->program, "pointLights[2].diffuse" ), 1.0f, 1.0f, 1.0f );
        glUniform3f( glGetUniformLocation( this->lightingShader->program, "pointLights[2].specular" ), 0.1f, 0.1f, 0.1f );
        glUniform1f( glGetUniformLocation( this->lightingShader->program, "pointLights[2].constant" ), 1.0f );
        glUniform1f( glGetUniformLocation( this->lightingShader->program, "pointLights[2].linear" ), 0.09f );
        glUniform1f( glGetUniformLocation( this->lightingShader->program, "pointLights[2].quadratic" ), 0.032f );

        // Point light 4
        glUniform1i( glGetUniformLocation( this->lightingShader->program, "useLightFour" ), useLight[3] );
        glUniform3f( glGetUniformLocation( this->lightingShader->program, "pointLights[3].position" ), lightPosition[3][0], lightPosition[3][1], lightPosition[3][2] );
        glUniform3f( glGetUniformLocation( this->lightingShader->program, "pointLights[3].ambient" ), 0.0f, 0.0f, 0.0f ); // 0.32f, 0.32f, 0.32f
        glUniform3f( glGetUniformLocation( this->lightingShader->program, "pointLights[3].diffuse" ), 0.4f, 0.4f, 0.4f );
        glUniform3f( glGetUniformLocation( this->lightingShader->program, "pointLights[3].specular" ), 0.5f, 0.5f, 0.5f );
        glUniform1f( glGetUniformLocation( this->lightingShader->program, "pointLights[3].constant" ), 1.0f );
        glUniform1f( glGetUniformLocation( this->lightingShader->program, "pointLights[3].linear" ), 0.09f );
        glUniform1f( glGetUniformLocation( this->lightingShader->program, "pointLights[3].quadratic" ), 0.032f );

        for ( int i=0; i<scene->children.size(); i++ ) {
            // Draw the loaded model
            glm::mat4 model = ( scene->children[i]->modelMatrix ) * this->randomMatrix;
            // std::cout << glm::to_string(model) << std::endl;
            glUniformMatrix4fv( glGetUniformLocation( this->lightingShader->program, "model" ), 1, GL_FALSE, glm::value_ptr( model ) );
            scene->children[i]->render( *this->lightingShader );
        }

        if ( renderMesh != nullptr ) {
            // Render to the screen 
            glBindFramebuffer(GL_FRAMEBUFFER, 0);

            // Do we need to render 3 times? Could we render to stencil buffer and texture at same time?
            // Render to the screen
            glBindFramebuffer(GL_FRAMEBUFFER, 0);

            // Clear the screen
            glClear( GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT | GL_STENCIL_BUFFER_BIT);

            // Draw to stencil buffer
            glStencilFunc(GL_ALWAYS, 1, 0xFF); // Set any stencil to 1
            glStencilOp(GL_KEEP, GL_KEEP, GL_REPLACE);
            glStencilMask(0xFF); // Write to stencil buffer 
            glColorMask(GL_FALSE, GL_FALSE, GL_FALSE, GL_FALSE); 
            glDepthMask(GL_FALSE); // Don't write to depth buffer 

            for ( int i=0; i<scene->children.size(); i++ ) {
                // Draw the loaded model
                glm::mat4 model = ( scene->children[i]->modelMatrix ) * this->randomMatrix;
                // std::cout << glm::to_string(model) << std::endl;
                glUniformMatrix4fv( glGetUniformLocation( this->lightingShader->program, "model" ), 1, GL_FALSE, glm::value_ptr( model ) );
                scene->children[i]->render( *this->lightingShader );
            }

            // Disable drawing to stencil buffer
            glStencilMask(~0);
            glColorMask(GL_TRUE, GL_TRUE, GL_TRUE, GL_TRUE);
            glDepthMask(GL_TRUE);
            // Only draw fragment if stencil is 1
            glStencilFunc(GL_EQUAL, 1, 0xFF);

            // glClearColor( 0.00f, 0.00f, 0.00f, 1.0f ); // make this a property
            glClear( GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT );
            this->blendingShader->use( ); // leifchri: does this need to be called every frame?

            glUniform1f( glGetUniformLocation( this->blendingShader->program, "blend" ), this->blendNoisePerc );

            // Bind our noise texture
            glActiveTexture( GL_TEXTURE0 + this->noiseTextureId );
            // Now set the sampler to the correct texture unit
            glUniform1i( glGetUniformLocation( this->blendingShader->program, ( "noiseTexture" ) ), this->noiseTextureId );
            // And finally bind the texture
            glBindTexture( GL_TEXTURE_2D, this->noiseTextureId );

            // Bind our texture in Texture Unit 0
            glActiveTexture(GL_TEXTURE0 + this->renderedTextureId );
            // Set our "renderedTextureId" sampler to use Texture Unit 0
            glUniform1i( glGetUniformLocation( this->blendingShader->program, ( "renderedTexture" ) ), this->renderedTextureId );
            // And finally bind the texture
            glBindTexture( GL_TEXTURE_2D, this->renderedTextureId );

            // glm::mat4 model = renderMesh->modelMatrix;
            // glUniformMatrix4fv( glGetUniformLocation( this->lightingShader->program, "model" ), 1, GL_FALSE, glm::value_ptr( model ) );
            renderMesh->render( *this->blendingShader );
        }

        // Swap the buffers
        glfwSwapBuffers( this->window );
    }

    void close() {
        // Cleanup VBO and shader
        // glDeleteBuffers(1, &vertexbuffer);
        // glDeleteBuffers(1, &uvbuffer);
        // glDeleteBuffers(1, &normalbuffer);
        // glDeleteBuffers(1, &elementbuffer);
        // glDeleteProgram(programID);
        // glDeleteTextures(1, &Texture);

        // glDeleteFramebuffers(1, &FramebufferName);
        // glDeleteTextures(1, &renderedTextureId);
        // glDeleteRenderbuffers(1, &depthrenderbuffer);
        // glDeleteBuffers(1, &quad_vertexbuffer);
        // glDeleteVertexArrays(1, &VertexArrayID);

        glfwTerminate();
        free(this->lightingShader);
        free(this->blendingShader);
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
        
        glfwSetErrorCallback(error_callback);

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
        glEnable(GL_STENCIL_TEST);

        return 0;
    }

    int setupRenderToTexture() {
        // ---------------------------------------------
        // Render to Texture - specific code begins here
        // ---------------------------------------------

        // leifchri is this necessary? don't we have default framebuffer?
        // The framebuffer, which regroups 0, 1, or more textures, and 0 or 1 depth buffer.
        GLuint renderedFramebuffer;
        glGenFramebuffers(1, &renderedFramebuffer);
        glBindFramebuffer(GL_FRAMEBUFFER, renderedFramebuffer);
        this->renderedFramebuffer = renderedFramebuffer;

        // The texture we're going to render to
        GLuint renderedTextureId;
        glGenTextures(1, &renderedTextureId);
        this->renderedTextureId = renderedTextureId;
        
        // "Bind" the newly created texture : all future texture functions will modify this texture
        glBindTexture(GL_TEXTURE_2D, this->renderedTextureId);

        // Give an empty image to OpenGL ( the last "0" means "empty" )
        glTexImage2D(GL_TEXTURE_2D, 0,GL_RGB, this->screen_width, this->screen_height, 0,GL_RGB, GL_UNSIGNED_BYTE, 0);

        // Poor filtering
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST); 
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);

        // The depth buffer
        GLuint depthrenderbuffer;
        glGenRenderbuffers(1, &depthrenderbuffer);
        glBindRenderbuffer(GL_RENDERBUFFER, depthrenderbuffer);
        glRenderbufferStorage(GL_RENDERBUFFER, GL_DEPTH_COMPONENT, this->screen_width, this->screen_height);
        glFramebufferRenderbuffer(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_RENDERBUFFER, depthrenderbuffer);

        // Set "renderedTextureId" as our colour attachement #0
        glFramebufferTexture(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, this->renderedTextureId, 0);

        // Set the list of draw buffers.
        GLenum DrawBuffers[1] = {GL_COLOR_ATTACHMENT0};
        glDrawBuffers(1, DrawBuffers); // "1" is the size of DrawBuffers

        // Always check that our framebuffer is ok
        if(glCheckFramebufferStatus(GL_FRAMEBUFFER) != GL_FRAMEBUFFER_COMPLETE)
            return EXIT_FAILURE;

        Mesh quadMesh = MeshFactory::quadMesh(1.0f, 4, 1.0f, 4);
        this->renderMesh = &quadMesh;

        return 0;
    }
};