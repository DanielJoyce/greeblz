define(['jquery'], function($) {"use strict";

	/**
	 * Creates a pubsub system that can be used to send/recieve messages
	 *
	 * @param {int} pumpInterval
	 * 		How often, in ms, to pump the messages. Defaults to 50ms
	 */
	function PubSub(pumpInterval) {

		this._suspend = false;

		this._callbacks = {};

		this._messages = {};

		this._pumpinterval = pumpInterval || 50;

		// var messagesToFire = false;

		this._timeout = null;

		// Pump messages every 50 ms
		setInterval(this._pump.bind(this), this._pumpinterval);

	};

	/**
	 * message pump routine. Goes through queued messages and callbacks
	 * and fires them off.
	 */
	PubSub.prototype._pump = function() {
		//console.debug(this._messages);
		//console.debug("PUMP MSGS!");
		if (!this._suspend) {
			// If pumping takes a long time, we should
			// make sure this method is not re-entered while we are pumping
			//this._suspend = true;
			var outer = this;
			$.each(this._callbacks, function(topic, callbacks) {
				if (outer._messages[topic]) {
					var msgQueue = outer._messages[topic];
					var msgCount = msgQueue.length;
					var msgs = msgQueue.slice(0, msgCount);
					outer._messages[topic] = outer._messages[topic].slice(msgCount);
					var msg = undefined;
					while ( msg = msgs.shift()) {
						// for (var i = 0; i < msg_queue.length; i++) {
						console.debug("Fire Message:");
						console.debug(msg);
						callbacks.fire(msg);
					}
				}
			});
			//this._suspend = false;
		}
		this._timeout = null;
	};

	// Only pump as needed;

	// PubSub.prototype._fire = function(topic, msg) {
	// var callbacks = this._callbacks[topic];
	// if (callbacks != undefined) {
	// callbacks.fire(msg);
	// }
	// };

	/**
	 * Subscribe to topic on pubsub, registering callback to handle
	 * messages
	 *
	 * callback should be a function taking a single argument object
	 * that represents a message
	 *
	 * @param {Object} topic
	 * @param {Function} callback
	 */
	PubSub.prototype.subscribe = function(topic, callback) {
		var callbacks = this._callbacks[topic];
		if (callbacks == undefined) {
			callbacks = $.Callbacks("unique");
			this._callbacks[topic] = callbacks;
		}
		callbacks.add(callback);
	};

	/**
	 * Remove callback from pubsub topic. Must be same callback that was
	 * originally registered
	 * @param {Object} topic
	 * @param {Function} callback
	 */
	PubSub.prototype.unsubscribe = function(topic, callback) {
		var callbacks = this._callbacks[topic];
		if (callbacks != undefined) {
			callbacks.remove(callback);
		}
	};

	/**
	 * Publish a message to a given topic
	 * @param {Object} topic
	 * @param {Object} msg
	 */
	PubSub.prototype.publish = function(topic, msg) {
		if (!this._suspend) {
			var msg_queue = this._messages[topic];
			if (msg_queue == undefined) {
				msg_queue = [];
				this._messages[topic] = msg_queue;
			}
			console.log("PUBLISH:");
			console.log(msg);
			msg_queue.push(msg);
		}
		// msgsToFire = true;

		// if (this._timeout == null) {
			// this._timeout = setTimeout(this._pump.bind(this), this._pumpinterval);
		// }

	};

	/**
	 * Reset the pubsub, removing all topics and callbacks
	 */
	PubSub.prototype.reset = function() {
		this._suspend = true;
		$.each(this._callbacks, function(topic, callbacks) {
			callbacks.empty();
			delete this._callbacks[topic];
		});
		this._messages = {};
		this._suspend = false;
	};

	/**
	 * Suspend handling of pubsub messages. All messages sent while
	 * suspended will be dropped
	 */
	PubSub.prototype.suspend = function() {
		// TODO cancel/reinstate setinterval to avoid busywait.
		this._suspend = true;
	};

	/**
	 * Resume pubsub messages
	 */
	PubSub.prototype.resume = function() {
		this._suspend = false;
	};

	return PubSub;

});
