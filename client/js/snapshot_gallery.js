window.onload = main;

function main() {
	var myElement = document.getElementById('seymour-container');
	var options = {
		width: 512, 
		height: 512, 
		backend: 'localhost'
	};
	var seymour = new Seymour(myElement, options);
	seymour.loadModel('./models/ply/VC_0001_Antoninus_Pious-3k.ply');

	document.getElementById("snapshot-xl").width = 512;
	document.getElementById("snapshot-xl").height = 512;
	document.getElementById("camera-btn").onclick = handleCameraBtn;
	document.getElementById("switch-btn").onclick = handleSwitchBtn;
}

function handleCameraBtn() {
	document.getElementById("gallery").innerHTML += 
		`<div class="snapshot" style="background-image: url('`
			+ document.getElementById("seymour-img-overlay").src +
			`')"`
			+ 'data-rot="'+getRotMatrix().elements.toString()+'"'
			+ 'data-fov="'+getFov()+'"'
			+ 'data-pos='+getPosition()+''
			+`>
			<a href="`+document.getElementById("seymour-img-overlay").src+`" download="frame.jpeg" style="text-decoration:none;">
				<svg class="download button" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M16 11h5l-9 10-9-10h5v-11h8v11zm1 11h-10v2h10v-2z"/></svg>
			</a>
			<svg class="delete button" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M24 20.188l-8.315-8.209 8.2-8.282-3.697-3.697-8.212 8.318-8.31-8.203-3.666 3.666 8.321 8.24-8.206 8.313 3.666 3.666 8.237-8.318 8.285 8.203z"/></svg>
		</div>`;

	var snapshots = document.getElementsByClassName('snapshot');
	for (var i=0; i<snapshots.length; i++) {
		var snapshot = snapshots[i];
		snapshot.onclick = handleSnapshot;
		snapshot.children[1].onclick = handleDeleteBtn;
	}
}

function handleSnapshot() {
	var src = this.style.backgroundImage.slice(4, -1).replace(/"/g, "");
	document.getElementById("seymour-img-overlay").src = src;
	setRotMatrix(this.getAttribute('data-rot'));
	setFov(this.getAttribute('data-fov'));
	console.log(this.getAttribute('data-pos'))
	setPosition(this.getAttribute('data-pos'));
}

function handleDeleteBtn() {
	this.parentElement.remove(this)
}

function handleSwitchBtn() {
	handleCameraBtn();
	document.getElementById("snapshot-xl").src = document.getElementById("seymour-img-overlay").src
}