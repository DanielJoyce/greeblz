define(['jquery', 'applib/scene', 'applib/pubsub', 'applib/stlstore', 'applib/command', 'lib/THREEx.FullScreen', 'lib/THREEx.WindowResize', 'lib/OrbitControls', 'lib/TransformControls'], function($, Scene, PubSub, StlStore, commands) {"use strict";

	function GreeblzEditor() {

		// Queue for undo/redo support
		this._commandQueue = new Array(100);

		this._pubsub = new PubSub();

		this._stlTopic = "stl_geometry";

		var sceneKeyboardTopic = "sceneKeyboard";

		var sceneMouseTopic = "sceneMouse";

		this._stlStore = new StlStore(this._pubsub, this._stlTopic);

		this._stlLoadedTopic = this._stlStore.storeLoadedTopic;

		this._partViewTopic = "partview";

		this._mainViewTopic = "mainview";

		var container = $('#main-view').get(0);

		this._mainView = new Scene({
			pubsub : this._pubsub,
			topic : this._mainViewTopic,
			container : container
		});

		container = $('#part-view').get(0);

		this._partView = new Scene({
			pubsub : this._pubsub,
			topic : this._partViewTopic,
			container : container,
			clearColor : 0xEEEEEE,
			clearAlpha : 1,
			skybox : false
		});

		var stlFile = "dav/bottle.stl";

		this._pubsub.subscribe(this._stlLoadedTopic, this._addModelToScene.bind(this));

		this._pubsub.publish(this._stlTopic, {
			type : "load",
			url : "dav/bottle.stl"
		});

	};

	// var loader = new THREE.STLLoader();
	// loader.load("dav/bottle.stl", this._addModelToScene.bind(this));

	GreeblzEditor.prototype.main = function() {

		this._mainView.animate();
		this._partView.animate();
	};

	GreeblzEditor.prototype._addModelToScene = function(msg) {
		console.log("DERP!!111");
		if (msg.type == "loaded") {
			var url = msg.url;
			var store = msg.store;
			var geometry = store.retrieve(url);
			console.log("DERP!!3333");
			// var material = new THREE.MeshPhongMaterial({
				// ambient : 0xff5533,
				// color : 0xff5533,
				// specular : 0x111111,
				// shininess : 200
			// });
			// var model = new THREE.Mesh(geometry, material);
			// //model.scale.set(10, 10, 10);
			// this._scene.add(model);
			// this._pickableObjects.push(model);
			// var model2 = new THREE.Mesh(geometry, material);
			// // model2.attach(model);
			// model2.rotation.x = Math.PI / 3;
			// model2.rotation.y = Math.PI / 6;
			// //model2.scale.z = 3;
			// model2.position.x = 1;
			// //model2.attach(model);
			// model.add(model2);
// 
			// model.rotation.x = Math.PI / 6;
			// model.rotation.z = Math.PI / 3;

			//			this._pickableObjects.push(model2);
			//this._scene.add(model2);

			this._pubsub.publish(this._partViewTopic, {
				type : "setRootModel",
				geometry : geometry.clone(),
				pickable : true
			});
			
			this._pubsub.publish(this._mainViewTopic, {
				type : "setRootModel",
				geometry : geometry.clone(),
				pickable : true
			});

		} else {
			console.warn("Load failed?");
			console.warn(msg);
		}

	};
	//function C

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

	return new GreeblzEditor();
});
