# OpenGL
## About
[OpenGL](https://www.opengl.org/) is an API for graphics rendering using the [GPU](https://en.wikipedia.org/wiki/Graphics_processing_unit). Originally using a fixed-graphics pipeline, one which only exposed a set of higher level graphics operations, modern progammable pipeline implementations allow for full control of the GPU execution. These examples use the modern programmable pipeline.

Examples are adapted from [SonarSystems series of OpenGL tutorials](https://github.com/SonarSystems/Modern-OpenGL-Tutorials), which in turn are based on https://learnopengl.com/. **Note: Since the writting of the tutorials the glm specification has changed. mat4 operations and contrustors now require at least one argument, ex glm:mat4 translate should now be glm::mat4 translate(1).**

## Files

## Running the examples (under Linux)
### Installing Dependencies
```
sudo apt-get install libglm-dev libglew-dev libglfw3-dev libsoil-dev
```
### Compilation and Running
```
# compile hello_triangle
g++ hello_triangle.cpp -lGL -lglfw -lGLEW -o hello_triangle
./hello_triangle
# compile transformations
g++ transformations.cpp -lGL -lglfw -lGLEW -lsoil -o transformations
./transformations
```