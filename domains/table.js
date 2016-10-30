/**
 * Created by Liberion on 2016/5/27.
 */

var Property = require('../consts/property');
var Types = require("../consts/types");
var Errors = require("../consts/errors");

function Table(id) {
    this.id = id;
    this.players = new Array(Property.GamePlayers);
    this.game = null;
    this.currentEventId = 0;

    this.masterInGame = null;

    /**
     * agent to sid
     * @param agent
     * @returns {number} -1 if no such agent
     */
    this.agentToSid = function (agent) {
        for (var i = 0; i < Property.GamePlayers; i ++) {
            if (this.players[i] == agent)
                return i;
        }
        return -1;
    };

    this.becomeEmpty = function () {
        for (var i = 0; i < Property.GamePlayers; i ++) {
            if (this.players[i])
                return false;
        }
        return true;
    };

    this.onNewEvent = function () {
        return this.currentEventId ++;
    };

    this.reset = function () {
        this.masterInGame = null;
        this.currentEventId = 0;
    };

    this.infoInHall = function () {
        var occupied = new Array(Property.GamePlayers);
        for (var i = 0; i < Property.GamePlayers; i ++)
            occupied[i] = this.players[i] ? true : false;
        return {
            id: this.id,
            seatsOccupied: occupied,
            inGame: this.game ? true : false
        };
    };

    this.infoInGame = function (agent) {

    };

    this.enterPlayer = function (agent, sid, err, callback) {
        if (sid >= Property.GamePlayers || sid < 0)
            return err(Errors.SEAT_NOT_FOUND);
        if (this.players[sid] != null)
            return err(Errors.ENTERING_SEAT_ALREADY_OCCUPIED);
        this.players[sid] = agent;
        callback();
    };

    this.leavePlayer = function (agent, err, callback) {
        var sid = this.agentToSid(agent);
        if (sid >= Property.GamePlayers || sid < 0)
            return err(Errors.SEAT_NOT_FOUND);
        if (this.game)
            return err(Errors.LEAVING_IN_GAME);
        this.players[sid] = null;
        if (this.becomeEmpty())
            this.reset();
        callback();
    };
}

module.exports = Table;
