var request = require('request');
var host = 'http://job-queue-dev.elasticbeanstalk.com';
module.exports = jq;

var jq = Object.create(null);

jq.createGame = function() {
	request.post(host + '/games', {form: {}},
		function(error, response, body) {
			if(!error) {
				return JSON.parse(body);
			} else {
				return 'Could not create game.'
			}
		}
	);
};

jq.getInfo = function(gameId) {
	request.get(host + '/games/' + gameId,
		function(error, response, body) {
			return JSON.parse(body);
		}
	);
};

jq.advanceTurn = function(gameId) {
	request.get(host + '/games/' + gameId + '/next_turn',
		function(error, response, body) {
			return JSON.parse(body);
		}
	);
};

jq.newMachine = function(gameId) {
	request.post(host + '/games/' + gameId + '/machines', {form: {}},
		function(error, response, body) {
			return JSON.parse(body);
		}
	);
};

jq.terminateMachine = function(gameId, machineId) {
	request.delete(host + '/games/' + gameId + '/machines/' + machineId, {form: {}},
		function(error, response, body) {
			return JSON.parse(body);
		}
	);
};

jq.assign = function(gameId, machineId, jobIds) {
	request.post(host + '/games/' + gameId + '/machines/' + machineId + '/job_assignments', {{ job_ids: JSON.stringify(jobIds) }},
		function(error, response, body) {
			return JSON.parse(body);
		}
	);	
};




