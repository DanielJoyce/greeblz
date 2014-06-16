define(['jquery', 'applib/scene', 'applib/pubsub', 'lib/STLLoader', 'lib/THREEx.FullScreen', 'lib/THREEx.WindowResize', 'lib/OrbitControls', 'lib/TransformControls'], function($, Scene, PubSub) {"use strict";

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

		this._pubsub.subscribe(this.storeTopic, this._msgHandler.bind(this));

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
	};

	StlStore.prototype._msgHandler = function(msg) {
		switch(msg.type) {
			case "load":
				this._loadUrl(msg);
				break;
		}
	};

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

	function GreeblzEditor() {

		var pubsub = new PubSub();

		var stlTopic = "stl_geometry";

		var sceneKeyboardTopic = "sceneKeyboard";

		var sceneMouseTopic = "sceneMouse";

		var stlStore = new StlStore(pubsub, stlTopic);

		var stlLoadedTopic = stlStore.storeLoadedTopic;

		var container = $('#content').get(0);

		this._scene = new Scene(container, pubsub, stlTopic, stlLoadedTopic, sceneKeyboardTopic, sceneMouseTopic);

		var stlFile = "dav/bottle.stl";

		pubsub.publish(stlTopic, {
			type : "load",
			url : "dav/bottle.stl"
		});

	};

	// var loader = new THREE.STLLoader();
	// loader.load("dav/bottle.stl", this._addModelToScene.bind(this));

	GreeblzEditor.prototype.main = function() {

		this._scene.main();
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
