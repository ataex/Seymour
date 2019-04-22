var scalebar;
var unit = 0.01;
var unitSpan;
var unitDict = {
	'0.001' : "Millimeters",
	'0.01' : "Centimeters",
	'0.1' : "Decimeters",
	'1' : "Meters",
	'10' : "Dekameters"
};

window.onload = function main() {
	// Setup Seymour
	var myElement = document.getElementById('seymour-container');
	var options = {
		width: 512, 
		height: 512, 
		backend: 'localhost'
	};
	seymour = new Seymour( myElement, options );
	seymour.loadModel( '../models/ply/queen/queen.ply' );

	// Switch to an orthographic camera
	var camera = new THREE.OrthographicCamera( -2, 2, 2, -2, 1, 1000 );
	camera.position.z = 5;
	seymour.camera = camera;

	// Setup up controls
	document.onwheel = handleMouseWheel;
	document.onmousewheel = handleMouseWheel;

	scalebar = document.getElementById( 'scalebar-container' );
	unitSpan = document.getElementById( 'units' );
	updateScalebar();

	seymour.render();
}

var scaleSpeed = 0.1;
function handleMouseWheel( ev ) {
	var delta;
	if (event.hasOwnProperty("wheelDelta")) {
		delta = Math.sign(event.wheelDelta);
	} else {
		delta = Math.sign(event.deltaY);
	}

	var newScale = 	seymour.models.scale.x + delta * scaleSpeed;

	if (newScale <= 0) return;

	seymour.models.scale.x = newScale;
	seymour.models.scale.y = newScale;
	seymour.models.scale.z = newScale;

	updateScalebar();
	seymour.render();
}

var vector = new THREE.Vector3(1, 0, 0);
var width = 512, height = 512;
var widthHalf = width / 2, heightHalf = height / 2;
function updateScalebar() {
	vector.x = 1; vector.y = 0; vector.z = 0;
	vector.applyMatrix4( seymour.models.matrixWorld ).project( seymour.camera );

	vector.x = ( vector.x * widthHalf ) + widthHalf;
	vector.y = - ( vector.y * heightHalf ) + heightHalf;

	var dist = vector.x - widthHalf;
	var newScalebarWidth = 5 * unit * (dist / 0.047);

	if (newScalebarWidth > width) {
		unit *= 0.1;
		newScalebarWidth *= 0.1;
	} else if (newScalebarWidth < (width*0.1)) {
		unit *= 10;
		newScalebarWidth *= 10;
	}

	unit = parseFloat(unit.toFixed(5));

	unitSpan.innerHTML = unitDict[unit.toString()];
	unitSpan.style.left = (newScalebarWidth + 10) + "px";
	scalebar.style.width = newScalebarWidth + "px";
}