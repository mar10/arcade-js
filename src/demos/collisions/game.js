/**
 * jsQuirks.js
 * 
 */


var DemoGame = ArcadeJS.extend({
    init: function(canvas, customOpts) {
		// Init ArcadeJS
		var opts = $.extend({
//			name: "jsQuirks",
//			fps: 30
		}, customOpts);
        this._super(canvas, opts);
        
        // Create an objects and add them to the game
        // Inner polygon (CCW)
        var pg = new Polygon2([300, 200,
                               200, 100,
                               100, 180,
                               210, 300]);
        this.addObject(new PgObject({pg: pg}));
        // Outer polygon (CW)
        pg = new Polygon2([600, 200,
                           200, 10,
                           10, 180,
                           210, 470]).revert();
        this.addObject(new PgObject({pg: pg}));
        // Ball
        this.addObject(new Ball(
        		{pos: new Point2(150, 100),
        		 r:10,
        		 move: {dx:10, dy:0},
        		 color: "red"
        		 }));
        this.addObject(new Ball(
        		{pos: new Point2(500, 10),
        		 r:10,
        		 move: {dx:0, dy:5},
        		 color: "green"
        		 }));
        this.addObject(new Ball(
        		{pos: new Point2(150, 150),
        		 r:10,
        		 move: {dx:3, dy:3},
        		 color: "blue"
        		 }));
        // Start render loop
        this.startLoop()
    },
    // --- end of class
    lastentry: undefined
});


/******************************************************************************/


var PgObject = Movable.extend({
    init: function(opts) {
		// Initialize this game object
        this._super("pg", null, opts);
        this.pg = opts.pg;
    },
    step: function() {
    },
    render: function(ctx) {
    	// Draw the list of lines to the canvas
    	ctx.strokeStyle = "#80ff80";
		ArcadeJS.renderPg(ctx, this.pg);
		// DEBUG: render nearest point on PG for current mouse 
		if(this.game.mousePos){
			var res = this.pg.nearestPt(this.game.mousePos);
			ArcadeJS.renderCircle(ctx, res.pt, 4);
		}
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
        this.r = opts.r;
//        this.circle = new Circle2(opts.pos, opts.r);
    },
    step: function() {
		var c1 = new Circle2(this.pos, this.r);
    	var pgs = this.game.getObjectsByType("pg");
    	for(var i=0; i<pgs.length; i++) {
    		var pg = pgs[i];
    		var coll = pg.pg.intersectsCircle(c1, this.move);
    		if( coll && Math.abs(coll.t) <= 1  ){
        		this.game.debug("ball %o vs. %o: %o", c1, pg, coll);
        		this.move = coll.velocityReflected;
        		this.pos = coll.centerReflected;
        		// stop on next frame
//		    	this.game.stopRequest = true;
        		//this.game.stopLoop();
    		}
    	}
    },
    render: function(ctx) {
		ctx.strokeStyle = "#ffffff";
		ctx.fillStyle = this.opts.color; 
		ArcadeJS.renderCircle(ctx, {x:0, y:0}, this.r, "solid");
	},
    getBoundingRadius: function() {
    	return this.r;
    },
    onMousemove: function(e) {
    	if( this.game.clickPos )
    		this.pos = this.game.mousPos();
//    	var ofs = this.game.mousePos.vectorTo(this.game.clickPos);
//		this.game.debug("mousemove: %o, %o", e, this.game.mousePos);
//		var res = this.pg.nearestPt(this.game.mousePos);
	//	this.game.debug("%o -> %o, d=%s, t=%s, c=%s", this.game.mousePos, res.pt, res.d, res.t, res.isCorner);
	},
//    onMouseDown: function() {
//    	return this.r;
//    },
    // --- end of class
    lastentry: undefined
});

