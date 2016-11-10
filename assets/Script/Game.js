const STATE_WAITPLAYER = 1;
const STATE_ALLREADY = 2;
const STATE_GIVECARD = 3;
const STATE_CALL = 4;
const STATE_CALLEND = 5;
const STATE_PLAYING = 6;
const STATE_GAMEOVER = 7;

const CT_ERROR               = 0; //错误类型
const CT_SINGLE              = 1;       //单牌类型
const CT_DOUBLE              = 2;       //对牌类型
const CT_THREE               = 3;       //三条类型
const CT_THREE_TAKE_ONE      = 4;
const CT_THREE_TAKE_TWO      = 5;
const CT_SINGLE_LINE         = 6;       //单连类型
const CT_DOUBLE_LINE         = 7;       //对连类型
const CT_THREE_LINE          = 8;       //三连类型
const CT_THREE_LINE_TAKE_ONE = 9;       //三带一单
const CT_THREE_LINE_TAKE_TWO = 10;       //三带一对
const CT_FOUR_LINE_TAKE_ONE  = 11;       //四带两单
const CT_FOUR_LINE_TAKE_TWO  = 12;       //四带两对
const CT_BOMB_CARD           = 13;       //炸弹类型
const CT_MISSILE_CARD        = 14;       //火箭类型
const CT_PASS                = 15;

var Player = require('Player');
var GiveCardAction = require('GiveCardAction');
var user = require('User');
var logic = require('Logic');

cc.Class({
    extends: cc.Component,

    properties: {
        cardPrefab: {
            default: null,
            type: cc.Prefab
        },
        
        cardAtlas: {
            default: null,
            type: cc.SpriteAtlas
        },

        smallCardAtlas: {
            default: null,
            type: cc.SpriteAtlas
        },

        callAtlas: {
            default: null,
            type: cc.SpriteAtlas
        },

        sprAtlas: {
            default: null,
            type: cc.SpriteAtlas
        },

        scoreAtlas: {
            default: null,
            type: cc.SpriteAtlas
        },
        
        cardCount: 54
    },
    
    // use this for initialization
    onLoad: function () {
        this.loadSound();
        user.canvas = this;
        user.joinTable();
        this.timeId = 0;
        this.clock = 10;
        this.cardPool = new cc.NodePool();
        this.player = new Player();
        this.player.game = this;

        this.giveCardAction = new GiveCardAction();
        this.giveCardAction.init(this);
        
        for (var i = 0; i < this.cardCount; ++i) {
            var card = cc.instantiate(this.cardPrefab);
            this.cardPool.put(card);
        }

        this.node.getChildByName('account_spr_bg_account').setLocalZOrder(100);
        this.node.getChildByName('spr_effect_missile').setLocalZOrder(100);
        this.node.getChildByName('spr_effect_bomb').setLocalZOrder(100);
        this.node.getChildByName('spr_effect_plane').setLocalZOrder(100);
        this.node.getChildByName('spr_effect_dbline').setLocalZOrder(100);
        this.node.getChildByName('spr_effect_straight').setLocalZOrder(100);
        this.node.getChildByName('main_btn_ready').active = true;
        // this.test();
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
    
    onReadyClick: function (event) {
        var btnNode = event.target;
        // var canvasNode = btnNode.getParent();
        btnNode.active = false;
        user.playerReady();
    },

    onNoCallClick: function (event) {
        user.callScore(0);
    },

    onCallOneClick: function (event) {
        user.callScore(1);
    },

    onCallTwoClick: function (event) {
        user.callScore(2);
    },

    onCallThreeClick: function (event) {
        user.callScore(3);
    },

    onSendCardClick: function (event) {
        var cards = user.canvas.player.getSelCards();
        
        if (logic.isValid(cards, this.player.lastCards, this.player.firstHand)) {
            user.sendCard(cards);
        }
    },

    onPassClick: function (event) {
        user.sendCard([]);
    },

    onPlayerReady: function(ready) {
        if (ready.uid == 0) {
            return;
        }
        
        var node;
        var turn = user.getTurn(ready.uid);
        
        if (turn  == user.TURN_MY) {
            node = this.node.getChildByName('spr_head_0').getChildByName('spr_bg_speak');
        } else if (turn == user.TURN_NEXT) {
            node = this.node.getChildByName('spr_head_1').getChildByName('spr_bg_speak');
        } else {
            node = this.node.getChildByName('spr_head_2').getChildByName('spr_bg_speak');
        }

        node.active = true;
        var label = node.getChildByName('Label');
        label.getComponent(cc.Label).string = '准备';
        label.active = true;
    },

    onJoinTable: function(join) {
        if (join.uid == 0) {
            return;
        }

        var turn = user.getTurn(join.uid);
        var head;

        if (turn == user.TURN_NEXT) {
            head = this.node.getChildByName('spr_head_1');
        } else if (turn == user.TURN_PRE) {
            head = this.node.getChildByName('spr_head_2');
        } else {
            head = this.node.getChildByName('spr_head_0');
        }

        this.setLabelText('label_name', head, join.name);
        head.active = true;
    },

    onStateChange: function(state) {
        if (state.state == STATE_WAITPLAYER) {
            this.restart();
        } else if (state.state == STATE_ALLREADY) {
            for (var i = 0; i < 3; ++i) {
                this.node.getChildByName('spr_head_' + i)
                    .getChildByName('spr_bg_speak').active = false;
            }

            var label = this.node.getChildByName('label_start');
            label.active = true;
        } else if (state.state == STATE_GIVECARD) {
            var label = this.node.getChildByName('label_start');
            label.active = false;
            var cards = JSON.parse(state.data);
            this.player.setCards(cards);
            this.giveCardAction.prepareCard();
            this.playSound('card/card_deal');
        } else if (state.state == STATE_CALL) {
            var callState = JSON.parse(state.data);
            this.showClock(true, callState.index, state.clock);

            if (user.isMyTurn(callState.index)) {
                this.showCallBtn(true);
            }
        } else if (state.state == STATE_CALLEND) {
            this.showClock(false);
            this.onCallEnd(JSON.parse(state.data));
        } else if (state.state == STATE_PLAYING) {
            var playState = JSON.parse(state.data);
            this.showClock(true, playState.index, state.clock);

            if (user.isMyTurn(playState.index)) {
                this.player.hideSendCards();
                this.showPlayerBtn(true, playState.first);
                this.player.firstHand = playState.first;
            } else if (user.isNextTurn(playState.index)) {
                this.player.hideNextCards();
            } else {
                this.player.hidePreCards();
            }
        } else if (state.state == STATE_GAMEOVER) {
            this.showClock(false);
            this.showScore(true, JSON.parse(state.data));
        }
    },

    onRestoreGame: function(table) {
        if (table.state == STATE_WAITPLAYER) {
            for (var i = 0; i < table.player.length; ++i) {
                var p = table.player[i];
                this.onJoinTable({uid : p.id, name : p.name});

                if (p.status != 0) {
                    this.onPlayerReady({uid : p.id});
                }
            }
        }
    },

    onCallScore: function(call) {
        if (call.score == 0) {
            this.playSound('qdz/dz_bj_W');
        } else {
            this.playSound('qdz/dz_score' + call.score + '_W');
        }

        if (user.isMyTurn(call.index)) {
            this.showCallBtn(false);
            this.node.getChildByName('spr_call').getComponent(cc.Sprite).spriteFrame
                = this.callAtlas.getSpriteFrame('ttf_call_score_' + call.score);
        } else {
            var node;

            if (user.isNextTurn(call.index)) {
                node = this.node.getChildByName('spr_head_1').getChildByName('spr_bg_speak');
            } else {
                node = this.node.getChildByName('spr_head_2').getChildByName('spr_bg_speak');
            }

            node.active = true;
            var label = node.getChildByName('Label');
            var text = (call.score == 0) ? '不叫' : call.score + '分';
            label.getComponent(cc.Label).string = text;
            label.active = true;
        }
    },

    onCallEnd: function(end) {
        this.setLabelText('label_score', this.node.getChildByName('spr_bg_top'), end.score);
        this.node.getChildByName('spr_call').active = false;
        this.node.getChildByName('spr_head_1').getChildByName('spr_bg_speak').active = false;
        this.node.getChildByName('spr_head_2').getChildByName('spr_bg_speak').active = false;

        if (user.isMyTurn(end.banker)) {
            this.player.addBackCards(end.back_cards);
            this.node.getChildByName('spr_head_0').getComponent(cc.Sprite).spriteFrame
                = this.sprAtlas.getSpriteFrame('spr_head_LL');
        } else if (user.isNextTurn(end.banker)) {
            this.node.getChildByName('spr_head_1').getComponent(cc.Sprite).spriteFrame
                = this.sprAtlas.getSpriteFrame('spr_head_LL_1');
        } else {
            this.node.getChildByName('spr_head_2').getComponent(cc.Sprite).spriteFrame
                = this.sprAtlas.getSpriteFrame('spr_head_LL');
        }

        this.giveCardAction.showBackCard(end.back_cards);
        this.playSound('card/level_up');
    },

    onSendCard: function(send) {
        this.playSendSound(send);

        if (user.isMyTurn(send.index)) {
            this.showPlayerBtn(false);
            this.player.sendCards(send.cards);
            this.playEffect(send.kind);
        } else if (user.isNextTurn(send.index)) {
            this.player.showNextCards(send.cards);
        } else {
            this.player.showPreCards(send.cards);
        }
    },

    showCallBtn: function(show) {
        this.node.getChildByName('main_btn_score_0').active = show;
        this.node.getChildByName('main_btn_1').active = show;
        this.node.getChildByName('main_btn_2').active = show;
        this.node.getChildByName('main_btn_3').active = show;
    },

    showPlayerBtn: function(show, firstHand) {
        if (show && firstHand) {
            this.node.getChildByName('main_btn_send_card').active = show;
        } else {
            this.node.getChildByName('main_btn_send_card').active = show;
            this.node.getChildByName('main_btn_pass').active = show;
            this.node.getChildByName('main_btn_prompt').active = show;
        }
    },

    restart: function() {
        this.player.reset();
        this.showScore(false);
        this.showClock(false);
        this.node.getChildByName('spr_head_0').getComponent(cc.Sprite).spriteFrame
            = this.sprAtlas.getSpriteFrame('spr_head_FR');
        this.node.getChildByName('spr_head_1').getComponent(cc.Sprite).spriteFrame
            = this.sprAtlas.getSpriteFrame('spr_head_FR_1');
        this.node.getChildByName('spr_head_2').getComponent(cc.Sprite).spriteFrame
            = this.sprAtlas.getSpriteFrame('spr_head_FR');
        this.node.getChildByName('main_btn_ready').active = true;
    },

    showScore: function(show, score) {
        var node = this.node.getChildByName('account_spr_bg_account');

        if (show) {
            var title;
            var sprite;
            var myScore = Math.pow(2, score.bomb_multiple) * score.land_score;
            var sound;

            //地主胜利
            if (score.winner == score.banker) {
                title =  (this.player.isDizhu) ? 'account_ttf_win' : 'account_ttf_lose';
                sprite = (this.player.isDizhu) ? 'account_spr_dz_win' : 'account_spr_nm_lose';
                myScore = (this.player.isDizhu) ? myScore * 2 : -myScore;
                sound = (this.player.isDizhu) ? 'card/game_win' : 'card/game_lose';
            } else {
                title =  (this.player.isDizhu) ? 'account_ttf_lose' : 'account_ttf_win';
                sprite = (this.player.isDizhu) ? 'account_spr_dz_lose' : 'account_spr_nm_win';
                myScore = (this.player.isDizhu) ? -myScore * 2 : myScore;
                sound = (this.player.isDizhu) ? 'card/game_lose' : 'card/game_win';
            }

            this.playSound(sound);
            node.getChildByName('account_ttf_win').getComponent(cc.Sprite).spriteFrame
                    = this.scoreAtlas.getSpriteFrame(title);
            node.getChildByName('account_spr').getComponent(cc.Sprite).spriteFrame
                    = this.scoreAtlas.getSpriteFrame(sprite);
            this.setLabelText('label_multiple', node, score.bomb_multiple + 1);
            this.setLabelText('label_bomb', node, score.bomb_multiple);
            this.setLabelText('label_land_score', node, score.land_score);
            this.setLabelText('label_score', node, myScore);
            this.setLabelText('label_total', node, myScore);
        }

        node.active = show;
    },

    setLabelText: function(name, node, value) {
        var label = node.getChildByName(name).getComponent(cc.Label);
        label.string = value;
    },

    playEffect: function(kind) {
        var title;
        var sound;

        if (kind == CT_MISSILE_CARD) {
            title = 'spr_effect_missile';
            sound = 'card/card_rocket_sound';
        } else if (kind == CT_BOMB_CARD) {
            title = 'spr_effect_bomb';
            sound = 'card/card_bomb_sound';
        } else if (kind == CT_THREE_LINE) {
            title = 'spr_effect_plane';
            sound = 'card/card_plane_sound';
        } else if (kind == CT_THREE_LINE_TAKE_ONE) {
            title = 'spr_effect_plane';
            sound = 'card/card_plane_sound'
        } else if (kind == CT_THREE_LINE_TAKE_TWO) {
            title = 'spr_effect_plane';
        } else if (kind == CT_DOUBLE_LINE) {
            title = 'spr_effect_dbline';
       } else if (kind == CT_SINGLE_LINE) {
            title = 'spr_effect_straight';
        } else {
            return;
        }

        var node = this.node.getChildByName(title);
        node.active = true;

        if (kind != CT_SINGLE_LINE) {
            var anim = node.getComponent(cc.Animation);
            var finished = function() {
                anim.off('finished', finished, this);
                node.active = false;
            };

            anim.on('finished', finished, this);
            anim.play();
        } else {
            var spine = node.getComponent(sp.Skeleton);
            spine.setAnimation(0, 'animation', false);
            spine.setEndListener(function() {
                node.active = false;
            });
        }

        this.playSound(sound);
    },

    loadSound: function() {
        cc.loader.loadResAll("sound", function (err, auddios) {
            //cc.audioEngine.playEffect(audio, true);
            if (err != null) {
                console.log(err);
                return;
            }
        });
    },

    playSound: function(name) {
        if (!user.sound) {
            return;
        }

        if (name == null) {
            return;
        }

        cc.loader.loadRes('sound/' + name, function(err, audio) {
            if (err == null) {
                cc.audioEngine.playEffect(audio, false);
            }
        });
    },

    playSendSound: function(send) {
        if (send.kind != CT_PASS) {
            this.playSound('card/card_send_over');
        }

        var sound = 'card/';

        if (send.kind == CT_MISSILE_CARD) {
            sound += 'card_rocket_W';
        } else if (send.kind == CT_BOMB_CARD) {
            sound += 'card_bomb_W';
        } else if (send.kind == CT_THREE) {
            sound += send.first ? 'card_three_W' : 'card_dani_M_' + Math.floor(Math.random() * 10 % 3); 
        } else if (send.kind == CT_THREE_TAKE_ONE) {
            sound += send.first ? 'card_three_1_W' : 'card_dani_M_' + Math.floor(Math.random() * 10 % 3); 
        } else if (send.kind == CT_THREE_TAKE_TWO) {
            sound += send.first ? 'card_three_2_W' : 'card_dani_M_' + Math.floor(Math.random() * 10 % 3); 
        } else if ((send.kind == CT_THREE_LINE)
                || (send.kind == CT_THREE_LINE_TAKE_ONE)
                || (send.kind == CT_THREE_LINE_TAKE_TWO)) {
            sound += send.first ? 'card_plane_W' : 'card_dani_M_' + Math.floor(Math.random() * 10 % 3); 
        } else if (send.kind == CT_DOUBLE_LINE) {
            sound += send.first ? 'card_doubleline_W' : 'card_dani_M_' + Math.floor(Math.random() * 10 % 3); 
        } else if (send.kind == CT_SINGLE_LINE) {
            sound += send.first ? 'card_shunzi_W' : 'card_dani_M_' + Math.floor(Math.random() * 10 % 3); 
        } else if (send.kind == CT_DOUBLE) {
            sound += 'card_double_' + logic.getCardLogicValue(send.cards[0]) + '_W';
        } else if (send.kind == CT_SINGLE) {
            sound += 'card_single_' + logic.getCardLogicValue(send.cards[0]) + '_W';
        } else if (send.kind == CT_PASS) {
            sound += 'card_pass_W';
        }

        this.playSound(sound);
    },

    showClock: function(show, index, clock) {
        this.clock = clock + 1;
        var node = this.node.getChildByName('spr_clock');

        if (!show) {
            node.active = false;
            clearInterval(this.timeId);
            this.timeId = 0;
            return;
        }

        this.setLabelText('label_clock', node, this.clock);

        if (user.isMyTurn(index)) {
            node.setPosition(-380, 0);
        } else if (user.isNextTurn(index)) {
            node.setPosition(380, 205);
        } else {
            node.setPosition(-380, 205);
        }

        node.active = true;

        if (this.timeId == 0) {
            this.timeId = setInterval(function() {
                if (this.clock > 0) {
                    --this.clock;
                }

                this.setLabelText('label_clock', node, this.clock);
            }.bind(this), 1000);
        }
    },

    test: function() {
        this.node.getChildByName('main_btn_ready').active = false;
        this.player.setCards([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19]);
        this.giveCardAction.prepareCard();
        setTimeout(function() {
           this.player.addBackCards([51,52,53]);
           this.giveCardAction.showBackCard([51, 52, 53]);
           this.showPlayerBtn(true);
        }.bind(this), 5000);
    }
});
