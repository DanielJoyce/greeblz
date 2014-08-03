define(['jquery', 'applib/common', 'applib/scene'], function($, common, GreeblzScene) {"use strict";

	function MainViewScene(options) {
		GreeblzScene.call(this, options);

		this._selectedPickInfo = null;

		this._currentMode = MainViewScene.mode.normal;

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
		reset : "RESET"
	};

	MainViewScene.prototype = common.inherit(GreeblzScene.prototype);

	MainViewScene.prototype.constructor = GreeblzScene;

	MainViewScene.prototype._handlePubsubMsg = function(msg) {
		try {
			switch (msg.type) {
				case MainViewScene.mode.add:
					this._currentMode = MainViewScene.mode.add;
					this._loadUrl(msg.child.url, this._addChildCallback.bind(this, msg));
					break;
				case MainViewScene.mode.reset:
					this._currentMode = MainViewScene.mode.reset;
					this._reset();

				default:
					console.log("Calling super...");
					this.$super._handlePubsubMsg.call(this, msg);
			}
		} catch (e) {
			console.error("Encountered exception while handling message");
			console.error(e);
		} finally {
			this._currentMode = MainViewScene.mode.normal;
		}
	};

	MainViewScene.prototype._reset = function() {
		this._pickableObjects = [];
		if (this._rootModel) {
			this._scene.remove(this._rootModel);
		}
		this._rootModel = null;
		this._currentMode = MainViewScene.mode.normal;
		this._selectedPickInfo = {};
	};

	MainViewScene.prototype._handleMouseUp = function(event) {
		// Because we are using the transform tools
		// we only want to perform a pick if this is a
		// 'click' without the mouse moving at all
		this._mouseDown = false;
		if (this._pickEnabled && !this._mouseMoved) {
			event.preventDefault();
			var domElement = this._renderer.domElement;
			var mouse = new THREE.Vector2();
			var pos = $(domElement).position();
			var relX = event.pageX - pos.left;
			var relY = event.pageY - pos.top;
			var mouseVector = new THREE.Vector3((relX / domElement.width ) * 2 - 1, -(relY / domElement.height ) * 2 + 1, 0);
			// Fixup mouse vector relative to camera.
			this._projector.unprojectVector(mouseVector, this._camera);
			this._raycaster.set(this._camera.position, mouseVector.sub(this._camera.position).normalize());
			var picked = this._raycaster.intersectObjects(this._pickableObjects, true);
			// console.debug(picked);
			if (picked.length > 0) {
				this._selectedPickInfo = picked[0];
				this._pubsub.publish(this._appTopic, {
					type : "mainViewSelected",
					uuid : this._selectedPickInfo.object.uuid,
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
			var model = new THREE.Mesh(geometry, this._defaultMaterial);
			this._rootModel = model;
			this._scene.add(model);
			geometry.computeBoundingSphere();
			if (centered == true) {
				var dir = geometry.boundingSphere.center.clone().normalize();
				var distance = -geometry.boundingSphere.radius;
				model.translateOnAxis(dir, distance);
			}
			if (pickable) {
				this._pickableObjects.push(model);
			}
			// Frame model
			var distance = 1.2 * geometry.boundingSphere.radius / Math.sin(this.VIEW_ANGLE / 2.0);
			var vec = this._camera.position.clone().sub(new THREE.Vector3(0, 0, 0)).normalize();
			var position = vec.multiplyScalar(distance);
			this._camera.position = position;
		} else {
			console.log("Root model already set, ignoring");
		}
	};

	MainViewScene.prototype._addChildCallback = function(msg, url, geometry) {
		var selectedObj = this._selectedPickInfo.object;
		if (msg.parent.uuid === selectedObj.uuid) {

			var target = selectedObj;
			var pNormal = this._selectedPickInfo.face.normal;
			var pPoint = this._selectedPickInfo.point;
			target.worldToLocal(pPoint);
			var cNormal = msg.child.normal;
			var cPoint = msg.child.point;
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
			this._pickableObjects.push(cModel);
		} else {
			console.group("Bad ADD");
			console.log("Current selected UUID " + this._selectedPickInfo.object.uuid);
			console.log("Got ADD Target UUID " + msg.parent.uuid);
			console.groupEnd();
		}

	};

	return MainViewScene;

});
