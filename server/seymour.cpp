/*
Seymour Server - seymour.cpp

Copyright (c) 2019, Leif Christiansen
All rights reserved.

This program is free software: you can redistribute it and/or modify
it under the terms of the CC Attribution-NonCommercial-ShareAlike 4.0 License.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
CC Attribution-NonCommercial-ShareAlike 4.0 License for more details.
You should have received a copy of the CC Attribution-NonCommercial-ShareAlike 4.0 License
along with this program.  If not, see <https://creativecommons.org/licenses/by-nc-sa/4.0/>.
*/

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

// External Libs
#include "SOIL/SOIL.h"
#include <jpeglib.h>
#include "fcgio.h"
#include <openssl/md5.h>

// Std. Includes
#include <string>
#include <iostream>
#include <stdlib.h>
#include <vector>
#include <random>

using namespace std;

bool debugFlag = false;
int screenWidth = 800;
int screenHeight = 800;

vector<int> randomOrder;
float distortionMax = 0.01;

void split(const std::string& str, std::vector<std::string>& cont, char delim);
void swap(int* arr, int i, int j);
void shuffle(int* arr, int start, int end);
unsigned int getUIntHash(const char* s);
glm::mat4 makeRandomMat(unsigned int seed);

int main(int argc, char **argv) {
    //
    // Setup FCGI
    //
    // Backup the stdio streambufs
    streambuf * cin_streambuf  = cin.rdbuf();
    streambuf * cout_streambuf = cout.rdbuf();
    // streambuf * cerr_streambuf = cerr.rdbuf();

    FCGX_Request request;

    FCGX_Init();
    FCGX_InitRequest(&request, 0, 0);
    
    //
    // Setup scene
    //
    Renderer renderer(screenWidth, screenHeight);
    renderer.clearColor = glm::vec4( 0.0, 0.0, 0.0, 1.0 );

    Scene scene;
    Camera camera(glm::vec3( 0.0f, 0.0f, 0.0f ), 45.0f);

    Model model0( "res/models/queen/queen.obj" );
    // Model model0( "res/models/saint-nicodeme-plumeliau/saint-nicodeme-plumeliau.obj" );
    scene.add( &model0 );

    Mesh renderMesh = MeshFactory::quadMesh(1.0f, 4, 1.0f, 4);

    float modelMatrix[] = {1.0f, 0.0f, 0.0f, 0.0f, 0.0f, 1.0f, 0.0f, 0.0f, 0.0f, 0.0f, 1.0f, 0.0f, 0.0f, 0.0f, 0.0f, 1.0f};
    float viewMatrix[] = {1.0f, 0.0f, 0.0f, 0.0f, 0.0f, 1.0f, 0.0f, 0.0f, 0.0f, 0.0f, 1.0f, 0.0f, 0.0f, 0.0f, 0.0f, 1.0f};
    float projectionMatrix[] = {1.0f, 0.0f, 0.0f, 0.0f, 0.0f, 1.0f, 0.0f, 0.0f, 0.0f, 0.0f, 1.0f, 0.0f, 0.0f, 0.0f, 0.0f, 1.0f};

    FramebufferReader framebufferReader("jpeg", screenWidth, screenHeight);

    // Game loop
    while (FCGX_Accept_r(&request) == 0) {
        //
        // read FCGI parameters
        //
        fcgi_streambuf cin_fcgi_streambuf(request.in);
        fcgi_streambuf cout_fcgi_streambuf(request.out);
        // fcgi_streambuf cerr_fcgi_streambuf(request.err);

        cin.rdbuf(&cin_fcgi_streambuf);
        cout.rdbuf(&cout_fcgi_streambuf);
        // cerr.rdbuf(&cerr_fcgi_streambuf);    

        char * uri = FCGX_GetParam("REQUEST_URI", request.envp);
        std::string uri_str(uri);

        //
        // get route
        //
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

        if ( route.compare("render") == 0 ) {
            // handle render
            if (words.size() >= 48) {
                int j=0;
                for (; j<16; j++) modelMatrix[j] = std::stod(words[j]);
                for (; j<32; j++) viewMatrix[j-16] = std::stod(words[j]);
                for (; j<48; j++) projectionMatrix[j-32] = std::stod(words[j]);
                renderer.useTexture = std::stoi(words[j++]);
            } 
        } else if ( route.compare("light") == 0 ) {
            // handle light
            if (words.size() >= 6) {
                int i = 0;
                renderer.useLight[0] = std::stoi(words[i]);
                i++;
                for (int j=0; j<3; j++) renderer.lightPosition[0][j] = std::stod(words[i+j]);
                i+=3;
                renderer.useLight[1] = std::stoi(words[i]);
                i++;
                
                for (int j=0; j<3; j++) renderer.lightPosition[1][j] = std::stod(words[i+j]);
                i+=3;
            }
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

        camera.viewMat = glm::make_mat4(viewMatrix);
        camera.projectionMat = glm::make_mat4(projectionMatrix);

        string seedstr = to_string(renderer.lightPosition[0][0]) + "," + to_string(renderer.lightPosition[0][1]) + "," + to_string(renderer.lightPosition[0][2]);
        char cstr1[seedstr.size() + 1];
        strcpy(cstr1, seedstr.c_str());
        unsigned int seed = getUIntHash(cstr1);
        srand(seed);

        // better way to deal with this? do we want to do model by model? or entire scene?
        // Geometric distortion
        model0.modelMatrix = glm::make_mat4(modelMatrix);
        seedstr = to_string(model0.modelMatrix);
        char cstr0[seedstr.size() + 1];
        strcpy(cstr0, seedstr.c_str());
        seed = getUIntHash(cstr0);
        srand(seed);
        renderer.randomMatrix = makeRandomMat(seed);

        // High frequency noise
        // int r = rand() % 400;
        // renderer.noiseTextureId = TextureLoader::TextureFromFile( string("random" +to_string(r)+ ".jpg").c_str(), "res/noise" );

        // Random lights
        float lightMax = 2.0;
        float dist = lightMax * (2 * ( (float)rand() / (float)RAND_MAX ) - 1.0);
        float x = rand();
        float y = rand();
        float z = rand();
        float norm = sqrt(x*x + y*y + z*z);
        renderer.lightPosition[3][0] = dist * x/norm;
        renderer.lightPosition[3][1] = dist * y/norm;
        renderer.lightPosition[3][2] = dist * z/norm;

        lightMax = 0.2;
        dist = lightMax * (2 * ( (float)rand() / (float)RAND_MAX ) - 1.0);
        x = rand();
        y = rand();
        z = rand();
        norm = sqrt(x*x + y*y + z*z);
        renderer.lightPosition[0][0] += dist * x/norm;
        renderer.lightPosition[0][1] += dist * y/norm;
        renderer.lightPosition[0][2] += dist * z/norm;

        //
        // Render and stream
        //
        renderer.render( &scene, &camera, &renderMesh );

        std::cout << "Content-type: image/jpeg\r\n\r\n";
        framebufferReader.writeFrameToCout();
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
    glm::mat4 out(1.0);

    if (randomOrder.size() == 0) return out;

    srand(seed);
    
    std::default_random_engine gen;
    std::uniform_real_distribution<double> d(0.0,1.0);

    shuffle(randomOrder, 0, randomOrder.size()-1);

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
        switch(mode) {
            case 0:
                rx *= dist;
                ry *= dist;
                rz *= dist;
                tempMat = glm::translate(glm::mat4(1.0), glm::vec3(rx, ry, rz));
                out = tempMat * out;

                tempV = glm::vec3(maxVector.x, maxVector.y, maxVector.z);
                maxVector.x += abs(rx);
                maxVector.y += abs(ry);
                maxVector.z += abs(rz);
                break;
            case 1:
                // use law of cosines to get angle in radians
                // point that will move most is the corner of the, now potentially warped, unit sphere
                // this point isn't necessarily maxVector, but it will have the same distance as maxVector
                temp = glm::distance(glm::vec3(0.0f, 0.0f, 0.0f), glm::vec3(maxVector.x, maxVector.y, maxVector.z));
                theta = acos(1 - (dist*dist) / (2*temp*temp));
                tempMat = glm::rotate(glm::mat4(1.0), theta, glm::vec3(rx, ry, rz));
                out = out * tempMat;

                tempV = glm::vec3(maxVector.x, maxVector.y, maxVector.z);
                maxVector = tempMat * maxVector;
                break;
            case 2:
                rx = 1.0 + (rx * dist) / maxVector.x;
                ry = 1.0 + (ry * dist) / maxVector.y;
                rz = 1.0 + (rz * dist) / maxVector.z;
                tempMat = glm::scale(glm::mat4(1.0), glm::vec3(rx, ry, rz));
                out = tempMat * out;

                tempV = glm::vec3(maxVector.x, maxVector.y, maxVector.z);
                maxVector.x *= rx;
                maxVector.y *= ry;
                maxVector.z *= rz;
                break;
            case 3:
                break;
            default:
                break;
        }
    }

    return out;
}