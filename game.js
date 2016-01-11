var Promise = require('bluebird');
var jq = require('./wrappers');

var game = Object.create(null);
game.id = null;
game.status = null;
game.currentTurn = null;
game.latestJobsArray = null;
game.workingMachinesArray = [];

game.createNewMachine = function() {
	jq.newMachine(game.id)
	.then(function(newMachine) {
		//console.log('newMachine response', newMachine)
		game.workingMachinesArray.push(newMachine);
		game.allocate(game.advanceTurn);
	})
}

game.advanceTurn = function() {
	jq.nextTurn(game.id)
	.then(function(turnInfo) {
		console.log('advanceTurn response', turnInfo)
		game.latestJobsArray = turnInfo.jobs;
		game.currentTurn = turnInfo.current_turn;
		game.status = turnInfo.status;
		if(game.status !== 'completed') {
			//console.log('1')
			game.allocate(game.advanceTurn)
	  	} else {
		  	console.log('Winner')
		  	game.getInfo(game.id)
		  	.then(function(res) {
		  		console.log('winning info', res)
		  	})  		
	  	}
	})
}

game.checkStatus = function() {
	var machineStatusArray = [];
	for(var i = 0; i < game.workingMachinesArray.length; i++) {
		var machine = game.workingMachinesArray[i];
		//console.log('machine!', machine)
		if(!machine.jobs) {
			machineStatusArray.push({id: machine.id, availableMemory: 64});
			break;
		}

		//console.log('hitting checkStatus');
		for(var j = 0; j < machine.jobs.length; j++) {
			//console.log('inner loop');
			var mem = 0;
			if(game.currentTurn <= machine.jobs[j].turns) {
				mem += machine.jobs[j].memoryUsed;
				machineStatusArray.push({id: machine.id, availableMemory: 64 - mem});
			}
		}
	}
	console.log('machineStatusArray', machineStatusArray)
	return machineStatusArray;
}

game.allocate = function(callback) {
	//console.log('2');
	//need to delete machines
	var machineStatusArray = game.checkStatus();
	if(machineStatusArray.length === 0) {
		//console.log('2.1');
		return game.createNewMachine();
	}
	//console.log('allocating')
	for(var i = 0; i < machineStatusArray.length; i++) {

		var jobs = [];
		jobsList = [];
		var machine = machineStatusArray[i];
		for(var j = 0; j < game.latestJobsArray.length; j++) {
			if(machine.availableMemory >= game.latestJobsArray[j].memory_required) {
				var currentJob = game.latestJobsArray[j];
				jobs.push({id: currentJob.id, memoryUsed: currentJob.memory_required, turns: currentJob.turns_required});
				jobsList.push(currentJob.id);
				machine.availableMemory = machine.availableMemory - game.latestJobsArray[j].memory_required;
			}
			break;
		}
		jq.assign(game.id, machine.id, jobsList)
		.then(function(res) {
			//console.log('3')
			console.log('assign response', res)
			if(callback) {	
				//console.log('4')
				callback();
			}
		})
		//update workingMachinesArray
		for(var k = 0; k < game.workingMachinesArray.length; k++) {
			if(game.workingMachinesArray[k].id === machine.id) {
				game.workingMachinesArray[k].jobs = jobs;
			}	
		}
	}
};

game.start = function() {
	jq.createGame()
	.then(function(gameState) {
		console.log('createGame response', gameState)
		game.id = gameState.id;
		game.status = gameState.status;
		game.advanceTurn();
	});
};

game.start();

// game.recurse = function() {
// 	if(game.status !== 'completed') {
// 		game.allocate(game.run);
// 	} else {
// 	  	console.log('Winner');
// 	  	game.getInfo(game.id)
// 	  	.then(function(res) {
// 	  		console.log('winning info', res);
// 	  	})  		
// 	}
// }

// game.run = function() {
// 	game.advanceTurn()
// 	.then(function(res) {
// 		if(game.status !== 'completed') {
// 			game.allocate(game.run)
// 	  	} else {
// 		  	console.log('Winner')
// 		  	game.getInfo(game.id)
// 		  	.then(function(res) {
// 		  		console.log('winning info', res)
// 		  	})  		
// 	  	}
// 	})
// }

//game.terminateMachine(game.id, machineId);