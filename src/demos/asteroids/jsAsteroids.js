/*******************************************************************************
 * jsAsteroids.js
 * Copyright (c) 2010, Martin Wendt (http://wwWendt.de)
 *
 * Released under the MIT license
 * http://www.opensource.org/licenses/mit-license.php
 *
 * A current version and some documentation is available at
 *     https://github.com/mar10/arcade-js/
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
			keyboardControls: true,
			icadeControls: false,
			mobileControls: false,
			gameOverMsg: "Game Over.",
			debug: {
				showFps: true
			}
		}, customOpts);
		this._super(canvas, opts);

		// --- Status data -----------------------------------------------------
		this.liveCount = 3;
		this.level = 1;
		this.score = 0;
		this.maxBullets = 4;
		this.shotDelay = 100; // ms
		this.permanentShotDelay = 500; // ms
		// this.shotDuration = 2000; // ms
		this.gracePeriod = 3; // seconds

		// --- Cache sounds ----------------------------------------------------
		this.gunSound = new AudioJS(["fire.mp3", "fire.oga", "fire.wav"]);
		this.explosionSound = new AudioJS(["damage.mp3", "damage.oga"]);
		if( opts.icadeControls ) {
			this.icade = new IcadeController({game: this});
		} else {		
			this.icade = null;
		}
		if( opts.mobileControls ) {
			this.stick = this.addObject(new TouchStick({
//              id: "stick",
				r1: 10,
				r2: 30,
				r3: 60,
				onResize: function(width, height){
					this.pos.x = 60;
					this.pos.y = height - 60;
				}
			}));
			this.button = this.addObject(new TouchButton({
//              id: "button",
				r: 20,
				r3: 40,
				onResize: function(width, height){
					this.pos.x = width - 40;
					this.pos.y = height - 40;
				}
			}));
		} else {		
			this.button = this.stick = null;
		}

		// Set the scene
		var obj;
		// Player rocket
		this.rocket = this.addObject(new Rocket())
		// this._restartGame(true);
		this._gameOver();
		// --- Start render loop -----------------------------------------------
		this.startLoop()
	},
	_gameOver: function(){
		this.setActivity("over");
		var self = this,
			popUp = new HtmlOverlay({
				game: this,
				html: this.opts.gameOverMsg,
				css: {
					backgroundColor: "transparent",
					color: "white"
				},
				onClick: function(e){
					self._restartGame(true);
					popUp.close();
					// window.location.reload();
				}
			});
		$(document).on("icadeclick", function(e, data){
			if( data.btnId === "btnTW" && game.isActivity("over")) {
				$("div.arcadePopup").click();
			}
		});
	},
	_restartGame: function(resetLevel){
		this.setActivity("prepare");
		if( resetLevel ) {
			this.level = 1;
		}
		this.visitObjects(function(obj){
			obj.die();
		}, "asteroid bullet");
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
		if(!hasAsteroids && !this.isActivity("over") ){
			this.level += 1;
			this.score += 1000;
			this._restartGame();
			return;
		}

		// --- Evaluate controllers ---
		var fire, thrust, turn,
			rocket = this.rocket;

		// Handle key controls
		if( this.opts.keyboardControls ) {
			if(this.isKeyDown(37)){ // Left
				turn = -5;
			} else if(this.isKeyDown(39)) { // Right
				turn = 5;
			}
			if(this.isKeyDown(38)){ // Up
				thrust = 3;
			}
			// [space] fires. Fast-clicking allows 5 shots per second.
			// Permanent fire (keep spacebar pushed) onl< 1 shots per sec
			fire = this.isKeyClicked(32, this.shotDelay, this.permanentShotDelay);
			// [backspace] starts hyperspace
			if( this.isKeyClicked(8) ) { rocket.hyperspace(); }
		}

		// --- Mobile mode: use virtual touch button and joystick
		if( this.opts.mobileControls ){
			var dx = this.stick.getX();

			if( Math.abs(dx) > 0.2 ) {
				turn = 3 * dx;
			}
			if( this.stick.getY() < -0.8 ) { // Up
				thrust = 3;
			}
			fire = fire || this.button.isClicked(this.shotDelay, this.permanentShotDelay);
		}

		// iCade Controller
		if( this.opts.icadeControls ) {		
			if( this.icade.isDown("left") ){
				turn = -3;
			} else if( this.icade.isDown("right") ){
				turn = 3;
			}
			// bottom left black button: thrust
			if( this.icade.isDown("btnBLB") ) {
				thrust = 3;
			}
			// bottom right black button: fire
			fire = fire || this.icade.isClicked("btnBRB", this.shotDelay, this.permanentShotDelay);
			// bottom red button starts hyperspace
			if( this.icade.isClicked("btnBR") ) { rocket.hyperspace(); }
		}

		if( turn ){
			rocket.orientation += turn * LinaJS.DEG_TO_RAD;
		}
		if( thrust ) {
			var vAccel = LinaJS.polarToVec(this.rocket.orientation - 90*LinaJS.DEG_TO_RAD, 3);
			rocket.velocity.add(vAccel).limit(300);
			rocket.isThrust = true;
		}
		if( fire ) {
			if( this.getObjectsByType("bullet").length < this.maxBullets ) {
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
//			ctx.font = "30px sans-serif";
//			ctx.strokeScreenText("Game over (hit [F5])", 0, 0);
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
			clipModeX: "die",
			clipModeY: "die"
//			scale: 2,
//			ttl: 20,
		}, opts);
		this._super("bullet", opts);
		this.startPos = this.pos.copy(); 
		// Die after 0.5 seconds
		// this.later(0.8, function(){
		// 	this.die();
		// });
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
		// --- Collision detection ---
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
			}else if(this.game.getActivity() != "over"){
				this.game._gameOver();
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
	fire: function() {
		if(this.isActivity("grace") || this.game.isActivity("over")){
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
	hyperspace: function() {
		if(this.isActivity("grace") || this.game.isActivity("over")){
			return;
		}
		// this.setActivity("grace");
		this.velocity.setNull();
		this.pos = new Point2(LinaJS.random(this.game.canvas.width),
			LinaJS.random(this.game.canvas.height));
		// this.later(this.game.gracePeriod, function(){
		// 	this.setActivity("idle");
		// });
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
			this.game.score += 20;
		}else if(this.size==2){
			this.game._makeAsteroid(1, this.pos, this.velocity);
			this.game._makeAsteroid(1, this.pos, this.velocity);
			this.game.score += 50;
		}else{
			this.game.score += 100;
		}
		this.die();
	},
	// --- end of class
	__lastentry: undefined
});
