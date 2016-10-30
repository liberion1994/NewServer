"use strict";

/**
 * Created by Liberion on 2016/5/27.
 */

var Property = require('../consts/property');
var Types = require("../consts/types");

function Table(id) {
    this.id = id;
    this.players = new Array(Property.GamePlayers);
    this.game = null;
    this.currentEventId = 0;

    this.masterInGame = null;

    this.infoInHall = function () {
        var agentsInfo = new Array(Property.GamePlayers);
        for (var i = 0; i < Property.GamePlayers; i++) {
            agentsInfo[i] = this.players[i] ? this.players[i].info() : null;
        }return {
            id: this.id,
            players: agentsInfo,
            inGame: this.game ? true : false
        };
    };
}

module.exports = Table;

//# sourceMappingURL=table-compiled.js.map