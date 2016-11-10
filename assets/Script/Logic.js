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

var Logic = cc.Class({
    ctor: function() {       
    },

    isValid: function(cards, lastCards, first) {
        var total = cards.length;

        if ((total == 0) && !first) {
            return true;
        }

        var myKind = this.getCardKind(cards);
        console.log("牌型：" + myKind.kind);

        if (myKind.kind == CT_ERROR) {
            return false;
        }

        if (first) {
            return true;
        }

        var lastKind = this.getCardKind(lastCards);
        return this.compareCards(myKind.kind, lastKind.kind, myKind.cards
            , lastKind.cards, total, lastCards.length);
    },

    getCardColor: function(card) {
        return card % 4;
    },

    getCardValue: function(card) {
        return Math.floor(card / 4 + 3);
    },

    getCardLogicValue: function(card) {
        var color = this.getCardColor(card);
        var value = this.getCardValue(card);

        //大小鬼
        if (value > 15) {
            value += color;
        }

        return value;
    },

    getCardKind: function(cards) {
        var n = cards.length;

        if (n == 0) {
            return {'kind' : CT_ERROR};
        }

        if ((n == 2) && (cards[0] == 52) && (cards[1] == 53)) {
            return {'kind' : CT_MISSILE_CARD};
        }

        var cardType = this.analyzeCards(cards);
        var kind = this.judgeFour(cardType, n);

        if (kind != null) {
            return {'kind' : kind, 'cards' : cardType};
        }

        kind = this.judgeThree(cardType, n);

        if (kind != null) {
            return {'kind' : kind, 'cards' : cardType};
        }

        kind = this.judgeDouble(cardType, n);
        
        if (kind != null) {
            return {'kind' : kind, 'cards' : cardType};
        }

        kind = this.judgeSingle(cardType, n);
        
        if (kind != null) {
            return {'kind' : kind, 'cards' : cardType};
        }

        return {'kind' : CT_ERROR};
    },

    //返回值是牌型数组，0-single 1-double 2-three 4-four
    analyzeCards: function(cards) {
        var r = [[], [], [], []];
        var n = cards.length;

        for (var i = 0; i < n;) {
            var same = 1;
            var value = this.getCardLogicValue(cards[i]);

            for (var j = i + 1; j < n; j++) {
                if (this.getCardLogicValue(cards[j]) != value) {
                    break;
                }

                same++;
            }

            //取牌型相应数组
            var cardType = r[same - 1];

            for (var k = 0; k < same; k++) {
                cardType[cardType.length] = cards[i + k];
            }

            i += same;
        }

        return r;
    },

    //判断是否有四张同牌
    judgeFour: function(cards, total) {
        var count = cards[3].length / 4;

        if (count < 1) {
            return null;
        }

        if (count > 1) {
            return CT_ERROR
        }

        if (total == 4) {
            return CT_BOMB_CARD;
        }

        if ((total == 6) && (cards[0].length == 2)) {
            return CT_FOUR_LINE_TAKE_ONE;
        }

        if ((total == 8) && (cards[1].length / 2 == 2)) {
            return CT_FOUR_LINE_TAKE_TWO;
        }

        return CT_ERROR;
    },

    //判断是否有三张同牌
    judgeThree: function(cards, total) {
        var count = cards[2].length / 3;

        if (count < 1) {
            return null;
        }

        if (count == 1) {
            if (total == 3) {
                return CT_THREE;
            }

            if (total == 4) {
                return CT_THREE_TAKE_ONE;
            }
            
            if ((total == 5) && (cards[1].length == 2)) {
                return CT_THREE_TAKE_TWO;
            }
        }

        var first = this.getCardLogicValue(cards[2][0]);

        //A以上的牌无法凑成3张飞机
        if ((first > 14) && (count > 1)) {
            return CT_ERROR;
        }

        //是否连牌判断
        for (var i = 1; i < count; i++) {
            if (this.getCardLogicValue(cards[2][i * 3]) != (first + i)) {
                return CT_ERROR;
            }
        }

        if ((count * 3) == total) {
            return CT_THREE_LINE;
        }

        if ((count * 4) == total) {
            return CT_THREE_LINE_TAKE_ONE;
        }

        if (((count * 5) == total) && (cards[1].length / 2 == count)) {
            return CT_THREE_LINE_TAKE_TWO;
        }

        return CT_ERROR;
    },

    judgeDouble: function(cards, total) {
        var count = cards[1].length / 2;

        if ((count * 2) != total) {
            return null;
        }

        if (count == 1) {
            return CT_DOUBLE;
        }

        if (count < 3) {
            return null;
        }

        var first = this.getCardLogicValue(cards[1][0]);

        //K以上的牌无法凑成2张飞机
        if (first > 13) {
            return CT_ERROR;
        }

        //是否连牌判断
        for (var i = 1; i < count; i++) {
            if (this.getCardLogicValue(cards[1][i * 2]) != (first + i)) {
                return CT_ERROR;
            }
        }

        return CT_DOUBLE_LINE;
    },

    judgeSingle: function(cards, total) {
        var count = cards[0].length;

        if (count != total) {
            return null;
        }

        if (count == 1) {
            return CT_SINGLE;
        }

        if (count < 5) {
            return null;
        }

        var first = this.getCardLogicValue(cards[0][0]);

        //J以上的牌无法凑成1张飞机
        if (first > 11) {
            return CT_ERROR;
        }

        //是否连牌判断
        for (var i = 1; i < count; i++) {
            if (this.getCardLogicValue(cards[0][i]) != (first + i)) {
                return CT_ERROR;
            }
        }

        return CT_SINGLE_LINE;
    },

    compareCards: function(myType, lastType, myKind, lastKind, myTotal, lastTotal) {
        //火箭判断
        if (myType == CT_MISSILE_CARD) {
            return true;
        }

        if (lastType == CT_MISSILE_CARD) {
            return false;
        }

        //炸弹判断
        if ((myType == CT_BOMB_CARD) && (lastType != CT_BOMB_CARD)) {
            return true;
        }

        if ((lastType == CT_BOMB_CARD) && (myType != CT_BOMB_CARD)) {
            return false;
        }

        //规则判断
        if ((myType != lastType) || (myTotal != lastTotal)) {
            return false;
        }

        for (var i = 3; i >=0; i--) {
            if (myKind[i].length == 0) {
                continue;
            }

            return myKind[i][0] > lastKind[i][0];
        }

        return false;
    }
});

var logic = new Logic();
module.exports = logic;