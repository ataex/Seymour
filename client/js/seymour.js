/*
Seymour

Copyright (c) 2019, Leif Christiansen
All rights reserved.

This program is free software: you can redistribute it and/or modify
it under the terms of the CC Attribution-NonCommercial-ShareAlike 4.0 License.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
CC Attribution-NonCommercial-ShareAlike 4.0 License for more details.
You should have received a copy of the CC Attribution-NonCommercial-ShareAlike 4.0 License
along with this program.  If not, see <https://creativecommons.org/licenses/by-nc-sa/4.0/>.
*/

//----------------------------------------------------------------------------------------
// CONSTANTS
//----------------------------------------------------------------------------------------
// version
const SEYMOUR_VERSION = '0.1';
// interaction modes
const INTERACTION_ENUM = Object.freeze({
	'translate': 0,
	'rotate':    1,
	'light':     2
});

function Seymour( myElement, options ) {
	this._init( myElement, options );
	console.log( 'Seymour version: ' + SEYMOUR_VERSION );
}

// TODO see presenter.js for encapsulate all functions
Seymour.prototype = {
	//----------------------------------------------------------------------------------------
	// SETUP
	//----------------------------------------------------------------------------------------
	_init : function( myElement, options ) {
		options = options || {};

		// set defaults
		this.windowWidth = options.width;
		this.windowHeight = options.height;
		this.host = options.backend;
		this.isResizable = options.resizable;
		
		this.doRequestRender = true;
		this.objectInteraction = true;
		this.inputIsDown = false;
		this.interactionMode = INTERACTION_ENUM.translate; 
		this.serverTexture = true;
		this.m = new THREE.Matrix4(); // temp matrix
		this.rotationMatrix = new THREE.Matrix4();

		// container
		this.container = document.createElement( 'div' );
		this.container.style = 'position: relative;'
		myElement.appendChild( this.container );

		// <img> for rendered frames 
		this.imgOverlay = this._createImgOverlay( this.windowWidth, this.windowHeight );
		this.container.appendChild( this.imgOverlay)		
		this.hideOverlay();

		// render default starting view
		this.imgOverlay.src = this._renderString( true );

		//
		// scene
		//
		this.scene = new THREE.Scene();

		this.camera = new THREE.PerspectiveCamera( 
			45, this.windowWidth / this.windowHeight, 0.1, 2000 
		);
		this.camera.position.z = 5;
		this.camera.updateMatrixWorld();
		this.scene.add( this.camera );

		// lights
		var ambientLight = new THREE.AmbientLight( 0x404040 );
		this.scene.add( ambientLight );

		this.pointLight0 = new THREE.PointLight( 0xffffff, 0.8 );
		this.pointLight0.position.set( -1.0, 0.5, 3.0 );
		this.scene.add( this.pointLight0 );

		this.pointLight1 = new THREE.PointLight( 0xffff00, 0.8 );
		this.pointLight1.position.set( -2.0, -2.0, 3.0 );
		this.pointLight1.visible = false;
		this.scene.add( this.pointLight1 );

		this.models = new THREE.Object3D();
		this.scene.add( this.models );

		this.renderer = new THREE.WebGLRenderer();
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( this.windowWidth, this.windowHeight );

		//
		// event listeners
		//
		this.container.appendChild( this.renderer.domElement );
		this.container.seymourInstance = this;
		this.container.addEventListener( 'mousedown', this.onDocumentMouseDown, false );
		this.container.addEventListener( 'mousemove', this.onDocumentMouseMove, false );
		this.container.addEventListener( 'mouseup', this.onDocumentMouseUp, false);
		this.container.addEventListener( 'mousewheel', this.onDocumentMouseWheel, false);
		this.container.addEventListener( 'wheel', this.onDocumentMouseWheel, false);
		this.container.addEventListener( 'touchstart', this.onTouchStart, false);
		this.container.addEventListener( 'touchmove', this.onTouchMove, false);
		this.container.addEventListener( 'touchend', this.onTouchEnd, false);

		// use Hammer to detect touch gestures
		var mc = new Hammer.Manager( this.container );
	    // create a pinch recognizer
	    var pinch = new Hammer.Pinch();
	    // add to the Manager
	    mc.add( pinch );
	    mc.on( 'pinch', function( ev ) {
	    	ev.preventDefault();
	    	zoom( 1-ev.scale );
	    });

		window.addEventListener( 'resize', this.onWindowResize, false );

		this.onWindowResize(); // resize window if needed
		this._render();
	},

	_createImgOverlay : function( width, height ) {
		var imgOverlay = document.createElement( 'img' );
		imgOverlay.id = 'seymour-img-overlay';
		imgOverlay.style = 'position: absolute;';
		imgOverlay.width = width;
		imgOverlay.height = height;

		// event listeners
		imgOverlay.seymourInstance = this;
		imgOverlay.onmousedown = function( ev ) {
			ev.preventDefault();
			this.seymourInstance.hideOverlay();
		}
		imgOverlay.ontouchstart = function( ev ) {
			ev.preventDefault();
			this.seymourInstance.hideOverlay();
		}
		imgOverlay.onwheel = function( ev ) {
			ev.preventDefault();
			this.seymourInstance.hideOverlay( ev );
		}
		imgOverlay.onmousewheel = function( ev ) {
			ev.preventDefault();
			this.seymourInstance.hideOverlay();
		}
		imgOverlay.onload = function( ev ) {
			this.seymourInstance.showOverlay();
		}
		return imgOverlay;
	},

	//----------------------------------------------------------------------------------------
	// RENDERING
	//----------------------------------------------------------------------------------------
	_render : function() {
		this.renderer.render( this.scene, this.camera );
	},

	_renderString : function( useDefault=false ) {
		if (useDefault)
			return 'http://'+this.host+'/renderer/render/1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,1,0,0,0,0,1,0,0,0,0,1,0,0,0,-5,1,2.4142135623730954,0,0,0,0,2.4142135623730954,0,0,0,0,-1.00010000500025,-1,0,0,-0.200010000500025,0,1';
		return 'http://' + this.host + '/renderer/render/' + 
			this.models.matrix.elements.toString() + ',' + 
			this.camera.matrixWorldInverse.elements.toString() + ',' + 
			this.camera.projectionMatrix.elements.toString() + ',' + 
			(this.serverTexture?1:0);
	},

	_lightString : function() {
		var pos = this.pointLight0.position;
		var path = 'http://' + this.host + '/renderer/light/' + 
			(this.pointLight0.visible?1:0) + ',' 
			+ pos.x + ',' + pos.y + ','+ pos.z;
		path += ",";
		var pos = this.pointLight1.position;
		path += (this.pointLight1.visible?1:0) + ',' 
		+ pos.x + ',' + pos.y + ','+ pos.z;
		return path;
	},

	_requestRenderTimeout : function() {
		this.seymour._requestRender();
	},

	_requestRender : function() {
		var path;
		if (this.interactionMode == INTERACTION_ENUM.light) {
			path = this._lightString();
		} else {
			path = this._renderString();
		}
		this.imgOverlay.src = path;
	},

	//----------------------------------------------------------------------------------------
	// EVENT HANDLERS
	//----------------------------------------------------------------------------------------
	onWindowResize : function() {
		if (!this.isResizable) return;

		this.windowHalfX = window.innerWidth / 2;
		this.windowHalfY = window.innerHeight / 2;

		if ( (this.windowHalfX > 400) && (this.windowHalfY > 400) ) return;

		var dim = Math.min( this.windowHalfX, this.windowHalfY ) * 2;

		// this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();

		this.renderer.setSize( dim, dim );

		this.imgOverlay.height = dim;
		this.imgOverlay.width = dim;

		this._render();
		this._requestRender();
	},

	zoom : function(delta) {
		clearTimeout(this.interval);

		var newFov = this.camera.fov + delta/2;
		if (newFov > 0 && newFov < 180) {
			this.camera.fov = newFov;
			this.camera.updateProjectionMatrix();
		}

		this._render();
		if (this.doRequestRender) {
			this.interval = setTimeout(this._requestRenderTimeout, 200);
		}
	},

	onInputStart : function(x, y) {
		this.inputIsDown = true;
		this.xInput = x;
		this.yInput = y;
		this.xInputPrev = this.xInput;
		this.yInputPrev = this.yInput;
		this._render();
	},

	onInputMove : function(x, y) {
		if (!this.inputIsDown) return;

		this.xInput = x;
		this.yInput = y;
		this.xDelta = this.xInputPrev - this.xInput;
		this.yDelta = this.yInputPrev - this.yInput;
		this.xInputPrev = this.xInput;
		this.yInputPrev = this.yInput;

		var current = this.models;
		if (this.interactionMode == INTERACTION_ENUM.translate) {
			current.position.x += -this.xDelta / this.windowWidth;
			current.position.y += this.yDelta / this.windowHeight;
		} else if (this.interactionMode == INTERACTION_ENUM.rotate) {
			if (this.objectInteraction) {
				this.rotationMatrix.premultiply(
					this._rollingBall(-this.xDelta, this.yDelta)
				);
				current.setRotationFromMatrix(this.rotationMatrix);
			}
		} else if (this.interactionMode == INTERACTION_ENUM.light) {
			this.pointLight0.position.set( 
				this.pointLight0.position.x-this.xDelta/this.windowWidth,
				this.pointLight0.position.y+this.yDelta/this.windowHeight,
				this.pointLight0.position.z
			);
		}

		this._render();
	},

	onInputEnd : function() {
		this.inputIsDown = false;
		this._render();
		if ( this.doRequestRender ) {
			this._requestRender();
		}
	},

	// Touch events
	onTouchStart : function(ev) {
		ev.preventDefault();
		if ( ev.touches.length == 2 ) {
			this.seymourInstance.interactionMode = INTERACTION_ENUM.translate;
		} else if ( ev.touches.length == 1 ) {
			this.seymourInstance.interactionMode = INTERACTION_ENUM.rotate;
		}
		this.seymourInstance.onInputStart(
			ev.touches[0].clientX,
			ev.touches[0].clientY
		);
	},

	onTouchMove : function(ev) {
		ev.preventDefault();
		this.seymourInstance.onInputMove(
			ev.touches[0].clientX, 
			ev.touches[0].clientY); 
	},

	onTouchEnd : function(ev) {
		ev.preventDefault();
		this.seymourInstance.onInputEnd(); 
	},

	// Mouse events
	onDocumentMouseWheel : function(ev) {
		event.preventDefault();

		if (event.hasOwnProperty("wheelDelta")) {
			this.seymourInstance.zoom(Math.sign(event.wheelDelta));
		} else {
			this.seymourInstance.zoom(Math.sign(event.deltaY));
		}
	},

	onDocumentMouseDown : function(ev) {
		if (event.ctrlKey) {
			this.seymourInstance.interactionMode = INTERACTION_ENUM.light;
		} else if (event.button == 2) { // right button
			this.seymourInstance.interactionMode = INTERACTION_ENUM.translate;
		} else if (event.button == 0) { // left button
			this.seymourInstance.interactionMode = INTERACTION_ENUM.rotate;
		}

		this.seymourInstance.onInputStart(event.clientX, event.clientY); 
	},

	onDocumentMouseMove : function(ev) {
		this.seymourInstance.onInputMove(event.clientX, event.clientY); 
	},

	onDocumentMouseUp : function(ev) {
		this.seymourInstance.onInputEnd();
	},

	//----------------------------------------------------------------------------------------
	// UTILS
	//----------------------------------------------------------------------------------------
	// Rolling ball rotation from The Rolling Ball (Hanson 1992) http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.69.2209&rep=rep1&type=pdf
	_rollingBall : function(dx, dy) {
		if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) return this.m.identity();

		var dr = Math.sqrt(dx*dx + dy*dy)
		var R = 100;
		var cos = R/Math.sqrt(R*R + dr*dr)
		var sin = dr/Math.sqrt(R*R + dr*dr)

		this.m.set(
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

		return this.m;
	},

	//----------------------------------------------------------------------------------------
	// EXPOSED FUNCTIONS
	//----------------------------------------------------------------------------------------
	start : function() {
		this.doRequestRender = true;
	},

	pause : function() {
		this.doRequestRender = false;
	},

	loadModel : function(path) {
		// instantiate a loader
		var seymourInstance = this;
		var texloader = new THREE.TextureLoader();

		var index = path.lastIndexOf( '/' );
		var folder = path.substr( 0,index+1 );
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
						var material = new THREE.MeshStandardMaterial( { color: 0x0055ff, flatShading: true } );
						// var material = new THREE.MeshBasicMaterial( {
						// 	map: texture
						//  } );
					
						// var material = new THREE.MeshStandardMaterial( { color: 0x0055ff, flatShading: true } );
						var mesh = new THREE.Mesh( geometry, material );
						mesh.name = "loadedModel";
						seymourInstance.models.add( mesh );
					},

					// onProgress callback currently not supported
					undefined,

					// onError callback
					function ( err ) {
						console.error( 'Error loading texture, default will be used.' );
						var material = new THREE.MeshStandardMaterial( { color: 0x0055ff, flatShading: true } );
						var mesh = new THREE.Mesh( geometry, material );
						mesh.name = "loadedModel";
						this.models.add( mesh );
					}
				);
			} else {
				var material = new THREE.MeshStandardMaterial( { color: 0xffffff, flatShading: true } );
				var mesh = new THREE.Mesh( geometry, material );
				mesh.name = "loadedModel";
				this.models.add( mesh );
			}
		} );
	},

	getCurrentFrameRequest : function() {
		return this._renderString();
	},

	enableModelInteraction : function(flag) {
		this.objectInteraction = flag;
	},

	hideOverlay : function() {
		this.imgOverlay.style.visibility = "hidden";
		this.imgOverlay.src = "";
		this.imgOverlay.style.width = "0pt";
		this.imgOverlay.style.height = "0pt";
	},

	showOverlay : function() {
		this.imgOverlay.style.visibility = "visible";
		this.imgOverlay.style.width = "";
		this.imgOverlay.style.height = "";
	},

	render : function() {
		this._render();
		if (this.doRequestRender)
			this._requestRender();
	},

	setRotationMatrix : function(matStr) {
		var vals = matStr.split(',');
		for (i=0; i<vals.length; i++) vals[i] = parseFloat(vals[i]);
		this.rotationMatrix.elements = vals.slice();
		this.models.setRotationFromMatrix(this.rotationMatrix);
		// this.render();
	},

	setFov : function(fov) {
		this.camera.fov = fov;
		this.camera.updateProjectionMatrix();
		// this.render();
	},

	setPosition : function(posStr) {
		var pos = posStr.split(',');
		this.models.position.x = parseFloat(pos[0]);
		this.models.position.y = parseFloat(pos[1]);
		// this.render();
	}
};

function getPosition() {
	var current = this.models;
	return '"'+current.position.x+','+current.position.y+'"';
}