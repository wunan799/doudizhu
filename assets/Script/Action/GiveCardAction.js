var Game = require('Game');

var GiveCardAction = cc.Class({
    ctor: function () {
        this.cardArray = {};
    },

    init: function (game) {
        this.game = game;
    },

    prepareCard: function () {
        var space = 5;
        var x = -space * this.game.cardCount / 2;
        
        for (var i = 0; i < this.game.cardCount; ++i) {
            var card = this.game.cardPool.get();
            
            if (card == null) {
                card = cc.instantiate(this.game.cardPrefab);
            }
            
            card.setScale(1, 1);
            card.setLocalZOrder(i);
            card.setPosition(cc.p(x, this.game.node.height / 2 - card.height / 2 - 100));
            card.getComponent(cc.Sprite).spriteFrame
                = this.game.cardAtlas.getSpriteFrame('backbig');
            x += space;
            this.cardArray[i] = card;
            this.game.node.addChild(card);
        }
        
        this.giveCard(this.game.cardCount - 1);
    },
    
    giveCard: function (cur) {
        if (cur < 3) {
            var leave = 3;
            var space = 5;
            var cardWidth = this.cardArray[0].width;
            var x = -cardWidth - space ;

            for (var i = 0; i < leave; ++i) {
                this.cardArray[i].setPosition(cc.p(x, this.cardArray[i].y));
                x += cardWidth + space;
            }

            return;
        }
        
        var card = this.cardArray[cur];
        
        if (card == null) {
            return;
        }

        var pos;
        
        if (cur % 3 == 0) {
            pos = cc.p(this.game.node.width / 2, card.y);
        } else if (cur % 3 == 1) {
            //pos = cc.p(-this.node.width / 2, card.y - 200);
            pos = cc.p(card.x, -this.game.node.height / 2 + card.height / 2);
        } else {
            pos = cc.p(-this.game.node.width / 2, card.y);
        }
        
        var finished = cc.callFunc(this.onFinishGive, this, cur);
        var action = cc.sequence(cc.spawn(cc.moveTo(0.05, pos)
            , cc.scaleTo(0.05, 0.3, 0.3)), finished);
        card.runAction(action);
    },

    onFinishGive: function (card, index) {
        if (index % 3 != 1) {
            this.game.cardPool.put(card);
            //target.destroy();
        } else {
            var value = this.game.player.addCard(card);
            card.setLocalZOrder(this.game.cardCount - value);
            card.getComponent(cc.Sprite).spriteFrame
                = this.game.cardAtlas.getSpriteFrame('poke' + value);
            this.game.player.adjustCards();
        }
        
        this.giveCard(index - 1);
    },

    showBackCard: function(cards) {
        for (var i = 0; i < cards.length; ++i) {
            var card = this.cardArray[i];
            card.getComponent(cc.Sprite).spriteFrame
                = this.game.cardAtlas.getSpriteFrame('poke' + cards[i]);
        }

        setTimeout(function() {
            this.onEndShowCard(cards);
        }.bind(this), 1500);
    },

    onEndShowCard: function(cards) {
        for (var i = 0; i < cards.length; ++i) {
            var pos = cc.p(0, this.game.node.height / 2);

            var finished = cc.callFunc(function(card, index) {
                if (this.game.player.isDizhu) {
                    var value = this.game.player.addCard(card);
                    card.setLocalZOrder(this.game.cardCount - value);
                    this.game.player.adjustCards(); 
                } else {
                    this.game.cardPool.put(card);
                }

                var back = this.game.node.getChildByName('spr_bg_top').getChildByName('card' + index);
                back.getComponent(cc.Sprite).spriteFrame 
                    = this.game.smallCardAtlas.getSpriteFrame('card' + cards[index]);
                back.active = true;
            }, this, i);

            var action = cc.sequence(cc.spawn(cc.moveTo(0.1, pos)
            , cc.scaleTo(0.1, 0.3, 0.3)), finished);
            this.cardArray[i].runAction(action);
        }
    }
});

module.exports = GiveCardAction;