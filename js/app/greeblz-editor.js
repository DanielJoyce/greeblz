define(['jquery', 'applib/mainview', 'applib/partview', 'applib/common', 'applib/hardpoint', 'applib/pubsub', 'applib/command', 'lib/THREEx.FullScreen', 'lib/THREEx.WindowResize', 'lib/OrbitControls', 'lib/TransformControls'], function($, MainViewScene, PartViewScene, common, Hardpoint, PubSub, commands) {"use strict";
	function GreeblzEditor() {

		$("#addPart").click(this._addPartHandler.bind(this));
		$("#cutPart").click(this._buttonHandler);
		$("#copyPart").click(this._buttonHandler);
		$("#removePart").click(this._removePartHandler.bind(this));
		$("#saveFigure").click(this._saveFigureHandler.bind(this));
		$("#settings").click(this._settingsHandler.bind(this));
		$("#trashFigure").click(this._trashFigureHandler.bind(this));

		$("#search-results > ol > li > a").click(this._searchResultClickHandler.bind(this));

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
				// case "mainViewSelected":
				// if (this._currentPartSelection.pickPoint && this._currentPartSelection.pickNormal) {
				// this._pubsub.publish(this._mainViewTopic, {
				// type : MainViewScene.mode.add,
				// parent : {
				// uuid : msg.uuid,
				// },
				// child : {
				// url : this._currentPartSelection.url,
				// point : this._currentPartSelection.pickPoint.clone(),
				// normal : this._currentPartSelection.pickNormal.clone()
				// }
				// });
				// }
				// break;

				case "partViewPick":
					this._pubsub.publish(this._mainViewTopic, {
						type : "partViewPick",
						url : msg.url,
						point : msg.point,
						normal : msg.normal
					});
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

		_buttonHandler : function(event) {
			alert("Button Clicked");
		},

		_saveFigureHandler : function(event) {
			alert("Not implemented yet!");
		},

		_settingsHandler : function(event) {
			alert("Not implemented yet!");
		},

		_addPartHandler : function(event) {
			this._pubsub.publish(this._mainViewTopic, {
				type : MainViewScene.mode.add
			});
		},

		_removePartHandler : function(event) {
			if (confirm("Remove this part and all children?")) {
				this._pubsub.publish(this._mainViewTopic, {
					type : MainViewScene.mode.remove
				});
			}
		},

		_trashFigureHandler : function(event) {
			if (confirm("Delete all work and start over?\nEverything will be lost unless saved!")) {
				this._pubsub.publish(this._mainViewTopic, {
					type : MainViewScene.mode.reset
				});
			}
		},

		_searchResultClickHandler : function(event) {

			console.log(event);

			var url = event.target.href;

			event.preventDefault();
			this._pubsub.publish(this._partViewTopic, {
				type : "setRootModel",
				url : url,
			});

			this._pubsub.publish(this._mainViewTopic, {
				type : "setRootModel",
				url : url,
			});

		}
	};

	return new GreeblzEditor();
});
