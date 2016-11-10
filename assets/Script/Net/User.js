// const TURN_MY = 0;
// const TURN_NEXT = 1;
// const TURN_PRE = 2;

var User = cc.Class({
    ctor: function() {
        this.wsUri = "ws://192.168.1.101:10010/socket";
        this.websocket = new WebSocket(this.wsUri);
        this.player = {};
        this.TURN_MY = 0;
        this.TURN_NEXT = 1;
        this.TURN_PRE = 2;
        this.sound = true;
        this.user = {};

        this.websocket.onopen = function (evt) {
        };

        this.websocket.onclose = function (evt) {
        };
            
        this.websocket.onmessage = function (evt) {
            console.log('收到消息：' + evt.data);
            var msg = JSON.parse(evt.data);
            var data = JSON.parse(msg.data);

            if (msg.type == 'login_r') {
                this.user = data;
                cc.director.loadScene('game');
            } else if (msg.type == 'join_table_r') {
                for (var i = 0; i < data.player.length; ++i) {
                    var p = data.player[i];

                    if (p.id == 0) {
                        continue;
                    }

                    if (p.id == this.user.id) {
                        this.user.index = i;
                    }

                    this.player[p.id] = p;
                    this.player[p.id].index = i;
                }

               this.canvas.onRestoreGame(data);
            } else if (msg.type == 'player_ready') {
                this.canvas.onPlayerReady(data);                
            } else if (msg.type == 'join_table') {
                this.player[data.uid] = data;
                this.canvas.onJoinTable(data);
            } else if (msg.type == "table_state") {
                this.canvas.onStateChange(data);
            } else if (msg.type == "call_score") {
                this.canvas.onCallScore(data);
            } else if (msg.type == "send_card") {
                this.canvas.onSendCard(data)
            }
        }.bind(this);
            
        this.websocket.onerror = function (evt) {
        };
    },

    login: function(account, room) {
        this.room = parseInt(room);
        var msg = {name : account};
        this.doSend(msg, 'login');
    },

    joinTable: function() {
        if (this.user == null) {
            return;
        }

        var msg = {uid : this.user.id, table : this.room, name : this.user.name};
        this.doSend(msg, 'join_table');
    },

    playerReady: function() {
        var msg = {uid : this.user.id, table : this.room};
        this.doSend(msg, "player_ready");
    },

    callScore: function(score) {
        var msg = {index : this.user.index, table : this.room, score : score};
        this.doSend(msg, "call_score");
    },

    sendCard: function(cards) {
        var msg = {index : this.user.index, table : this.room, cards : cards};
        this.doSend(msg, "send_card");
    },

    doSend: function(msg, type) {
        var pack = {type : type, data : JSON.stringify(msg)};
        this.websocket.send(JSON.stringify(pack));
    },

    getTurn: function(userId) {
        if (userId == this.user.id) {
            return this.TURN_MY; //自己
        } else if((this.user.index + 1) % 3 == this.player[userId].index) {
            return this.TURN_NEXT; //下家
        } else {
            return this.TURN_PRE; //上家
        }
    },

    isMyTurn: function(index) {
        return index == this.user.index;
    },

    isNextTurn: function(index) {
        return (this.user.index + 1) % 3 == index
    }
});

var user = new User();
module.exports = user;