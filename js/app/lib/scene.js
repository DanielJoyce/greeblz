define(['jquery', 'applib/hardpoint', 'applib/common', 'lib/STLLoader', 'lib/THREEx.FullScreen', 'lib/OrbitControls', 'lib/TransformControls'], function($, Hardpoint, common) {"use strict";

	// var Mode = {};
	//
	// Mode.SELECT_HARDPOINT = "SELECT_HARDPOINT";
	// Mode.MOVE_HARDPOINT = "MOVE_HARDPOINT";
	// Mode.ORBIT = "ORBIT";
	// Mode.PICK = "PICK";

	function GreeblzScene(options) {

		var opts = $.extend(true, {}, this.defaultOptions(), options);

		// MAIN
		// standard global variables

		this._scene = null;
		this._camera = null;
		this._renderer = null;
		this._orbitControls = null;
		this._stats = null;
		this._projector = null;
		this._raycaster = null;
		this._light = null;
		//this._keyboard = new THREEx.KeyboardState();
		this._editMode = false;
		this._pickEnabled = true;

		this._mouseMoved = false;
		this._mouseDown = false;
		this._pickableObjects = [];
		this._hasMouse = false;

		this._pubsub = opts.pubsub;
		this._topic = opts.topic;
		this._appTopic = opts.appTopic;

		// this._mode = Mode.ORBIT;

		// SCENE
		this._scene = new THREE.Scene();
		// CAMERA
		var SCREEN_WIDTH = opts.container.clientWidth;
		var SCREEN_HEIGHT = opts.container.clientHeight;
		var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;

		// Sertup Camera
		this._camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
		//this._camera = new THREE.OrthographicCamera(-SCREEN_WIDTH/20,SCREEN_WIDTH/20,SCREEN_HEIGHT/20,-SCREEN_HEIGHT/20,0.1, 20000);
		this._scene.add(this._camera);
		this._camera.position.set(0, 150, 400);
		this._camera.lookAt(this._scene.position);
		// Add camera light
		var flashlight = new THREE.SpotLight(0xaaaaaa, 1, 0.0);
		this._camera.add(flashlight);
		flashlight.position.set(0, 0, 1);

		// Add picking support
		this._raycaster = new THREE.Raycaster(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0));
		this._projector = new THREE.Projector();

		// RENDERER
		this._renderer = new THREE.WebGLRenderer({
			antialias : true,
			alpha : opts.clearAlpha < 1.0
		});
		this._renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
		this._renderer.setClearColor(opts.clearColor, opts.clearAlpha);
		opts.container.appendChild(this._renderer.domElement);
		// EVENTS
		common.windowResize(this._renderer, this._camera, opts.container);
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

		// var axes = new THREE.AxisHelper(1000);
		// this._scene.add(axes);

		if (opts.skybox) {

			var skyboxImage = "img/greeblz-editor-skybox.png";
			var skyboxTexture = THREE.ImageUtils.loadTexture(skyboxImage);

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

		}

		window.addEventListener('keydown', this._keyboardHandler.bind(this));

		this._pubsub.subscribe(this._topic, this._handlePubsubMsg.bind(this));

		this._renderer.domElement.addEventListener("mousedown", this._handleMouseDown.bind(this));
		this._renderer.domElement.addEventListener("mousemove", this._handleMouseMove.bind(this));
		this._renderer.domElement.addEventListener("mouseup", this._handleMouseUp.bind(this));
		this._renderer.domElement.addEventListener("mouseenter", this._handleMouseEnter.bind(this));
		this._renderer.domElement.addEventListener("mouseleave", this._handleMouseLeave.bind(this));

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

	GreeblzScene.prototype = {

		defaultOptions : function() {
			return {
				pubSub : null,
				topic : null,
				skybox : true,
				clearColor : 0x000000,
				clearAlpha : 1.0
			};
		},

		_handleMouseDown : function(event) {
			// Because we are using the transform tools
			// we only want to perform a pick if this is a
			// 'click' without the mouse moving at all
			this._mouseMoved = false;
			this._mouseDown = true;
		},

		_handleMouseMove : function(event) {
			// Because we are using the transform tools
			// we only want to perform a pick if this is a
			// 'click' without the mouse moving at all
			this._mouseMoved = true;
			// Mouse is moving in scene, but we're not triggering camera movement
			if (!this._mouseDown) {

			}
		},

		_handleMouseEnter : function(event) {
			// Because we are using the transform tools
			// we only want to perform a pick if this is a
			// 'click' without the mouse moving at all
			this._hasMouse = true;
		},

		_handleMouseLeave : function(event) {
			// Because we are using the transform tools
			// we only want to perform a pick if this is a
			// 'click' without the mouse moving at all
			this._hasMouse = false;
		},

		_handleMouseUp : function(event) {
		},

		_handlePubsubMsg : function(msg) {
			console.log("DERP");
			console.log("DERP");
			switch (msg.type) {
				case "setRootModel":
					this._setRootModel(msg.geometry, msg.pickable, msg.centered);
					break;
				default:
					console.log("Unknown message:");
					console.log(msg);
			}
		},

		/**
		 *
		 * @param {Object} geometry
		 * @param {Object} pickable
		 * @param {Object} centerObject
		 */
		_setRootModel : function(geometry, pickable, centered) {
			var material = new THREE.MeshPhongMaterial({
				ambient : 0xff5533,
				color : 0xff5533,
				specular : 0x111111,
				shininess : 200
			});
			var model = new THREE.Mesh(geometry, material);
			this._scene.add(model);
			if (centered == true) {
				geometry.computeBoundingSphere();
				console.log(geometry.boundingSphere);
				console.log(geometry.boundingSphere.center);
				var dir = geometry.boundingSphere.center.clone().negate().normalize();
				var distance = geometry.boundingSphere.center.clone().length();
				model.translateOnAxis(dir, distance);
			}
			//model.scale.set(10, 10, 10);
			if (pickable) {
				this._pickableObjects.push(model);
			}
			//this._scene.add(model2);

			// console.log(model2);
		},

		_keyboardHandler : function(event) {

			if (!this._hasMouse)
				return;

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
		},

		animate : function() {
			var scope = this;
			this._render();
			this._update();
			var fps = 30;
			setTimeout(function() {
				requestAnimationFrame(scope.animate.bind(scope));
			}, 1000 / fps);
		},

		_update : function() {
			this._orbitControls.update();
			// stats.update();
		},

		_render : function() {
			this._renderer.render(this._scene, this._camera);
		},
	};

	function PartViewScene(options) {
		GreeblzScene.call(this, options);

		this._pickWidget = new Hardpoint();
		this._pickWidget.visible = false;
		this._pickWidget.opacity = 0.65;
		this._scene.add(this._pickWidget);
	}


	PartViewScene.prototype = common.inherit(GreeblzScene.prototype);

	PartViewScene.prototype.constructor = PartViewScene;

	PartViewScene.prototype._handleMouseUp = function(event) {
		// Because we are using the transform tools
		// we only want to perform a pick if this is a
		// 'click' without the mouse moving at all
		this._mouseDown = false;
		if (this._pickEnabled && !this._mouseMoved) {
			this._pickWidget.visible = true;
			event.preventDefault();
			var domElement = this._renderer.domElement;
			var mouse = new THREE.Vector2();
			var pos = $(domElement).position();
			var relX = event.pageX - pos.left;
			var relY = event.pageY - pos.top;
			var mouseVector = new THREE.Vector3((relX / domElement.width ) * 2 - 1, -(relY / domElement.height ) * 2 + 1, 0);
			// Fixup mouse vector relative to camera.
			this._projector.unprojectVector(mouseVector, this._camera);
			this._raycaster.set(this._camera.position, mouseVector.sub(this._camera.position).normalize());
			var picked = this._raycaster.intersectObjects(this._pickableObjects, true);
			// console.debug(picked);
			if (picked.length > 0) {
				console.debug("HIT!");
				var pickInfo = picked[0];
				var face = pickInfo.face.clone();
				var normal = face.normal.clone();
				var point = pickInfo.point.clone();
				this._orbitControls.center = point;
				var object = pickInfo.object;
				this._pickWidget.position = point;
				var normalMatrix = new THREE.Matrix3().getNormalMatrix(object.matrixWorld);
				normal.applyMatrix3(normalMatrix).normalize();
				var dquat = new THREE.Quaternion();
				dquat.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
				this._pickWidget.setRotationFromQuaternion(dquat.normalize());
				//object.add(hpWidget);
				this._pickWidget.rotation.z = 0;
				this._pubsub.publish(this._appTopic, {
					type : "partViewPick",
					point : object.worldToLocal(point.clone())
				});
			}
		}
	};

	function MainViewScene(options) {
		GreeblzScene.call(this, options);

	}


	MainViewScene.mode = {
		add : "ADD",
		remove : "REMOVE",
		copy : "COPY",
		waggle : "WAGGLE",
		twist : "TWIST",
		shift : "SHIFT",
		push : "PUSH",
		scale : "SCALE",
	};

	MainViewScene.prototype = common.inherit(GreeblzScene.prototype);

	MainViewScene.prototype._handleMouseUp = function(event) {
		// Because we are using the transform tools
		// we only want to perform a pick if this is a
		// 'click' without the mouse moving at all
		this._mouseDown = false;
		if (this._pickEnabled && !this._mouseMoved) {
			event.preventDefault();
			var domElement = this._renderer.domElement;
			var mouse = new THREE.Vector2();
			var pos = $(domElement).position();
			var relX = event.pageX - pos.left;
			var relY = event.pageY - pos.top;
			var mouseVector = new THREE.Vector3((relX / domElement.width ) * 2 - 1, -(relY / domElement.height ) * 2 + 1, 0);
			// Fixup mouse vector relative to camera.
			this._projector.unprojectVector(mouseVector, this._camera);
			this._raycaster.set(this._camera.position, mouseVector.sub(this._camera.position).normalize());
			var picked = this._raycaster.intersectObjects(this._pickableObjects, true);
			// console.debug(picked);
			if (picked.length > 0) {
				console.debug("HIT!");
				var pickInfo = picked[0];
				var face = pickInfo.face.clone();
				var normal = face.normal.clone();
				var point = pickInfo.point.clone();
				var object = pickInfo.object;
				var normalMatrix = new THREE.Matrix3().getNormalMatrix(object.matrixWorld);
				normal.applyMatrix3(normalMatrix).normalize();
				var dquat = new THREE.Quaternion();
				dquat.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
				//object.add(hpWidget);
				this._pubsub.publish(this._appTopic, {
					type : "mainViewPick",
					point : object.worldToLocal(point.clone())
				});
			}
		}
	};

	return {
		PartViewScene : PartViewScene,
		MainViewScene : MainViewScene,
	};

});
