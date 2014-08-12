define(['jquery', 'applib/common', 'applib/scene'], function($, common, GreeblzScene) {"use strict";

	function MainViewScene(options) {
		GreeblzScene.call(this, options);

		this._selectedPickInfo = null;
		this._currentPartViewPick = null;

		this._currentMode = MainViewScene.mode.normal;

		this._control = new THREE.TransformControls(this._camera, this._renderer.domElement);
		//this._control.addEventListener('change', this._render.bind(this));
		this._control.setSpace("local");

		this._scene.add(this._control);

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
		transform : "TRANSFORM"
	};

	MainViewScene.prototype = common.inherit(GreeblzScene.prototype);

	MainViewScene.prototype.constructor = GreeblzScene;

	MainViewScene.prototype._keyboardHandler = function(event) {

		if (!this._hasMouse)
			return;

		this.$super._keyboardHandler(event);

		if (this._currentMode !== MainViewScene.mode.transform)
			return;
		//console.log(event.which);
		switch ( event.keyCode ) {
			case 81:
				// Q
				this._control.setSpace(this._control.space == "local" ? "world" : "local");
				break;
			case 87:
				// W
				this._control.setMode("translate");
				break;
			case 69:
				// E
				this._control.setMode("rotate");
				break;
			case 82:
				// R
				this._control.setMode("scale");
				break;
			case 187:
			case 107:
				// +,=,num+
				this._control.setSize(control.size + 0.1);
				break;
			case 189:
			case 10:
				// -,_,num-
				this._control.setSize(Math.max(control.size - 0.1, 0.1));
				break;
		}

	};

	MainViewScene.prototype._handlePubsubMsg = function(msg) {
		switch (msg.type) {
			case 'partViewPick':
				this._currentPartViewPick = msg;
				break;
			case MainViewScene.mode.transform:
				this._currentMode = MainViewScene.mode.transform;
				break;
			case MainViewScene.mode.add:
				this._currentMode = MainViewScene.mode.add;
				// this._loadUrl(msg.child.url, this._addChildCallback.bind(this, msg));
				break;
			case MainViewScene.mode.remove:
				this._currentMode = MainViewScene.mode.remove;
				// this._loadUrl(msg.child.url, this._addChildCallback.bind(this, msg));
				break;
			case MainViewScene.mode.reset:
				this._currentMode = MainViewScene.mode.reset;
				this._reset();
				break;
			default:
				console.log("Calling super...");
				this.$super._handlePubsubMsg.call(this, msg);
		}
	};

	MainViewScene.prototype._reset = function() {
		this.$super._reset.call(this);
		this._pickableObjects = [];
		this._currentMode = MainViewScene.mode.normal;
		this._selectedPickInfo = null;
		this._currentPartViewPick = null;
		this._control.detach();
	};

	MainViewScene.prototype._handleMouseUp = function(event) {
		// Because we are using the transform tools
		// we only want to perform a pick if this is a
		// 'click' without the mouse moving at all

		this._mouseDown = false;
		if (this._pickEnabled === true && this._mouseMoved === false && event.button === 0) {
			event.preventDefault();
			var picked = this._doPick(this._pickableObjects, true);
			// console.debug(picked);
			if (picked.length > 0) {
				var scope = this;
				// Unhighlight via old select info
				if (this._selectedPickInfo) {
					this._selectedPickInfo.object.traverse(function(obj) {
						if ( obj instanceof THREE.Mesh) {
							obj.material = scope._defaultMaterial;
						}
					});
				}

				this._selectedPickInfo = picked[0];
				// this._pubsub.publish(this._appTopic, {
				// type : "mainViewSelected",
				// uuid : this._selectedPickInfo.object.uuid,
				// });

				this._selectedPickInfo.object.traverse(function(obj) {
					if ( obj instanceof THREE.Mesh) {
						obj.material = scope._materials.selectMaterial;
					}
				});

				switch (this._currentMode) {

					case MainViewScene.mode.transform:
						if (this._selectedPickInfo.object === this._rootModel) {
							this._control.detach();
							this._pubsub.publish(this._appTopic, {
								type : "error",
								error : "Root model can not be transformed. Please select a different part"
							});
						} else {
							// Attach to picked objects parent group.
							this._control.attach(this._selectedPickInfo.object.parent);
						}
						break;
					case MainViewScene.mode.add:
						this._loadUrl(this._currentPartViewPick.url, this._addChildCallback.bind(this));
						break;
					case MainViewScene.mode.remove:
						if (this._selectedPickInfo.object === this._rootModel) {
							this._control.detach();
							this._pubsub.publish(this._appTopic, {
								type : "error",
								error : "Root model can not be deleted"
							});
						} else {
							var parent = this._selectedPickInfo.object.parent;
							parent.remove(this._selectedPickInfo.object);
							this._scene.remove(this._selectedPickInfo.object);
							this._setPickableObjects(this._rootModel);
							this._currentMode = MainViewScene.mode.normal;
						}
						break;
					default:
						break;
				}

			} else {
				var scope = this;
				this._rootModel.traverse(function(obj) {
					if ( obj instanceof THREE.Mesh) {
						obj.material = scope._defaultMaterial;
					}
				});
			}
		}
	};

	/**
	 *
	 * @param {Object} geometry
	 * @param {Object} pickable
	 * @param {Object} centerObject
	 */
	MainViewScene.prototype._setRootModel = function(geometry, pickable, centered) {
		if (this._rootModel == null) {
			this._resetCamera();

			this.$super._setRootModel.call(this, geometry, pickable, centered);

			// var model = new THREE.Mesh(geometry, this._defaultMaterial);
			// this._rootModel = model;
			// this._scene.add(model);
			// geometry.computeBoundingSphere();
			// if (centered == true) {
			// this._centerModel(model);
			// }
			// if (pickable) {
			// this._pickableObjects.push(model);
			// }
			// // Frame model
			// var distance = 1.2 * geometry.boundingSphere.radius / Math.sin(this.VIEW_ANGLE / 2.0);
			// var vec = this._camera.position.clone().sub(new THREE.Vector3(0, 0, 0)).normalize();
			// var position = vec.multiplyScalar(distance);
			// this._camera.position = position;
		} else {
			console.log("Root model already set, ignoring");
		}
	};

	MainViewScene.prototype._addChildCallback = function(url, geometry) {
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

			var positions = geometry.attributes.position.array;

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
		var cDir = cPoint.clone().negate().normalize();
		var cDistance = cPoint.clone().length();
		cModel.translateOnAxis(cDir, cDistance);
		container.add(cModel);
		this._setPickableObjects(this._rootModel);
		this._currentMode = MainViewScene.mode.normal;
		var scope = this;
		this._selectedPickInfo.object.traverse(function(obj) {
			if ( obj instanceof THREE.Mesh) {
				obj.material = scope._materials.selectMaterial;
			}
		});

	};

	MainViewScene.prototype._update = function() {
		this.$super._update.call(this);
		this._control.update();
		// stats.update();
	};

	return MainViewScene;

});
