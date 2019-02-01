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

// GLEW
#define GLEW_STATIC
#include <GL/glew.h>

// GLFW
#include <GLFW/glfw3.h>

// GL includes
#include "Shader.h"
#include "Camera.h"
#include "Model.h"
#include "Renderer.h"
#include "FramebufferReader.h"
#include "MeshFactory.h"

// GLM Mathemtics
#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>
#include <glm/gtc/type_ptr.hpp>
#define GLM_ENABLE_EXPERIMENTAL
#include <glm/gtx/string_cast.hpp>

// Other Libs
#include "SOIL/SOIL.h"
#include <jpeglib.h>

#include <iostream>
#include <stdlib.h>
#include "fcgio.h"
#include <algorithm>
#include <iterator>
#include <vector>

using namespace std;

bool debugFlag = false;
int screenWidth = 800;
int screenHeight = 600;

// http://www.martinbroadhurst.com/how-to-split-a-string-in-c.html
void split(const std::string& str, std::vector<std::string>& cont, char delim);

int main(int argc, char **argv) {
    Renderer renderer(screenWidth, screenHeight);

    Scene scene;
    Camera camera(glm::vec3( 0.0f, 0.0f, 0.0f ), 45.0f);
    Model model0( "res/models/cube/cube.obj" );
    scene.add( &model0 );

    Mesh renderMesh = MeshFactory::quadMesh(1.0f, 4, 1.0f, 4);

    float m[] = {1.0f, 0.0f, 0.0f, 0.0f, 0.0f, 1.0f, 0.0f, 0.0f, 0.0f, 0.0f, 1.0f, 0.0f, 0.0f, 0.0f, 0.0f, 1.0f};

    // Game loop
    while ( true ) {        

        // better way to deal with this? do we want to do model by model? or entire scene?
        model0.modelMatrix = glm::make_mat4(m);

        renderer.render( &scene, &camera, &renderMesh );

    }
    
    renderer.close();
    
    return 0;
}

// http://www.martinbroadhurst.com/how-to-split-a-string-in-c.html
void split(const std::string& str, std::vector<std::string>& cont, char delim = ' ')
{
    std::stringstream ss(str);
    std::string token;
    while (std::getline(ss, token, delim)) {
        cont.push_back(token);
    }
}