var container, stats;

var camera, scene, renderer;
var pointLight0, pointLight1, pointLight2, pointLight3;

var inputFlag = false;
var mousePrevX = 0, mouseX = 0, mousePrevY = 0, mouseY = 0;
var mouseDx = 0, mouseDy = 0;

var windowWidth = 512;
var windowHeight = 512;
var windowHalfX = windowWidth / 2;
var windowHalfY = windowHeight / 2;

var InteractionEnum = Object.freeze({"translate":0,"rotate":1,"light":2});
var interactionMode = InteractionEnum.translate; 

var identity = new THREE.Matrix4();
var rotM = new THREE.Matrix4();

var clientTexture = true;
var serverTexture = true;
var clientMaterial;

var host = "localhost";

var phi = -60;
var theta = 0;

window.onload = init;
// animate();

function init() {

	document.getElementById("server-texture").checked = serverTexture;	
	document.getElementById("client-texture").checked = clientTexture;	
	document.getElementById("server-texture").onchange = function () { 
		serverTexture = document.getElementById("server-texture").checked; 
		render();
		requestRender();
	};
	document.getElementById("client-texture").onchange = function () { 
		clientTexture = document.getElementById("client-texture").checked; 
		var head = scene.getObjectByName( "head" );
		if ( !clientTexture ) head.children[0].material = new THREE.MeshLambertMaterial( {color: 0xaaaaaa});
		else head.children[0].material = clientMaterial;
		head.children[0].material.needsUpdate = true;
		render();
		requestRender();
	};

	container = document.createElement( 'div' );
	document.getElementById("webgl-container").appendChild( container );

	img = document.createElement( 'img' );
	// shouldn't have this hardcoded
	img.src = "http://"+host+"/renderer/render/1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,45,1,0,0,5";
	img.style = "position: absolute;";
	container.appendChild(img)

	img.onmousedown = function(ev) {
		ev.preventDefault();
		hideOverlay();
	}
	img.ontouchstart = function() {
		hideOverlay();
	}
	img.onload = function() {
		showOverlay();
	}

	camera = new THREE.PerspectiveCamera( 45, windowWidth / windowHeight, 0.1, 2000 );
	camera.position.z = 5;

	// scene

	scene = new THREE.Scene();

	var ambientLight = new THREE.AmbientLight( 0xcccccc, 0.4 );
	scene.add( ambientLight );

	pointLight0 = new THREE.PointLight( 0xffffff, 0.8 );
	pointLight0.position.set( 2.0, 2.0, 3.0 );
	scene.add( pointLight0 );

	pointLight1 = new THREE.PointLight( 0xffff00, 0.8 );
	pointLight1.position.set( -2.0, -2.0, 3.0 );
	pointLight1.visible = false;
	scene.add( pointLight1 );

	scene.add( camera );

	// model

	if (true) {
	var onProgress = function ( xhr ) {

		if ( xhr.lengthComputable ) {

			var percentComplete = xhr.loaded / xhr.total * 100;
			console.log( Math.round( percentComplete, 2 ) + '% downloaded' );

		}

	};

	var onError = function () { };

	THREE.Loader.Handlers.add( /\.dds$/i, new THREE.DDSLoader() );

	new THREE.MTLLoader()
		.setPath( 'models/obj/zeus_ammon/' )
		.load( 'zeus-ammon-25k.mtl', function ( materials ) {

			materials.preload();

			new THREE.OBJLoader()
				.setMaterials( materials )
				.setPath( 'models/obj/zeus_ammon/' )
				.load( 'zeus-ammon-25k.obj', function ( object ) {

					object.position.z = 0;
					object.name = "head";
					object.matrixAutoUpdate = true;
					clientMaterial = object.children[0].material;
					scene.add( object );

					var temp = new THREE.Matrix4();

					render();
				}, onProgress, onError );

		} );
	} else {
		geometry = new THREE.BoxGeometry( 1, 1, 1 );
		material = new THREE.MeshNormalMaterial();

		mesh = new THREE.Mesh( geometry, material );
		mesh.name = "head";
		scene.add( mesh );
	}
	//

	renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( windowWidth, windowHeight );

	container.appendChild( renderer.domElement );

	container.addEventListener( 'mousedown', onDocumentMouseDown, false );
	container.addEventListener( 'mousemove', onDocumentMouseMove, false );
	container.addEventListener( 'mouseup', onDocumentMouseUp, false);
	container.addEventListener( 'mousewheel', onDocumentMouseWheel, false);
	container.addEventListener( 'wheel', onDocumentMouseWheel, false);
	container.addEventListener( 'touchstart', onTouchStart, false);
	container.addEventListener( 'touchmove', onTouchMove, false);
	container.addEventListener( 'touchend', onTouchEnd, false);

	var mc = new Hammer.Manager(container);
    // create a pinch recognizer
    var pinch = new Hammer.Pinch();
    // add to the Manager
    mc.add(pinch);
    mc.on("pinch", function(ev) {
        ev.preventDefault();
		zoom(1-ev.scale);
    });

	// window.addEventListener( 'resize', onWindowResize, false );

	render();
}

var interval;
function gatherFrames(mode) {
	switch(mode){
		case 0:
			var temp = new THREE.Matrix4();
			camera.applyMatrix( temp.makeRotationAxis( new THREE.Vector3(1, 0, 0), THREE.Math.degToRad(-100) ) );
			zoom( - 50 );
			interval = setInterval(rotateModel, 500);
			break;
		default:
			break;
	}
}

function stopGatherFrames() {
	clearInterval(interval);
}

// should produce 511 frames...
var camY = -2;
var theta = 5;
var thetaSum = 0;
var phi = 20;
var phiSum = -100;
function rotateModel() {
	if (phiSum == 120) clearInterval(interval);
	var temp = new THREE.Matrix4();
	if ((thetaSum%360) == 0) {
		camera.applyMatrix( temp.makeRotationAxis( new THREE.Vector3(1, 0, 0), THREE.Math.degToRad(phi) ) );
		phiSum += phi;
	}
	temp = new THREE.Matrix4();
	camera.applyMatrix( temp.makeRotationAxis( new THREE.Vector3(0, 1, 0), THREE.Math.degToRad(theta) ) );
	camera.lookAt( new THREE.Vector3(0, 0, 0) );
	thetaSum += theta;

	render();

	requestRender();
}

function hideOverlay() {
	img.style.visibility = "hidden";
	img.style.width = "0pt";
	img.style.height = "0pt";
}

function showOverlay() {
	img.style.visibility = "visible";
	img.style.width = "";
	img.style.height = "";
}

function onWindowResize() {

	windowHalfX = window.innerWidth / 2;
	windowHalfY = window.innerHeight / 2;

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

	render();

}

//
var interval;
function zoom( delta ) {
	
	clearTimeout(interval);

	img.style.visibility = "hidden";
	img.style.width = "0pt";
	img.style.height = "0pt";

	var newFov = camera.fov + delta/2;
	if (newFov > 0 && newFov < 180) {
		camera.fov = newFov;
		camera.updateProjectionMatrix();
	}

	render();

	interval = setTimeout(requestRender, 200);
}

function onInputStart( x,y ) {
	img.style.visibility = "hidden";
	img.style.width = "0pt";
	img.style.height = "0pt";


	inputFlag = true;
	xInput = x;
	yInput = y;
	xInputPrev = xInput;
	yInputPrev = yInput;

	render();
}

function onInputMove( x,y ) {
	if (!inputFlag) return;

	xInput = x;
	yInput = y;
	xDelta = xInputPrev - xInput;
	yDelta = yInputPrev - yInput;
	xInputPrev = xInput;
	yInputPrev = yInput;

	var current = scene.getObjectByName("head");

	if (interactionMode == InteractionEnum.translate) {
		current.position.x += -xDelta / windowHalfX;
		current.position.y += yDelta / windowHalfX;
	} else if (interactionMode == InteractionEnum.rotate) {
		rotM.premultiply(rollingBall(-xDelta, yDelta));
		current.setRotationFromMatrix(rotM);
	} else if (interactionMode == InteractionEnum.light) {
		pointLight0.position.set( pointLight0.position.x-xDelta/windowHalfX, pointLight0.position.y+yDelta/windowHalfX, pointLight0.position.z )
	}

	render();
}

function onInputEnd() {
	inputFlag = false;

	render();

	requestRender();
}

function requestRender() {
	if (scene.getObjectByName("head")) {
		var obj = scene.getObjectByName("head");

		var matStr = scene.getObjectByName("head").matrix.elements.toString();

		var path;
		if (interactionMode == InteractionEnum.light) {
			var pos = pointLight0.position;
			path = "http://"+host+"/renderer/light/" + (pointLight0.visible?1:0) + "," + pos.x + "," + pos.y + ","+ pos.z;
			path += ",";
			var pos = pointLight1.position;
			path += (pointLight1.visible?1:0) + "," + pos.x + "," + pos.y + ","+ pos.z
		} else {
			path = "http://"+host+"/renderer/render/" + matStr + "," + camera.fov + "," + (serverTexture?1:0) + "," + camera.position.x + "," + camera.position.y + "," + camera.position.z;
		}
		document.getElementById('frames-print').innerHTML += ',"' + path + '"';
		img.src = path;
	}
}

// 

//-------------------------------------------------------------
// Touch events in the canvas

function onTouchStart(ev) {
    ev.preventDefault();
    var x = ev.touches[0].clientX;
    var y = ev.touches[0].clientY;

    if (ev.touches.length == 2) {
    	interactionMode = InteractionEnum.translate;
    } else if (ev.touches.length == 1) {
    	interactionMode = InteractionEnum.rotate;
    }

	onInputStart(x, y); 
}

function onTouchMove(ev) {
    ev.preventDefault();
    var x = ev.touches[0].clientX;
    var y = ev.touches[0].clientY;

    onInputMove(x, y); 
}

function onTouchEnd(ev) {
    ev.preventDefault();
   
	onInputEnd(); 
}

// Mouse events

function onDocumentMouseWheel( event ) {
	if (event.hasOwnProperty("wheelDelta")) {
		zoom(Math.sign(event.wheelDelta));
	} else {
		zoom(Math.sign(event.deltaY));
	}
	
}

function onDocumentMouseDown( event ) {

	if (event.ctrlKey) interactionMode = InteractionEnum.light;
	// right button
	else if (event.button == 2) interactionMode = InteractionEnum.translate;
	// left button
	else if (event.button == 0) interactionMode = InteractionEnum.rotate;

	onInputStart(event.clientX, event.clientY); 

}

function onDocumentMouseMove( event ) {

	onInputMove(event.clientX, event.clientY); 

}

function onDocumentMouseUp( event ) {

	onInputEnd();

}

//

var m = new THREE.Matrix4();
function rollingBall( dx, dy) {

	if (Math.abs(dx) < 0.0001 && Math.abs(dy) < 0.0001) return identity;

	var dr = Math.sqrt(dx*dx + dy*dy)
	var R = 100;
	var cos = R/Math.sqrt(R*R + dr*dr)
	var sin = dr/Math.sqrt(R*R + dr*dr)

	m.set(
		cos + (dy/dr)*(dy/dr)*(1-cos),
		-(dx/dr)*(dy/dr)*(1-cos),
		(dx/dr)*sin,
		0,

		-(dx/dr)*(dy/dr)*(1-cos),
		cos+(dx/dr)*(dx/dr)*(1-cos),
		(dy/dr)*sin,
		0,

		-(dx/dr)*sin,
		-(dy/dr)*sin,
		cos,
		0,

		1,
		0,
		0,
		0

		);

	return m;
}

//

function animate() {

	requestAnimationFrame( animate );
	render();

}

function render() {

	renderer.render( scene, camera );
}