var Promise = require('bluebird');
var jq = require('./wrappers');
var _ = require('lodash');
var game = Object.create(null);
game.currentJobs = [];

game.advanceTurn = function() {
    jq.nextTurn(game.id)
        .then(function(turnInfo) {
            if(turnInfo.status === 'completed') {
                console.log('Done!');
                console.log(turnInfo);
                jq.getInfo(game.id)
                    .then(function(finalInfo) {
                        console.log(finalInfo);
                    })
                return;
            }
            game.newJobs = turnInfo.jobs;
            game.currentTurn = turnInfo.current_turn;
            console.log(turnInfo.status);
            console.log('NEW TURN', game.currentTurn);
            console.log('jobs running', turnInfo.jobs_running)
            console.log('machines running', turnInfo.machines_running)
            game.checkMachineStatus();
        })
}

game.checkMachineStatus = function() {
    //return memory status of machines in format: {0: 'machine1', 1: 'machine2', 2: 'machine3'}, [61, 57, 59]
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
    //console.log('machines', machines);
    //console.log('availMemArray', availMemArray);
    game.currentJobsCopy = _.clone(game.currentJobs);
    return game.prep(machines, availMemArray);
}

game.prep = function(machinesAvailable, availMemArray) {
    var memCopy = availMemArray.slice(0);
    var machineCopy = _.clone(machinesAvailable);

    //console.log('machinesAvailable', machinesAvailable)
    //console.log('newJobs', game.newJobs)
    function getMachine(memoryRequired, memArray) {
        //loop over memArray and return fullest machine with enough free space
        var smallest = -1;
        for(var j = 0; j < memArray.length; j++) {
            if(memArray[j] > memoryRequired && (memArray[j] < memArray[smallest] || smallest === -1)) {
                smallest = j;
            }
        }
        if(smallest === -1) {
            //if there's no machine with enough space, create new machine
            jq.newMachine(game.id)
                .then(function(newMachine) {
                    //memArray.push(64 - memoryRequired);
                    //machinesAvailable[memArray.length] = newMachine.id;
                    //return newMachine.id;
                    //add new machine and call prep again
                    game.currentJobs = game.currentJobsCopy;
                    machineCopy[memCopy.length] = newMachine.id;
                    memCopy.push(64);
                    game.prep(machineCopy, memCopy);
                })
        } else {
            //subtract required memory and return machine id
            memArray[smallest] = memArray[smallest] - memoryRequired;
            return machinesAvailable[smallest];
        }
    }

    function collectJobs(machineId, jobId) {
        //create hash table of [jobs] to assign per machine
        if(game.toAsync[machineId]) {
            game.toAsync[machineId].push(jobId);
        } else {
            var array = [];
            array.push(jobId);
            game.toAsync[machineId] = array;
        }
        //console.log('collectJobs', game.toAsync)
    }
    game.toAsync = Object.create(null);

    for(var i = 0; i < game.newJobs.length; i++) {
        var machineId = getMachine(game.newJobs[i].memory_required, availMemArray);
        if(!machineId) {
            return;
        } else {
            collectJobs(machineId, game.newJobs[i].id);
            game.newJobs[i].machineId = machineId;
            game.currentJobs.push(game.newJobs[i]);
        }
    }
    game.allocate(machinesAvailable, availMemArray);
}

game.allocate = function(machinesAvailable, availMemArray) {
    var arrayOfPromises = [];
    //assign jobs
    for(var prop in game.toAsync) {
        //console.log('prop', prop)
        //console.log('jobID array', game.toAsync[prop])
        arrayOfPromises.push(
            //async, returns promise
            jq.assign(game.id, prop, game.toAsync[prop])
        );
    }

    //delete machines with full 64 gb mem
    for(var j = 0; j < availMemArray.length; j++) {
        if (availMemArray[j] === 64) {
            arrayOfPromises.push(
                //async, returns promise
                jq.terminateMachine(game.id, machinesAvailable[i])
            );
        }
    }
    Promise.all(arrayOfPromises)
        .then(function(arrayOfResults) {
            //console.log('results', arrayOfResults)
            game.advanceTurn();
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