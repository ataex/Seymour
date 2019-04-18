var recordFlag = false;
var animateFlag = false;
var images = []

window.onload = function main() {
	// Setup Seymour
	var myElement = document.getElementById('seymour-container');
	var options = {
		width: 512, 
		height: 512, 
		backend: 'localhost'
	};
	seymour = new Seymour( myElement, options );
	seymour.loadModel( './models/ply/VC_0001_Antoninus_Pious-3k.ply' );

	// Setup event handlers
	document.getElementById( 'record-btn' ).onclick = handleRecordBtn;
	document.getElementById( 'frame-slider' ).oninput = handleFrameSlider;
	document.getElementById( 'animate-btn' ).onclick = handleAnimateBtn;

	// Initialize Object3D to display the selected render path
	initPoints();
	setupSlider();

	seymour.container.onmousemove = handleMouseMove;
}

// Initialize object to visualize render path with red points
var currentPoints, positions, points;
function initPoints() {
	var MAX_POINTS = 1000000;
	currentPoints = 0;
	var geometry = new THREE.BufferGeometry();
	positions = new Float32Array( MAX_POINTS * 3 ); 
	geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );

	var material = new THREE.PointsMaterial( { color: 0xff0000, size: 0.1 } );

	points = new THREE.Points( geometry, material );
	points.name = "points";

	seymour.models.add( points );
}

function resetPoints() {
	points.geometry.setDrawRange( 0, currentPoints ); 
	currentPoints = 0;
}

var v = new THREE.Vector3();
var m = new THREE.Matrix4();
function handleMouseMove(ev) {
	if (recordFlag && (ev.buttons == 1 || ev.buttons == 2)) {
		// Add a point to the path
		v.x = 0; v.y = 0; v.z = 1;
		m.identity();
		v = v.applyMatrix4(m.getInverse(seymour.models.matrix));

		positions[currentPoints*3+0] = v.x;
		positions[currentPoints*3+1] = v.y;
		positions[currentPoints*3+2] = v.z;
		currentPoints++;
		points.geometry.attributes.position.needsUpdate = true;   
  		points.geometry.setDrawRange( 0, currentPoints );  

  		images.push(seymour.getCurrentFrameRequest());
		
		// Render the image hidden so that it will be cached for future viewing
  		var img = document.createElement( 'img' );
  		img.hidden = true;
  		img.src = seymour.getCurrentFrameRequest();
  		document.body.append(img);
	}
}

function setupSlider() {
	var slider = document.getElementById( 'frame-slider' );
	var animateBtn = document.getElementById( 'animate-btn' );
	slider.value = 0;
	if (images.length == 0) {
		slider.disabled = true;
		animateBtn.disabled = true;
	} else {
		slider.disabled = false;
		animateBtn.disabled = false;
		slider.setAttribute('max', (images.length-1));
	}
	resetPoints();
}

function handleRecordBtn() {
	recordFlag = !recordFlag;

	var recordIcon = this.children[0];
	if (recordFlag) {
		recordIcon.classList.add('to-square');
		recordIcon.classList.remove('to-dot');
		this.children[2].innerHTML = ' Stop'

		images = [];
 		seymour.pause();
	} else {
		recordIcon.classList.add('to-dot');
		recordIcon.classList.remove('to-square');
		this.children[2].innerHTML = ' Start'

		seymour.start();
	}

	resetPoints();
	setupSlider();
}

var current = 0;
function handleFrameSlider() {
	current = this.value;
	seymour.imgOverlay.src = images[current];
}

var interval;
function handleAnimateBtn() {
	animateFlag = !animateFlag;

	if (animateFlag) {
		interval = setInterval(animateSlider, 100, 1);
		this.innerHTML = 'Animate<br>Stop';
	} else {
		clearInterval( interval );
		this.innerHTML = 'Animate<br>Start';
	}
}

var delta = 1;
function animateSlider() {
	if (current == (images.length-1)) 
		delta = -1
	else if (current == 0)
		delta = 1

	current += delta;
	seymour.imgOverlay.src = images[current];
	document.getElementById( 'frame-slider' ).value = current;
}

function animateBackward() {

}