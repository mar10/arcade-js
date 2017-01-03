/*******************************************************************************
 * jsRipOff.js
 * Copyright (c) 2010, Martin Wendt (http://wwWendt.de)
 *
 * Released under the MIT license
 * http://www.opensource.org/licenses/mit-license.php
 *
 * A current version and some documentation is available at
 *     https://github.com/mar10/arcade-js/
 */

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
]).transform(LinaJS.scale33(2.0));

var pgBandit10 = new Polygon2([
	 -2, 3,
	 -2, -3,
	 -4,  2,
	 0, 4,
	 4,  2,
	 2, -3,
	 2,  3,
	 0,  -4,
	 -2, 3

]).transform(LinaJS.scale33(-3.0));

var pgBandit20 = new Polygon2([
	 0, -5,
	 0.25, -2,
	 4,  6,
	 3.75, -2,
	 3.75,  -1,
	 3, -1,
	 1,  3,
	 1,  0,
	 0.25, -2,
	 0, -5,
	 -0.25, -2,
	 -4, 6,
	 -3.75, -2,
	 -3.75, -1,
	 -3, -1,
	 -1, 4,
	 -1, 0,
	 -0.25, -2,
	 0, -5
  ]).transform(LinaJS.scale33(-2.5));

var pgBandit30 = new Polygon2([
	 0,  5,
	 2, -2,
	 2,  3,
	 0, -3,
	-2,  3,
	-2, -2,
	 0,  5
]).transform(LinaJS.scale33(4.0));

var pgBandit40 = new Polygon2([
	 0, -3,
	 4, 3,
	 2, 6,
	 3, 3,
	 1.5, 0,
	 -1.5, 0,
	 -3, 3,
	 -2, 6,
	 -4, 3,
	 0, -3,
	 1, 0,
	 2, 3,
	 -2, 3,
	 -1, 0,
	 0, -3
  ]).transform(LinaJS.scale33(-3.0));

var pgBandit50 = new Polygon2([
	 3,  3,
	 3, -2,
	 1, -2,
	 0, -4,
	-1, -2,
	-3,  2,
	 1, -2,
	 3,  2,
	-1, -2,
	-3, -2,
	-3,  2
  ]).transform(LinaJS.scale33(-4.0));

var pgBandit60 = new Polygon2([
	 0, -3,
	-1, -1,
	 6,  6,
	 6,  4,
	 0,  3,
	-6,  4,
	-6,  6,
	 1, -1,
	 0, -3
]).transform(LinaJS.scale33(-3.0));

var banditsDefs = [
	{score: 10, maxSpeed: 50, accel: 50, decel: 50, turnRate: 90*LinaJS.D2R, attackRange: 50, fireRate: 2500,
	 pg: pgBandit10},
	{score: 20, maxSpeed: 70, accel: 70, decel: 70, turnRate: 110*LinaJS.D2R, attackRange: 50, fireRate: 1500,
	 pg: pgBandit20},
	{score: 30, maxSpeed: 90, accel: 90, decel: 90, turnRate: 130*LinaJS.D2R, attackRange: 150, fireRate: 1000,
	 pg: pgBandit30},
	{score: 40, maxSpeed: 110, accel: 100, decel: 100, turnRate: 150*LinaJS.D2R, attackRange: 150, fireRate: 1000,
	 pg: pgBandit40},
	{score: 50, maxSpeed: 140, accel: 120, decel: 120, turnRate: 170*LinaJS.D2R, attackRange: 150, fireRate: 800,
	 pg: pgBandit50},
	{score: 60, maxSpeed: 180, accel: 150, decel: 150, turnRate: 180*LinaJS.D2R, attackRange: 150, fireRate: 500,
	 pg: pgBandit60}
];
// pgTank1.copy().transform(LinaJS.scale33(.9))


/**
 * Rip-off game object
 */
var RipOffGame = ArcadeJS.extend({
	init: function(canvas, customOpts) {
		// Init ArcadeJS
		var opts = $.extend({
				name: "jsRipOff",
				fps: 30,
				keyboardControls: true,
				icadeControls: false,
				mobileControls: false,
				gameOverMsg: "Game Over.",
				twoPlayer: false,
				// lineWidth: 1.5,
				debug: {
					showFps: true,
					showHulls: true
				}
			}, customOpts);

		this._super(canvas, opts);

		var i;
		// Copy selected options as object attributes
		ArcadeJS.extendAttributes(this, opts, "twoPlayer");

		// Set the scene
		this.setViewport(0, 0, 640, 480, "extend");

		// --- Status data -----------------------------------------------------
		this.wave = 0;
		this.score = 0;
		this.score2 = 0;
		this.gracePeriod = 2; // seconds

		// --- Cache sounds ----------------------------------------------------
		this.gunSound = new AudioJS(["fire.mp3", "fire.oga"]);
		this.explosionSound = new AudioJS(["damage.mp3", "damage.oga"]);

		this.attackStyle = "orange";

		if( opts.icadeControls ) {
			this.icade = new IcadeController({game: this});
		} else {		
			this.icade = null;
		}
		if( opts.mobileControls ) {
			// Add iPod extensions
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

		this.player1 = this.addObject(new Tank({
			id: "player1",
			pos: new Point2(840, 100),
			homePos: new Point2(540, 100),
			color: "skyblue"
		}));
		this.player2 = this.twoPlayer ? this.addObject(new Tank({
			id: "player2",
			pos: new Point2(-200, 100),
			homePos: new Point2(100, 100),
			color: "yellowgreen"
		})) : null;

		// Seed 8 canisters in the center
		for(i=0; i<8; i++){
			var pos = new Point2(LinaJS.random(250, 390), LinaJS.random(190, 290));
			this.addObject(new Canister({pos: pos}));
		}
		//
		this.gameOver();
		// this._startWave(true);
		// Start render loop
		this.startLoop();
	},
	gameOver: function(){
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
					self._startWave(true);
					popUp.close();
				}
			});
		$(document).on("icadeclick", function(e, data){
			if( data.btnId === "btnTW" && self.isActivity("over")) {
				$("div.arcadePopup").click();
			}
		});
	},
	_startWave: function(reset){
		var i,
			maxBandits = 3,
			canisters = this.getObjectsByType("canister"),
			forceAttack = false,
			banditHome = new Point2(LinaJS.random(0, 640), 500);

		if( reset ) {
			this.wave = 1;
			this.score = 0;
			this.score2 = 0;
			this.player1.restart();
			if(this.player2){
				this.player2.restart();
			}
		} else {
			this.wave += 1;
		}

		// Remove old bandits and bullets
		this.visitObjects(function(obj){
			obj.die();
		}, "bandit bullet")

		// Create bandits and assign targets
		var idx = (this.wave - 1) % 6,
			lap = Math.floor((this.wave - 1) / 6),
			banditDef = banditsDefs[idx];

		for(i=0; i<maxBandits + lap; i++){
			var bandit = this.addObject(new Bandit({
				pos: banditHome,
				score: banditDef.score,
				maxSpeed: banditDef.maxSpeed,
				turnRate: banditDef.turnRate,
				accel: banditDef.accel,
				decel: banditDef.decel,
				attackRange: banditDef.attackRange,
				fireRate: banditDef.fireRate,
				pg: banditDef.pg.copy()
				}));

//			if(forceAttack && i === 0){
//				bandit.target = this.player1;
//			}else if(i < canisters.length){
//				bandit.target = canisters[i];
//			}else{
//				bandit.target = this.player1;
//			}
		}
		this._assignTargets();

		this.setActivity("prepare");
		this.later(3, function(){
			this.setActivity("run");
		});
	},
	/**
	 * Check if targets are still valid, and re-assign as necessary
	 */
	_assignTargets: function(){
		var i, canister, bandit,
			bandits = this.getObjectsByType("bandit"),
			canisters = this.getObjectsByType("canister"),
			attachedCanisterMap = {};
		// Collect attached/targeted canisters and remove invalid targets
		for(i=0; i<bandits.length; i++){
			bandit = bandits[i];
			if(bandit.canister){
				attachedCanisterMap[bandit.canister.id] = bandit;
			}else if(bandit.target && bandit.target.type == "canister"){
				attachedCanisterMap[bandit.target.id] = bandit;
			}
			if(bandit.target && bandit.target.hidden){
				bandit.target = null;
			}
		}
		// Attache free canisters to lazy bandits
		var nextIdx = 0;
		for(i=0; i<bandits.length; i++){
			bandit = bandits[i];
			if(!bandit.target){
				canister = null;
				while(!canister && nextIdx < canisters.length){
					canister = canisters[nextIdx];
					if(attachedCanisterMap[canister.id]){
						nextIdx++;
						canister = null;
					}
				}
				if(canister){
					bandit.target = canister;
					attachedCanisterMap[canister.id] = bandit;
				}else{
					if(bandit.game.player2 && (i % 2)){
						bandit.target = bandit.game.player2;
					}else{
						bandit.target = bandit.game.player1;
					}
				}
				bandit.game.debug("Assign " + bandit.target + " to " + bandit);
			}
		}
	},
	postStep: function(){
		var bandits = this.getObjectsByType("bandit");
//		this.debug("postStep: " + bandits);
		if( bandits.length < 1){
			var canisters = this.getObjectsByType("canister");
			if( this.getActivity() != "over") {
				if( canisters.length ){
					this._startWave();  // start next wave
				} else {
					this.gameOver();
				}
			}
		}
	},
	preDraw: function(ctx){
		ctx.save();
		var yOfs = this.canvasArea.y;
		// Display score
		ctx.save();
		ctx.font = "16px sans-serif";
		ctx.fillStyle = this.player1.color;
		ctx.fillScreenText("Player 1: " + this.score, 10, 17 + yOfs);
		if(this.twoPlayer){
			ctx.fillStyle = this.player2.color;
			ctx.fillScreenText("Player 2: " + this.score2, 10, 34 + yOfs);
		}
		ctx.restore();

		if(this.isActivity("prepare")){
			ctx.font = "30px sans-serif";
			ctx.strokeScreenText("Wave " + this.wave + "...", 0, 0);
		}else if(this.isActivity("over")){
			ctx.font = "30px sans-serif";
			ctx.strokeScreenText("Game over (hit [F5])", 0, 0);
		}
		if(!this.opts.debug.showMouse){
			ctx.font = "10px sans-serif";
			ctx.fillScreenText("Copyright (c) 2011 Martin Wendt - Made with ArcadeJS", 0, -1);
		}
		// done
		ctx.restore();
		// Prepare context for following object rendering
		if( this.opts.lineWidth ) {
			ctx.lineWidth = this.opts.lineWidth;
		}
	},
	// --- end of class
	__lastentry: undefined
});

/*----------------------------------------------------------------------------*/

var Bullet = Movable.extend({
	init: function(opts) {
		this._super("bullet", $.extend({
			source: null,
			ttl: 1, // live max. 1 second
			clipModeX: "die",
			clipModeY: "die"
		}, opts));
		// Copy selected options as object attributes
		ArcadeJS.extendAttributes(this, opts, "source ttl");
		if(this.ttl > 0){
			this.later(this.ttl, function(){
				this.die();
			});
		}
	},
	getBoundingCircle: function() {
		return new Circle2(this.pos, 0.1);
	},
	step: function() {
		// Check if this bullet hit a player or bandit
		var list = this.game.getObjectsByType("tank bandit");
		for(var i=0, l=list.length; i<l; i++) {
			var obj = list[i];
			if(this.source === obj || !this.game.preCheckCollision(this, obj)){
				continue;
			}
			// Pre-check is exact enough for our purpose...
			this.die();
			obj.hitBy(this);
			break;
		}
	},
	render: function(ctx) {
		ctx.fillRect(0, 0, 3, 3);
	},
	// --- end of class
	__lastentry: undefined
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
	getBoundingCircle: function() {
		return new Circle2(this.pos, 7);
	},
	render: function(ctx) {
		ctx.strokePolygon2(this.pg);
	},
	// --- end of class
	__lastentry: undefined
});

/*----------------------------------------------------------------------------*/

var Tank = Movable.extend({
	init: function(opts) {
		this._super("tank", $.extend({
			clipModeX: "stop",
			clipModeY: "stop",
			color: "white"
		}, opts));
		// Copy selected options as object attributes
		ArcadeJS.extendAttributes(this, opts, "color");
		this.pg = pgTank1.copy();
		this.pgHull = this.pg.getConvexHull();
		// Start here
		this.homePos = opts.homePos.copy();
		// Drive from here to homePos after a hit (recover mode).
		this.recoverPos = opts.pos.copy();
//		alert("init: " + this.id + " home:" + this.homePos + ", recover:" + this.recoverPos);
		this.fireRate = 330; // ms
		this.fireRange = 1.3; // sec
	},
	getBoundingCircle: function() {
		return new Circle2(this.pos, 18);
	},
	applyControls: function(){
		var maxSpeed = 150,
			accel = 150,
			decel = 100,
			turnRate = 90 * LinaJS.D2R,
			game = this.game;

		// In recover mode (after it was hit), the tank drives back to its home
		if(this.isActivity("recover") ){
			if(this.driveToPosition(game.frameDuration, this.homePos,
					10, maxSpeed, turnRate, accel, decel)){
				this.setActivity("idle");
				this.clipModeX = "stop";
			};
			return;
		}
		// --- Handle key controls ---
		if(this.id == "player1"){
			// Player 1 is keyboard controlled
			var doFire = false,
				doThrust = false,
				doTurn = 0;

			if( game.opts.keyboardControls ) {			
				if(game.isKeyDown(32)){ // [space]
					doFire = true;
				}
				if(game.isKeyDown(38)){ // [up]
					doThrust = true;
				}
				if(this.game.isKeyDown(37)){ // [left]
					doTurn = +1;
				}else if(this.game.isKeyDown(39)){ // [right]
					doTurn = -1;
				}
			}
			// iCade Controller
			if( game.icade ) {
				if( game.icade.isDown("left") ){
					doTurn = +1;
				} else if( game.icade.isDown("right") ){
					doTurn = -1;
				}
				doThrust = doThrust || game.icade.isDown("up");
				doFire = doFire || game.icade.isClicked("btnBRB", 100, 500);
			}
			// Apply controls
			if(  doFire ) {
				this.fire();
			}
			if( doThrust ) {
				var force = LinaJS.polarToVec(this.orientation + 90*LinaJS.D2R, accel * game.frameDuration);
				this.velocity.accelerate(force, maxSpeed);
			}else{
				this.velocity.accelerate(-decel * game.frameDuration);
			}
			if( doTurn ) {
				this.orientation += doTurn * turnRate * game.frameDuration;
				this.velocity.setAngle(this.orientation + 90*LinaJS.D2R);
			}
		}
		if(!game.twoPlayer || this.id == "player2"){
			// Player 2 is mouse controlled
			if(game.leftButtonDown){ // left mouse button is pressed
				this.driveToPosition(game.frameDuration, game.mousePos,
					10, maxSpeed, turnRate, accel, decel);
			}else{
				this.velocity.accelerate(-decel * game.frameDuration);
			}
			if(game.rightButtonDown){ // right mouse is pressed
				// Turn to mouse pos and fire
				if(this.turnToDirection(game.frameDuration, game.mousePos, turnRate)){
					this.fire();
				}
			}
		}
	},
	step: function(p) {
		// Evaluate keyboard, mouse, and touch events
		this.applyControls();
		// --- Check for collisions
		var list = this.game.getObjectsByType("tank bandit");
		for(var i=0, l=list.length; i<l; i++) {
			var obj = list[i];
			if(!this.game.preCheckCollision(this, obj)){
				continue;
			}
			// Pre-check is exact enough for our purpose...
			obj.hitBy(this);
			this.hitBy(obj);
			break;
		}
	},
	render: function(ctx) {
		ctx.strokeStyle = this.color;
		// ctx.lineWidth = 1.2;
		ctx.strokePolygon2(this.pg, false);
		if( this.game.opts.debug.showHulls ) {		
			ctx.strokeStyle = "magenta";
			ctx.strokePolygon2(this.pgHull, false);
		}
	},
	hitBy: function(obj) {
		this.game.explosionSound.play();
		// Score penalty for friendly fire
		var otherId = (obj.type == "bullet" ? obj.source.id : ""),
			isReal = this.isActivity("run");
		if(isReal && otherId == "player1"){
			this.game.score -= 100;
		}else if(isReal && otherId == "player2"){
			this.game.score2 -= 100;
		}
		this.hidden = true;
		this.game._assignTargets();
		this.hidden = false;

		this.restart();

//		this.later(this.game.gracePeriod, function(){
//			this.pos.set(this.homePos);
//			this.hidden = false;
//		});
	},
	/**Move outside screen and activate 'recover' mode (i.e. drive back to home)*/
	restart: function(){
		this.pos.set(this.recoverPos);
//		alert("restart: " + this.id + " home:" + this.homePos + ", recover:" + this.recoverPos);
		this.clipModeX = "none";
		this.setActivity("recover");
	},
	fire: function() {
		if(this.hidden || this.game.time - this.lastFire < this.fireRate){
			return;
		}
		this.lastFire = this.game.time;
		var bullet = new Bullet({
			source: this,
			pos: this.pos.copy(),
			velocity: LinaJS.polarToVec(this.orientation + 0.5 * Math.PI, 300),
			ttl: this.fireRange
			});
		this.game.addObject(bullet);
		this.game.gunSound.play();
	},
	// --- end of class
	__lastentry: undefined
});

/*----------------------------------------------------------------------------*/

var Bandit = Movable.extend({
	init: function(opts) {
		this._super("bandit", $.extend({
			clipModeX: "none",
			clipModeY: "none"
		}, opts));
		// Copy selected options as object attributes
		ArcadeJS.extendAttributes(this, opts, "score maxSpeed accel decel turnRate attackRange fireRate pg");
		this.target = null;
		this.pgHull = this.pg.getConvexHull();
	},
	getBoundingCircle: function() {
		return new Circle2(this.pos, 9);
	},
	step: function(p) {
		var vDest,
			target = this.target,
			vTarget = this.pos.vectorTo(target.pos),
			minBuddyDist = 50,
			minCanisterDist = 50,
			epsTarget = 5, // WC units
			decel = this.opts.decel,
			self = this;

		// Drag attached canister
		if(this.canister){
			this.canister.pos = this.pos.copy();
			if(this.velocity.length() > 15){
				this.canister.pos.translate(this.velocity.copy().revert().setLength(15));
			}
		}

		// If a player is in reach, switch to attack mode
		this.attackMode = false;
		if( !this.isActivity("escape")){
			this.game.visitObjects(function(obj){
				vDest = self.pos.vectorTo(obj.pos);
				if(!obj.hidden && vDest.length() < self.attackRange){
					// temporarily override target
					target = obj;
					vTarget = vDest;
					self.attackMode = true;
					self.canister = null; // drop canister
					decel = 0; // I don't break for players
					return false;
				}
			}, "tank");
		}
//		// TODO: If a canister is in reach, go for it
//		this.game.visitObjects(function(obj){
//			vDest = obj.pos.vectorTo(self.pos);
//			if(vDest.length() < minCanisterDist){
////				self.velocity.accelerate(vDest.limit(3), 100);
//				driveToPosition(self, this.frameDuration, obj.pos, 90*LinaJS.D2R, 50, 100, 50);
//			}
//		}, "canister");

		// --- move to target
		var reached = this.driveToPosition(this.game.frameDuration, target.pos,
				epsTarget, this.maxSpeed, this.turnRate, this.accel, this.decel);
		if(reached){
			if(target.type == "canister"){
				// Reached a canister: attach and run home
				this.canister = target;
				var targetPos = new Point2(this.pos.x + LinaJS.random(-100, 100), -50);
				// flee to bottom if this is nearer
				if(this.pos.y > 240){
					targetPos.y = 530;
				}
				this.target = {type: "home", pos: targetPos};
				this.setActivity("escape");
			}else if(target.type == "home"){
				// Reached home: vanish
				this.canister.die();
				this.canister = null;
				this.target = null;
				this.die();
			}
		}

		// --- avoid buddies
		this.game.visitObjects(function(obj){
			if(obj !== self ){
				vDest = obj.pos.vectorTo(self.pos);
				if(vDest.length() < minBuddyDist){
					self.velocity.accelerate(vDest.limit(3), this.maxSpeed);
				}
			}
		}, "bandit");
		// --- fire, if a player is in front of us
		if( this.attackMode //&& vTarget.length() < minFireDist
				&& LinaJS.angleDiff(vTarget.angle(), this.orientation - 90*LinaJS.D2R) < 25*LinaJS.D2R){
			this.fire();
		}

	},
	render: function(ctx) {
		if(this.attackMode){
			ctx.strokeStyle = this.game.attackStyle; //"lightblue";
		}
		ctx.strokePolygon2(this.pg, false);
		if( this.game.opts.debug.showHulls ) {		
			ctx.strokeStyle = "magenta";
			ctx.strokePolygon2(this.pgHull, false);
		}
	},
	hitBy: function(obj) {
		this.game.explosionSound.play();
		// Add score if Bandit was hit by player or player bullet
		var otherId = obj.source ? obj.source.id : obj.id;
		if(otherId == "player1"){
			this.game.score += this.score;
		}else if(otherId == "player2"){
			this.game.score2 += this.score;
		}
		this.die();
	},
	fire: function() {
		if(this.game.time - this.lastFire < this.fireRate){
			return;
		}
		this.lastFire = this.game.time;
		var bullet = new Bullet({
			source: this,
			pos: this.pos.copy(),
			velocity: LinaJS.polarToVec(this.orientation + 0.5 * Math.PI, 180),
			ttl: 1.0
			});
		this.game.addObject(bullet);
//		this.game.gunSound.play();
	},
	// --- end of class
	__lastentry: undefined
});
