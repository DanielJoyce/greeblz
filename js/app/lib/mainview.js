define(['jquery', 'applib/common', 'applib/scene'], function($, common, GreeblzScene) {"use strict";

	// var protoState = {
	// scene: reference to mainview scene instance

	// automatic: true/false
	//
	// // Return the next state at end of function.
	// // If no transition, return null
	// return null;
	// },
	//
	// /**
	// * When this function is called, 'this' is bound
	// * to the MainViewScene instance
	// */
	// execute : function() {
	// // Return the next state at end of function.
	// // If no transition, return null
	// return null;
	// }
	// };

	function MainViewScene(options) {
		GreeblzScene.call(this, options);

		this._selectedPickInfo = null;
		this._currentPartViewPick = null;
		this._hasActiveSelection = false;
		this._pickableSelectionObjects = [];

		this._control = new THREE.TrackballControls(this._renderer.domElement);
		this._control.userZoom = false;
		//this._control.addEventListener('change', this._render.bind(this));
		//this._control.setSpace("local");

		//this._scene.add(this._control);

		this._initStateMachine();

	}


	MainViewScene.mode = {
		add : "ADD",
		partViewPick : "PART_VIEW_PICK",
		select : "SELECT",
		remove : "REMOVE",
		copy : "COPY",
		waggle : "WAGGLE",
		twist : "TWIST",
		shift : "SHIFT",
		push : "PUSH",
		scale : "SCALE",
		normal : "NORMAL",
		reset : "RESET",
		transform : "TRANSFORM",
		frame : "FRAME",
		setRootModel : "setRootModel",
		rootModelSet : "rootModelSet",
		modelDisposed : "modelDisposed",
		partSelected : "partSelected",
	};

	MainViewScene.prototype = common.inherit(GreeblzScene.prototype);

	MainViewScene.prototype.constructor = GreeblzScene;

	MainViewScene.prototype._initStateMachine = function() {

		var view = this;

		var setRootModelState = null;
		var pickState = null;
		var addState = null;
		var transformState = null;

		// var protoState = {
		// Enter action only executed once when state changes
		// enterAction: function(msg){}.
		// Exit action only executed once when state changes
		// exitAction: function(msg){},
		// Input action executed for every input
		// inputAction: function(msg){}
		// Executed for every input, to see if state changes
		// nextState: function(msg){},
		// };

		function DefaultState() {

			this.inputAction = function(msg) {
				switch (msg.type) {
					case MainViewScene.mode.reset:
						this.reset();
						break;
					case MainViewScene.mode.remove:
						this.removePart();
						break;
					case "error":
						handleError(msg);
						break;
					case MainViewScene.mode.partViewPick:
						view._currentPartViewPick = msg;
						break;
					default:
						break;
				}
			};

			this.handleError = function(msg) {
				scope._pubsub.publish(this._appTopic, msg);
			};

			// TODO Move message dispatch here, as it dispatches to all other states...
			this.nextState = function(msg) {
				switch (msg.type) {
					// case MainViewScene.mode.transform:
					// return transformState;
					// break;
					case MainViewScene.mode.setRootModel:
						return setRootModelState;
						break;
					case MainViewScene.mode.add:
						return addState;
						break;
					case MainViewScene.mode.transform:
						return transformState;
						break;
					case "mouseup":
						return pickState;
						break;
					// case modelLoadComplete:

					// case "error":
					// return errorState;
					// break;
					default:
						return defaultState;
				}
			};

			this.reset = function() {
				view.$super._reset.call(view);
				view._pickableObjects = [];
				view._currentMode = MainViewScene.mode.normal;
				view._selectedPickInfo = null;
				view._currentPartViewPick = null;
				view._control.detach();
				view._hasActiveSelection = false;
				view._pickableSelectionObjects = [];
			};

			this.removePart = function() {
				if (view._selectedPickInfo.object === view._rootModel) {
					view._control.detach();
					view._pubsub.publish(view._appTopic, {
						type : "error",
						error : "Root model can not be deleted"
					});
				} else {
					var parent = view._selectedPickInfo.object.parent;
					parent.remove(view._selectedPickInfo.object);
					view._scene.remove(view._selectedPickInfo.object);
					view._setPickableObjects(view._rootModel);
					view._currentMode = MainViewScene.mode.normal;
					view._pubsub.publish(view._appTopic, {
						type : "partSelected",
						value : false
					});
				}
			};
		};

		var defaultState = new DefaultState();
		this._defaultState = defaultState;

		function PickState() {

			this.automatic = true;

			this.nextState = function(msg) {
				return defaultState;
			};

			this.enterAction = function(event) {
				var picked = view._doPick(event, view._pickableObjects, true);
				// Has selection changed?
				if (picked.length > 0) {
					var scope = view;
					// Unhighlight via old select info
					if (view._selectedPickInfo && picked[0] !== view._selectedPickInfo) {
						view._unhighlightPart(view._selectedPickInfo.object);
					}
					// Set new selection
					view._selectedPickInfo = picked[0];
					// Root can never be selected
					view._hasActiveSelection = true;
					view._pickableSelectionObjects = [];
					view._highlightPart(view._selectedPickInfo.object, true);
					view._pubsub.publish(view._appTopic, {
						type : "partSelected",
						value : true
					});
				}
				if (picked.length == 0) {
					if (view._selectedPickInfo) {
						view._unhighlightPart(view._selectedPickInfo.object);
						view._selectedPickInfo = null;
					}
					view._hasActiveSelection = false;
					view._pickableSelectionObjects = [];
					view._pubsub.publish(view._appTopic, {
						type : "partSelected",
						value : false
					});
				}
			};
		};

		pickState = new PickState();

		function SetRootModelState() {
			this.nextState = function(msg) {
				if (view._rootModel == null) {
					switch(msg.type) {
						case "modelLoadComplete":
							return defaultState;
							break;
						default:
							return setRootModelState;
					}
				} else {
					return defaultState;
				}
			};

			this.enterAction = function(msg) {
				// TODO Set busy indicator
				if (view._rootModel == null) {
					switch(msg.type) {
						case MainViewScene.mode.setRootModel:
							this.startLoad(msg);
						default:
							break;
					}
				}
			};

			this.exitAction = function(msg) {
				if (view._rootModel == null) {
					// TODO Remove busy indicator
					// Set root model
					// if (msg.loadType === "rootModel") {
					this.setRootModel(msg);
					view._pubsub.publish(view._appTopic, {
						type : "rootModelSet"
					});
					// }
				}
			};

			this.startLoad = function(msg) {
				view._loadModel(msg.url, "rootModel");
			};

			this.setRootModel = function(msg) {
				view._setRootModel(msg.geometry, true, true);
			};
		};

		setRootModelState = new SetRootModelState();

		function AddState() {

			this.nextState = function(msg) {
				switch(msg.type) {
					case "addComplete":
						if (view._selectedPickInfo) {
							view._unhighlightPart(view._rootModel, true);
							view._highlightPart(view._selectedPickInfo.object, true);
						}
						return defaultState;
						break;
					default:
						return addState;
				}
			};

			this.inputAction = function(msg) {
				switch (msg.type) {
					case "modelLoadComplete":
						this.modelLoadMsg = msg;
						break;
					case "mouseup":
						this.pickAction(msg);
						break;
					default:
						break;
				}
			};

			this.enterAction = function(msg) {
				// TODO Set busy indicator
				switch(msg.type) {
					case MainViewScene.mode.add:
						this.startLoad(msg);
					default:
						break;
				}
			};

			this.pickAction = function(event) {
				var picked = view._doPick(event, view._pickableObjects, true);
				// Has selection changed?
				if (picked.length > 0) {
					view._selectedPickInfo = picked[0];
					view._addChild(this.modelLoadMsg.url, this.modelLoadMsg.geometry);
					view._pubsub.publish(view._topic, {
						type : "addComplete"
					});
				}

			};

			// TODO Need to store state locally when

			// this.exitAction = function(msg) {
			// // TODO Remove busy indicator
			// // Set root model
			// // if (msg.loadType === "rootModel") {
			//
			// // }
			// this.addModel(msg);
			//
			// };

			this.startLoad = function(msg) {
				view._loadModel(view._currentPartViewPick.url, "addModel");
			};

		};

		var addState = new AddState();

		var cutState = {

		};
		var copyState = {

		};

		var pasteState = {

		};

		var mirrorState = {

		};

		var deleteState = {

		};

		var frameState = {

		};

		function TransformState() {

			// TODO Move message dispatch here, as it dispatches to all other states...
			this.nextState = function(msg) {
				console.log(msg);
				switch(msg.type) {
					case MainViewScene.mode.transform:
					case "mouseup":
						return transformState;
					// break;
					default:
						return defaultState;
					// break;
				}
			};

			this.inputAction = function(msg) {
				switch(msg.type) {
					case "mouseup":
						this.handleMouseUp(msg);
						break;
					default:
						break;
				}
			};

			this.exitAction = function(msg) {
				view._control.detach();
			};

			this.handleMouseUp = function(event) {
				console.log("DERP!");
				var picked = view._doPick(event, view._pickableObjects, true);
				// Has selection changed?
				if (picked.length > 0) {
					var scope = view;
					// Unhighlight via old select info
					if (view._selectedPickInfo && picked[0] !== view._selectedPickInfo) {
						view._unhighlightPart(view._selectedPickInfo.object);
					}
					// Set new selection
					view._selectedPickInfo = picked[0];
					view._hasActiveSelection = true;
					view._pickableSelectionObjects = [];
					view._highlightPart(view._selectedPickInfo.object, true);
					view._pubsub.publish(view._appTopic, {
						type : "partSelected",
						value : true
					});

					if (view._selectedPickInfo.object === view._rootModel) {
						console.log("TRANSFORM ERROR!");
						view._control.detach();
						view._enableCameraNavigation();
						view._pubsub.publish(view._appTopic, {
							type : "error",
							error : "Root model can not be transformed. Please select a different part"
						});
					} else {
						view._disableCameraNavigation();
						view._control.attach(view._selectedPickInfo.object);
					}

				}
				if (picked.length == 0) {
					view._control.detach();
					view._enableCameraNavigation();
					if (view._selectedPickInfo) {
						view._unhighlightPart(view._selectedPickInfo.object);
						view._selectedPickInfo = null;
					}
					view._hasActiveSelection = false;
					view._pickableSelectionObjects = [];
					view._pubsub.publish(view._appTopic, {
						type : "partSelected",
						value : false
					});
				}
			};
		};

		transformState = new TransformState();

		this._currentState = defaultState;

	};

	MainViewScene.prototype._keyboardHandler = function(event) {

		if (!this._hasMouse)
			return;

		this.$super._keyboardHandler(event);

		// if (this._currentState !== MainViewScene.mode.transform)
		// return;

		// TODO Add to state handling framework
		//console.log(event.which);
		switch ( event.keyCode ) {
			// case 81:
				// // Q
				// this._control.setSpace(this._control.space == "local" ? "world" : "local");
				// break;
			// case 87:
				// // W
				// this._control.setMode("translate");
				// break;
			// case 69:
				// // E
				// this._control.setMode("scale");
				// break;
			// case 82:
				// // R
				// this._control.setMode("rotate");
				// break;
			// case 187:
			// case 107:
				// // +,=,num+
				// this._control.setSize(control.size * 1.1);
				// break;
			// case 189:
			// case 10:
				// // -,_,num-
				// this._control.setSize(Math.max(control.size * 0.9));
				// break;
		}

	};

	MainViewScene.prototype._handleStateTransition = function(msg) {
		var nextState = null;
		try {
			nextState = this._processState(this._currentState, msg);
			console.log(nextState);
			while (nextState.automatic) {
				nextState = this._processState(nextState, msg);
				console.log(nextState);
			}
		} catch(err) {
			console.group("MAIN VIEW STATE ERROR");
			console.error(err);
			console.log("Error transitioning states");
			console.log("Current State:");
			console.log(this._currentState);
			console.log("Message that caused problem:");
			console.log(msg);
			console.log("Returning to default state");
			console.groupEnd();
			nextState = this._defaultState;
		}
		this._currentState = nextState;
	};

	MainViewScene.prototype._processState = function(state, msg) {
		console.group("PROCESSING STATE");
		var nextState = state.nextState(msg);
		console.log("CURRENT STATE");
		console.log(state);
		console.log("NEXT STATE");
		console.log(nextState);
		if (nextState !== state) {
			console.log("Changing states!");
			if (state.exitAction) {
				console.log("Exit Action!");
				state.exitAction(msg);
			}
			if (nextState.inputAction) {
				console.log("processing input action");
				nextState.inputAction(msg);
			}
			if (nextState.enterAction) {
				console.log("Enter Action!");
				nextState.enterAction(msg);
			}
		} else {
			console.log("Doing input for state");
			if (state.inputAction) {
				console.log("processing input action");
				state.inputAction(msg);
			}
			nextState = state;
		}
		console.groupEnd();
		return nextState;
	};

	MainViewScene.prototype._handlePubsubMsg = function(msg) {

		this._handleStateTransition(msg);
	};

	MainViewScene.prototype._handleMouseUp = function(event) {

		// Because we are using the transform tools
		// we only want to perform a pick if this is a
		// 'click' without the mouse moving at all

		this._mouseDown = false;
		if (this._pickEnabled === true && this._mouseMoved === false && event.button === 0) {
			event.preventDefault();
			this._handleStateTransition(event);
		}
	};

	/**
	 *
	 * @param {Object} geometry
	 * @param {Object} pickable
	 * @param {Object} centerObject
	 */
	MainViewScene.prototype._setRootModel = function(geometry, pickable, centered) {
		// if (this._rootModel == null) {
		this._resetCamera();
		this.$super._setRootModel.call(this, geometry, pickable, centered);
		// } else {
		// console.log("Root model already set, ignoring");
		// }
	};

	MainViewScene.prototype._highlightPart = function(parentPart, recursive) {
		var scope = this;
		if (recursive) {
			parentPart.traverse(function(obj) {
				if ( obj instanceof THREE.Mesh) {
					obj.material = scope._materials.highlightMaterial;
				}
			});
		}
		parentPart.material = this._materials.selectMaterial;
	};

	MainViewScene.prototype._unhighlightPart = function(parentPart) {
		var scope = this;
		parentPart.traverse(function(obj) {
			if ( obj instanceof THREE.Mesh) {
				obj.material = scope._defaultMaterial;
			}
		});
	};

	MainViewScene.prototype._loadModel = function(url, loadType) {
		//var dataType = msg.dataType;
		var scope = this;

		if (url == undefined || url == null) {
			this._pubsub.publish(this._topic, {
				type : "error",
				msg : "No url specified"
			});
		} else {
			// TODO Use webworker in future
			try {
				var callback = function(geometry) {
					scope._pubsub.publish(scope._topic, {
						type : "modelLoadComplete",
						url : url,
						loadType : loadType,
						geometry : geometry,
						status : "complete"
					});
				};

				this._loader.load(url, callback);
			} catch(err) {
				this._pubsub.publish(this._topic, {
					type : "error",
					msg : "Loader encountered error",
					exception : err,
				});
			}
		}
	};

	MainViewScene.prototype._addChild = function(url, geometry) {
		geometry.computeBoundingSphere();
		var selectedObj = this._selectedPickInfo.object;
		var partPickInfo = this._currentPartViewPick;
		var target = selectedObj;
		var pNormal = null;
		// workaround for bug https://github.com/mrdoob/three.js/issues/5164 until I can update
		if (this._selectedPickInfo.indices) {
			var vA = new THREE.Vector3();
			var vB = new THREE.Vector3();
			var vC = new THREE.Vector3();

			// Face is null, so pNormal is null
			var a = this._selectedPickInfo.indices[0];
			var b = this._selectedPickInfo.indices[1];
			var c = this._selectedPickInfo.indices[2];

			var positions = selectedObj.geometry.attributes.position.array;

			vA.set(positions[a * 3], positions[a * 3 + 1], positions[a * 3 + 2]);
			vB.set(positions[b * 3], positions[b * 3 + 1], positions[b * 3 + 2]);
			vC.set(positions[c * 3], positions[c * 3 + 1], positions[c * 3 + 2]);

			var face = new THREE.Face3(a, b, c, THREE.Triangle.normal(vA, vB, vC));
			pNormal = face.normal;

		} else {
			pNormal = this._selectedPickInfo.face.normal;
		}
		var pPoint = this._selectedPickInfo.point;
		target.worldToLocal(pPoint);
		var cNormal = partPickInfo.normal;
		var cPoint = partPickInfo.point;
		var cGeom = geometry;
		cGeom.name = url;
		var container = new THREE.Object3D();
		container.position = pPoint;
		target.add(container);
		var dquat = new THREE.Quaternion();
		dquat.setFromUnitVectors(cNormal.normalize(), pNormal.clone().negate().normalize());
		container.setRotationFromQuaternion(dquat.normalize());
		//container.rotation.z = 0;
		var cModel = new THREE.Mesh(cGeom, this._defaultMaterial.clone());
		var cRadius = cModel.geometry.boundingSphere.radius;
		var pRadius = this._rootModel.geometry.boundingSphere.radius;
		var cScale = cRadius / cRadius;
		if (cRadius > 10 * pRadius) {
			cScale = 10 * pRadius / cRadius;
		}
		if (cRadius < 0.25 * pRadius) {
			cScale = 0.25 * pRadius / cRadius;
		}
		cModel.scale.set(cScale, cScale, cScale);
		var cDir = cPoint.clone().negate().normalize();
		var cDistance = cPoint.clone().length();
		cModel.translateOnAxis(cDir, cDistance);
		container.add(cModel);
	};

	MainViewScene.prototype._update = function() {
		this.$super._update.call(this);
		this._control.update();
		// stats.update();
	};

	return MainViewScene;

});
