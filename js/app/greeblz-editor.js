define(['jquery', 'applib/mainview', 'applib/partview', 'applib/common', 'applib/hardpoint', 'applib/pubsub', 'applib/command', 'lib/THREEx.FullScreen', 'lib/THREEx.WindowResize', 'lib/OrbitControls', 'lib/TransformControls'], function($, MainViewScene, PartViewScene, common, Hardpoint, PubSub, commands) {"use strict";
	function GreeblzEditor() {

		// Queue for undo/redo support
		this._commandQueue = new Array(100);

		this._pubsub = new PubSub();

		var sceneKeyboardTopic = "sceneKeyboard";

		var sceneMouseTopic = "sceneMouse";

		this._partViewTopic = "partview";

		this._mainViewTopic = "mainview";

		this._appTopic = "application";

		var container = $('#main-view').get(0);

		this._currentPartSelection = {};

		this._mainView = new MainViewScene({
			pubsub : this._pubsub,
			topic : this._mainViewTopic,
			appTopic : this._appTopic,
			container : container,
		});

		container = $('#part-view').get(0);

		this._partView = new PartViewScene({
			pubsub : this._pubsub,
			topic : this._partViewTopic,
			appTopic : this._appTopic,
			container : container,
			clearColor : 0xEEEEEE,
			clearAlpha : 1,
			skybox : false
		});

		this._pubsub.subscribe(this._appTopic, this._handleAppTopic.bind(this));

		this._pubsub.publish(this._partViewTopic, {
			type : "setRootModel",
			url : "dav/bottle.stl",
		});

		this._pubsub.publish(this._mainViewTopic, {
			type : "setRootModel",
			url : "dav/bottle.stl",
		});

	};

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
				case "mainViewSelected":
					if (this._currentPartSelection.pickPoint && this._currentPartSelection.pickNormal) {
						this._pubsub.publish(this._mainViewTopic, {
							type : MainViewScene.mode.add,
							parent : {
								uuid : msg.uuid,
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
					this._currentPartSelection.url = msg.url;
					this._currentPartSelection.pickPoint = msg.point;
					this._currentPartSelection.pickNormal = msg.normal;
					break;

			}

		},

		_addModelToScene : function(msg) {
			if (msg.type == "loaded") {

			} else {
				console.warn("Load failed?");
				console.warn(msg);
			}
		},
	};

	return new GreeblzEditor();
});
