define(['jquery', 'applib/hardpoint', 'applib/common', 'lib/STLLoader', 'lib/THREEx.FullScreen', 'lib/OrbitControls', 'lib/TransformControls'], function($, Hardpoint, common) {"use strict";

	function GreeblzScene(options) {

		var opts = $.extend(true, {}, this.defaultOptions(), options);

		// MAIN
		// standard global variables

		var materials = new common.materials();

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

		this._loader = new THREE.STLLoader();

		// this._mode = Mode.ORBIT;

		// SCENE
		this._scene = new THREE.Scene();
		// CAMERA
		var SCREEN_WIDTH = opts.container.clientWidth;
		var SCREEN_HEIGHT = opts.container.clientHeight;
		this.VIEW_ANGLE = 45;
		var ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;

		// Sertup Camera
		this._camera = new THREE.PerspectiveCamera(this.VIEW_ANGLE, ASPECT, NEAR, FAR);
		//this._camera = new THREE.OrthographicCamera(-SCREEN_WIDTH/20,SCREEN_WIDTH/20,SCREEN_HEIGHT/20,-SCREEN_HEIGHT/20,0.1, 20000);
		this._scene.add(this._camera);
		this._camera.position.set(0, 0, 400);
		this._camera.lookAt(new THREE.Vector3(0, 0, 0));
		// Add camera light
		var flashlight = new THREE.DirectionalLight(0xffffff);
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
		this._light = new THREE.DirectionalLight(0xffffff);
		this._light.position.set(0, 1, 0);
		this._scene.add(this._light);

		this._defaultMaterial = materials.sprueGreyMaterial;

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
			console.group("Handle scene topic " + this._topic);
			console.debug(msg);
			console.groupEnd();
			switch (msg.type) {
				case "setRootModel":
					this._loadUrl(msg);
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

			var model = new THREE.Mesh(geometry, this._defaultMaterial);
			this._scene.add(model);
			geometry.computeBoundingSphere();
			if (centered == true) {
				var dir = geometry.boundingSphere.center.clone().normalize();
				var distance = -geometry.boundingSphere.radius;
				model.translateOnAxis(dir, distance);
			}
			if (pickable) {
				this._pickableObjects.push(model);
			}
			// Frame model
			var distance = 1.2 * geometry.boundingSphere.radius / Math.sin(this.VIEW_ANGLE / 2.0);
			var vec = this._camera.position.clone().sub(new THREE.Vector3(0, 0, 0)).normalize();
			var position = vec.multiplyScalar(distance);
			this._camera.position = position;

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

		_loadUrl : function(msg) {
			var url = msg.url;
			var dataType = msg.dataType;
			if (url == undefined || url == null) {
				this._pubsub.publish(this._topic, {
					type : "error",
					msg : "No url specified"
				});
			} else {
				// TODO Use webworker in future
				try {
					this._loader.load(msg.url, this._geometryLoadedCallback.bind(this, url));
				} catch(err) {
					this._pubsub.publish(this._topic, {
						type : "error",
						msg : "Loader encountered error",
						exception : err,
					});
				}
			}
		},

		_geometryLoadedCallback : function(url, geometry) {
			//			console.debug("LOAD COMPLETE");
			//			console.debug("TOPIC: " + this.storeLoadedTopic);
			//			this._store[url] = geometry;
			//
			geometry.name = url;
			this._setRootModel(geometry, true, true);

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
					url : object.geometry.name,
					point : object.worldToLocal(point.clone()),
					//point : point.clone()),
					normal : normal.clone()
				});
			}
		}
	};

	function MainViewScene(options) {
		GreeblzScene.call(this, options);

		this._selectedPickInfo = null;

	}


	MainViewScene.mode = {
		add : "ADD",
		select : "SELECT",
		remove : "REMOVE",
		copy : "COPY",
		waggle : "WAGGLE",
		twist : "TWIST",
		shift : "SHIFT",
		push : "PUSH",
		scale : "SCALE",
	};

	MainViewScene.prototype = common.inherit(GreeblzScene.prototype);

	MainViewScene.prototype.constructor = GreeblzScene;

	MainViewScene.prototype._handlePubsubMsg = function(msg) {
		switch (msg.type) {
			case "ADD":
				var selectedObj = this._selectedPickInfo.object;
				if (msg.parent.uuid = selectedObj.uuid) {

					var target = selectedObj;
					var pNormal = this._selectedPickInfo.face.normal;
					var pPoint = this._selectedPickInfo.point;
					target.worldToLocal(pPoint);
					var cNormal = msg.child.normal;
					var cPoint = msg.child.point;
					var cGeom = msg.child.geometry;
					var container = new THREE.Object3D();
					container.position = pPoint;
					target.add(container);
					var dquat = new THREE.Quaternion();
					dquat.setFromUnitVectors(cNormal.normalize(), pNormal.clone().negate().normalize());
					container.setRotationFromQuaternion(dquat.normalize());
					//container.rotation.z = 0;
					var cModel = new THREE.Mesh(cGeom, this._defaultMaterial.clone());
					var cDir = cPoint.clone().negate().normalize();
					var cDistance = cPoint.clone().length();
					cModel.translateOnAxis(cDir, cDistance);
					container.add(cModel);
					this._pickableObjects.push(cModel);
				} else {
					console.group("Bad ADD");
					console.log("Current selected UUID " + this._selectedPickInfo.object.uuid);
					console.log("Got ADD Target UUID " + msg.parent.uuid);
					console.groupEnd();
				}
				break;
			default:
				console.log("Calling super...");
				this.$super._handlePubsubMsg.call(this, msg);
		}
	};

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
				this._selectedPickInfo = picked[0];
				this._pubsub.publish(this._appTopic, {
					type : "mainViewSelected",
					uuid : this._selectedPickInfo.object.uuid,
				});
			}
		}
	};

	return {
		PartViewScene : PartViewScene,
		MainViewScene : MainViewScene,
	};

});
