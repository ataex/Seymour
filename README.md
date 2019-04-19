# Seymour

## About

Seymour is an open source protected remote rendering visualization tool that enables the interactive visualization of high-resolution 3D digital models in a web browser, while ensuring that the 3D assets are secured against unauthorized access. 

Seymour is built in C++ and JavaScript using OpenGL, Fast-CGI, and Nginx, along with other useful libraries. See the [client](./client) and [server](./server) folders for more complete descriptions of the technologies and set-up for each component.

This software was developed as part of my dissertation project [Extending Model Use in Virtual Heritage: User-Centric Implementation of a Proctected Remote Rendering Visualization Tool](./Christiansen-2019-ModelUseVH.pdf).

## Getting Started

See [examples](./examples) for simple samples of OpenGL and Fast-CGI code, useful for understanding the project and troubleshooting.

Seymour is a client-server architecture and requires a properly configured Nginx server.
1. [Download and install Nginx](http://nginx.org/en/docs/install.html).
    ```sh
    sudo apt-get install nginx
    ```
1. Configure and start Nginx. [server/nginx.conf](./server/nginx.conf) contains a sample configuration.
    ```sh
    # cd to the root of Seymour directoy
    cd ~/Seymour
    # make sure to stop nginx
    sudo nginx -s stop
    # save the default nginx.conf file
    sudo mv /etc/nginx/nginx.conf /etc/nginx/nginx-default.conf
    # copy the sample nginx.conf
    sudo cp server/nginx.conf /etc/nginx/nginx.conf
    # restart nginx
    sudo nginx
    ```
1. Copy the Seymour client to the Nginx web root, by defualt /var/www/html.
    ```sh
    # cd to the root of Seymour directory
    cd ~/Seymour
    # copy all client code to the web root
    sudo cp client/* /var/www/html
    ```
1. [Compile the Seymour server and start the FCGI process](./server/README.md#backend---compilation-and-running).
1. Visit your sample Seymour webpage at [http://localhost/simple-seymour.html](http://localhost/simple-seymour.html)!

To cite:

        @phdthesis{christiansen2019modelusevh,
          title={Extending Model Use in Virtual Heritage: User-Centric Implementation of a Proctected Remote Rendering Visualization Tool},
          author={Christiansen, Leif},
          year={2019},
          school={Indiana University}
        }
