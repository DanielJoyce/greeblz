define([], function() {"use strict";

	function Command(context) {
		this._context = context;
	};

	Command.prototype.execute = function() {
		throw "Command Do does nothing!";
	};

	Command.prototype.unExecute = function() {
		throw "Command Undo does nothing!";
	};

	function AddMeshCommand(mesh, target) {
		Command.call(this, {
			mesh : mesh,
			target : target
		});
	}


	AddMeshCommand.prototype = new Command();

	AddMeshCommand.prototype.constructor = AddMeshCommand;

	AddMeshCommand.prototype.execute = function() {

	};

	AddMeshCommand.prototype.unExecute = function() {

	};

	function RemoveMeshCommand(mesh, target) {
		Command.call(this, {
			mesh : mesh,
			target : target
		});
	};

	RemoveMeshCommand.prototype = new Command();

	RemoveMeshCommand.prototype.constructor = RemoveMeshCommand;

	RemoveMeshCommand.prototype.execute = AddMeshCommand.prototype.unExecute;

	RemoveMeshCommand.prototype.unExecute = AddMeshCommand.prototype.execute;

	function TranslateMeshCommand(mesh, axis, distance) {
		Command.call(this, {
			mesh : mesh,
			axis : axis,
			distance : distance
		});
	}


	TranslateMeshCommand.prototype = new Command();

	TranslateMeshCommand.prototype.constructor = TranslateMeshCommand;

	TranslateMeshCommand.prototype.execute = function() {

	};

	TranslateMeshCommand.prototype.unExecute = function() {

	};

	function RotateMeshCommand(mesh, axis, angle) {
		Command.call(this, {
			mesh : mesh,
			axis : axis,
			angle : angle
		});
	}


	RotateMeshCommand.prototype = new Command();

	RotateMeshCommand.prototype.constructor = RotateMeshCommand;

	RotateMeshCommand.prototype.execute = function() {

	};

	RotateMeshCommand.prototype.unExecute = function() {

	};

	function ScaleMeshCommand(mesh, xScale, yScale, zScale) {
		Command.call(this, {
			mesh : mesh,
			xScale : xScale,
			yScale : yScale,
			zScale : zScale,
		});
	}


	ScaleMeshCommand.prototype = new Command();

	ScaleMeshCommand.prototype.constructor = ScaleMeshCommand;

	ScaleMeshCommand.prototype.execute = function() {

	};

	ScaleMeshCommand.prototype.unExecute = function() {

	};

	return {
		Command : Command,
		AddMeshCommand : AddMeshCommand,
		RemoveMeshCommand : RemoveMeshCommand,
		RotateMeshCommand : RotateMeshCommand,
		ScaleMeshCommand : ScaleMeshCommand,
		TranslateMeshCommand : TranslateMeshCommand
	};

});
