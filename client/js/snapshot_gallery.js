var seymour;

window.onload = function() {
	// seymour setup
	var myElement = document.getElementById( 'seymour-container' );
	var options = {
		width: 512, 
		height: 512, 
		backend: '10.10.10.100'
	};
	seymour = new Seymour( myElement, options );
	seymour.loadModel( './models/ply/queen/queen.ply' );

	// snapshot gallery
	document.getElementById( 'snapshot-xl' ).width = 512;
	document.getElementById( 'snapshot-xl' ).height = 512;
	document.getElementById( 'camera-btn' ).onclick = handleCameraBtn;
	document.getElementById( 'switch-btn' ).onclick = handleSwitchBtn;
}

function handleCameraBtn() {
	// add a new snapshot
	document.getElementById( 'gallery' ).innerHTML += 
		`<div class="snapshot" style="background-image: url('`
			+ document.getElementById("seymour-img-overlay").src +
			`')"`
			+ 'data-rot="'+seymour.rotationMatrix.elements.toString()+'"'
			+ 'data-fov="'+seymour.camera.fov+'"'
			+ 'data-pos='+seymour.models.position.x+','+seymour.models.position.y+''
			+`>
			<a href="`+document.getElementById("seymour-img-overlay").src+`" download="frame.jpeg" style="text-decoration:none;">
				<svg class="download button" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M16 11h5l-9 10-9-10h5v-11h8v11zm1 11h-10v2h10v-2z"/></svg>
			</a>
			<svg class="delete button" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M24 20.188l-8.315-8.209 8.2-8.282-3.697-3.697-8.212 8.318-8.31-8.203-3.666 3.666 8.321 8.24-8.206 8.313 3.666 3.666 8.237-8.318 8.285 8.203z"/></svg>
		</div>`;

	// make sure event listeners are attached to all the snapshot buttons
	var snapshots = document.getElementsByClassName( 'snapshot' ) ;
	for (var i=0; i<snapshots.length; i++) {
		var snapshot = snapshots[i];
		snapshot.onclick = handleSnapshot;
		snapshot.children[1].onclick = handleDeleteBtn;
	}
}

function handleSnapshot() {
	// set rotation matrix
	var vals = this.getAttribute( 'data-rot' ).split(',');
	for (i=0; i<vals.length; i++) vals[i] = parseFloat(vals[i]);
	this.rotationMatrix.elements = vals.slice();
	this.models.setRotationFromMatrix(this.rotationMatrix);

	// set fov of camera
	seymour.camera.fov = this.getAttribute( 'data-fov' );
	seymour.camera.updateProjectionMatrix();

	// set position of models
	var pos = this.getAttribute( 'data-pos' ).split(',');
	this.models.position.x = parseFloat(pos[0]);
	this.models.position.y = parseFloat(pos[1]);

	// set imgOverlay
	var src = this.style.backgroundImage.slice(4, -1).replace(/"/g, "");
	document.getElementById( 'seymour-img-overlay' ).src = "";
	document.getElementById( 'seymour-img-overlay' ).src = src;
}

function handleDeleteBtn() {
	this.parentElement.remove( this )
}

function handleSwitchBtn() {
	handleCameraBtn();
	document.getElementById( 'snapshot-xl' ).src = document.getElementById( 'seymour-img-overlay' ).src
}