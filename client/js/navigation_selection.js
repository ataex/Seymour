var mode = 'rollingball';
var m0 = new THREE.Matrix4();
var m1 = new THREE.Matrix4();
var xaxis = new THREE.Vector4( 1, 0, 0 );
var yaxis = new THREE.Vector4( 0, 1, 0 );
var pitch = 0;
var yaw = 0;
var speed = 0.1;

window.onload = function main() {
	// Setup Seymour
	var myElement = document.getElementById('seymour-container');
	var options = {
		width: 512, 
		height: 512, 
		backend: 'localhost'
	};
	seymour = new Seymour( myElement, options );
	seymour.loadModel( './models/ply/saint-nicodeme-plumeliau.ply' );

	// seymour.models.scale.set(5,5,5);
	// seymour.camera.position.z += 5;

	document.getElementById( 'navigation-dropdown' ).selectedIndex = 0;
	document.getElementById( 'navigation-dropdown' ).onchange = handleNavigationDropdown;
	document.onkeypress = handleKeyPress;
	document.onkeyup = handleKeyUp;
	document.onmousemove = handleMouseMove;

	seymour.camera.setRotationFromMatrix( m0 )
	seymour.render();
}

function handleMouseMove( ev ) {
	if (!(ev.buttons == 1) || (mode == 'rollingball')) return;

	if (mode == 'flying') {
		m0.identity();
		m0.makeRotationAxis( yaxis, yaw );
		m1.makeRotationAxis( xaxis, pitch );
		seymour.camera.setRotationFromMatrix( m0.multiply(m1) );
		pitch += -1 * ev.movementY * speed * Math.PI / 180;
		seymour.camera.pitch = pitch;
		yaw += -1 * ev.movementX * speed * Math.PI / 180;
		seymour.camera.yaw = yaw;
	} else if (mode == 'turntable') {
		seymour.models.rotation.y += ev.movementX * speed * 0.2;
		var newRotX = seymour.models.rotation.x + ev.movementY * speed * 0.2;
		if (newRotX > 0 && newRotX < (Math.PI/2))
			seymour.models.rotation.x = newRotX;
	}
}

function handleNavigationDropdown( ev ) {
	var value = this.options[this.selectedIndex].value;
	mode = value;
	
	if (value == 'rollingball')
		seymour.enableModelInteraction(true);
	else		
		seymour.enableModelInteraction(false);
}

var v = new THREE.Vector3();
function handleKeyPress( ev ) {
	if (!(mode == 'flying'))
		return;

	seymour.pause();
	seymour.hideOverlay();
	seymour.render();
	seymour.camera.getWorldDirection( v );
	v.normalize();
	if (ev.key == 'w') {
		seymour.camera.position.x += v.x * 0.05;
		seymour.camera.position.y += v.y * 0.05;
		seymour.camera.position.z += v.z * 0.05;
	} else if (ev.key == 's') {
		seymour.camera.position.x -= v.x * 0.05;
		seymour.camera.position.y -= v.y * 0.05;
		seymour.camera.position.z -= v.z * 0.05;
	}
}

function handleKeyUp() {
	seymour.start();
	seymour.render();
}