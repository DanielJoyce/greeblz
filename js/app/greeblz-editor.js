define(['jquery', 'applib/mainview', 'applib/partview', 'applib/common', 'applib/hardpoint', 'applib/pubsub', 'applib/command', 'lib/THREEx.FullScreen', 'lib/THREEx.WindowResize', 'lib/OrbitControls', 'lib/TransformControls'], function($, MainViewScene, PartViewScene, common, Hardpoint, PubSub, commands) {"use strict";

	function ButtonManager(scope) {
		this._frameButton = $("#framePart");
		this._transformButton = $("#transformPart");
		this._addPartButton = $("#addPart");
		this._cutPartButton = $("#cutPart");
		this._copyPartButton = $("#copyPart");
		this._removePartButton = $("#removePart");
		this._saveFigureButton = $("#saveFigure");
		this._settingsButton = $("#settings");
		this._trashFigureButton = $("#trashFigure");

		this._transformButton.click(scope._transformPartHandler.bind(scope));
		this._addPartButton.click(scope._addPartHandler.bind(scope));
		this._cutPartButton.click(scope._buttonHandler);
		this._copyPartButton.click(scope._buttonHandler);
		this._removePartButton.click(scope._removePartHandler.bind(scope));
		this._saveFigureButton.click(scope._saveFigureHandler.bind(scope));
		this._settingsButton.click(scope._settingsHandler.bind(scope));
		this._trashFigureButton.click(scope._trashFigureHandler.bind(scope));

		this.reset = function() {
			this._frameButton.prop("disabled", true);
			this._transformButton.prop("disabled", true);
			this._addPartButton.prop("disabled", true);
			this._cutPartButton.prop("disabled", true);
			this._copyPartButton.prop("disabled", true);
			this._removePartButton.prop("disabled", true);
			this._saveFigureButton.prop("disabled", false);
			this._settingsButton.prop("disabled", false);
			this._trashFigureButton.prop("disabled", false);
		};

		// this.

		this.enableEditing = function() {
			this._addPartButton.prop("disabled", false);
		};

		this.enablePickRequiredButtons = function() {
			this._frameButton.prop("disabled", false);
			this._transformButton.prop("disabled", false);
			this._cutPartButton.prop("disabled", false);
			this._copyPartButton.prop("disabled", false);
			this._removePartButton.prop("disabled", false);
			this._settingsButton.prop("disabled", false);
		};

	}

	function GreeblzEditor() {

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

		this._partViewPick = false;
		this._hasRootModel = false;
		this._partSelected = false;
		this._buttonManager = new ButtonManager(this);
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

				case "error" :
					alert(msg.error);
					break;
				case "partViewPick":
					if (msg.pick) {
						this._pubsub.publish(this._mainViewTopic, {
							type : MainViewScene.mode.partViewPick,
							url : msg.pick.url,
							point : msg.pick.point,
							normal : msg.pick.normal
						});
						this._partViewPick = true;
						console.log("HAS PART VIEW PICK");
					} else {
						this._partViewPick = false;
					}
					break;
				case "partSelected":
					this._partSelected = msg.value;
					break;
				case "modelDisposed":
					this._hasRootModel = false;
					break;
				case "rootModelSet":
					this._hasRootModel = true;
					console.log("HAS ROOT MODEL");
					break;
				default:
					break;
			}
			this._buttonManager.reset();
			if (this._hasRootModel && this._partViewPick) {
				console.log("ENABLE EDIT!");
				this._buttonManager.enableEditing();
			}
			if (this._partSelected) {
				this._buttonManager.enablePickRequiredButtons();
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

		_transformPartHandler : function(event) {
			this._pubsub.publish(this._mainViewTopic, {
				type : MainViewScene.mode.transform
			});
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
