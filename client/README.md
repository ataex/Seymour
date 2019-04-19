# Seymour Client

## About 

The Seymour client uses [Three.js](https://threejs.org/) to render a low-resolution reference model.

## Quickstart
NOTE: The model loaders require a running webserver.

1. Include the seymour.js library and its dependencies in your webpage.
    ```html
    <script src="loaders/PLYLoader.js"></script>
    <script src="three.min.js"></script>

    <script src="seymour.js"></script>
    ```
1. Create a \<div\> to use for the rendering window and create the Seymour client instance.
    ```html
    <div id="webgl-container"></div>

    <script>
      var seymour = new Seymour({
        width: 512,
        height: 512,
        backend: "localhost"
      });

      var container = document.getElementById( "webgl-container" );
      seymour.init( container );
      seymour.loadModel( "./models/ply/fooobar.ply" );
    </script>
    ```

[simple-seymour.html](./simple-seymour.html) shows the most basic usage.

## Documentation

See [docs](./docs) for documentation of [seymour.js](./seymour.js) and its exposed methods and properties. The [Three.js](https://threejs.org/) scene elements are directly exposed, and may be manipulated according to the [Three.js](https://threejs.org/) documentation.
