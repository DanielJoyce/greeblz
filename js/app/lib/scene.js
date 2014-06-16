define(['jquery', 'lib/STLLoader', 'lib/THREEx.FullScreen', 'lib/THREEx.WindowResize', 'lib/OrbitControls', 'lib/TransformControls'], function($) {"use strict";

	function GreeblzScene(container, pubsub, geomTopic, geomLoadedTopic, keyboardTopic, mouseTopic) {

		/*
		* Three.js "tutorials by example" Author: Lee Stemkoski Date: July 2013
		* (three.js v59dev)
		*/

		// MAIN
		// standard global variables

		this._scene = null;
		this._camera = null;
		this._renderer = null;
		this._orbitControls = null;
		this._stats = null;
		this._projector = null;
		this._light = null;
		//this._keyboard = new THREEx.KeyboardState();
		this._editMode = false;

		// this._pubsub.subscribe()
		// custom global variables
		//this._cube = null;
		//var INTERSECTED = false;
		//var SELECTED = false;
		// var mouse = new THREE.Vector2();
		// var objects = [];
		// Primary App mode, NAVIGATE or EDIT
		// var mode = "NAVIGATE";
		// Application context state
		/*
		var appCtxt = {
		// Current global application mode
		mode : "NAVIGATE",
		// Current 'active' object being manipulated, if any
		activeObject : null,

		}*/

		// _init();

		// FUNCTIONS
		// function _init() {
		// SCENE
		this._scene = new THREE.Scene();
		// CAMERA
		var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
		var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
		this._camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
		this._scene.add(this._camera);
		this._camera.position.set(0, 150, 400);
		this._camera.lookAt(this._scene.position);

		var flashlight = new THREE.SpotLight(0xaaaaaa, 1, 0.0);
		this._camera.add(flashlight);
		flashlight.position.set(0, 0, 1);

		// RENDERER
		// if ( Detector.webgl )
		// console.log( $("#editor").get());
		this._renderer = new THREE.WebGLRenderer({
			antialias : true
		});
		// else
		// renderer = new THREE.CanvasRenderer();
		this._renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
		container.appendChild(this._renderer.domElement);
		// EVENTS
		THREEx.WindowResize(this._renderer, this._camera);
		// THREEx.FullScreen.bindKey({
		// charCode : 'm'.charCodeAt(0)
		// });
		// CONTROLS
		this._orbitControls = new THREE.OrbitControls(this._camera, this._renderer.domElement);
		this._orbitControls.maxDistance = 4900;
		this._orbitControls.enabled = true;
		// STATS
		// stats = new Stats();
		// stats.domElement.style.position = 'absolute';
		// stats.domElement.style.bottom = '0px';
		// stats.domElement.style.zIndex = 100;
		// container.appendChild( stats.domElement );
		// LIGHT
		this._light = new THREE.PointLight(0xffffff);
		this._light.position.set(0, 250, 0);
		this._scene.add(this._light);

		var axes = new THREE.AxisHelper(1000);
		this._scene.add(axes);

		var skyboxImage = "img/greeblz-editor-skybox.png";
		var skyboxTexture = THREE.ImageUtils.loadTexture(skyboxImage);

		var discImage = "img/greeblz-disc.png";
		this._discTexture = THREE.ImageUtils.loadTexture(discImage);

		// FLOOR
		/*
		* var floorTexture = skyboxTexture var floorMaterial = new
		* THREE.MeshBasicMaterial( { map: floorTexture, side: THREE.DoubleSide } );
		* var floorGeometry = new THREE.PlaneGeometry(100, 100, 10, 10); var
		* floor = new THREE.Mesh(floorGeometry, floorMaterial);
		* floor.position.y = -0.5; floor.rotation.x = Math.PI / 2;
		* scene.add(floor);
		*/
		// //////////
		// CUSTOM //
		// //////////
		// axes

		var skyGeometry = new THREE.CubeGeometry(10000, 10000, 10000);

		var materialArray = [];

		var material = new THREE.MeshBasicMaterial({
			map : skyboxTexture,
			side : THREE.BackSide
		});

		for (var i = 0; i < 6; i++)
			materialArray.push(material);
		var skyMaterial = new THREE.MeshFaceMaterial(materialArray);
		var skyBox = new THREE.Mesh(skyGeometry, skyMaterial);
		this._scene.add(skyBox);

		window.addEventListener('keydown', this._keyboardHandler.bind(this));

		pubsub.subscribe(geomLoadedTopic, this._addModelToScene.bind(this));

		//		projector = new THREE.Projector();
		//
		//		// flashlight.target = ;
		//		renderer.domElement.addEventListener('mousemove', onDocumentMouseMove,
		//				false);
		//		renderer.domElement.addEventListener('mousedown', onDocumentMouseDown,
		//				false);
		//		renderer.domElement.addEventListener('mouseup', onDocumentMouseUp,
		//				false);
		//
		//		window.addEventListener('keypress', function(event) {
		//			// console.log(event.which);
		//			switch (event.keyCode) {
		//			case 81: // Q
		//				control.setSpace(control.space == "local" ? "world" : "local");
		//				break;
		//			case 87: // W
		//				control.setMode("translate");
		//				break;
		//			case 69: // E
		//				control.setMode("rotate");
		//				break;
		//			case 82: // R
		//				control.setMode("scale");
		//				break;
		//			case 84: // T Edit Mode
		//				// control.setMode("scale");
		//				break;
		//			case 187:
		//			case 107: // +,=,num+
		//				control.setSize(control.size + 0.1);
		//				break;
		//			case 189:
		//			case 10: // -,_,num-
		//				control.setSize(Math.max(control.size - 0.1, 0.1));
		//				break;
		//			}
		//		});
		// console.log("FINISHED INIT");
		// };

	};

	GreeblzScene.prototype._chunkyArrow = function(length, thickness, headRatio, headWidthRatio, sides, material) {

		var group = new THREE.Object3D();

		var coneWidth = headWidthRatio * thickness / 2;
		var coneLength = length * headRatio;

		var shaftLength = (1 - headRatio) * length;

		var coneGeom = new THREE.CylinderGeometry(0, coneWidth, coneLength, sides, 2);
		var cylinderGeom = new THREE.CylinderGeometry(thickness / 2, thickness / 2, shaftLength, sides, 2);

		var cone = new THREE.Mesh(coneGeom, material);
		var cylinder = new THREE.Mesh(cylinderGeom, material);

		cone.position.set(0, shaftLength + 0.5 * coneLength, 0);
		cylinder.position.set(0, shaftLength / 2, 0);

		group.add(cone);
		group.add(cylinder);
		return group;
	};

	GreeblzScene.prototype._hardpointWidget = function() {

		var group = new THREE.Object3D();

		var discMaterial = new THREE.MeshBasicMaterial({
			map : this._discTexture,
			side : THREE.DoubleSide,
			alphaTest : 0.5,
			color : 0xff0000,
			transparent : true,
			blending: "Additive"
		});

		var blueMaterial = new THREE.MeshPhongMaterial({
			color : 0x5079c2
		});

		var greenMaterial = new THREE.MeshPhongMaterial({
			color : 0x00ff00
		});

		var radius = 10;
		var segments = 16;

		//		var circleGeometry = new THREE.CircleGeometry(radius, segments);
		//		var circle = new THREE.Mesh(circleGeometry, whiteMaterial);

		var planeGeometry = new THREE.PlaneGeometry(20, 20);

		var plane = new THREE.Mesh(planeGeometry, discMaterial);
		group.add(plane);

		// var chunkyArrowY = this._chunkyArrow(15, 2.5, 0.4, 1.5, 12, blueMaterial);

		// group.add(chunkyArrowY);

		var chunkyArrowX = this._chunkyArrow(15, 2.5, 0.4, 1.5, 12, blueMaterial);

		chunkyArrowX.rotation.x = 0.5 * Math.PI;

		group.add(chunkyArrowX);

		return group;
	};

	GreeblzScene.prototype._addModelToScene = function(msg) {
		if (msg.type == "loaded") {
			var url = msg.url;
			var store = msg.store;
			var geometry = store.retrieve(url);
			var material = new THREE.MeshPhongMaterial({
				ambient : 0xff5533,
				color : 0xff5533,
				specular : 0x111111,
				shininess : 200
			});
			var model = new THREE.Mesh(geometry, material);
			// model.scale.set(10,10,10);
			//this._scene.add(model);

			var hpWidget = this._hardpointWidget();

			this._scene.add(hpWidget);

			// hpWidget.useQuaternion = true;

			var dquat = new THREE.Quaternion();

			var vect = (new THREE.Vector3(1, 1, 1)).normalize();

			console.log(vect);

			// vect.normalize();

			dquat.setFromAxisAngle(vect, Math.PI / 6).normalize();

			var quat = hpWidget.quaternion;

			var tquat = quat.inverse().multiply(dquat).normalize();

			console.log(tquat);

			hpWidget.setRotationFromQuaternion(tquat);

			console.log("ADDED MODEL");
		} else {
			console.warn("Load failed?");
			console.warn(msg);
		}
	};

	GreeblzScene.prototype._keyboardHandler = function(event) {

		console.log("KEYBOARD EVENT");
		console.log(event);

		// if (msg.type = "event") {
		// var event = msg.event;
		switch (event.keyCode) {
			case 81:
				// Q
				// control.setSpace(control.space == "local" ? "world" : "local");
				break;
			case 87:
				// W
				// control.setMode("translate");
				break;
			case 69:
				// E
				// control.setMode("rotate");
				break;
			case 82:
				// R
				// control.setMode("scale");
				break;
			case 84:
				// T Edit Mode
				// control.setMode("scale");
				this._orbitControls.enabled = !this._orbitControls.enabled;
				break;
			// case 187:
			// case 107:
			// // +,=,num+
			// control.setSize(control.size + 0.1);
			// break;
			// case 189:
			// case 10:
			// // -,_,num-
			// control.setSize(Math.max(control.size - 0.1, 0.1));
			// break;
		}
		// }
	};

	// Make it focusable to get keyboard events
	//$(this._renderer.domElement).attr('tabindex',1);

	// pubsub.subscribe(keyboardTopic, this._keyboardHandler.bind(this));

	// GreeblzScene.prototype._mouseHandler = function(msg) {
	// console.log("MOUSE MSG");
	// console.log(msg);
	// };
	//
	// pubsub.subscribe(mouseTopic, this._mouseHandler.bind(this));

	/*
	 * function setInteractionMode() {
	 *  }
	 *
	 * function onDocumentMouseMove(event) {
	 *
	 * event.preventDefault();
	 *
	 * mouse.x = (event.clientX / window.innerWidth) * 2 - 1; mouse.y =
	 * -(event.clientY / window.innerHeight) * 2 + 1;
	 *  //
	 *
	 * var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
	 * projector.unprojectVector(vector, camera);
	 *
	 * var raycaster = new THREE.Raycaster(camera.position, vector.sub(
	 * camera.position).normalize());
	 *
	 * if (SELECTED) {
	 *
	 * var intersects = raycaster.intersectObject(plane);
	 * SELECTED.position.copy(intersects[0].point.sub(offset)); return;
	 *  }
	 *
	 * var intersects = raycaster.intersectObjects(objects);
	 *
	 * if (intersects.length > 0) {
	 *
	 * if (INTERSECTED != intersects[0].object) {
	 *
	 * if (INTERSECTED)
	 * INTERSECTED.material.color.setHex(INTERSECTED.currentHex);
	 *
	 * INTERSECTED = intersects[0].object; INTERSECTED.currentHex =
	 * INTERSECTED.material.color.getHex();
	 *
	 * plane.position.copy(INTERSECTED.position); plane.lookAt(camera.position);
	 *  }
	 *
	 * container.style.cursor = 'pointer';
	 *  } else {
	 *
	 * if (INTERSECTED)
	 * INTERSECTED.material.color.setHex(INTERSECTED.currentHex);
	 *
	 * INTERSECTED = null;
	 *
	 * container.style.cursor = 'auto';
	 *  }
	 *  }
	 *
	 * function onDocumentMouseDown(event) {
	 *
	 * event.preventDefault();
	 *
	 * var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
	 * projector.unprojectVector(vector, camera);
	 *
	 * var raycaster = new THREE.Raycaster(camera.position, vector.sub(
	 * camera.position).normalize());
	 *
	 * var intersects = raycaster.intersectObjects(objects);
	 *
	 * if (intersects.length > 0) {
	 *
	 * controls.enabled = false;
	 *
	 * SELECTED = intersects[0].object;
	 *
	 * var intersects = raycaster.intersectObject(plane);
	 * offset.copy(intersects[0].point).sub(plane.position);
	 *
	 * container.style.cursor = 'move';
	 *  }
	 *  }
	 *
	 * function onDocumentMouseUp(event) {
	 *
	 * event.preventDefault();
	 *
	 * controls.enabled = true;
	 *
	 * if (INTERSECTED) {
	 *
	 * plane.position.copy(INTERSECTED.position);
	 *
	 * SELECTED = null; } container.style.cursor = 'auto'; }
	 */
	GreeblzScene.prototype._animate = function() {
		var scope = this;
		this._render();
		this._update();
		var fps = 30;
		setTimeout(function() {
			requestAnimationFrame(scope._animate.bind(scope));
		}, 1000 / fps);
	};

	GreeblzScene.prototype._update = function() {
		this._orbitControls.update();
		// stats.update();
	};

	GreeblzScene.prototype._render = function() {
		this._renderer.render(this._scene, this._camera);
	};

	/**
	 * Start the editor
	 */
	GreeblzScene.prototype.main = function() {
		this._animate();
	};

	return GreeblzScene;

});
