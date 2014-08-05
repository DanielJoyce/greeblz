define(['jquery', 'applib/hardpoint', 'applib/common', 'applib/scene'], function($, Hardpoint, common, GreeblzScene) {"use strict";

	function PartViewScene(options) {
		GreeblzScene.call(this, options);

		this._pickWidget = new Hardpoint();
		this._pickWidget.visible = false;
		this._pickWidget.opacity = 0.65;
		this._scene.add(this._pickWidget);
	}


	PartViewScene.prototype = common.inherit(GreeblzScene.prototype);

	PartViewScene.prototype.constructor = PartViewScene;

	/**
	 *
	 * @param {Object} geometry
	 * @param {Object} pickable
	 * @param {Object} centerObject
	 */
	PartViewScene.prototype._setRootModel = function(geometry, pickable, centered) {

		this._pickWidget.visible = false;

		this._resetCamera();

		this.$super._setRootModel.call(this, geometry, pickable, centered);

	};

	PartViewScene.prototype._handleMouseUp = function(event) {
		// Because we are using the transform tools
		// we only want to perform a pick if this is a
		// 'click' without the mouse moving at all
		this._mouseDown = false;
		if (this._pickEnabled === true && this._mouseMoved === false && event.button === 0) {
			this._pickWidget.visible = true;
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
				console.debug("HIT!");
				console.log(picked);
				var pickInfo = picked[0];
				var face = pickInfo.face.clone();
				var normal = face.normal.clone();
				var point = pickInfo.point.clone();
				this._orbitControls.center = point;
				var object = pickInfo.object;
				this._pickWidget.position = point;
				var normalMatrix = new THREE.Matrix3().getNormalMatrix(object.matrixWorld);
				normal.applyMatrix3(normalMatrix).normalize();
				var dquat = new THREE.Quaternion();
				dquat.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
				this._pickWidget.setRotationFromQuaternion(dquat.normalize());
				//object.add(hpWidget);
				this._pickWidget.rotation.z = 0;
				this._pubsub.publish(this._appTopic, {
					type : "partViewPick",
					url : object.geometry.name,
					point : object.worldToLocal(point.clone()),
					//point : point.clone()),
					normal : normal.clone()
				});
			}
		}
	};

	return PartViewScene;

});
