var Promise = require('bluebird');
var jq = require('./wrappers');
var game = Object.create(null);
game.currentJobs = [];

//1. create game
//2. advance turn
//3. check if win -> exit if so
//4. get status of machines running jobs
//5. create/delete new machines if necessary
//6. allocate jobs to machines
//Repeat from step 2 until win

game.advanceTurn = function() {
    jq.nextTurn(game.id)
        .then(function(turnInfo) {
            if(turnInfo.status === 'winding_down') {
                console.log('Done!');
                console.log(turnInfo);
                return;
            }
            game.newJobs = turnInfo.jobs;
            game.currentTurn = turnInfo.current_turn;
            //console.log('current jobs', game.currentJobs)
            console.log('NEW TURN')
            console.log(turnInfo.status)
            console.log(turnInfo.current_turn)
            game.checkMachineStatus();
        })
}

game.checkMachineStatus = function() {
    var availMemArray = [];
    var machines = Object.create(null);
    var seen = [];

    function addProp(i) {
        machines[availMemArray.length] = game.currentJobs[i].machineId;
        availMemArray.push(64 - game.currentJobs[i].memory_required);
        seen.push(game.currentJobs[i].machineId);
    }

    for(var i = 0; i < game.currentJobs.length; i++) {
        for(var prop in machines) {
            if(seen.indexOf(game.currentJobs[i].machineId) === -1) {
                addProp(i);
            }
            if(game.currentJobs[i].machineId === machines[prop]) {
                availMemArray[prop] -= game.currentJobs[i].memory_required;
            }
        }
        if(!seen.length) {
            addProp(i);
        }
    }
    return game.allocate(machines, availMemArray);
}

game.allocate = function(machinesAvailable, availMemArray) {
    //console.log('machinesAvailable', machinesAvailable)
    //console.log('newJobs', game.newJobs)
    return Promise.all(function () {
        console.log('balling')
        var arrayOfPromises = [];
        for (var machine in machinesAvailable) {
            var jobIdArray = [];
            for (var i = 0; i < game.newJobs.length; i++) {
                if (machinesAvailable[machine] >= game.newJobs[i].memory_required) {
                    game.newJobs[i].machineId = machine;
                    game.currentJobs.push(game.newJobs[i]);
                    jobIdArray.push(game.newJobs[i].id);
                    game.newJobs.splice(i,1);
                } else {
                    break;
                }
            }
            arrayOfPromises.push(function () {
                //async, returns promise
                jq.assign(game.id, machine, jobIdArray)
            });
        }
        //delete machines with full 64 gb mem
        for (var machine in machinesAvailable) {
            if (machinesAvailable[machine] === 64) {
                arrayOfPromises.push(function () {
                    //async, returns promise
                    jq.terminateMachine(game.id, machine)
                });
            }
        }
        return arrayOfPromises;
    }())
        .then(function(arrayOfResults) {
            //if there are more jobs than machines, add more machines
            if(!game.currentJobs.length || game.newJobs.length) {
                if(!game.currentJobs.length && !game.newJobs.length) {game.advanceTurn()}
                console.log('currentJobs', game.currentJobs.length)
                console.log('newjobs', game.newJobs.length)
                jq.newMachine(game.id)
                    .then(function(newMachine) {
                        //console.log('newMachine response', newMachine)
                        var machinesAvailable = Object.create(null);
                        machinesAvailable[newMachine.id] = 64;
                        return game.allocate(machinesAvailable);
                    })
            } else {
                game.advanceTurn();
            }
        });
}

game.start = function() {
    jq.createGame()
        .then(function(gameState) {
            console.log('createGame response', gameState)
            game.id = gameState.id;
            game.advanceTurn();
        });
};

game.start();