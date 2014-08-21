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

		this._control = new THREE.TransformControls(this._camera, this._renderer.domElement);
		//this._control.addEventListener('change', this._render.bind(this));
		this._control.setSpace("local");

		this._scene.add(this._control);

		this._initStateMachine();

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
		normal : "NORMAL",
		reset : "RESET",
		transform : "TRANSFORM",
		frame : "FRAME",
		setRootModel : "setRootModel"
	};

	MainViewScene.prototype = common.inherit(GreeblzScene.prototype);

	MainViewScene.prototype.constructor = GreeblzScene;

	MainViewScene.prototype._initStateMachine = function() {

		var view = this;

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

		var defaultState = {

			inputAction : function(msg) {
				switch (msg.type) {
					case MainViewScene.mode.reset:
						reset();
						break;
					case MainViewScene.mode.remove:
						removePart();
						break;
					case "error":
						handleError(msg);
					default:
						break;
				}
			},

			handleError : function(msg) {
				scope._pubsub.publish(this._appTopic, msg);
			},

			// TODO Move message dispatch here, as it dispatches to all other states...
			nextState : function(msg) {
				switch (msg.type) {
					case MainViewScene.mode.reset:
						return resetState;
						break;
					// case MainViewScene.mode.transform:
					// return transformState;
					// break;
					case MainViewScene.mode.setRootModel:
						return setRootModelState;
						break;
					case "mouseup":
						return partPickState;
						break;
					// case modelLoadComplete:

					// case "error":
					// return errorState;
					// break;
					default:
						return defaultState;
				}
			},

			reset : function() {
				view.$super._reset.call(view);
				view._pickableObjects = [];
				view._currentMode = MainViewScene.mode.normal;
				view._selectedPickInfo = null;
				view._currentPartViewPick = null;
				view._control.detach();
				view._hasActiveSelection = false;
				view._pickableSelectionObjects = [];
			},

			removePart : function() {
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
				}
			}
		};

		var partPickState = {

			automatic : true,

			nextState : function(msg) {
				return defaultState;
			},

			enterAction : function(event) {
				var picked = view._doPick(view._pickableObjects, true);
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
			},
		};

		var setRootModelState = {

			nextState : function(msg) {
				switch(msg.type) {
					case "modelLoadComplete":
						return defaultState;
						break;
					default:
						return setRootModelState;
				}
			},

			enterAction : function(msg) {
				switch(msg.type) {
					case MainViewScene.mode.setRootModel:
						this.startLoad(msg);
					default:
						break;
				}
			},

			exitAction : function(msg) {
				// Remove busy indicator
				// Set root model
				// if (msg.loadType === "rootModel") {
				this.setRootModel(msg);
				// }
			},

			startLoad : function(msg) {
				view._loadModel(msg.url, "rootModel");
			},

			setRootModel : function(msg) {
				view._setRootModel(msg.geometry, true, true);
			}
		};

		var addState = {

		};

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

		var transformState = {

			// TODO Move message dispatch here, as it dispatches to all other states...
			execute : function(msg) {
				switch (msg.type) {
					case 'mouseup':
						handleMouseUp(msg);
						return transformState;
					default:
						return defaultState;
				}
			},

			handleMouseUp : function(event) {
				var picked = view._doPick(view._pickableObjects, true);
				// console.debug(picked);
				if (picked.length > 0) {
					// Unhighlight via old select info
					if (view._selectedPickInfo) {
						view._selectedPickInfo.object.traverse(function(obj) {
							if ( obj instanceof THREE.Mesh) {
								obj.material = scope._defaultMaterial;
							}
						});
					}

					if (view._selectedPickInfo.object === view._rootModel) {
						view._control.detach();
						view._pubsub.publish(view._appTopic, {
							type : "error",
							error : "Root model can not be transformed. Please select a different part"
						});
					} else {
						// Attach to picked objects parent group.
						view._control.attach(view._selectedPickInfo.object.parent);
					}

				} else {
					view._rootModel.traverse(function(obj) {
						if ( obj instanceof THREE.Mesh) {
							obj.material = view._defaultMaterial;
						}
					});
				}

			}
		};

		this._currentState = defaultState;

	};

	MainViewScene.prototype._keyboardHandler = function(event) {

		if (!this._hasMouse)
			return;

		this.$super._keyboardHandler(event);

		// if (this._currentMode !== MainViewScene.mode.transform)
		return;
		//console.log(event.which);
		switch ( event.keyCode ) {
			case 81:
				// Q
				this._control.setSpace(this._control.space == "local" ? "world" : "local");
				break;
			case 87:
				// W
				this._control.setMode("move");
				break;
			case 69:
				// E
				this._control.setMode("scale");
				break;
			case 82:
				// R
				this._control.setMode("rotate");
				break;
			case 187:
			case 107:
				// +,=,num+
				this._control.setSize(control.size * 1.1);
				break;
			case 189:
			case 10:
				// -,_,num-
				this._control.setSize(Math.max(control.size * 0.9));
				break;
		}

	};

	MainViewScene.prototype._handleStateTransition = function(msg) {
		var nextState = this._processState(this._currentState, msg);
		//console.log(nextState);
		while (nextState.automatic) {
			nextState = this._processState(nextState, msg);
			console.log(nextState);
		}
		this._currentState = nextState;
	};

	MainViewScene.prototype._processState = function(state, msg) {
		var nextState = state.nextState(msg);

		if (nextState !== state) {
			//console.log("Changing states!");
			if (state.exitAction) {
				//console.log("Exit Action!");
				state.exitAction(msg);
			}
			if (nextState.enterAction) {
				//console.log("Enter Action!");
				nextState.enterAction(msg);
			}
			return nextState;
		} else {
			//console.log("Doing input for state");
			if (state.inputAction) {
				state.inputAction(msg);
			}
			return state;
		}
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

	MainViewScene.prototype._addChildCallback = function(url, geometry) {
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
		this._setPickableObjects(this._rootModel);
		this._currentMode = MainViewScene.mode.normal;
		var scope = this;
		this._selectedPickInfo.object.traverse(function(obj) {
			if ( obj instanceof THREE.Mesh) {
				obj.material = scope._materials.highlightMaterial;
			}
		});
		this._selectedPickInfo.object.material = this._materials.selectMaterial;

	};

	MainViewScene.prototype._update = function() {
		this.$super._update.call(this);
		this._control.update();
		// stats.update();
	};

	return MainViewScene;

});
