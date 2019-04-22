var seymour;

window.onload = function () {
	var myElement = document.getElementById('seymour-container');
	var options = {
		width: 512, 
		height: 512, 
		backend: 'localhost'
	};

	seymour = new Seymour(myElement, options);
	seymour.loadModel('../models/ply/queen/queen.ply');

	initHandlers();
}

function initHandlers() {
	// image distortions
	document.getElementById("jpeg-num").innerHTML = document.getElementById("jpeg-slider").value;
	document.getElementById("jpeg-slider").onchange = function () {
		document.getElementById("jpeg-num").innerHTML = this.value;
		changeDistortion();
	}
	document.getElementById("noise-num").innerHTML = (100 - document.getElementById("noise-slider").value/10).toFixed(1) + "%";
	document.getElementById("noise-slider").onchange = function () {
		document.getElementById("noise-num").innerHTML = (100 - this.value/10).toFixed(1) + "%";
		changeDistortion();
	}
	// light distortions
	document.getElementById("light-checkbox").onchange = function () {
		changeDistortion();
	}
	document.getElementById("light-dist-num").innerHTML = (document.getElementById("light-dist-slider").value/10);
	document.getElementById("light-dist-slider").onchange = function () {
		document.getElementById("light-dist-num").innerHTML = (this.value/10);
		changeDistortion();
	}
	// geometric distortions
	document.getElementById("trans-checkbox").onchange = function () {
		changeDistortion();
	}
	document.getElementById("scale-checkbox").onchange = function () {
		changeDistortion();
	}
	document.getElementById("rotate-checkbox").onchange = function () {
		changeDistortion();
	}
	document.getElementById("geo-dist-num").innerHTML = (document.getElementById("geo-dist-slider").value/1000);
	document.getElementById("geo-dist-slider").onchange = function () {
		document.getElementById("geo-dist-num").innerHTML = (this.value/1000);
		changeDistortion();
	}
}

function changeDistortion() {
	seymour.imgOverlay.src = "http://" + seymour.host + "/renderer/distortions/" + 
	document.getElementById("jpeg-slider").value + "," + 
	(document.getElementById("noise-slider").value/1000) + "," + 
	(document.getElementById("light-checkbox").checked?1:0) + "," + 
	(document.getElementById("light-dist-slider").value/10) + "," +
	(document.getElementById("trans-checkbox").checked?1:0) + "," + 
	(document.getElementById("rotate-checkbox").checked?1:0) + "," + 
	(document.getElementById("scale-checkbox").checked?1:0) + "," + 
	(document.getElementById("geo-dist-slider").value/1000) + "," +
	Date.now(); // add time to avoid browser caching image
}