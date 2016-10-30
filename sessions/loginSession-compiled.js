'use strict';

/**
 * Created by liboyuan on 2016/10/15.
 */

var cipher = require('../utils/cipher');

module.exports = {

    sessions: {},

    createSession: function createSession(username, password) {
        var time = new Date().getTime();
        var target = cipher.cipher(username + time + password);
        this.sessions[target] = { username: username };
        return target;
    },

    findUsernameBySession: function findUsernameBySession(session) {
        var res = this.sessions[session];
        if (res) return res.username;
        return null;
    }
};

//# sourceMappingURL=loginSession-compiled.js.map