# Seymour v2
## About

## Running the examples (under Linux)
### Installing Dependencies
```
sudo apt-get install libglm-dev libglew-dev libglfw3-dev libsoil-dev libjpeg-dev libfcgi-dev spawn-fcgi nginx
```
### Backend - Compilation and Running
```
# first cd into the Seymour_v2/seymour directory
# compile seymour_backend 
g++ -I ./classes seymour.cpp -lGL -lGLEW -lglfw -lSOIL -lassimp -ljpeg -lfcgi++ -lfcgi -o seymour_backend.o

g++ -I ./classes modeltobin.cpp -lGL -lGLEW -lglfw -lSOIL -lassimp modeltobin.o
```