define(["lib/three"], function() {"use strict";

	var Colors = {};

	Colors.blue = 0x5079c2;
	Colors.red = 0xc25079;
	Colors.green = 0x79c250;
	Colors.white = 0xdedede;
	Colors.sprueGrey = 0x666666;
	Colors.greenstuff = 0x0da624;

	function Materials() {

		this.blueMaterial = new THREE.MeshLambertMaterial({
			color : Colors.blue,
			shading : THREE.FlatShading,
		});

		this.whiteMaterial = new THREE.MeshLambertMaterial({
			color : Colors.white,
			shading : THREE.FlatShading,
		});

		this.redMaterial = new THREE.MeshLambertMaterial({
			color : Colors.red,
			shading : THREE.FlatShading,
		});

		this.greenMaterial = new THREE.MeshLambertMaterial({
			color : Colors.green,
			shading : THREE.FlatShading,
		});

		this.sprueGreyMaterial = new THREE.MeshPhongMaterial({
			ambient : 0x151515,
            emissive : 0x202020,
			color : Colors.sprueGrey,
			specular : 0x202020,
			shininess : 50,
            shading : THREE.SmoothShading,
		});

		this.greenstuffMaterial = new THREE.MeshPhongMaterial({
			ambient : 0x000000,
			color : Colors.greenstuff,
			specular : 0x050500,
			shininess : 50,
		});

		this.selectMaterial = this.greenMaterial.clone();

		this.highlightMaterial = this.blueMaterial.clone();

		this.simpleRedMaterial = new THREE.MeshBasicMaterial({
			color : 0xff0000
		});
		
		this.simpleBlueMaterial = new THREE.MeshBasicMaterial({
			color : 0x0000ff
		});
		
		this.simpleGreenMaterial = new THREE.MeshBasicMaterial({
			color : 0x00ff00
		});
		
		this.simpleYellowMaterial = new THREE.MeshBasicMaterial({
			color : 0xffff00
		});
		
		this.simpleOrangeMaterial = new THREE.MeshBasicMaterial({
			color : 0xff8000
		});

	}

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

	/**
	 * Assign prototype without calling constructor
	 * @param {Object} o The object whose prototype you want to inherit
	 */
	function inherit(o) {
		function F() {
		};// Dummy constructor
		F.prototype = o;
		F.prototype.$super = o;
		return new F();
	}

	return {
		colors : Colors,
		materials : Materials,
		windowResize : WindowResize,
		inherit : inherit,
	};

});
