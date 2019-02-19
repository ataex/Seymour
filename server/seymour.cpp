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
#include "TextureLoader.h"

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
#include <random>
#include <openssl/md5.h>

using namespace std;

bool debugFlag = false;
int screenWidth = 1024;
int screenHeight = 1024;

vector<int> randomOrder;
float distortionMax = 0.01;

// http://www.martinbroadhurst.com/how-to-split-a-string-in-c.html
void split(const std::string& str, std::vector<std::string>& cont, char delim);
void swap(int* arr, int i, int j);
void shuffle(int* arr, int start, int end);
unsigned int getUIntHash(const char* s);
glm::mat4 makeRandomMat(unsigned int seed);

int main(int argc, char **argv) {
    // Backup the stdio streambufs
    streambuf * cin_streambuf  = cin.rdbuf();
    streambuf * cout_streambuf = cout.rdbuf();
    // streambuf * cerr_streambuf = cerr.rdbuf();

    FCGX_Request request;

    FCGX_Init();
    FCGX_InitRequest(&request, 0, 0);
    
    Renderer renderer(screenWidth, screenHeight);
    renderer.clearColor = glm::vec4( 0.0, 0.0, 0.0, 1.0 );

    Scene scene;
    Camera camera(glm::vec3( 0.0f, 0.0f, 0.0f ), 45.0f);
    // Model model0( "res/models/cube/cube.obj" );
    Model model0( "res/models/antoninus_pious/VC_0001_Antoninus_Pious-7m.obj" );
    // Model model0( "res/models/sphere/sphere.obj" );
    // scene.add( &model1 );
    scene.add( &model0 );

    Mesh renderMesh = MeshFactory::quadMesh(1.0f, 4, 1.0f, 4);

    float m[] = {1.0f, 0.0f, 0.0f, 0.0f, 0.0f, 1.0f, 0.0f, 0.0f, 0.0f, 0.0f, 1.0f, 0.0f, 0.0f, 0.0f, 0.0f, 1.0f};

    FramebufferReader framebufferReader("png", screenWidth, screenHeight);

    // Game loop
    while (FCGX_Accept_r(&request) == 0) {
        fcgi_streambuf cin_fcgi_streambuf(request.in);
        fcgi_streambuf cout_fcgi_streambuf(request.out);
        // fcgi_streambuf cerr_fcgi_streambuf(request.err);

        cin.rdbuf(&cin_fcgi_streambuf);
        cout.rdbuf(&cout_fcgi_streambuf);
        // cerr.rdbuf(&cerr_fcgi_streambuf);    

        if (debugFlag) {
            std::cout << "Content-type: text/html\r\n\r\n";
        }

        char * uri = FCGX_GetParam("REQUEST_URI", request.envp);
        std::string uri_str(uri);

        //
        // get route
        char *temp1;
        if (uri[0] == '/') {
            temp1 = &uri[1];
        }
        string temp2(temp1);
        int i = temp2.find('/');
        temp2 = temp2.substr(i+1,temp2.length());
        i = temp2.find('/');
        string route = temp2.substr(0,i);

        std::vector<std::string> words;
        split(temp2.substr(i+1,temp2.length()), words, ',');
        //

        if ( route.compare("render") == 0 ) {
            //
            // handle render
            if (words.size() >= 18) {
                for (unsigned int j=0; j<16; j++) {
                    m[j] = std::stod(words[j]);
                }
                camera.fov = std::stod(words[16]);
                renderer.useTexture = std::stoi(words[17]);
                renderer.camX = std::stof(words[18]);
                renderer.camY = std::stof(words[19]);
                renderer.camZ = std::stof(words[20]);
            } else {
                camera.fov = 45.0f;
                renderer.useTexture = 1;
            }
            //
        } else if ( route.compare("light") == 0 ) {
            //
            // handle light
            int i = 0;
            renderer.useLight[0] = std::stoi(words[i]);
            i++;
            for (int j=0; j<3; j++) {
                renderer.lightPosition[0][j] = std::stod(words[i+j]);
            }
            i+=3;

            renderer.useLight[1] = std::stoi(words[i]);
            i++;
            for (int j=0; j<3; j++) {
                renderer.lightPosition[1][j] = std::stod(words[i+j]);
            }
            i+=3;
            //
        } else if ( route.compare("distortions") == 0 ) {
            framebufferReader.jpegQuality = std::stoi(words[0]);
            renderer.blendNoisePerc = std::stof(words[1]);
            randomOrder.clear();
            if (std::stoi(words[2]) == 1) randomOrder.push_back(0);
            if (std::stoi(words[3]) == 1) randomOrder.push_back(1);
            if (std::stoi(words[4]) == 1) randomOrder.push_back(2);
            distortionMax = std::stof(words[5]);
        } else {
            std::cout << "Content-type: text/html\r\n\r\n" << "ERROR: Invalid route: " << route << std::endl;
        }

        // better way to deal with this? do we want to do model by model? or entire scene?
        model0.modelMatrix = glm::make_mat4(m);
        unsigned int seed = getUIntHash(to_string(model0.modelMatrix).c_str());
        srand(seed);
        int r = rand() % 400;
        renderer.noiseTextureId = TextureLoader::TextureFromFile( string("random" +to_string(r)+ ".jpg").c_str(), "res/noise" );
        renderer.randomMatrix = makeRandomMat(seed);

        renderer.render( &scene, &camera, &renderMesh );

        if (!debugFlag) {
            std::cout << "Content-type: image/png\r\n\r\n";
            framebufferReader.writeFrameToCout();
        }

        std::cout << std::endl;
    }
    
    renderer.close();
    
    // restore stdio streambufs
    cin.rdbuf(cin_streambuf);
    cout.rdbuf(cout_streambuf);
    // cerr.rdbuf(cerr_streambuf);

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

unsigned int getUIntHash(const char* s) {
    unsigned char digest[MD5_DIGEST_LENGTH];
    MD5((unsigned char*)&s, strlen(s), (unsigned char*)&digest);    
    char mdString[33]; 
    for(int i = 0; i < 8; i++) sprintf(&mdString[i*2], "%02x", (unsigned int)digest[i]);
    unsigned int x = std::stoul(mdString, nullptr, 16);
    return x;
}

void swap(vector<int>& arr, int i, int j) {
    int temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
}

void shuffle(vector<int>& arr, int start, int end) {
    for (int i=end+1; i>start; i--) {
        int r = rand() % i;
        swap(arr, i-1, r);
    }
}

glm::mat4 makeRandomMat(unsigned int seed) {
    // std::cerr << "START makeRandomMat" << std::endl;
    glm::mat4 out(1.0);
    // return out;

    srand(seed);
    std::cerr << "Seed: " << seed << std::endl;
    
    std::default_random_engine gen;
    std::uniform_real_distribution<double> d(0.0,1.0);

    // int order[] = {0, 1, 2};
    // cerr << randomOrder.size() << endl;
    shuffle(randomOrder, 0, randomOrder.size()-1);
    for (int i=0; i<randomOrder.size(); i++) {
        std::cerr << randomOrder[i] << ",";
    }
    std::cerr << std::endl;

    float max = distortionMax;
    glm::vec4 maxVector(1.0f, 1.0f, 1.0f, 1.0f);
    glm::mat4 tempMat(1.0);
    int mode;
    float dist, rx, ry, rz, theta, temp;
    for (int i=0; i<randomOrder.size(); i++) {
        mode = randomOrder[i];
        // generate a random point one the unit sphere
        rx = d(gen);
        ry = d(gen);
        rz = d(gen);
        temp = 1 / sqrt(rx*rx + ry*ry + rz*rz);
        rx *= temp;
        ry *= temp;
        rz *= temp;
        // generate the distance for the transfomration
        dist = 2 * max * ( (float)rand() / (float)RAND_MAX ) - max;
        max -= abs(dist);

        glm::vec3 tempV;
        // will max vector always be the same?
        // std::cerr << "NEXT" << std::endl;
        // std::cerr << "dist: " << dist << std::endl;
        switch(mode) {
            case 0:
                // std::cerr << "Translate" << std::endl;
                rx *= dist;
                ry *= dist;
                rz *= dist;
                // std::cerr << "rx:" << rx << " ry:" << ry << " rz" << rz << std::endl;
                tempMat = glm::translate(glm::mat4(1.0), glm::vec3(rx, ry, rz));
                out = tempMat * out;

                tempV = glm::vec3(maxVector.x, maxVector.y, maxVector.z);
                maxVector.x += abs(rx);
                maxVector.y += abs(ry);
                maxVector.z += abs(rz);
                // std::cerr << "maxVector: " << to_string(maxVector) << std::endl;
                // std::cerr << "new dist:" << glm::distance(tempV, glm::vec3(maxVector.x, maxVector.y, maxVector.z)) << std::endl;
                // std::cerr << "sum dist: " << glm::distance(glm::vec3(1.0f, 1.0f, 1.0f), glm::vec3(maxVector.x, maxVector.y, maxVector.z)) << std::endl;
                break;
            case 1:
                // std::cerr << "Rotate" << std::endl;
                // use law of cosines to get angle in radians
                // point that will move most is the corner of the, now potentially warped, unit sphere
                // this point isn't necessarily maxVector, but it will have the same distance as maxVector
                temp = glm::distance(glm::vec3(0.0f, 0.0f, 0.0f), glm::vec3(maxVector.x, maxVector.y, maxVector.z));
                theta = acos(1 - (dist*dist) / (2*temp*temp));
                // std::cerr << "theta: " << theta << std::endl;
                tempMat = glm::rotate(glm::mat4(1.0), theta, glm::vec3(rx, ry, rz));
                out = out * tempMat;

                tempV = glm::vec3(maxVector.x, maxVector.y, maxVector.z);
                maxVector = tempMat * maxVector;
                // std::cerr << "maxVector: " << to_string(maxVector) << std::endl;
                // std::cerr << "new dist:" << glm::distance(tempV, glm::vec3(maxVector.x, maxVector.y, maxVector.z)) << std::endl;
                // std::cerr << "sum dist: " << glm::distance(glm::vec3(1.0f, 1.0f, 1.0f), glm::vec3(maxVector.x, maxVector.y, maxVector.z)) << std::endl;
                break;
            case 2:
                // std::cerr << "Scale" << std::endl;
                rx = 1.0 + (rx * dist) / maxVector.x;
                ry = 1.0 + (ry * dist) / maxVector.y;
                rz = 1.0 + (rz * dist) / maxVector.z;
                // std::cerr << "rx:" << rx << " ry:" << ry << " rz:" << rz << std::endl;
                tempMat = glm::scale(glm::mat4(1.0), glm::vec3(rx, ry, rz));
                out = tempMat * out;

                tempV = glm::vec3(maxVector.x, maxVector.y, maxVector.z);
                maxVector.x *= rx;
                maxVector.y *= ry;
                maxVector.z *= rz;
                // std::cerr << "maxVector: " << to_string(maxVector) << std::endl;
                // std::cerr << "new dist:" << glm::distance(tempV, glm::vec3(maxVector.x, maxVector.y, maxVector.z)) << std::endl;
                // std::cerr << "sum dist: " << glm::distance(glm::vec3(1.0f, 1.0f, 1.0f), glm::vec3(maxVector.x, maxVector.y, maxVector.z)) << std::endl;
                break;
            case 3:
                std::cerr << "Shear" << std::endl;
                break;
            default:
                break;
        }
    }

    // std::cerr << "Result: " << to_string(maxVector) << std::endl;
    std::cerr << glm::distance(glm::vec3(1.0f, 1.0f, 1.0f), glm::vec3(maxVector.x, maxVector.y, maxVector.z)) << std::endl;
    float final = glm::distance(glm::vec3(1.0f, 1.0f, 1.0f), glm::vec3(maxVector.x, maxVector.y, maxVector.z));

    // if (final > 0.01) {
    //     std::cerr << "ERROR::seed " << seed << " " << final << endl;
    // }

    // std::cerr << "END makeRandomMat\n" << std::endl;
    return out;
}