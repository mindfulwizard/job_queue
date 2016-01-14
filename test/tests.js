/**
 * Created by Yitzchak on 1/13/16.
 */

var should = require('should');
var assert = require('assert');

describe('Test Framework', function () {
    it('should have Mocha installed and running.', function () {
        assert.equal(true, true);
    })
    it('should have the should library installed.', function () {
        true.should.eql(true);
    })
});