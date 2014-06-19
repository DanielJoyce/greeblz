define(['jquery', 'applib/common', 'lib/three'], function($, common) {"use strict";

	function Hardpoint() {
		
		THREE.Object3D.call(this);

		this.id = THREE.Object3DIdCount++;
		this.uuid = THREE.Math.generateUUID();

		var radius = 10;

		// this._discTexture = THREE.ImageUtils.loadTexture(discImage);
		//
		// this._discMaterial = new THREE.MeshBasicMaterial({
		// map : this._discTexture,
		// side : THREE.DoubleSide,
		// shading : THREE.FlatShading,
		// alphaTest : 0.5,
		// color : 0x5079c2,
		// // transparent : true,
		// // blending: "Additive"
		// });
		//		var circleGeometry = new THREE.CircleGeometry(radius, segments);
		//		var circle = new THREE.Mesh(circleGeometry, whiteMaterial);

		var planeGeometry = new THREE.PlaneGeometry(20, 20);

		this._disc = new THREE.Mesh(planeGeometry, Hardpoint._baseDiscMaterial);
		this._disc.position.z = 0.1;
		this.add(this._disc);

		// var chunkyArrowY = this._chunkyArrow(15, 2.5, 0.4, 1.5, 12, blueMaterial);

		// group.add(chunkyArrowY);

		var chunkyArrowX = this._chunkyArrow(15, 2.5, 0.4, 1.5, 6, common.materials.blueMaterial);

		chunkyArrowX.rotation.x = 0.5 * Math.PI;

		this.add(chunkyArrowX);

	}


	Hardpoint._discImage = "img/greeblz-disc.png";

	Hardpoint._discTexture = THREE.ImageUtils.loadTexture(Hardpoint._discImage);

	Hardpoint._baseDiscMaterial = function() {

		return new THREE.MeshBasicMaterial({
			map : Hardpoint._discTexture,
			side : THREE.DoubleSide,
			shading : THREE.FlatShading,
			alphaTest : 0.5,
			color : common.colors.white,
			// transparent : true,
			// blending: "Additive"
		});
	}.call();

	Hardpoint._selectedDiscMaterial = function() {

		return new THREE.MeshBasicMaterial({
			map : Hardpoint._discTexture,
			side : THREE.DoubleSide,
			shading : THREE.FlatShading,
			alphaTest : 0.5,
			color : common.colors.blue,
			// transparent : true,
			// blending: "Additive"
		});
	}.call();

	Hardpoint._highlightedDiscMaterial = function() {

		return new THREE.MeshBasicMaterial({
			map : Hardpoint._discTexture,
			side : THREE.DoubleSide,
			shading : THREE.FlatShading,
			alphaTest : 0.5,
			color : common.colors.green,
			// transparent : true,
			// blending: "Additive"
		});
	}.call();

	Hardpoint.prototype = new THREE.Object3D();

	Hardpoint.prototype.constructor = Hardpoint;
	/*
	 Object.defineProperty(Hardpoint.prototype, "visible", {
	 get : function() {
	 return this.visible;
	 },
	 set : function(visible) {
	 this.traverse(function(child) {
	 child.visible = visible;
	 });
	 },
	 enumerable : true,
	 configurable : true
	 });
	 */
	Hardpoint.prototype._chunkyArrow = function(length, thickness, headRatio, headWidthRatio, sides, material) {

		var group = new THREE.Object3D();

		var coneWidth = headWidthRatio * thickness / 2;
		var coneLength = length * headRatio;

		var shaftLength = (1 - headRatio) * length;

		var coneGeom = new THREE.CylinderGeometry(0, coneWidth, coneLength, sides, 2);
		var cylinderGeom = new THREE.CylinderGeometry(thickness / 2, thickness / 2, shaftLength, sides, 2);

		var cone = new THREE.Mesh(coneGeom, material);
		var cylinder = new THREE.Mesh(cylinderGeom, material);

		cone.position.set(0, shaftLength + 0.5 * coneLength, 0);
		cylinder.position.set(0, shaftLength / 2, 0);

		group.add(cone);
		group.add(cylinder);
		return group;
	};

	Hardpoint.prototype.highlight = function() {
		this._disc.material = Hardpoint._highlightedDiscMaterial;
	};

	Hardpoint.prototype.select = function() {
		this._disc.material = Hardpoint._selectedDiscMaterial;
	};

	return Hardpoint;

});
