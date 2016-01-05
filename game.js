var jq = require('jq');

var game = Object.create(jq);
game.id = null;
game.jobsArray = [];

game.startGame = function() {
	game.createGame()
	.then(function(res) {
		game.id = res.id;
	});
};

game.nextTurn = function() {
	game.advanceTurn(game.id)
	.then(function(res) {
		game.jobsArray = res.jobs;
	})
};

game.addMachine = function() {
	game.newMachine(game.id);
};

game.deleteMachine = function(machineId) {
	game.terminateMachine(game.id, machineId);
};

game.assignJobs = function(machineId, jobs) {
	game.assign(game.id, machineId, jobs);
};

game.play = function() {

};

game.play();


// watch memory, if jobs are queued spin up new machine when 64gb limit approaching
// if any delay, spin up new machine