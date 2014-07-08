define(["lib/three"], function() {"use strict";

	var Colors = {};

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

	function WindowResize(renderer, camera, hostElement) {
		var callback = function() {
			// notify the renderer of the size change
			renderer.setSize(hostElement.clientWidth, hostElement.clientHeight);
			// update the camera
			camera.aspect = hostElement.clientWidth / hostElement.clientHeight;
			camera.updateProjectionMatrix();
		};
		// bind the resize event
		window.addEventListener('resize', callback, false);
		// return .stop() the function to stop watching window resize
		return {
			/**
			 * Stop watching window resize
			 */
			stop : function() {
				window.removeEventListener('resize', callback);
			}
		};
	}

	return {
		colors : Colors,
		materials : Materials,
		windowResize : WindowResize,
	};

});
