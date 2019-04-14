# Seymour Client

## About 

The Seymour client uses [Three.js](https://threejs.org/) to render a low-resolution reference model.

## Quickstart

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

## Extesibility

seymour.js exposes a number of function calls to interact with the client rendering service. A more complete description will be coming soon, but for now check the file for comments and description.
