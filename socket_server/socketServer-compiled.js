'use strict';

/**
 * Created by liboyuan on 2016/10/13.
 */

var io = require('socket.io')();
var ioReq = require("socket.io-request");
var RequestTypes = require('../consts/requestTypes');
var User = require('../daos/userDAO');
var sessionHandler = require("../sessions/loginSession");
var validator = require('../utils/validator');

io.on('connection', function (socket) {
    console.log('connect from ' + socket.id);

    ioReq(socket).response(RequestTypes.AUTH, function (req, res) {
        //TODO 添加agent
        console.log(req);
        switch (req.type) {
            case RequestTypes.AUTH_TYPES.AUTH_CODE:
                var username = sessionHandler.findUsernameBySession(req.authenticationCode);
                if (!username) {
                    res({ success: false, errorInfo: '登录已失效' });
                } else {
                    res({
                        success: true, username: username,
                        authenticationCode: req.authenticationCode
                    });
                }
                break;
            case RequestTypes.AUTH_TYPES.LOGIN:
                User.findOne({ username: req.username }, function (err, user) {
                    if (err) {
                        res({ success: false, errorInfo: '数据库内部错误' });
                    } else if (!user) {
                        res({ success: false, errorInfo: '找不到用户' });
                    } else if (user.password != req.password) {
                        res({ success: false, errorInfo: '密码错误' });
                    } else {
                        res({
                            success: true, username: req.username,
                            authenticationCode: sessionHandler.createSession(req.username, req.password)
                        });
                    }
                });
                break;
            case RequestTypes.AUTH_TYPES.REG_AND_LOGIN:
                var username = req.username;
                var password = req.password;
                if (!validator.isUsername(username)) {
                    res({ success: false, errorInfo: '用户名不符合规范:' + validator.usernameReg });
                } else if (!validator.isPassword(password)) {
                    res({ success: false, errorInfo: '密码不符合规范:' + validator.passwordReg });
                } else {
                    User.findOne({ username: username }, function (err, user) {
                        if (err) {
                            res({ success: false, errorInfo: '数据库内部错误' });
                        } else if (user) {
                            res({ success: false, errorInfo: '用户名已存在' });
                        } else {
                            new User({
                                username: username,
                                password: password
                            }).save();
                        }
                        res({
                            success: true, username: username,
                            authenticationCode: sessionHandler.createSession(username, password)
                        });
                    });
                }
                break;
            default:
                res({ success: false, errorInfo: '未知的验证方式' });
                break;
        }
    });

    // ioReq(socket).response()
});

module.exports = io;

//# sourceMappingURL=socketServer-compiled.js.map