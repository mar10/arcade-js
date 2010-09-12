/*******************************************************************************
 * jsRipOff.js
 * 
 * Main classes.
 * 
 */

var RipOffGame = ArcadeJS.extend({
    init: function(canvas, customOpts) {
		// Init ArcadeJS
		var opts = $.extend({
			name: "jsRipOff",
			fps: 30
		}, customOpts);
        this._super(canvas, opts);
        
        // Set the scene
        var obj;
        // Player tank
        obj = this.addObject(new Tank())

        // Canisters
        obj = this.addObject(new Canister({pos: new Point2(320, 240)}))
        obj = this.addObject(new Canister({pos: new Point2(300, 240)}))
        obj = this.addObject(new Canister({pos: new Point2(340, 240)}))
        obj = this.addObject(new Canister({pos: new Point2(320, 200)}))

        // --- Status data -----------------------------------------------------
        this.liveCount = 3;
        this.score = 0;
        this.shotTtl = 40;
        this.shotDelay = 250; // ms
        this.gracePeriod = 120; // frames

        // --- Cache sounds ----------------------------------------------------
        this.gunSound = new AudioJS("shot.wav");
        this.explosionSound = new AudioJS("damage.wav");
        // Start render loop
        this.startLoop()
    },
	preDraw: function(ctx){
    	ctx.save();
	    // Display score
    	ctx.font = "12px sans-serif";
    	ctx.fillText("Score: " + this.score, 10, 15);
//    	ctx.fillText(this.realFps.toFixed(1) + " fps", this.canvas.width-50, 15);
    	if(this.getActivity() === "over"){
    		ctx.font = "30px sans-serif";
    		ctx.strokeText("Game over (hit [F5])", 200, 200);
    	}
    	
	    // Draw lives
    	var live = new Polygon2([0, 5,
    	                         -3, -5,
    	                         3, -5]);
    	ctx.translate(10, 40);
    	for(var i=0; i<this.liveCount; i++){
    		ctx.strokePolygon2(live);
        	ctx.translate(10, 0);
    	}
    	// done
    	ctx.restore();
	},
    // --- end of class
    lastentry: undefined
});

/*----------------------------------------------------------------------------*/

var Bullet = Movable.extend({
    init: function(opts) {
        this._super("bullet", $.extend({
        	ttl: 20
        }, opts));
    },
    getBoundingRadius: function() {
    	return 0.1;
    },
    render: function(ctx) {
    	ctx.fillRect(0, 0, 3, 3);
    },
    // --- end of class
    lastentry: undefined
});

/*----------------------------------------------------------------------------*/

var Canister = Movable.extend({
    init: function(opts) {
        this._super("canister", $.extend({
        }, opts));
        this.pg = new Polygon2([ 0, 5,
   	                            -5, -5,
	                             5, -5]);
    },
    getBoundingRadius: function() {
    	return 0.1;
    },
    render: function(ctx) {
    	ctx.strokePolygon2(this.pg);
    },
    // --- end of class
    lastentry: undefined
});

/*----------------------------------------------------------------------------*/

var Bullet = Movable.extend({
    init: function(opts) {
        this._super("bullet", $.extend({
        	ttl: 20
        }, opts));
    },
    getBoundingRadius: function() {
    	return 0.1;
    },
    render: function(ctx) {
    	ctx.fillRect(0, 0, 3, 3);
    },
    // --- end of class
    lastentry: undefined
});


/*----------------------------------------------------------------------------*/

var pgTank1 = new Polygon2([
    -4,  3,
    -4,  6,
    -6,  3,
    -6, -5,
    -3, -3,
    -1,  8,
    -4,  3,
    -4,  0,
     0,  2,
     4,  0,
     4,  3,
     1,  8,
     3, -3,
     6, -5,
     6,  3,
     4,  6,
     4,  3
]);

var Tank = Movable.extend({
    init: function(opts) {
        this._super("tank", $.extend({
			debug: {showBCircle: true}
		}, opts));
        this.pg = pgTank1.copy().transform(LinaJS.scale33(2));
        this.pos = new Point2(100, 100);
    },
    getBoundingRadius: function() {
    	return 2 * 9;
    },
    step: function(p) {
    },
    render: function(ctx) {
		ctx.strokePolygon2(this.pg, false);
    },
    fire: function() {
    	var bullet = new Bullet({
    		pos: this.pos.copy(), 
    		velocity: LinaJS.polarToVec(this.orientation - 0.5 * Math.PI, 10), 
    		ttl: 50
    		});
    	this.game.addObject(bullet);
    },
    onKeydown: function(e, key) {
    	if(this.game.isKeyDown(32))
    		this.fire();
    },
    // --- end of class
    lastentry: undefined
});
