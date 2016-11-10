var Player = cc.Class({
    ctor: function () {
        this.myCardNodes = {};//手牌node，key为牌值
        this.isDizhu = false;
        this.ready = false;
        this.myCards = [];//手牌数组
        this.selCards = {};
        this.preCards = {}; //上家出的牌
        this.nextCards = {}; //下家出的牌
        this.firstHand = true;
        this.lastCards = [];
        this.playCards = {};
    },

    addCard: function (cardNode) {
        var keys = Object.keys(this.myCardNodes);
        var value = this.myCards[keys.length];
        this.myCardNodes[value] = cardNode;
        cardNode.value = value;
        cardNode.on(cc.Node.EventType.TOUCH_END, this.onTouchCard, this);
        return value;
    },

    onTouchCard: function(event) {
        this.game.playSound('card/card_click');
        if (this.selCards[event.target.value] != null) {
            event.target.setPosition(event.target.x, event.target.y - 20);
            delete this.selCards[event.target.value];
        } else {
            event.target.setPosition(event.target.x, event.target.y + 20);
            this.selCards[event.target.value] = event.target;
        }
    },

    removeCard: function (cardNum) {
        this.myCardNodes[cardNum].off(cc.Node.EventType.TOUCH_END, this.onTouchCard, this);
        delete this.myCardNodes[cardNum];
    },

    setCards: function(cards) {
        this.myCards = cards;
    },

    addBackCards: function(cards) {
        for (var i = 0; i < cards.length; ++i) {
            this.myCards[17 + i] = cards[i];
        }

        this.isDizhu = true;
    },

    adjustCards: function () {
        var keys = Object.keys(this.myCardNodes);

        if (keys.length == 0) {
            return;
        }

        var canvasWidth = this.game.node.width;
        var canvasHeight = this.game.node.height;
        var cardWidth = this.myCardNodes[keys[0]].width;
        var cardHeight = this.myCardNodes[keys[0]].height;
        var total = this.isDizhu ? 20 : 17;
        var space = (canvasWidth - (cardWidth - canvasWidth / total)) / total;
        var posy = -canvasHeight / 2 + cardHeight / 2;
    
        for (var i = keys.length - 1; i >= 0; --i) {
            var card = this.myCardNodes[keys[i]];
            card.setScale(1, 1);
            var posx = -((keys.length - 1) * space) / 2 + (keys.length - i - 1) * space;
            card.setPosition(posx, posy);
        }
    },

    adjustSendCards: function() {
        var keys = Object.keys(this.playCards);

        if (keys.length == 0) {
            return;
        }

        var total = keys.length;
        var space = 35;
        var posx = -space * total / 2;
    
        for (var i = total - 1; i >= 0; --i) {
            var card = this.playCards[keys[i]];
            card.setScale(0.5, 0.5);
            card.setPosition(posx, 0);
            posx += space;
        }
    },

    initCardEvent: function() {
        for (var key in this.myCardNodes) {
            var card = this.myCardNodes[key];
            card.value = key;

            // card.on(cc.Node.EventType.TOUCH_START, function (event) {
            // }, this);

            // card.on(cc.Node.EventType.TOUCH_MOVE, function (event) {
            // }, this);

            // card.on(cc.Node.EventType.TOUCH_CANCEL, function (event) {
            // }, this);

            card.on(cc.Node.EventType.TOUCH_END, function(event) {
                console.log('touch end');
                if (this.selCards[event.target.value] != null) {
                    event.target.setPosition(event.target.x, event.target.y - 20);
                    delete this.selCards[event.target.value];
                } else {
                    event.target.setPosition(event.target.x, event.target.y + 20);
                    this.selCards[event.target.value] = event.target;
                }
            }, this);
        }
    },

    getSelCards: function() {
        var cards = [];

        for (var key in this.selCards) {
            cards[cards.length] = parseInt(key);
        }

        return cards;
    },

    sendCards: function(cards) {
        for (var i = 0; i < cards.length; ++i) {
            this.playCards[cards[i]] = this.myCardNodes[cards[i]];
            this.removeCard(cards[i]);
        }

        this.selCards = {};
        this.adjustSendCards();
        this.adjustCards();
    },

    hideSendCards: function() {
        for (var key in this.playCards) {
            this.game.cardPool.put(this.playCards[key]);
            delete this.playCards[key];
        }

        this.playCards = {};
    },

    showPreCards: function(cards) {
        if (cards.length > 0) {
            this.lastCards = cards;
        }

        this.showOtherCards(cards, this.preCards, -360, 185, 35);
    },

    hidePreCards: function() {
        this.hideOtherCards(this.preCards);
    },

    showNextCards: function(cards) {
        if (cards.length > 0) {
            this.lastCards = cards;
        }

        var space = 35;
        var x = 360 - space * (Math.min(cards.length, 7) - 1);
        this.showOtherCards(cards, this.nextCards, x, 185, space);
    },

    showOtherCards: function(cards, nodes, x, y, space) {
        var posx = x;
        var posy = y;
        var count = 0;

        for (var i = 0; i < cards.length; ++i) {
            var card = this.game.cardPool.get();
            nodes[cards[i]] = card;
            card.getComponent(cc.Sprite).spriteFrame
                = this.game.cardAtlas.getSpriteFrame('poke' + cards[i]);
            card.setScale(0.5, 0.5);
            card.setPosition(posx, posy);
            card.setLocalZOrder(cards[i]);
            this.game.node.addChild(card);
            posx += space;
            ++count;

            if (count > 6) {
                posy -= 40;
                posx = x;
                count = 0;
            }
        }
    },

    hideNextCards: function() {
        this.hideOtherCards(this.nextCards);
    },

    hideOtherCards: function(nodes) {
        for (var key in nodes) {
            this.game.cardPool.put(nodes[key]);
            delete nodes[key];
        }

        nodes = {};
    },

    reset: function() {
        this.hideSendCards();
        this.hidePreCards();
        this.hideNextCards();

        for (var key in this.myCardNodes) {
            this.game.cardPool.put(this.myCardNodes[key]);
            this.removeCard(key);
        }

        this.myCardNodes = {};
        this.myCards = [];
        this.isDizhu = false;
        this.ready = false;
        this.selCards = {};
    }
});

module.exports = Player;