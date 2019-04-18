//----------------------------------------------------------------------------------------
// CONSTANTS
//----------------------------------------------------------------------------------------
// version
const SEYMOUR_VERSION             = "0.1";

var container, stats;

var camera, scene, renderer;
var viewMatrix = new THREE.Matrix4();
var pointLight0, pointLight1, pointLight2, pointLight3;

var inputFlag = false;
var mousePrevX = 0, mouseX = 0, mousePrevY = 0, mouseY = 0;
var mouseDx = 0, mouseDy = 0;

var windowWidth = 1024;
var windowHeight = 1024;
var windowHalfX = windowWidth / 2;
var windowHalfY = windowHeight / 2;

var InteractionEnum = Object.freeze({"translate":0,"rotate":1,"light":2});
var interactionMode = InteractionEnum.translate; 

var identity = new THREE.Matrix4();
var rotM = new THREE.Matrix4();

var models = new THREE.Object3D();

var clientTexture = true;
var serverTexture = true;
var clientMaterial;

var host = "localhost";

var objectInteraction = true;

function setDefaults(options, defaults){
    return _.defaults({}, _.clone(options), defaults);
}

function Seymour(myElement, options) {
	options = options || { };

	// TODO see presenter.js for how to set default options
	windowWidth = options.width;
	windowHeight = options.height;
	host = options.backend;
	isResizable = options.resizable;
	doRequestRender = true;

	init(myElement);
	this.scene = scene;
	this.models = models;
	this.container = container;
	this.imgOverlay = imgOverlay;
	this.camera = camera;
}

// TODO see presenter.js for encapsulate all functions
Seymour.prototype = {
	start : function() {
		doRequestRender = true;
	},

	pause : function() {
		doRequestRender = false;
	},

	// TODO parse path 
	loadModel : function(path) {
		// instantiate a loader
		var texloader = new THREE.TextureLoader();

		var index = path.lastIndexOf('/');
		var folder = path.substr(0,index+1);
		var plyloader = new THREE.PLYLoader();
		plyloader.load( path, function ( geometry ) {
			geometry.computeVertexNormals();
			// load a resource
			if (geometry.texture) {
				texloader.load(
					// resource URL
					folder+geometry.texture,

					// onLoad callback
					function ( texture ) {
						// in this example we create the material when the texture is loaded
						var material = new THREE.MeshBasicMaterial( {
							map: texture
						 } );
					
						// var material = new THREE.MeshStandardMaterial( { color: 0x0055ff, flatShading: true } );
						var mesh = new THREE.Mesh( geometry, material );
						mesh.name = "head";
						models.add( mesh );
						
					},

					// onProgress callback currently not supported
					undefined,

					// onError callback
					function ( err ) {
						console.error( 'Error loading texture, default will be used.' );
						var material = new THREE.MeshStandardMaterial( { color: 0x0055ff, flatShading: true } );
						var mesh = new THREE.Mesh( geometry, material );
						mesh.name = "head";
						models.add( mesh );
					}
				);
			} else {
				var material = new THREE.MeshStandardMaterial( { color: 0xffffff, flatShading: true } );
				var mesh = new THREE.Mesh( geometry, material );
				mesh.name = "head";
				models.add( mesh );
			}
		} );
	},

	getCurrentFrameRequest : function() {
		return renderString();
	},

	hideOverlay : function() {
		hideOverlay();
	},

	showOverlay : function() {
		showOverlay();
	},

	enableModelInteraction : function(flag) {
		objectInteraction = flag;
	},

	render : function() {
		render();
		if (doRequestRender)
			requestRender();
	},

	setCamera : function(newCamera) {
		camera = newCamera;
	}
};

// animate();

function init(myElement) {
	// TODO break this up into logical init functions
	container = document.createElement( 'div' );
	container.style = "position: relative;"
	myElement.appendChild( container );

	imgOverlay = document.createElement( 'img' );
	// TODO shouldn't have this hardcoded
	imgOverlay.id = "seymour-img-overlay";
	imgOverlay.style = "position: absolute;";
	imgOverlay.width = windowWidth;
	imgOverlay.height = windowHeight;
	container.appendChild(imgOverlay)

	hideOverlay();

	imgOverlay.onmousedown = function(ev) {
		ev.preventDefault();
		hideOverlay();
	}
	imgOverlay.ontouchstart = function() {
		hideOverlay();
	}
	imgOverlay.onload = function() {
		showOverlay();
	}

	camera = new THREE.PerspectiveCamera( 45, windowWidth / windowHeight, 0.1, 2000 );
	camera.position.z = 5;
	camera.updateMatrixWorld();

	m0 = new THREE.Matrix4();
	m1 = new THREE.Matrix4();
	v0 = new THREE.Vector3();

	imgOverlay.src = renderString(true);

	// scene

	scene = new THREE.Scene();

	var ambientLight = new THREE.AmbientLight( 0x404040 );
	scene.add( ambientLight );

	pointLight0 = new THREE.PointLight( 0xffffff, 0.8 );
	pointLight0.position.set( -1.0, 0.5, 3.0 );
	scene.add( pointLight0 );

	pointLight1 = new THREE.PointLight( 0xffff00, 0.8 );
	pointLight1.position.set( -2.0, -2.0, 3.0 );
	pointLight1.visible = false;
	scene.add( pointLight1 );

	scene.add( camera );

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

	window.addEventListener( 'resize', onWindowResize, false );

	scene.add( models );

	onWindowResize();
	render();
}

function getScene() {
	return scene;
}

function hideOverlay() {
	imgOverlay.style.visibility = "hidden";
	imgOverlay.src = "";
	imgOverlay.style.width = "0pt";
	imgOverlay.style.height = "0pt";
}

function showOverlay() {
	imgOverlay.style.visibility = "visible";
	imgOverlay.style.width = "";
	imgOverlay.style.height = "";
}

function onWindowResize() {
	if (!isResizable) return;

	windowHalfX = window.innerWidth / 2;
	windowHalfY = window.innerHeight / 2;

	if ((windowHalfX > 400) && (windowHalfY > 400)) return;

	var dim = Math.min(windowHalfX, windowHalfY);

	// camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( dim * 2, dim * 2 );

	imgOverlay.height = dim*2;
	imgOverlay.width = dim*2;

	render();
	requestRender();
}

//
var interval;
function zoom( delta ) {
	
	clearTimeout(interval);

	imgOverlay.style.visibility = "hidden";
	imgOverlay.style.width = "0pt";
	imgOverlay.style.height = "0pt";

	var newFov = camera.fov + delta/2;
	if (newFov > 0 && newFov < 180) {
		camera.fov = newFov;
		camera.updateProjectionMatrix();
	}

	render();

	if (doRequestRender)
		interval = setTimeout(requestRender, 200);
}

function onInputStart( x,y ) {
	imgOverlay.style.visibility = "hidden";
	imgOverlay.style.width = "0pt";
	imgOverlay.style.height = "0pt";


	inputFlag = true;
	xInput = x;
	yInput = y;
	xInputPrev = xInput;
	yInputPrev = yInput;

	render();
}

pitch = 0;
yaw = 0;
camRotSpeed = 0.1;
function onInputMove( x,y ) {
	if (!inputFlag) return;

	xInput = x;
	yInput = y;
	xDelta = xInputPrev - xInput;
	yDelta = yInputPrev - yInput;
	xInputPrev = xInput;
	yInputPrev = yInput;

	// TODO Fix references to head
	var current = models;

	if (interactionMode == InteractionEnum.translate) {
		current.position.x += -xDelta / windowHalfX;
		current.position.y += yDelta / windowHalfX;
	} else if (interactionMode == InteractionEnum.rotate) {
		if (objectInteraction) {
			rotM.premultiply(rollingBall(-xDelta, yDelta));
			current.setRotationFromMatrix(rotM);
		}
	} else if (interactionMode == InteractionEnum.light) {
		pointLight0.position.set( pointLight0.position.x-xDelta/windowHalfX, pointLight0.position.y+yDelta/windowHalfX, pointLight0.position.z )
	}

	render();
}

function onInputEnd() {
	inputFlag = false;

	render();

	if (doRequestRender)
		requestRender();
}

function renderString(useDefault=false) {
	modelMatStr = '1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1'
	if (!useDefault)
		modelMatStr = models.matrix.elements.toString();
	return "http://"+host+"/renderer/render/" + modelMatStr + "," + camera.matrixWorldInverse.elements.toString() + "," + camera.projectionMatrix.elements.toString() + "," + (serverTexture?1:0);
}

function requestRender() {
	var obj = models;

	var matStr = models.matrix.elements.toString();
	var projMatStr = camera.projectionMatrix.elements.toString();

	// TODO dont hardcode uri paths
	var path;
	if (interactionMode == InteractionEnum.light) {
		var pos = pointLight0.position;
		path = "http://"+host+"/renderer/light/" + (pointLight0.visible?1:0) + "," + pos.x + "," + pos.y + ","+ pos.z;
		path += ",";
		var pos = pointLight1.position;
		path += (pointLight1.visible?1:0) + "," + pos.x + "," + pos.y + ","+ pos.z
	} else {
		path = renderString();
		// path = "http://"+host+"/renderer/render/" + matStr + "," + camera.fov + "," + (serverTexture?1:0) + "," + camera.position.x + "," + camera.position.y + "," + camera.position.z;
	}
	imgOverlay.src = path;
}

function getFov() {
	return camera.fov;
}

function setFov(fov) {
	var newFov = parseFloat(fov);
	if (newFov > 0 && newFov < 180) {
		camera.fov = newFov;
		camera.updateProjectionMatrix();
	}

	render();
}

function getPosition() {
	var current = models;//scene.getObjectByName("head");
	return '"'+current.position.x+','+current.position.y+'"';
}

function setPosition(posStr) {
	var pos = posStr.split(',');
	console.log(pos)
	var current = models;//scene.getObjectByName("head");
	current.position.x = parseFloat(pos[0]);
	current.position.y = parseFloat(pos[1]);
}

function getRotMatrix() {
	return rotM;
}

function setRotMatrix(matStr) {
	var vals = matStr.split(',');
	for (i=0; i<vals.length; i++) vals[i] = parseFloat(vals[i]);
		console.log(vals)
	var m = new THREE.Matrix4();
	m.elements = vals;
	console.log(m);
	rotM = m;
	models.setRotationFromMatrix(rotM);

	render();
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
	event.preventDefault();

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