# Seymour

## About

Seymour is an open source protected remote rendering visualization tool that enables the interactive visualization of high-resolution 3D digital models in a web browser, while ensuring that the 3D assets are secured against unauthorized access. 

Seymour is built in C++ and JavaScript using OpenGL, Fast-CGI, and Nginx, along with other useful libraries. See the [client](./client) and [server](./server) folders for more complete descriptions of the technologies and set-up for each component.

This software was developed as part of my dissertation project [Extending Model Use in Virtual Heritage: User-Centric Implementation of a Proctected Remote Rendering Visualization Tool](./docs/Christiansen-2019-MiVH.pdf).

## Getting Started

See [examples](./examples) for simple samples of OpenGL and Fast-CGI code, useful for understanding the project and troubleshooting.

Seymour is a client-server architecture and requires a properly configured Nginx server.
1. [Download and install Nginx](http://nginx.org/en/docs/install.html).
1. Configure and start Nginx, see the [Seymour server README](./server/README.md).
1. Copy the Seymour client to the Nginx web roor, by defualt /var/www/html.
1. Compile the Seymour server and start the FCGI process.
1. Visit your sample Seymour webpage at [http://localhost/simple-seymour.html](http://localhost/simple-seymour.html)!

To cite:

        @phdthesis{christiansen2019modeluse,
          title={Extending Model Use in Virtual Heritage: User-Centric Implementation of a Proctected Remote Rendering Visualization Tool},
          author={Christiansen, Leif},
          year={2019},
          school={Indiana University}
        }
