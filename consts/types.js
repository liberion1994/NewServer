/**
 * Created by liboyuan on 16/9/9.
 */

exports.AgentStatus = {
    HALL: '大厅',
    UNPREPARED: '未准备',
    PREPARED: '已准备',
    IN_GAME: '游戏中',
    OBSERVING: '观战中'
};

exports.GameStatus = {
    OFFER_MAJOR_AMOUNT  : 1,
    CHOOSE_MAJOR_COLOR  : 2,
    RESERVE_CARDS       : 3,
    CHOOSE_A_COLOR      : 4,
    PLAY_CARDS          : 5
};

exports.AgentCommandType = {
    LeftTable:  0,
    EnterTable: 1,
    LeaveTable: 2,
    Prepare:    3,
    UnPrepare:  4,
    InGame:     5,
    Disconnect: 6
};