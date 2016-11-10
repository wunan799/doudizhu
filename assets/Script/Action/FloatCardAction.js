cc.Class({
    extends: cc.Component,

    properties: {
        // 主角跳跃高度
        jumpHeight: 0,
        // 主角跳跃持续时间
        jumpDuration: 0,
    },

    // use this for initialization
    onLoad: function () {
        // 初始化跳跃动作
        this.jumpAction = this.setJumpAction();
        
        function start(obj) {
            return function() {
                obj.node.runAction(obj.jumpAction);
            }
        }
        
        setTimeout(start(this), Math.random() * 2000);
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
    
    setJumpAction: function () {
        // 跳跃上升
        var jumpUp = cc.moveBy(this.jumpDuration, cc.p(0, this.jumpHeight));
        // 下落
        var jumpDown = cc.moveBy(this.jumpDuration, cc.p(0, -this.jumpHeight));
        // 不断重复
        return cc.repeatForever(cc.sequence(jumpUp, jumpDown));
    },
});
