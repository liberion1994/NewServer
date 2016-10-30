/**
 * Created by liboyuan on 2016/10/13.
 */

var io = require('socket.io')();
var ioReq = require("socket.io-request");
var RequestTypes = require('../consts/requestTypes');
var User = require('../daos/userDAO');
var sessionHandler = require("../sessions/loginSession");
var validator = require('../utils/validator');
var hall = require('../domains/hall');
var Agent = require('../domains/agent');
var Channels = require('../consts/channels');
var Errors = require('../consts/errors');
var Properties = require('../consts/property');
var MessageTypes = require('../consts/messageTypes');
var Types = require('../consts/types');

var sockets = {};

function auth_done(user, authenticationCode, res, socket) {
    if (sockets[user.username]) {
        var prevSocket = sockets[user.username];
        socket.agent = prevSocket.agent.changeSocket(socket);
        socket.inheritChannels(prevSocket);
        //TODO 通知前面的socket下线，现在是直接断开毫无通知，有点不友好
        prevSocket.leaveAllChannels();
        prevSocket.agent = null;
        prevSocket.disconnect();

    } else {
        //TODO 这里还需要判断，是否存在该user的agent
        socket.agent = new Agent(user, socket);
        /**
         * 只加入大厅channel
         */
        socket.enterChannel(Channels.CHANNEL_HALL);
    }
    sockets[user.username] = socket;

    res({success: true, agent: socket.agent.info(), authenticationCode: authenticationCode});
}

function prepareSocket(socket) {
    socket.channels = [];
    socket.enterChannel = function (channelName) {
        this.channels.push(channelName);
        this.join(channelName);
    };
    socket.leaveChannel = function (channelName) {
        this.leave(channelName);
        for (var i = 0; i < this.channels.length; i ++) {
            if (this.channels[i] == channelName) {
                console.log('leave');
                this.channels.splice(i, 1);
                break;
            }
        }
    };
    socket.leaveAllChannels = function () {
        for (var i = 0; i < this.channels.length; i ++) {
            this.leave(this.channels[i]);
        }
        this.channels = [];
    };
    socket.inheritChannels = function (prevSocket) {
        for (var i = 0; i < prevSocket.channels.length; i ++) {
            this.enterChannel(prevSocket.channels[i]);
        }
    };

    socket.isInChannel = function (channelName) {
        for (var i = 0; i < this.channels.length; i ++) {
            if (this.channels[i] == channelName) {
                return true;
            }
        }
        return false;
    }
}


io.on('connection', (socket) => {

    console.log('connect from ' + socket.id);
    prepareSocket(socket);

    ioReq(socket).response(RequestTypes.AUTH, (req, res) => {
        console.log('AUTH', req);
        switch (req.type) {
            case RequestTypes.AUTH_TYPES.AUTH_CODE:
                var username = sessionHandler.findUsernameBySession(req.authenticationCode);
                if (!username) {
                    res({success: false, errorCode: Errors.WRONG_SESSION_ID});
                } else {
                    User.findOne({username: username}, (err, user) => {
                        if (err) {
                            res({success: false, errorCode: Errors.DATABASE_FAIL});
                        } else if (!user) {
                            res({success: false, errorCode: Errors.NO_USERS_FOUND});
                        } else {
                            auth_done(user, req.authenticationCode, res, socket);
                        }
                    });

                }
                break;
            case RequestTypes.AUTH_TYPES.LOGIN:
                User.findOne({username: req.username}, (err, user) => {
                    if (err) {
                        res({success: false, errorCode: Errors.DATABASE_FAIL});
                    } else if (!user) {
                        res({success: false, errorCode: Errors.NO_USERS_FOUND});
                    } else if (user.password != req.password) {
                        res({success: false, errorCode: Errors.WRONG_PASSWORD});
                    } else {
                        auth_done(user, sessionHandler.createSession(req.username, req.password), res, socket);
                    }
                });
                break;
            case RequestTypes.AUTH_TYPES.REG_AND_LOGIN:
                var username = req.username;
                var password = req.password;
                if (!validator.isUsername(username)) {
                    res({success: false, errorCode: Errors.INVALID_USERNAME});
                } else if (!validator.isPassword(password)) {
                    res({success: false, errorCode: Errors.INVALID_PASSWORD});
                } else {
                    User.findOne({username: username}, function (err, user) {
                        if (err) {
                            res({success: false, errorCode: Errors.DATABASE_FAIL});
                        } else if (user) {
                            res({success: false, errorCode: Errors.USER_ALREADY_EXIST});
                        } else {
                            var newUser = new User({
                                username: username,
                                password: password
                            }).save();
                            auth_done(newUser, sessionHandler.createSession(username, password), res, socket);
                        }
                    });
                }
                break;
            default:
                res({success: false, errorCode: Errors.UNKNOWN_AUTH_TYPE});
                break;
        }
    });

    ioReq(socket).response(RequestTypes.GET_TABLES, (req, res) => {
        console.log('GET_TABLES', req);
        if (!socket.agent) {
            res({success: false, errorCode: Errors.NOT_AUTHENTICATED});
        } else {
            res({success: true, content: hall.getInfo()});
        }
    });

    ioReq(socket).response(RequestTypes.GET_GAME, (req, res) => {
        console.log('GET_GAME', req);
        if (!socket.agent) {
            res({success: false, errorCode: Errors.NOT_AUTHENTICATED});
        } else {
            //TODO 这里要判断是否在游戏中，然后返回桌子信息
            res({success: true, content: null});
        }
    });

    ioReq(socket).response(RequestTypes.CHAT, (req, res) => {
        console.log('CHAT', req);
        if (!socket.agent) {
            return res({success: false, errorCode: Errors.NOT_AUTHENTICATED});
        }
        var agent = socket.agent;
        var cur = new Date();
        if (agent.lastChatTime && cur - agent.lastChatTime < Properties.ChatMinInterval) {
            res({success: false, errorCode: Errors.SENDING_MESSAGE_TOO_FREQUENTLY});
        } else if (req.content.length > Properties.ChatContentLength) {
            res({success: false, errorCode: Errors.SENDING_MESSAGE_TOO_LONG});
        } else if (!socket.isInChannel(req.channelName)) {
            res({success: false, errorCode: Errors.SENDING_MESSAGE_ILLEGAL_CHANNEL});
        } else {
            agent.lastChatTime = cur;
            res({success: true});
            io.in(req.channelName).emit(MessageTypes.CHAT, {
                serial: req.channelName + cur.getTime(),
                from: agent.username,
                content: req.content,
                channelName: req.channelName
            });
        }
    });

    ioReq(socket).response(RequestTypes.ENTER_TABLE, (req, res) => {
        console.log('ENTER_TABLE', req);
        if (!socket.agent) {
            return res({success: false, errorCode: Errors.NOT_AUTHENTICATED});
        }
        var agent = socket.agent;
        agent.enterTable(req.tid, req.sid, (errorCode) => {
            res({success: false, errorCode: errorCode})
        }, ()=> {
            res({success: true});
            var tableChannel = Channels.tidToChannelName(req.tid);
            io.in(tableChannel).emit(MessageTypes.EVENT, {
                type: Types.AgentCommandType.EnterTable,
                serial: agent.currentTable.onNewEvent(),
                from: agent.username,
                content: {sid: req.sid},
                channelName: tableChannel
            });
            socket.enterChannel(tableChannel);
        });
    });

    ioReq(socket).response(RequestTypes.LEAVE_TABLE, (req, res) => {
        console.log('LEAVE_TABLE', req);
        if (!socket.agent) {
            return res({success: false, errorCode: Errors.NOT_AUTHENTICATED});
        }
        var agent = socket.agent;
        var table = agent.currentTable;
        var sid = -1;
        if (agent.currentTable)
            sid = agent.currentTable.agentToSid(agent);
        agent.leaveTable((errorCode) => {
            res({success: false, errorCode: errorCode})
        }, ()=> {
            res({success: true});
            var tableChannel = Channels.tidToChannelName(table.id);
            socket.leaveChannel(tableChannel);
            io.in(tableChannel).emit(MessageTypes.EVENT, {
                type: Types.AgentCommandType.LeaveTable,
                serial: table.onNewEvent(),
                from: agent.username,
                content: {sid: sid},
                channelName: tableChannel
            });
        });
    });

    //TODO disconnect以后需要做的事情：
    // 从sockets数组删除
    // 如果agent在大厅，就删掉agent；否则标记agent的socket为空，游戏结束后清理
});


module.exports = io;