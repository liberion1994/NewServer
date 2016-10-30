/**
 * Created by liboyuan on 16/8/11.
 */

var Types = require("../consts/types");
var User = require('../daos/userDAO');
var hall = require("./hall");
var Errors = require("../consts/errors");

var Agent = function (user, socket) {
    this.username = user.username;
    this.majorNumber = user.majorNumber;
    this.status = Types.AgentStatus.HALL;
    this.currentTable = null;
    this.statistics = user.statistics;
    this.lastChatTime = null;

    this.socket = socket;

    this.changeSocket = function (newSocket) {
        this.socket = newSocket;
        return this;
    };

    this.info = function () {
        return {
            username: this.username,
            status: this.status,
            majorNumber: this.majorNumber
        };
    };

    this.saveBack = function (done) {
        var conditions = { username: this.username }
            , update = { $set: { majorNumber: this.majorNumber, statistics: this.statistics }}
            , options = { multi: false };
        User.update(conditions, update, options, () => { done() });
    };

    this.enterTable = function (tid, sid, err, callback) {
        if (this.status != Types.AgentStatus.HALL)
            return err(Errors.ENTERING_TABLE_WHILE_IN_TABLE);
        var table = hall.findTableById(tid);
        if (table == null)
            return err(Errors.TABLE_NOT_FOUND);
        table.enterPlayer(this, sid, err,  () => {
            this.status = Types.AgentStatus.UNPREPARED;
            this.currentTable = table;
            callback();
        });
    };

    this.leaveTable = function (err, callback) {
        if (this.status == Types.AgentStatus.HALL)
            return err(Errors.LEAVING_TABLE_WHILE_NOT_IN_TABLE);
        var table = this.currentTable;
        if (table == null)
            return err(Errors.TABLE_NOT_FOUND);
        table.leavePlayer(this, err, () => {
            this.status = Types.AgentStatus.HALL;
            this.currentTable = null;
            //离开桌子后保存
            this.saveBack(callback);
        });
    };
};

module.exports = Agent;