var Promise = require('bluebird');
var request = require('request');
var host = 'http://job-queue-dev.elasticbeanstalk.com';

var jq = Object.create(null);
module.exports = jq;

jq.createGame = function() {
	return new Promise(function(resolve, reject) {
		request.post(host + '/games', {form: {}}, function(error, response, body) {
			if(error) {
				reject(error);
				return;
			}
			try {
				resolve(JSON.parse(body));
			} catch(e) {
				reject('invalid JSON response received');
			}
		});	
	})
};

jq.nextTurn = function(gameId) {
	return new Promise(function(resolve, reject) {
		request.get(host + '/games/' + gameId + '/next_turn', function(error, response, body) {
			if(error) {
				reject(error);
				return;
			}
			try {
				resolve(JSON.parse(body));
			} catch(e) {
				reject('Problem advancing turn');
			}
		});
	})
};

jq.newMachine = function(gameId) {
	return new Promise(function(resolve, reject) {
		request.post(host + '/games/' + gameId + '/machines', function(error, response, body) {
			if(error) {
				reject(error);
				return;
			}
			try {
				resolve(JSON.parse(body));
			} catch(e) {
				reject('Problem creating new machine');
			}
		});	
	})
};

jq.assign = function(gameId, machineId, jobIds) {
	console.log('heey');
	return new Promise(function(resolve, reject) {
		request.post(host + '/games/' + gameId + '/machines/' + machineId + '/job_assignments', {form: {job_ids: JSON.stringify(jobIds)}}, function(error, response, body) {
			if(error) {
				reject(error);
				return;
			}
			try {
				resolve(JSON.parse(body));
			} catch(e) {
				reject('Problem assigning machine');
			}
		});	
	})
};

jq.terminateMachine = function(gameId, machineId) {
	return new Promise(function(resolve, reject) {
		request.delete(host + '/games/' + gameId + '/machines/' + machineId, {form: {}}, function(error, response, body) {
			if(error) {
				reject(error);
				return;
			}
			try {
				resolve(JSON.parse(body));
			} catch(e) {
				reject('Problem terminating machine');
			}
		});	
	})
};

jq.getInfo = function(gameId) {
	return new Promise(function(resolve, reject) {
		request.get(host + '/games/' + gameId, function(error, response, body) {
			if(error) {
				reject(error);
				return;
			}
			try {
				resolve(JSON.parse(body));
			} catch(e) {
				reject('Problem retrieving info');
			}
		});	
	})
};

