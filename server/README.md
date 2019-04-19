# Seymour Server Module

## About

The Seymour server uses OpenGL and Fast-CGI to create a long-running, rendering process.

### Setup

1. Install dependencies.
    ```sh
    sudo apt-get install libglm-dev libglew-dev libglfw3-dev libsoil-dev libjpeg-dev libfcgi-dev spawn-fcgi nginx xvfb g++ libassimp-dev openssl libssl-dev imagemagick
    ```
1. Setup nginx, [see the root README for step-by-step instructions](../README.md). [nginx.conf](./nginx.conf) shows a sample configuration for an Nginx server. By default, the nginx.conf file is located at /etc/nginx/nginx.conf.
1. Compile the server renderer.
    ```sh
    # first cd into the Seymour/server directory
    cd ~/Seymour/server
    # compile seymour_backend 
    g++ -I./classes -I./external ./external/lodepng.cpp seymour.cpp -lGL -lGLEW -lglfw -lSOIL -lassimp -ljpeg -lfcgi++ -lfcgi -lssl -lcrypto -o seymour_backend.o
    ```
1. Generate the noise textures.
    ```sh
    # first cd into the Seymour/server/res/noise directory
    cd ~/Seymour/server/res/noise
    # be sure your in the proper directory! noise images will be placed in current directory
    # execute the supplied script
    ./res/noise/gennoise.sh
    ```
1. Start the renderer as a FCGI process.
    ```sh
    # run with spawn-fcgi
    spawn-fcgi -p 8000 -n ./seymour_backend.o

    # to run headless first execute
    Xvfb :99 &
    export DISPLAY=:99
    # then run program normally...
  ```

## Customization

Coming soon...
