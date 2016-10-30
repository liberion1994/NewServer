/**
 * Created by liboyuan on 16/8/11.
 */

var Table = require('./table');
var Property = require("../consts/property");

var hall = {
    tables: [],
    eventId: 0
};

hall.findTableById = function (id) {
    var len = hall.tables.length;
    for (var i = 0; i < len; i ++) {
        if (hall.tables[i].id == id)
            return hall.tables[i];
    }
    return null;
};

hall.getInfo = function () {
    return {
        eventId: hall.eventId,
        tables: hall.getAllTablesInfo()
    }
};

hall.getAllTablesInfo = function () {
    var ret = [];
    var len = hall.tables.length;
    for (var i = 0; i < len; i ++)
        ret.push(hall.tables[i].infoInHall());
    return ret;
};

hall.getAllTables = function () {
    return hall.tables;
};

hall.init = function () {
    for (var i = 0; i < Property.TableSum; i ++)
        hall.tables.push(new Table(i + 1));
};

module.exports = hall;