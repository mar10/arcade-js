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
        this.addObject(new WallObject({pg: pg}));
        // Outer polygon (CW)
        pg = new Polygon2([600, 200,
                           200, 10,
                           10, 180,
                           210, 470]).revert();
        this.addObject(new WallObject({pg: pg}));
        // Ball
        this.addObject(new Ball(
        		{pos: new Point2(150, 100),
        		 r:10,
        		 velocity: {dx:10, dy:0},
        		 color: "red"
        		 }));
        this.addObject(new Ball(
        		{pos: new Point2(500, 10),
        		 r:10,
        		 velocity: {dx:0, dy:5},
        		 color: "green"
        		 }));
        this.addObject(new Ball(
        		{pos: new Point2(150, 150),
        		 r:10,
        		 velocity: {dx:3, dy:3},
        		 color: "blue"
        		 }));
        // Start render loop
        this.startLoop()
    },
//    beforeEvent: function(name, object, e){
//    	
//    },
//    afterEvent: function(name, object, e){
//    	
//    },
    onKeydown: function(e, key){
    	$("#keys").html("Keydown: key='"+this.key+"'; down:"+this.downKeyCodes)
    },
    onKeyup: function(e, key){
    	$("#keys").html("Keyup: key='"+this.key+"'; down:"+this.downKeyCodes)
    },
    onKeypressed: function(e){
    	$("#keys").html("Keypressed; down:"+this.downKeyCodes)
    },
    // --- end of class
    lastentry: undefined
});


/******************************************************************************/


var WallObject = Movable.extend({
    init: function(opts) {
		// Initialize this game object
        this._super("wall", null, opts);
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
    	// Check for wall collisions
		var c1 = new Circle2(this.pos, this.r);
    	var pgs = this.game.getObjectsByType("wall");
    	for(var i=0; i<pgs.length; i++) {
    		var pg = pgs[i];
    		var coll = pg.pg.intersectsCircle(c1, this.velocity);
    		if( coll && Math.abs(coll.t) <= 1  ){
//        		this.game.debug("ball %o vs. %o: %o", c1, pg, coll);
        		this.velocity = coll.velocityReflected;
        		this.pos = coll.centerReflected;
        		// stop on next frame
//		    	this.game.stopRequest = true;
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

