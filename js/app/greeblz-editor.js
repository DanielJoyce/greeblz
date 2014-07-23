define(['jquery', 'applib/scene', 'applib/common', 'applib/hardpoint', 'applib/pubsub', 'applib/stlstore', 'applib/command', 'lib/THREEx.FullScreen', 'lib/THREEx.WindowResize', 'lib/OrbitControls', 'lib/TransformControls'], function($, scene, common, Hardpoint, PubSub, StlStore, commands) {"use strict";

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

		this._appTopic = "application";

		var container = $('#main-view').get(0);

		this._currentPartSelection = {};

		this._mainView = new scene.MainViewScene({
			pubsub : this._pubsub,
			topic : this._mainViewTopic,
			appTopic : this._appTopic,
			container : container,
		});

		container = $('#part-view').get(0);

		this._partView = new scene.PartViewScene({
			pubsub : this._pubsub,
			topic : this._partViewTopic,
			appTopic : this._appTopic,
			container : container,
			clearColor : 0xEEEEEE,
			clearAlpha : 1,
			skybox : false
		});

		//		this._partView._pickWidget

		var stlFile = "dav/bottle.stl";

		this._pubsub.subscribe(this._stlLoadedTopic, this._addModelToScene.bind(this));

		this._pubsub.subscribe(this._appTopic, this._handleAppTopic.bind(this));

		this._pubsub.publish(this._stlTopic, {
			type : "load",
			url : "dav/bottle.stl"
		});

	};

	// var loader = new THREE.STLLoader();
	// loader.load("dav/bottle.stl", this._addModelToScene.bind(this));

	GreeblzEditor.prototype = {

		main : function() {

			this._mainView.animate();
			this._partView.animate();
		},

		_handleAppTopic : function(msg) {
			console.group("Topic: " + this._appTopic);
			console.debug(msg);
			console.groupEnd();

			switch (msg.type) {
				case "mainViewPick":
					if (this._currentPartSelection.pickPoint && this._currentPartSelection.pickNormal) {
						this._pubsub.publish(this._mainViewTopic, {
							type : scene.MainViewScene.mode.add,
							parent : {
								uuid : msg.uuid,
								point : msg.point,
								normal : msg.normal
							},
							child : {
								geometry : this._currentPartSelection.geometry.clone(),
								point : this._currentPartSelection.pickPoint.clone(),
								normal : this._currentPartSelection.pickNormal.clone()
							}
						});
					}
					break;

				case "partViewPick":
					this._currentPartSelection.pickPoint = msg.point;
					this._currentPartSelection.pickNormal = msg.normal;
					break;

			}

		},

		_addModelToScene : function(msg) {
			console.log("DERP!!111");
			if (msg.type == "loaded") {
				var url = msg.url;
				var store = msg.store;
				this._currentPartSelection.geometry = store.retrieve(url);
				this._pubsub.publish(this._partViewTopic, {
					type : "setRootModel",
					geometry : this._currentPartSelection.geometry.clone(),
					pickable : true,
					centered : true,
				});

				this._pubsub.publish(this._mainViewTopic, {
					type : "setRootModel",
					geometry : this._currentPartSelection.geometry.clone(),
					pickable : true,
					centered : true,
				});

			} else {
				console.warn("Load failed?");
				console.warn(msg);
			}
		},
	};

	return new GreeblzEditor();
});
