/*
Seymour Client - seymour.sj

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

/**
 * Enumeration for interaction modes.
 * @property {number} translate
 * @property {number} rotate
 * @property {number} light
 */
const INTERACTION_ENUM = Object.freeze({
	'translate': 0,
	'rotate':    1,
	'light':     2
});

/**
 * An instance of the seymour client, adding the rendering canvas to the supplied html element.
 * @property {boolean} host Base URL of Seymour server.
 * @property {boolean} isResizable If true, client canvas will resize with window.
 * @property {boolean} doRequestRender If true, requests will be sent for server renderings.
 * @property {Object} interactionMode Current mode as INTERACTION_ENUM.
 * @property {boolean} serverTexture Request render from server with/without texture.
 * @property {Object} rotationMatrix <a src="https://threejs.org/docs/#api/en/math/Matrix4">THREE.Matrix4</a> storing the rotation of this.models.
 * @property {Object} container Reference to div element containing the client canvas and imgOverlay.
 * @property {Object} imgOverlay Reference to img element holding rendered server frame.
 * @property {Object} scene <a src="https://threejs.org/docs/#api/en/scenes/Scene">THREE.Scene</a>.
 * @property {Object} camera <a src="https://threejs.org/docs/#api/en/cameras/Camera">THREE.Camera</a>, is THREE.PerspectiveCamera by default.
 * @property {Object} models <a src="https://threejs.org/docs/#api/en/core/Object3D">THREE.Object3D</a> containing models for interaction.
 * @property {Object} pointLight0 <a src="https://threejs.org/docs/#api/en/lights/PointLight">THREE.PointLight</a>
 * @property {Object} pointLight1 <a src="https://threejs.org/docs/#api/en/lights/PointLight">THREE.PointLight</a>
 * @property {Object} pointLight2 <a src="https://threejs.org/docs/#api/en/lights/PointLight">THREE.PointLight</a>
 * @param {Object} myElement The html element.
 * @param {Object} options Options for Seymour instance.
 */
function Seymour( myElement, options ) {
	this._init( myElement, options );
	console.log( 'Seymour version: ' + SEYMOUR_VERSION );
}

Seymour.prototype = {
	//----------------------------------------------------------------------------------------
	// SETUP
	//----------------------------------------------------------------------------------------
	/**
	 * Initialize Seymour object, create client rendering canvas, and render the first frame.
	 * @private
	 * @param {Object} myElement
	 * @param {Object} options
	 */
	_init : function( myElement, options ) {
		options = options || {};

		//
		// init properties
		//
		// set defaults
		this._windowWidth = options.width;
		this._windowHeight = options.height;
		this.host = options.backend;
		this.isResizable = options.resizable || false;
		
		this.doRequestRender = true;
		this._objectInteraction = true;
		this._inputIsDown = false;
		this.interactionMode = INTERACTION_ENUM.translate; 
		this.serverTexture = true;
		this._m = new THREE.Matrix4(); // temp matrix
		this.rotationMatrix = new THREE.Matrix4();

		// container
		this.container = document.createElement( 'div' );
		this.container.style = 'position: relative;'
		myElement.appendChild( this.container );

		// <img> for rendered frames 
		this.imgOverlay = this._createImgOverlay( this._windowWidth, this._windowHeight );
		this.container.appendChild( this.imgOverlay)		
		this.hideOverlay();

		// render default starting view
		this.imgOverlay.src = this._renderString( true );

		//
		// scene
		//
		this.scene = new THREE.Scene();

		this.camera = new THREE.PerspectiveCamera( 
			45, this._windowWidth / this._windowHeight, 0.1, 2000 
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
		this.renderer.setSize( this._windowWidth, this._windowHeight );

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

	/**
	 * Create img to hold rendered server frames and overlay client canvas.
	 * @private
	 * @param {Object} width
	 * @param {Object} height
	 * @return {Object} Reference to created img element
	 */
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
	/**
	 * Render scene in client canvas.
	 * @private
	 */
	_render : function() {
		this.renderer.render( this.scene, this.camera );
	},

	/**
	 * Create and return server URI for current frame.
	 * @private
	 * @param {boolean} useDefault Flag to use default URI
	 * @return {string} URI
	 */
	_renderString : function( useDefault=false ) {
		if (useDefault)
			return 'http://'+this.host+'/renderer/render/1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,1,0,0,0,0,1,0,0,0,0,1,0,0,0,-5,1,2.4142135623730954,0,0,0,0,2.4142135623730954,0,0,0,0,-1.00010000500025,-1,0,0,-0.200010000500025,0,1';
		return 'http://' + this.host + '/renderer/render/' + 
			this.models.matrix.elements.toString() + ',' + 
			this.camera.matrixWorldInverse.elements.toString() + ',' + 
			this.camera.projectionMatrix.elements.toString() + ',' + 
			(this.serverTexture?1:0);
	},

	/**
	 * Description
	 * @private
	 * @return {Object} description
	 */
	_lightString : function() {
		var pos = this.pointLight0.position;
		var path = 'http://' + this.host + '/renderer/light/' + 
			(this.pointLight0.visible?1:0) + ',' 
			+ pos.x + ',' + pos.y + ','+ pos.z;
		path += ",";
		var pos = this.pointLight1.position;
		path += (this.pointLight1.visible?1:0) + ',' 
		+ pos.x + ',' + pos.y + ','+ pos.z +
		Date.now(); // add time to avoid browser caching image
		return path;
	},

	/**
	 * Description
	 * @private
	 */
	_requestRenderTimeout : function() {
		this.seymour._requestRender();
	},

	/**
	 * Description
	 * @private
	 */
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
	/**
	 * Resize the client canvas to fill the window.
	 * @private
	 */
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

	/**
	 * Zoom by changing the FOV of the camera.
	 * @private
	 * @param {number} delta
	 */
	zoom : function( delta ) {
		clearTimeout(this.interval);

		var newFov = this.camera.fov + delta/2;
		if (newFov > 0 && newFov < 180) {
			this.camera.fov = newFov;
			this.camera.updateProjectionMatrix();
		}

		this._render();
		if (this.doRequestRender) {
			this.interval = setTimeout( this._requestRenderTimeout, 200 );
		}
	},

	/**
	 * Initialize input variables.
	 * @private
	 * @param {number} x
	 * @param {number} y
	 */
	onInputStart : function( x, y ) {
		this._inputIsDown = true;
		this.xInput = x;
		this.yInput = y;
		this.xInputPrev = this.xInput;
		this.yInputPrev = this.yInput;
		this._render();
	},

	/**
	 * Apply appropriate interactionMode, see INTERACTION_ENUM.
	 * @private
	 * @param {number} x
	 * @param {number} y
	 */
	onInputMove : function( x, y ) {
		if (!this._inputIsDown) return;

		this.xInput = x;
		this.yInput = y;
		this.xDelta = this.xInputPrev - this.xInput;
		this.yDelta = this.yInputPrev - this.yInput;
		this.xInputPrev = this.xInput;
		this.yInputPrev = this.yInput;

		var current = this.models;
		if (this.interactionMode == INTERACTION_ENUM.translate) {
			current.position.x += -this.xDelta / this._windowWidth;
			current.position.y += this.yDelta / this._windowHeight;
		} else if (this.interactionMode == INTERACTION_ENUM.rotate) {
			if (this._objectInteraction) {
				this.rotationMatrix.premultiply(
					this._rollingBall(-this.xDelta, this.yDelta)
				);
				current.setRotationFromMatrix(this.rotationMatrix);
			}
		} else if (this.interactionMode == INTERACTION_ENUM.light) {
			this.pointLight0.position.set( 
				this.pointLight0.position.x-this.xDelta/this._windowWidth,
				this.pointLight0.position.y+this.yDelta/this._windowHeight,
				this.pointLight0.position.z
			);
		}

		this._render();
	},

	/**
	 * Clean up input event and render.
	 * @private
	 */
	onInputEnd : function() {
		this._inputIsDown = false;
		this._render();
		if ( this.doRequestRender ) {
			this._requestRender();
		}
	},

	//
	// Touch events
	//
	/**
	 * Call onInputStart
	 * @private
	 * @param {number} ev <a src="https://developer.mozilla.org/en-US/docs/Web/API/TouchEvent">TouchEvent</a>
	 */
	onTouchStart : function( ev ) {
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

	/**
	 * Call onInputMove
	 * @private
	 * @param {number} ev <a src="https://developer.mozilla.org/en-US/docs/Web/API/TouchEvent">TouchEvent</a>
	 */
	onTouchMove : function( ev ) {
		ev.preventDefault();
		this.seymourInstance.onInputMove(
			ev.touches[0].clientX, 
			ev.touches[0].clientY); 
	},

	/**
	 * Call onInputEnd
	 * @private
	 * @param {number} ev <a src="https://developer.mozilla.org/en-US/docs/Web/API/TouchEvent">TouchEvent</a>
	 */
	onTouchEnd : function( ev ) {
		ev.preventDefault();
		this.seymourInstance.onInputEnd(); 
	},

	//
	// Mouse events
	//
	/**
	 * Parse MouseEvent and call zoom.
	 * @private
	 * @param {number} ev <a src="https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent">MouseEvent</a>
	 */
	onDocumentMouseWheel : function( ev ) {
		event.preventDefault();

		if (event.hasOwnProperty("wheelDelta")) {
			this.seymourInstance.zoom(Math.sign(event.wheelDelta));
		} else {
			this.seymourInstance.zoom(Math.sign(event.deltaY));
		}
	},

	/**
	 * Set interactionMode and call onInputEnd.
	 * @private
	 * @param {number} ev <a src="https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent">MouseEvent</a>
	 */
	onDocumentMouseDown : function( ev ) {
		if (event.ctrlKey) {
			this.seymourInstance.interactionMode = INTERACTION_ENUM.light;
		} else if (event.button == 2) { // right button
			this.seymourInstance.interactionMode = INTERACTION_ENUM.translate;
		} else if (event.button == 0) { // left button
			this.seymourInstance.interactionMode = INTERACTION_ENUM.rotate;
		}

		this.seymourInstance.onInputStart(event.clientX, event.clientY); 
	},

	/**
	 * Call onInputMove
	 * @private
	 * @param {number} ev <a src="https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent">MouseEvent</a>
	 */
	onDocumentMouseMove : function( ev ) {
		this.seymourInstance.onInputMove( event.clientX, event.clientY ); 
	},

	/**
	 * Call onInputUp
	 * @private
	 * @param {number} ev <a src="https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent">MouseEvent</a>
	 */
	onDocumentMouseUp : function( ev ) {
		this.seymourInstance.onInputEnd();
	},

	//----------------------------------------------------------------------------------------
	// UTILS
	//----------------------------------------------------------------------------------------
	/**
	 * Rolling ball rotation from <a src="http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.69.2209&rep=rep1&type=pdf">The Rolling Ball (Hanson 1992)</a>.
	 * @private
	 * @param {number} dx
	 * @param {number} dy
	 * @return {Object} <a src="https://threejs.org/docs/#api/en/math/Matrix4">THREE.Matrix4</a> rotation matrix
	 */
	_rollingBall : function( dx, dy ) {
		if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) return this._m.identity();

		var dr = Math.sqrt(dx*dx + dy*dy)
		var R = 100;
		var cos = R/Math.sqrt(R*R + dr*dr)
		var sin = dr/Math.sqrt(R*R + dr*dr)

		this._m.set(
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

		return this._m;
	},

	//----------------------------------------------------------------------------------------
	// EXPOSED FUNCTIONS
	//----------------------------------------------------------------------------------------
	/**
	 * Start sending rendering requests to the server for each frame.
	 */
	start : function() {
		this.doRequestRender = true;
	},

	/**
	 * Stop sending rendering requests to the server for each frame.
	 */
	pause : function() {
		this.doRequestRender = false;
	},

	/**
	 * Loads the model in the given file to the Seymour client scene.
	 * @param {string} path path to file
	 */
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

	/**
	 * Get the URI for the current frame.
	 * @returns {string} uri for current frame
	 */
	getCurrentFrameRequest : function() {
		return this._renderString();
	},

	/**
	 * Enable/disable default rolling ball interaction with models.
	 * @param {boolean} flag update value
	 */
	enableModelInteraction : function(flag) {
		this._objectInteraction = flag;
	},

	/**
	 * Hide the imgOverlay.
	 */
	hideOverlay : function() {
		this.imgOverlay.style.visibility = "hidden";
		this.imgOverlay.src = "";
		this.imgOverlay.style.width = "0pt";
		this.imgOverlay.style.height = "0pt";
	},

	/**
	 * Show the imgOverlay.
	 */
	showOverlay : function() {
		this.imgOverlay.style.visibility = "visible";
		this.imgOverlay.style.width = "";
		this.imgOverlay.style.height = "";
	},

	/**
	 * Render a frame in the client canvas and, if doRequestRender is true, request a render from the server.
	 */
	render : function() {
		this._render();
		if (this.doRequestRender)
			this._requestRender();
	}
};