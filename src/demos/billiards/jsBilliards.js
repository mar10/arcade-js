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

		// Official table size: big: 2840 × 1420 mm, middle: 2300x1150, small:2100x1050
		var tableWidth = 2.100,
			tableHeight = 0.5 * tableWidth, //1.420,
			vpPadding = 0.2, // add 20 cm around the table
			ballRadius = 0.5 * 0.0615, // diameter 61.5 mm
			quart = tableWidth / 4; 
		this.setViewport(-vpPadding, -vpPadding, 
				tableWidth + 2 * vpPadding, tableHeight + 2 * vpPadding)

		// --- Create objects and add them to the game -------------------------
		// Bounding polygon that defines the playing area of the table.
		// It is counter clock wise oriented, so the balls are reflected when 
		// they approach from the inside.
		var pg = new Polygon2([0,    0,
		                       tableWidth, 0,
		                       tableWidth, tableHeight,
							   0,    tableHeight]).makeCCW();
		var obj;
		obj = this.addObject(new WallObject({
			pg: pg,
			color: "green"
			}));

		// Three balls (diameter 61.5mm)
		obj = this.addObject(new Ball({
			id: "player", // We define a special ID for the playing ball
			r: ballRadius,
			pos: {x: quart, y: quart},
			color: "red"
			}));
		obj = this.addObject(new Ball({
			id: "ball_1",
			r: ballRadius,
			pos: {x: 3*quart, y: quart},
			color: "white"
			}));
		obj = this.addObject(new Ball({
			id: "ball_2",
			r: ballRadius,
			pos: {x: 3*quart, y: quart - 0.1825},
			color: "yellow"
			}));
		// --- Status data -----------------------------------------------------
		this.points = 0;
		this.hit1 = false;
		this.hit2 = false;
		this.velocityScale = 2.0; // Ratio from drag length to initial speed
		this.decellerationRate = 0.99;// * this.fps; // Decrease speed by 1% per second 
		this.minVelocity = 0.01; // Stop ball when slower than 1 cm/sec

		// --- Start the render loop -------------------------------------------
		this.startLoop();
	},
	postStep: function() {
		// Reset game activity to 'idle', if all balls have zero velocity
		if(this.isActivity("rolling")) {
			var isMoving = false;
			this.visitObjects(function(obj){
				//alert("this must be ArcadeGame: "+ this);
				if(obj.velocity.length() >= this.minVelocity){
					isMoving = true;
				}
			}, "ball");
			if(!isMoving) {
				this.hit1 = this.hit2 = false;
				this.setActivity("idle");
			}
		}
	},
	postDraw: function(ctx){
		// Draw drag-vector while aiming
//		if(this.isActivity("aiming")) {
//			ctx.strokeStyle = "blue";
//			ctx.moveTo(this.pos.x, this.pos.y);
//			ctx.lineTo(this.dragOffset.dx, this.dragOffset.dy);
//			ctx.stroke();
//			ctx.closePath();
//		}
		$("#frames").html("Frame #" + this.frameCount + ", FpS: " + this.realFps + " (want: " + this.fps + ")");
		$("#points").html("Points: " + this.points);
	},
	onSetActivity: function(target, activity, prevActivity) {
		this.debug("%s.setActivity '%s' -> '%s'", this, prevActivity, activity);
	},
	// --- end of class
	__lastentry: undefined
});


/*----------------------------------------------------------------------------*/


var WallObject = Movable.extend({
	init: function(opts) {
		// Initialize this game object
		this._super("wall", opts);
		// Copy selected options as object attributes
		ArcadeJS.extendAttributes(this, opts, "pg color");
	},
	render: function(ctx) {
		// Draw the list of lines to the canvas
		ctx.fillStyle = this.color;
		ctx.fillPolygon2(this.pg);
	},
	// --- end of class
	__lastentry: undefined
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
		this.circle = new Circle2({x:0, y:0}, this.r);
		this.hitByPlayer = false;
	},
	getBoundingCircle: function() {
		return new Circle2({x: this.pos.x, y: this.pos.y}, this.r);
	},
	step: function() {
		if(this.velocity.isNull()){
			return;
		}
		var game = this.game;
		// Get 1% slower with every step
//		this.game.debug("%s.step(): pos=%s, velocity = %s", this, this.pos, this.velocity);
		this.velocity.scale(this.game.decellerationRate);
		if(this.velocity.length() < this.game.minVelocity) {
			this.velocity.setNull();
			return;
		}
		var circle = this.getBoundingCircle();
		// Check for wall collisions
		var walls = game.getObjectsByType("wall");
		for(var i=0; i<walls.length; i++) {
			var other = walls[i];
			if(!game.preCheckCollision(this, other)){
				continue;
			}
			// Note: we pass a translation step as velocity and rescale the new
			// velocity afterwards.
			var coll = other.pg.intersectsCircle(circle, this.translationStep);
			if( coll && Math.abs(coll.t) <= 1  ){
				this.velocity = coll.velocityReflected.scale(1 / this.game.frameDuration);
				this.pos = coll.centerReflected;
			}
		}
		// Check for ball-ball collisions
		var balls = this.game.getObjectsByType("ball");
		for(var i=0; i<balls.length; i++) {
			var other = balls[i];
			if(!game.preCheckCollision(this, other)){
				continue;
			}
//			var circle2 = new Circle2(other.pos, other.r).transform(other.mc2wc);
			var circle2 = other.getBoundingCircle();
			var coll = circle.intersectsCircle(circle2, this.velocity, other.velocity);
			if(!coll){
				continue;
			}
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
		}
	},
	render: function(ctx) {
		// Draw this ball
		ctx.fillStyle = this.opts.color;
		if(this.id == "player" && this.game.isActivity("rolling")){
			ctx.fillStyle = "darkred";
		}
		ctx.fillCircle2(this.circle);
		// Draw drag-vector while aiming
		if(this.id == "player" && this.game.isActivity("aiming")) {
			ctx.strokeStyle = "#FFEE5B";
			ctx.lineWidth = 2 * this.game.onePixelWC;
			ctx.moveTo(0, 0);
			ctx.lineTo(this.game.dragOffset.dx, this.game.dragOffset.dy);
			ctx.stroke();
			//ctx.closePath();
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
		this.game.debug("dragOffset:" + dragOffset);
		this.velocity = dragOffset.copy().revert().scale(this.game.velocityScale);
		this.game.debug("velocity:" + this.velocity);
		this.game.setActivity("rolling");
	},
	/**
	 * Simulate red ball drag'n'drop from touch events.
	 */
	onTouchevent: function(e, orgEvent) {
		if(this.id != "player" || this.game.isActivity("rolling")){
			return;
		}
		var touch = null;
		if(this.touchDownId){
			touch = _getTouchWithId(orgEvent.changedTouches, this.touchDownId);
		}else if(e.type == "touchstart" && orgEvent.changedTouches.length == 1) {
			touch =  orgEvent.changedTouches[0];
		}
		// Ignore event, if touch identifier is different from start event
		if(!touch){
			return;
		}
		// Otherwise, prevent default handling
		orgEvent.preventDefault();

		var touchPos = new Point2(
			touch.pageX - this.game.canvas.offsetLeft,
			touch.pageY - this.game.canvas.offsetTop).transform(this.game.cc2wc);;

		switch (e.type) {
		case "touchstart":
			this.game.dragOffset = new Vec2(0, 0);
			this.touchDownId = touch.identifier;
			this.game.setActivity("aiming");
			break;
		case "touchmove":
			// Drag vector is always relative to controls center
			this.game.dragOffset = new Vec2(
					touchPos.x - this.pos.x,
					touchPos.y - this.pos.y);
//           	this.game.debug("- drag: " + this.game.dragOffset);
			break;
		case "touchend":
			this.velocity = this.game.dragOffset.copy().revert().scale(this.game.velocityScale);
			this.game.setActivity("rolling");
			// fall through
		case "touchcancel":
			this.touchDownId = null;
			break;
		}
	},

	// --- end of class
	__lastentry: undefined
});
