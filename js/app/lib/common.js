define(["lib/three"], function() {"use strict";

	function Colors() {

	}


	Colors.blue = 0x5079c2;
	Colors.red = 0xc25079;
	Colors.green = 0x79c250;
	Colors.white = 0xdedede;

	function Materials() {
	};

	Materials.blueMaterial = new THREE.MeshLambertMaterial({
		color : Colors.blue,
		shading : THREE.FlatShading,
		transparent : true
	});

	Materials.whiteMaterial = new THREE.MeshLambertMaterial({
		color : Colors.white,
		shading : THREE.FlatShading,
		transparent : true
	});

	Materials.redMaterial = new THREE.MeshLambertMaterial({
		color : Colors.red,
		shading : THREE.FlatShading,
		transparent : true
	});

	Materials.greenMaterial = new THREE.MeshLambertMaterial({
		color : Colors.green,
		shading : THREE.FlatShading,
		transparent : true
	});

	return {
		colors : Colors,
		materials : Materials,
	};

});
