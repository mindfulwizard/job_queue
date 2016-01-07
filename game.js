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
		console.log('newMachine response', newMachine)
		game.workingMachinesArray.push(newMachine);
		game.allocate();
	})
}

game.advanceTurn = function() {
	jq.advanceTurn(game.id)
	.then(function(turnInfo) {
		console.log('advanceTurn response', turnInfo)
		game.status = turnInfo.status;
		game.latestJobsArray = turnInfo.jobs;
		game.currentTurn = turnInfo.current_turn;
	})
}

game.checkStatus = function() {
	var machineStatusArray = [];

	for(var i = 0; i < game.workingMachinesArray.length; i++) {
		var machine = game.workingMachinesArray[i];

		if(!machine.jobs) {
			console.log('YO');
			machineStatusArray.push({id: machine.id, availableMemory: 64});
			break;
		}

		for(var j = 0; j < machine.jobs.length; j++) {
			var mem = 0;
			if(game.currentTurn <= machine.jobs[j].turns) {
				mem += machine.jobs[j].memoryUsed;
				machineStatusArray.push({id: machine.id, availableMemory: 64 - mem});
			}
		}
	}
	return machineStatusArray;
}

game.allocate = function() {
	//need to delete machines
	var machineStatusArray = game.checkStatus();
	if(!machineStatusArray) {
		game.createNewMachine();
	}

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
			console.log('assign response', res)
		})
		//update workingMachinesArray
		for(var k = 0; k < game.workingMachinesArray.length; k++) {
			if(game.workingMachinesArray[k].id === machine.id) {
				game.workingMachinesArray[k].jobs = jobs;
			}	
		}
	}
};

game.run = function() {
	game.advanceTurn()
	if(game.status !== 'completed') {
		game.allocate()
		game.run()
  	} else {
	  	console.log('Winner')
	  	game.getInfo(game.id)
	  	.then(function(res) {
	  		console.log('winning info', res)
	  	})  		
  	}
}

game.start = function() {
	jq.createGame()
	.then(function(gameState) {
		console.log('createGame response', gameState)
		game.id = gameState.id;
		game.status = gameState.status;
		game.run();
	// 	return jq.advanceTurn(game.id);
	// })
	// .then(function(turnInfo) {
	// 	console.log('advanceTurn response', turnInfo)
	// 	game.latestJobsArray = turnInfo.jobs;
	// 	game.currentTurn = turnInfo.current_turn;
	// 	return jq.newMachine(game.id);
	// })
	// .then(function(newMachine) {
	// 	console.log('newMachine response', newMachine)
	// 	game.workingMachinesArray.push(newMachine);
	// 	game.allocate();
	// })
};

game.start();
//game.terminateMachine(game.id, machineId);