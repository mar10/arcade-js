/*******************************************************************************
 * jsBilliards.js
 *
 * Main classes.
 *
 */

/*******************************************************************************
 * Class BilliardsGame
 */

var BilliardsGame = ArcadeJS.extend({
	init: function(canvas, customOpts) {
		// --- Init ArcadeJS ---------------------------------------------------
		var opts = $.extend({
			name: "jsBilliards",
			backgroundColor: "brown",
			fps: 30
		}, customOpts);
		this._super(canvas, opts);

		// Cache sounds
		this.clickSound = new AudioJS("click.wav");
		this.applauseSound = new AudioJS("applause.wav");

		// --- Create objects and add them to the game -------------------------
		// Bounding polygon that defines the playing area of the table.
		// It is counter clock wise oriented, so the balls are reflected when 
		// they approach from the inside.
		var pg = new Polygon2([ 10,  10,
							   630,  10,
							   630, 470,
								10, 470]).makeCCW();
		var obj;
		obj = this.addObject(new WallObject({
			pg: pg,
			color: "green"
			}));

		// Three balls
		obj = this.addObject(new Ball({
			id: "player", // We define a special ID for the playing ball
			r: 15,
			pos: {x: 150, y: 240},
			color: "#ff0000"
			}));
		obj = this.addObject(new Ball({
			id: "ball_1",
			r: 15,
			pos: {x: 490, y: 240},
			color: "#ffffff"
			}));
		obj = this.addObject(new Ball({
			id: "ball_2",
			r: 15,
			pos: {x: 490, y: 340},
			color: "#c0c0c0"
			}));
		// --- Status data -----------------------------------------------------
		this.points = 0;
		this.hit1 = false;
		this.hit2 = false;

		// --- Start the render loop -------------------------------------------
		this.startLoop()
	},
	postStep: function() {
		// Reset game activity to 'idle', if all balls have zero velocity
		if(this.isActivity("rolling")) {
			var isMoving = false;
			this.visitObjects(function(obj){
				if(obj.velocity.length() >= 0.1)
					isMoving = true;
			}, "ball");
			if(!isMoving) {
				this.hit1 = this.hit2 = false;
				this.setActivity("idle");
			}
		}
	},
	postDraw: function(ctx){
		$("#frames").html("Frame #" + this.frameCount + ", FpS: " + this.realFps + " (want: " + this.fps + ")");
		$("#points").html("Points: " + this.points);
	},
	onSetActivity: function(target, activity, prevActivity) {
		this.debug("%s.setActivity %s -> %s", this, prevActivity, activity);
	},
	// --- end of class
	lastentry: undefined
});


/*----------------------------------------------------------------------------*/


var WallObject = Movable.extend({
	init: function(opts) {
		// Initialize this game object
		this._super("wall", opts);
		// Copy selected options as object attributes
		ArcadeJS.extendAttributes(this, opts, "pg,color");
	},
	render: function(ctx) {
		// Draw the list of lines to the canvas
		ctx.fillStyle = this.color;
//		ArcadeJS.renderPg(ctx, this.pg, "solid");
		ctx.fillPolygon2(this.pg);
	},
	// --- end of class
	lastentry: undefined
});


/*----------------------------------------------------------------------------*/


var Ball = Movable.extend({
	init: function(opts) {
		opts = $.extend({
		}, opts);
		this._super("ball", opts);
		// Copy selected options as object attributes
		ArcadeJS.extendAttributes(this, opts, "r color");
		//
		this.hitByPlayer = false;
	},
	getBoundingRadius: function() {
		return this.r;
	},
	step: function() {
		if(this.velocity.isNull())
			return;
		var game = this.game;
		// Get 1% slower with every step
		this.velocity.scale(0.99);
		if(this.velocity.length() < 0.1) {
			this.velocity.setNull();
		}
		// Check for wall collisions
		var circle = new Circle2(this.pos, this.r);
		var walls = game.getObjectsByType("wall");
		for(var i=0; i<walls.length; i++) {
			var other = walls[i];
			if(!game.preCheckCollision(this, other))
				continue;
			var coll = other.pg.intersectsCircle(circle, this.velocity);
			if( coll && Math.abs(coll.t) <= 1  ){
				this.velocity = coll.velocityReflected;
				this.pos = coll.centerReflected;
			}
		}
		var balls = this.game.getObjectsByType("ball");
		for(var i=0; i<balls.length; i++) {
			var other = balls[i];
			if(!game.preCheckCollision(this, other))
				continue;
			var circle2 = new Circle2(other.pos, other.r);
			var coll = circle.intersectsCircle(circle2, this.velocity, other.velocity);
			if(!coll)
				continue;
//     		game.debug("ball %o vs. %o: %o", this, other, coll);
			this.velocity = coll.velocityReflected1;
			this.pos = coll.centerReflected1;
			other.velocity = coll.velocityReflected2;
			other.pos = coll.centerReflected2;
			this.game.clickSound.play();
			if(this.id == "player" || other.id == "player"){
				var hasPoint = this.game.hit1 && this.game.hit2;
				if(this.id == "ball_1" || other.id == "ball_1"){
					this.game.hit1 = true;
				} else if(this.id == "ball_2" || other.id == "ball_2") {
					this.game.hit2 = true;
				}
				if(!hasPoint && this.game.hit1 && this.game.hit2){
					this.game.applauseSound.play();
					this.game.points += 1;
				}
			}
			// stop on next frame
//	    	this.game.stopRequest = true;
		}
	},
	render: function(ctx) {
		// Draw this ball
		ctx.fillStyle = this.opts.color;
		if(this.id == "player" && this.game.isActivity("rolling")){
			ctx.fillStyle = "darkred";
		}
//		ArcadeJS.renderCircle(ctx, {x:0, y:0}, this.r, "solid");
		var circle = new Circle2({x:0, y:0}, this.r);
		ctx.fillCircle2(circle);
		// Draw drag-vector while aiming
		if(this.id == "player" && this.game.isActivity("aiming")) {
			ctx.strokeStyle = "yellow";
//			ArcadeJS.renderVector(ctx, this.game.dragOffset);
			ctx.moveTo(0, 0);
			ctx.lineTo(this.game.dragOffset.dx, this.game.dragOffset.dy);
			ctx.stroke();
			ctx.closePath();
		}
	},
	onDragstart: function(clickPos) {
		// We want drag'n'drop events for the red ball
		if(this.id == "player" && this.game.isActivity("idle")) {
			this.game.setActivity("aiming");
			return true;
		}
	},
	onDragcancel: function(dragOffset) {
		this.game.setActivity("idle");
	},
	onDrop: function(dragOffset) {
		//
		this.velocity = dragOffset.copy().revert().scale(.1);
		this.game.setActivity("rolling");
	},
	// --- end of class
	__lastentry: undefined
});