/**
 * Created by liboyuan on 2016/10/15.
 */

exports.CHANNEL_HALL = '大厅';

/**
 * @return {string}
 */
exports.tidToChannelName = function (tid) {
    return '第' + tid + '桌';
};