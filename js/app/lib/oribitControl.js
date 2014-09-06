define(['jquery', 'applib/pubsub'], function($, PubSub) {"use strict";

	function OrbitControl(domElement, targetObject) {

		this.minDistance = 0;
		this.maxDistance = Infinity;
		// this.canPan = false;
		this.canZoom = true;
		this.canRotate = true;
		this.target = targetObject;
		this.enabled = false;
		this.targetDom = domElement;
	}


	OrbitControl.prototype = {

		_handleMsg : function(msg) {
			if (!this.enabled) {
				return;
			}
			switch(msg.type) {
				case "mousedown":
					this._handleMouseDown(msg);
					break;
				case "mousemove":
					this._handleMouseMove(msg);
					break;
				case "wheel":
				case "mousewheel":
				case "DOMMouseScroll":
					this._handleMouseWheel(msg);
					break;
				case "mouseup":
					this._handleMouseUp(msg);
					break;
				default:
					break;
			};
		},

		_handleMouseDown : function(msg) {

		},
		
		_handleMouseMove : function(msg) {

		},
		
		_handleMouseWheel : function(msg) {

		},
		
		_handleMouseUp : function(msg) {

		},

		update : function() {

		},
	};

	return OrbitControl;

});
