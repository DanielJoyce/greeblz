define(["applib/pubsub", "lib/STLLoader"], function() {"use strict";

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

	return StlStore;

});
