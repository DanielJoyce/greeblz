"use strict";

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
	this._keyboard = new THREEx.KeyboardState();
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
	var discTexture = THREE.ImageUtils.loadTexture(discImage);

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
			map : discTexture,
			side : THREE.DoubleSide,
			alphaTest : 0.25
		});

		var blueMaterial = new THREE.MeshPhongMaterial({
			color : 0x0000ff
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

		var chunkyArrowY = this._chunkyArrow(15, 2.5, 0.4, 1.5, 12, blueMaterial);

		group.add(chunkyArrowY);

		var chunkyArrowX = this._chunkyArrow(15, 2.5, 0.4, 1.5, 12, greenMaterial);

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
			this._scene.add(this._hardpointWidget());
			console.log("ADDED MODEL");
		} else {
			console.warn("Load failed?");
			console.warn(msg);
		}
	};

	pubsub.subscribe(geomLoadedTopic, this._addModelToScene.bind(this));

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

	window.addEventListener('keydown', this._keyboardHandler.bind(this));

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
		if (this._keyboard.pressed("z")) {
			console.log("WORKING!");
		}
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

};

/**
 * Creates a pubsub system that can be used to send/recieve messages
 *
 * @param {int} pumpInterval
 * 		How often, in ms, to pump the messages. Defaults to 50ms
 */
function PubSub(pumpInterval) {

	this._suspend = false;

	this._callbacks = {};

	this._messages = {};

	this._pumpinterval = pumpInterval || 50;

	// var messagesToFire = false;

	var timeout = null;

	/**
	 * message pump routine. Goes through queued messages and callbacks
	 * and fires them off.
	 */
	PubSub.prototype._pump = function() {
		console.debug("PUMP MSGS!");
		if (!this._suspend) {
			// If pumping takes a long time, we should
			// make sure this method is not re-entered while we are pumping
			this._suspend = true;
			var outer = this;
			$.each(this._callbacks, function(topic, callbacks) {
				var msg_queue = outer._messages[topic] || [];
				for (var i = 0; i < msg_queue.length; i++) {
					var msg = msg_queue[i];
					console.debug("Fire Message:");
					console.debug(msg);
					callbacks.fire(msg);
				}
			});
			this._messages = {};
			this._suspend = false;
		}
		timeout = null;
	};

	// Pump messages every 50 ms
	//setInterval(this._pump.bind(this), this._pumpinterval);

	// Only pump as needed;

	// PubSub.prototype._fire = function(topic, msg) {
	// var callbacks = this._callbacks[topic];
	// if (callbacks != undefined) {
	// callbacks.fire(msg);
	// }
	// };

	/**
	 * Subscribe to topic on pubsub, registering callback to handle
	 * messages
	 *
	 * callback should be a function taking a single argument object
	 * that represents a message
	 *
	 * @param {Object} topic
	 * @param {Function} callback
	 */
	PubSub.prototype.subscribe = function(topic, callback) {
		var callbacks = this._callbacks[topic];
		if (callbacks == undefined) {
			callbacks = $.Callbacks("unique");
			this._callbacks[topic] = callbacks;
		}
		callbacks.add(callback);
	};

	/**
	 * Remove callback from pubsub topic. Must be same callback that was
	 * originally registered
	 * @param {Object} topic
	 * @param {Function} callback
	 */
	PubSub.prototype.unsubscribe = function(topic, callback) {
		var callbacks = this._callbacks[topic];
		if (callbacks != undefined) {
			callbacks.remove(callback);
		}
	};

	/**
	 * Publish a message to a given topic
	 * @param {Object} topic
	 * @param {Object} msg
	 */
	PubSub.prototype.publish = function(topic, msg) {
		if (!this._suspend) {
			var msg_queue = this._messages[topic];
			if (msg_queue == undefined) {
				msg_queue = [];
				this._messages[topic] = msg_queue;
			}
			msg_queue.push(msg);
		}
		// msgsToFire = true;
		if (timeout == null) {
			timeout = setTimeout(this._pump.bind(this), this._pumpinterval);
		}
	};

	/**
	 * Reset the pubsub, removing all topics and callbacks
	 */
	PubSub.prototype.reset = function() {
		this._suspend = true;
		$.each(this._callbacks, function(topic, callbacks) {
			callbacks.empty();
			delete this._callbacks[topic];
		});
		this._messages = {};
		this._suspend = false;
	};

	/**
	 * Suspend handling of pubsub messages. All messages sent while
	 * suspended will be dropped
	 */
	PubSub.prototype.suspend = function() {
		// TODO cancel/reinstate setinterval to avoid busywait.
		this._suspend = true;
	};

	/**
	 * Resume pubsub messages
	 */
	PubSub.prototype.resume = function() {
		this._suspend = false;
	};

}

/**
 * Handles loading of stls
 *
 * pubsub is the pubsub postbox to use
 * storeTopic is the pubsub topic resource store
 * listens to for load requests
 *
 * StlStore posts load completion information on
 * the topic storeTopic+"Loaded"
 *
 * Uses pubsub to do so.
 *
 * TODO If this works, refactor into reusable parts...
 */
function StlStore(pubsub, storeTopic) {

	this._store = {};

	this.storeTopic = storeTopic;

	this.storeLoadedTopic = storeTopic + "Loaded";

	this._pubsub = pubsub;

	this._loader = new THREE.STLLoader();

	// this._baseAjaxOptions = {
	// dataType : "json",
	// data : null,
	// };

	// StlStore.prototype.ajaxError = function(jqXHR, textStatus, errorThrown) {
	// this._pubsub.publish(this._storeLoadedTopic, {
	// type : "error",
	// url : url,
	// status : jqXHR.status,
	// textStatus : textStatus,
	// errorThrown : errorThrown,
	// msg : "resource load failed"
	// });
	// };

	// StlStore.prototype.ajaxSuccess = function(data, textStatus, jqXHR) {
	// // And start, progress, loaded??
	// this._store[url] = this._pubsub.publish(this._storeLoadedTopic, {
	// type : "loaded",
	// store : this,
	// url : url,
	// });
	// };

	// ResourceStore.prototype.register() = function(pubsub, store_topic){
	// this._pubsub = pubsub;
	// pubsub.subscribe(store_topic, _msg_handler);
	// };

	StlStore.prototype._msgHandler = function(msg) {
		switch(msg.type) {
			case "load":
				this._loadUrl(msg);
				break;
		}
	};

	this._pubsub.subscribe(this.storeTopic, this._msgHandler.bind(this));

	StlStore.prototype._loadUrl = function(msg) {
		var url = msg.url;
		var dataType = msg.dataType;
		if (url == undefined || url == null) {
			this._pubsub.publish(this.storeLoadedTopic, {
				type : "error",
				msg : "No url specified"
			});
		} else {
			// TODO Use webworker in future
			try {
				this._loader.load(msg.url, this._storeGeometry.bind(this, url));
			} catch(err) {
				this._pubsub.publish(this.storeLoadedTopic, {
					type : "error",
					msg : "Loader encountered error",
					exception : err,
				});
			}
		}
	};

	/**
	 * Retrieve the data from the store. This operation
	 * removes the data.
	 */
	StlStore.prototype.retrieve = function(handle) {
		var data = this._store[handle];
		delete this._store[handle];
		return data;
	};

	StlStore.prototype._storeGeometry = function(url, geometry) {
		console.debug("LOAD COMPLETE");
		console.debug("TOPIC: " + this.storeLoadedTopic);
		this._store[url] = geometry;
		this._pubsub.publish(this.storeLoadedTopic, {
			type : "loaded",
			store : this,
			url : url
		});
	};
}

function GreeblzEditor() {

	var pubsub = new PubSub();

	var stlTopic = "stl_geometry";

	var sceneKeyboardTopic = "sceneKeyboard";

	var sceneMouseTopic = "sceneMouse";

	var stlStore = new StlStore(pubsub, stlTopic);

	var stlLoadedTopic = stlStore.storeLoadedTopic;

	var container = $('#content').get(0);

	var scene = new GreeblzScene(container, pubsub, stlTopic, stlLoadedTopic, sceneKeyboardTopic, sceneMouseTopic);

	var stlFile = "dav/bottle.stl";

	pubsub.publish(stlTopic, {
		type : "load",
		url : "dav/bottle.stl"
	});
	// var loader = new THREE.STLLoader();
	// loader.load("dav/bottle.stl", this._addModelToScene.bind(this));

	GreeblzEditor.prototype.main = function() {
		scene.main();
	};

}

// /**
// * Register ajax transports for blob send/recieve and array buffer send/receive via XMLHttpRequest Level 2
// * within the comfortable framework of the jquery ajax request, with full support for promises.
// *
// * Notice the +* in the dataType string? The + indicates we want this transport to be prepended to the list
// * of potential transports (so it gets first dibs if the request passes the conditions within to provide the
// * ajax transport, preventing the standard transport from hogging the request), and the * indicates that
// * potentially any request with any dataType might want to use the transports provided herein.
// *
// * Remember to specify 'processData:false' in the ajax options when attempting to send a blob or arraybuffer -
// * otherwise jquery will try (and fail) to convert the blob or buffer into a query string.
// */
// $.ajaxTransport("+*", function(options, originalOptions, jqXHR) {
// // Test for the conditions that mean we can/want to send/receive blobs or arraybuffers - we need XMLHttpRequest
// // level 2 (so feature-detect against window.FormData), feature detect against window.Blob or window.ArrayBuffer,
// // and then check to see if the dataType is blob/arraybuffer or the data itself is a Blob/ArrayBuffer
// if (window.FormData && ((options.dataType && (options.dataType == 'blob' || options.dataType == 'arraybuffer')) || (options.data && ((window.Blob && options.data instanceof Blob) || (window.ArrayBuffer && options.data instanceof ArrayBuffer)))
// )) {
// return {
// /**
// * Return a transport capable of sending and/or receiving blobs - in this case, we instantiate
// * a new XMLHttpRequest and use it to actually perform the request, and funnel the result back
// * into the jquery complete callback (such as the success function, done blocks, etc.)
// *
// * @param headers
// * @param completeCallback
// */
// send : function(headers, completeCallback) {
// var xhr = new XMLHttpRequest(), url = options.url || window.location.href, type = options.type || 'GET', dataType = options.dataType || 'text', data = options.data || null, async = options.async || true;
//
// xhr.addEventListener('load', function() {
// var res = {};
//
// res[dataType] = xhr.response;
// completeCallback(xhr.status, xhr.statusText, res, xhr.getAllResponseHeaders());
// });
//
// xhr.open(type, url, async);
// xhr.responseType = dataType;
// xhr.send(data);
// },
// abort : function() {
// jqXHR.abort();
// }
// };
// }
// });
