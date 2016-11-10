var user = require('User');

cc.Class({
    extends: cc.Component,

    properties: {
        backAudio: {
            default: null,
            url: cc.AudioClip
        },
    },

    // use this for initialization
    onLoad: function () {
        cc.audioEngine.playEffect(this.backAudio, true);
        cc.director.preloadScene('game', function () {
            cc.log('Next scene preloaded');
        });
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },

    soundOnOff: function(event) {
        user.sound = !user.sound;

        if (user.sound) {
            cc.audioEngine.resumeAll();
        } else {
            cc.audioEngine.pauseAll();
        }
    },

    onStartClick: function(event) {
        var loginNode = this.node.getChildByName('spr_login');
        var account = cc.sys.localStorage.getItem('account');

        if (account != null) {
            loginNode.getChildByName('edit_account').getComponent(cc.EditBox).string = account;
        }

        var room = cc.sys.localStorage.getItem('room');

        if (room != null) {
            loginNode.getChildByName('edit_room').getComponent(cc.EditBox).string = room;
        }

        loginNode.active = true;
    },

    onLoginClick: function(event) {
        var loginNode = this.node.getChildByName('spr_login');
        var account = loginNode.getChildByName('edit_account').getComponent(cc.EditBox).string;
        var room = loginNode.getChildByName('edit_room').getComponent(cc.EditBox).string;
        cc.sys.localStorage.setItem('account', account);
        cc.sys.localStorage.setItem('room', room);
        user.login(account, room);
    }
});