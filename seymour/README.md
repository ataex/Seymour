# Seymour v2
## About

## Running the examples (under Linux)
### Installing Dependencies
```
sudo apt-get install libglm-dev libglew-dev libglfw3-dev libsoil-dev libjpeg-dev libfcgi-dev spawn-fcgi nginx xvfb g++ libassimp-dev
```
### Backend - Compilation and Running
```
# first cd into the Seymour_v2/seymour directory
# compile seymour_backend 
g++ -I ./classes seymour.cpp -lGL -lGLEW -lglfw -lSOIL -lassimp -ljpeg -lfcgi++ -lfcgi -o seymour_backend.o
# run with spawn-fcgi
spawn-fcgi -p 8000 -n ./seymour_backend.o

g++ -I ./classes modeltobin.cpp -lGL -lGLEW -lglfw -lSOIL -lassimp modeltobin.o

# to run headless first execute
Xvfb :99 &
export DISPLAY=:99
# then run program normally
```
