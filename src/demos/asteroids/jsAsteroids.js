/*******************************************************************************
 * jsAsteroids.js
 */

/*******************************************************************************
 * Class AsteroidsGame
 */

var AsteroidsGame = ArcadeJS.extend({
	init: function(canvas, customOpts) {
		// Init ArcadeJS
		var opts = $.extend({
			name: "jsAsteroids",
			fps: 30,
			debug: {
				showFps: true
			}
		}, customOpts);
		this._super(canvas, opts);

		// --- Status data -----------------------------------------------------
		this.liveCount = 3;
		this.level = 1;
		this.score = 0;
		this.shotDelay = 250; // ms
		this.gracePeriod = 3; // seconds

		// --- Cache sounds ----------------------------------------------------
		this.gunSound = new AudioJS(["fire.mp3", "fire.oga", "fire.wav"]);
		this.explosionSound = new AudioJS(["damage.mp3", "damage.oga"]);

		// Set the scene
		var obj;
		// Player rocket
		this.rocket = this.addObject(new Rocket())
		this._restartGame();

		// --- Start render loop -----------------------------------------------
		this.startLoop()
	},
	_restartGame: function(){
		this.setActivity("prepare");
		this.rocket.velocity.setNull();
		this.rocket.pos = new Point2(0.5 * this.canvas.width, 0.5 * this.canvas.height);
		var speed = 15 * (1.0 + (this.level - 1) * 0.3);
		var pt0 = new Point2(0, 0);
		for(var i=0; i<this.level; i++){
			this._makeAsteroid(3, pt0, new Vec2(LinaJS.random(-1, 1), LinaJS.random(-1, 1)).setLength(speed));
		}
		this.later(3, function(){
			this.setActivity("running");
		});
	},
	_makeAsteroid: function(size, pos, velocity){
		this.addObject(new Asteroid({
			size: size,
			pos: new Point2(pos.x + LinaJS.random(-10, 10), pos.y + LinaJS.random(-10, 10)),
			velocity: new Vec2(velocity.dx + LinaJS.random(-6, +6), velocity.dx + LinaJS.random(-6, +6)),
			rotationalSpeed: LinaJS.random(-60*LinaJS.DEG_TO_RAD, 60*LinaJS.DEG_TO_RAD),
			debug: {
//				showBCircle: true,
//				showVelocity: true,
//				velocityScale: 15.0
			}
		}));
	},
	preStep: function(){
		var hasAsteroids = this.getObjectsByType("asteroid").length > 0;
		if(!hasAsteroids){
			this.level += 1;
			this.score += 1000;
			this._restartGame();
			return;
		}
		// 
		var stick = this.stick,
			button = this.button,
			rocket = this.rocket;
		if(stick && button){
	        var dx = stick.getX();
	        if(Math.abs(dx) > 0.2){
	        	rocket.orientation += 3 * dx * LinaJS.DEG_TO_RAD;
	        }
	        var dy = stick.getX(); 
	        if(stick.getY() < -0.8){ // Up
	            var vAccel = LinaJS.polarToVec(this.rocket.orientation - 90*LinaJS.DEG_TO_RAD, 3);
	            this.rocket.velocity.add(vAccel).limit(300);
	            this.rocket.isThrust = true;
	        }
	        if(button.isDown()){
	            rocket.fire();
	        }
		}
	},
	preDraw: function(ctx){
		ctx.save();
		// Display score
		ctx.font = "12px sans-serif";
		ctx.fillScreenText("Score: " + this.score, 10, 15);
		if(this.isActivity("over")){
			ctx.font = "30px sans-serif";
			ctx.strokeScreenText("Game over (hit [F5])", 0, 0);
		}else if(this.isActivity("prepare")){
			// Doesn't work in chrome
			// http://code.google.com/p/chromium/issues/detail?id=44017
			ctx.font = "30px sans-serif";
			ctx.strokeScreenText("Level " + this.level, 0, 0);
		}
		ctx.font = "10px sans-serif";
		ctx.fillScreenText("Copyright (c) 2011 Martin Wendt - Made with ArcadeJS", 0, -1);
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


/* ****************************************************************************/


var Bullet = Movable.extend({
	init: function(opts) {
		opts = $.extend({
			
//			scale: 2,
//			ttl: 20,
		}, opts);
		this._super("bullet", opts);
		// die after 0.5 seconds
		this.later(0.8, function(){
			this.die();
		});
	},
	step: function() {
		var list = this.game.getObjectsByType("asteroid");
		for(var i=0; i<list.length; i++) {
			var obj = list[i];
			if(!this.game.preCheckCollision(this, obj))
				continue;
			// Pre-check is exact enough for our purpose...
			this.die();
			obj.hitBy(this);
			break;
		}
	},
	render: function(ctx) {
		ctx.strokeStyle = "white";
		ctx.beginPath();
		ctx.moveTo(-this.translationStep.dx, -this.translationStep.dy);
		ctx.lineTo(0, 0);
		ctx.stroke();
	},
	getBoundingCircle: function() {
		return new Circle2({x:this.pos.x, y:this.pos.y}, 0.1);
	},
	// --- end of class
	__lastentry: undefined
});


/*******************************************************************************
 * Class Rocket
 */
/** @class */
var Rocket = Movable.extend({
	init: function(opts) {
		opts = $.extend({
			id: "player1",
			velocity: new Vec2(0, 0),
			pos: new Point2(320, 200),
			clipModeX: "wrap",
			clipModeY: "wrap"
			}, opts);
		this._super("rocket", opts);
		this.pg = new Polygon2([0, 5,
								-4, -5,
								4, -5]);
		this.pg.transform(LinaJS.scale33(2, -2));

		this.pgThrust = new Polygon2([-4, -5,
									  -2, -7,
									  -1, -6,
									   0, -7,
									   1, -5,
									   2, -7,
									   3, -6,
									   4, -5
									  ]);
		this.pgThrust.transform(LinaJS.scale33(2, -2));
		this.isThrust = false;
		this.lastShotTime = 0;
	},
	getBoundingCircle: function() {
		return new Circle2({x:this.pos.x, y:this.pos.y}, 13);
	},
	step: function() {
		if(this.isActivity("grace") || this.game.isActivity("over")){
			return;
		}
		var list = this.game.getObjectsByType("asteroid");
		for(var i=0; i<list.length; i++) {
			var obj = list[i];
			if(!this.game.preCheckCollision(this, obj))
				continue;
			// Pre-check is exact enough for our purpose...
			this.game.debug("%s vs. %s", this, obj);
			obj.hitBy(this);
			this.game.explosionSound.play();
			this.game.liveCount -= 1;
			if(this.game.liveCount > 0){
				this.setActivity("grace");
				this.later(this.game.gracePeriod, function(){
					this.setActivity("idle");
				});
			} else {
				this.game.setActivity("over");
			}
		}
	},
	render: function(ctx) {
		ctx.strokeStyle = "white";
		ctx.strokePolygon2(this.pg);
		// Draw reflector shield in grace mode
		if(this.isActivity("grace")){
			var circle = new Circle2({x:0, y:0}, 13); //this.getBoundingCircle();
			circle.r += LinaJS.random(-2, +2);
			ctx.strokeStyle = "#88f";
			ctx.strokeCircle2(circle);
		}
		// Draw thrust fire
		if(this.isThrust){ // Up
			ctx.strokeStyle = "#f80";
			ctx.translate(LinaJS.random(-1, +1), LinaJS.random(-1, +1));
			ctx.strokePolygon2(this.pgThrust);
			this.isThrust = false;
		}
	},
	onKeydown: function(e, key) {
//    	this.game.debug("%s: '%s', %o", e.type, this.game.downKeyCodes);
		if(this.game.isKeyDown(32)){ // Space
			this.fire();
		}
		if(this.game.isKeyDown(37)){ // Left
			this.orientation -= 5 * LinaJS.DEG_TO_RAD;
		}else if(this.game.isKeyDown(39)){ // Right
			this.orientation += 5 * LinaJS.DEG_TO_RAD;
		}
		if(this.game.isKeyDown(38)){ // Up
			this.isThrust = true;
			var vAccel = LinaJS.polarToVec(this.orientation - 90*LinaJS.DEG_TO_RAD, 3);
			this.velocity.add(vAccel).limit(300);
			e.stopImmediatePropagation();
			e.preventDefault();
			return false;
		}
	},
//    onMousewheel: function(e, delta) {
//    	this.game.debug("onMousewheel: %o, %s", e, delta);
//    	this.rotationalSpeed += delta * LinaJS.DEG_TO_RAD;
//		e.stopImmediatePropagation();
//    },
	fire: function() {
		if(this.isActivity("grace") || this.game.isActivity("over")){
			return;
		}
		if((this.game.time - this.lastShotTime) < this.game.shotDelay ){
			return;
		}
		this.lastShotTime = this.game.time;
		var aim = LinaJS.polarToVec(this.orientation - 0.5 * Math.PI, 300);
		this.game.addObject(new Bullet({
			pos: this.pos,
			velocity: aim
			}));
		this.game.gunSound.play();
	},
	// --- end of class
	__lastentry: undefined
});

/*******************************************************************************
 * Class Asteroid
 */
var Asteroid = Movable.extend({
	init: function(opts) {
		opts = $.extend({
			clipModeX: "wrap",
			clipModeY: "wrap",
//			size: 3
			}, opts);
		this._super("asteroid", opts);
		// Copy selected options as object attributes
		ArcadeJS.extendAttributes(this, opts, "size");
		//this.scale = 2 * this.size;
		this.pg = new Polygon2([4, 0,
								2.5, 1.5,
								1.5, 3.5,
								-1.5, 2.5,
								-4, 0,
								-1.5, -3.5,
								2, -3.5
								]);
		this.pg.transform(LinaJS.scale33(2*this.size, -2*this.size));
	},
	getBoundingCircle: function() {
		return new Circle2({x:this.pos.x, y:this.pos.y}, 2*this.size * 4);
	},
	render: function(ctx) {
		ctx.strokeStyle = "white";
		ctx.strokePolygon2(this.pg);
	},
	hitBy: function(obj) {
		this.game.explosionSound.play();
		if(this.size==3){
			this.game._makeAsteroid(2, this.pos, this.velocity);
			this.game._makeAsteroid(2, this.pos, this.velocity);
			this.game.score += 10;
		}else if(this.size==2){
			this.game._makeAsteroid(1, this.pos, this.velocity);
			this.game._makeAsteroid(1, this.pos, this.velocity);
			this.game.score += 20;
		}else{
			this.game.score += 40;
		}
		this.die();
	},
	// --- end of class
	__lastentry: undefined
});
