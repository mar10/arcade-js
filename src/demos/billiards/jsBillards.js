/*******************************************************************************
 * jsRipOff.js
 * 
 * Main classes.
 * 
 */

/*******************************************************************************
 * Class Bullet
 */

var BillardsGame = ArcadeJS.extend({
    init: function(canvas, customOpts) {
		// Init ArcadeJS
		var opts = $.extend({
			name: "jsBillards",
			fps: 30
		}, customOpts);
        this._super(canvas, opts);
        
        // Set the scene
        var obj;

        obj = this.addObject(new Ball({
        	pos: {x: 20, y: 200},
        	color: "#0000ff"
        }));
        obj = this.addObject(new Ball({
        	pos: {x: 200, y: 200},
        	color: "#ff0000"
        }));
        obj = this.addObject(new Ball({
        	pos: {x: 200, y: 20},
        	color: "#00ff00"
        }));
        // Cache sounds
        this.clickSound = new AudioJS("click.wav");
        // Start render loop
        this.startLoop()
    },
    // --- end of class
    lastentry: undefined
});


/******************************************************************************/


var Ball = Movable.extend({
    init: function(opts) {
		opts = $.extend({
		}, opts);
        this._super("ball", null, opts);
        this.r = 10;
    },
    toString: function() {
        return "Ball(" + this.id + ")";
    },
    step: function() {
    	var balls = this.game.getObjectsByType("ball");
		var c1 = {
    			x: this.pos.x,
    			y: this.pos.y,
    			vx: this.velocity.dx,
    			vy: this.velocity.dy,
    			r: this.r
    		};
    	for(var i=0; i<balls.length; i++) {
    		var b = balls[i];
    		if( b === this )
    			continue;
    		var c2 = {
        			x: b.pos.x,
        			y: b.pos.y,
        			vx: b.velocity.dx,
        			vy: b.velocity.dy,
        			r: b.getBoundingRadius()
        		};
    		var coll = LinaJS.intersectMovingCircles(c1, c2, 5);
//        		this.game.debug("rocket %o vs. %o: %o", c1, c2, coll);
    		if( coll && Math.abs(coll.t) <= 1  ){
        		this.game.debug("ball %o vs. %o: %o", c1, c2, coll);
        		this.game.stopLoop();
    		}
    	}
    },
    render: function(ctx) {
		ctx.strokeStyle = "#ffffff";
		ctx.fillStyle = this.opts.color; 
		ArcadeJS.renderCircle(ctx, this.pos, this.r, "solid");
	},
    getBoundingRadius: function() {
    	return this.r;
    },
//    onMouseDown: function() {
//    	return this.r;
//    },
    // --- end of class
    lastentry: undefined
});
