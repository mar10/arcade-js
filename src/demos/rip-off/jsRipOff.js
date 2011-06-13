/*******************************************************************************
 * jsRipOff.js
 */

/**
 * Adjust velocity (by applying acceleration force) to move an object towards
 * a target position.
 * @param {Movable} movable
 * @param {float} stepTime
 * @param {Point2} targetPos
 * @param {float} eps
 * @param {float} maxSpeed
 * @param {float} turnRate
 * @param {float} maxAccel
 * @param {float} maxDecel
 */
function driveToPosition(movable, stepTime, targetPos, eps, maxSpeed, turnRate, maxAccel, maxDecel){
	var vTarget = movable.pos.vectorTo(targetPos),
		dTarget = vTarget.length(),
		aTarget = LinaJS.angleDiff(movable.orientation + 90*LinaJS.D2R, vTarget.angle()),
		curSpeed = movable.velocity.length();
//	movable.game.debug("driveToPosition: " + targetPos + ", ofs=" + vTarget + ", " + aTarget + "°, d=" + dTarget);
	if(dTarget <= eps && curSpeed < eps){
		movable.velocity.setNull();
		return true;
	}
	if(movable.velocity.isNull()){
		movable.velocity = vTarget.copy().setLength(stepTime * maxAccel);
		curSpeed = movable.velocity.length();
		maxAccel = 0;
	}
	// Turn to target (within 0.1° accuracy)
	if(Math.abs(aTarget) > 0.1 * LinaJS.D2R){
		if(aTarget > 0){
			movable.orientation += Math.min(aTarget, stepTime * turnRate);
		}else{
			movable.orientation -= Math.min(-aTarget, stepTime * turnRate);
		}
		movable.velocity.setAngle(movable.orientation + 90*LinaJS.D2R);
//		movable.game.debug("driveToPosition: turning to " + movable.orientation * LinaJS.R2D + "°");
	}
	// Decelerate, if desired and target is in reach
	if(maxDecel > 0 && dTarget < curSpeed){
		movable.velocity.setLength(Math.max(LinaJS.EPS, curSpeed - stepTime * maxDecel));
//		movable.game.debug("driveToPosition: breaking to speed = " + movable.velocity.length());
	}else if(maxAccel > 0 && maxSpeed > 0 && Math.abs(curSpeed - maxSpeed) > LinaJS.EPS){
		// otherwise accelerate to max speed, if this is desired
		movable.velocity.setLength(Math.min(maxSpeed, curSpeed + stepTime * maxAccel));
//		movable.game.debug("driveToPosition: accelerating to speed = " + movable.velocity.length());
	}
	return false;
}

/**
 * Turn game object to direction or target point.
 * @param {Movable} movable
 * @param {float} stepTime
 * @param {float | Vec2 | Point2} target angle, vector or position
 * @param {float} turnRate
 */
function turnToDirection(movable, stepTime, target, turnRate){
	var angle = target;
	if(target.x !== undefined){
		// target is a point: calc angle from current pos top this point
		angle = movable.pos.vectorTo(target).angle();
	}else if(target.dx !== undefined){
		// target is a vector
		angle = target.angle();
	}
	// now calc the delta-angle
	angle = LinaJS.angleDiff(movable.orientation + 90*LinaJS.D2R, angle);
	// Turn to target (within 0.1° accuracy)
	if(Math.abs(angle) <= 0.1 * LinaJS.D2R){
		return true;
	}
	if(angle > 0){
		movable.orientation += Math.min(angle, stepTime * turnRate);
	}else{
		movable.orientation -= Math.min(-angle, stepTime * turnRate);
	}
	movable.velocity.setAngle(movable.orientation + 90*LinaJS.D2R);
	// return true, if destination orientation was reached
	return Math.abs(angle) <= stepTime * turnRate;
}

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


///**
// * Adjust velocity (by applying acceleration force) to move an object towards
// * a target position.
// */
//function floatToPosition(movable, targetPos, maxAccel, maxSpeed, maxDecel){
//	//TODO
//	var vDest = movable.pos.vectorTo(targetPos);
//	movable.velocity.accelerate(vDest.setLength(maxAccel), maxSpeed);
//	// make sure we are heading to the moving direction
//	movable.orientation = movable.velocity.angle() - 90*LinaJS.D2R;
////	movable.game.debug("v: " + movable.velocity);
////	if( this.attackMode && vTarget.length() < minFireDist
////			&& Math.abs(vTarget.angle() - this.orientation - 90*LinaJS.D2R) < 25*LinaJS.D2R){
////		this.fire();
////	}
//}

/**
 * Rip-off game object
 */
var RipOffGame = ArcadeJS.extend({
	init: function(canvas, customOpts) {
		// Init ArcadeJS
		var opts = $.extend({
			name: "jsRipOff",
			fps: 30,
			twoPlayer: false
		}, customOpts);
		this._super(canvas, opts);

		// Copy selected options as object attributes
		ArcadeJS.extendAttributes(this, opts, "twoPlayer");

		// Set the scene
		this.setViewport(0, 0, 640, 480, "extend");

		// --- Status data -----------------------------------------------------
		this.wave = 0;
		this.score = 0;
		this.gracePeriod = 2; // seconds

		// --- Cache sounds ----------------------------------------------------
		this.gunSound = new AudioJS(["fire.mp3", "fire.oga"]);
		this.explosionSound = new AudioJS(["damage.mp3", "damage.oga"]);

		this.player1 =  this.addObject(new Tank({id: "player1", pos: new Point2(540, 100)}));
		this.player2 =  this.twoPlayer ? this.addObject(new Tank({id: "player2", pos: new Point2(100, 100)})) : null;
		// Seed 8 canisters in the center
		for(var i=0; i<8; i++){
			var pos = new Point2(LinaJS.random(250, 390), LinaJS.random(190, 290));
			this.addObject(new Canister({pos: pos}));
		}
		//
		this._startWave();

		// Start render loop
		this.startLoop();
	},

	_startWave: function(){
		var i,
			maxBandits = 3,
			canisters = this.getObjectsByType("canister"),
			forceAttack = false;
			banditHome = new Point2(LinaJS.random(0, 640), 500);

		this.wave += 1;

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
			if(canisters.length){
				this._startWave();
			}else if(this.getActivity() != "over"){
				this.setActivity("over");
				var popUp = new HtmlOverlay({
					canvas: this.canvas,
					html: "Game Over.",
					onClick: function(e){
						window.location.reload();
					}
				});
			}
		}
	},
	preDraw: function(ctx){
		ctx.save();
		// Display score
		ctx.font = "16px sans-serif";
		ctx.fillScreenText("Score: " + this.score, 10, 15);
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
			clipModeY: "stop"
		}, opts));
		// Copy selected options as object attributes
//		ArcadeJS.extendAttributes(this, opts, "homePos");
		this.pg = pgTank1.copy();
//		this.pgHull = this.pg.getConvexHull();
		this.homePos = this.pos.copy();
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

		// --- Handle key controls ---
		if(this.id == "player1"){
			// Player 1 is keyboard controlled
			if(game.isKeyDown(32)){ // [space]
				this.fire();
			}
			if(game.isKeyDown(38)){ // [up]
				var force = LinaJS.polarToVec(this.orientation + 90*LinaJS.D2R, accel * game.frameDuration);
				this.velocity.accelerate(force, maxSpeed);
			}else{
				this.velocity.accelerate(-decel * game.frameDuration);
			}
			if(this.game.isKeyDown(37)){ // [left]
				this.orientation += turnRate * game.frameDuration;
				this.velocity.setAngle(this.orientation + 90*LinaJS.D2R);
			}else if(this.game.isKeyDown(39)){ // [right]
				this.orientation -= turnRate * game.frameDuration;
				this.velocity.setAngle(this.orientation + 90*LinaJS.D2R);
			}
		}
		if(!game.twoPlayer || this.id == "player2"){
			// Player 2 is mouse controlled
			if(game.leftButtonDown){ // left mouse button is pressed
				driveToPosition(this, game.frameDuration, game.mousePos,
					10, maxSpeed, turnRate, accel, decel);
			}else{
				this.velocity.accelerate(-decel * game.frameDuration);
			}
			if(game.rightButtonDown){ // right mouse is pressed
				// Turn to mouse pos and fire
				if(turnToDirection(this, game.frameDuration, game.mousePos, turnRate)){
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
//			alert("Collision von " + this + " mit " + obj);
			// Pre-check is exact enough for our purpose...
			obj.hitBy(this);
			this.hitBy(obj);
			if(obj.score){
				this.game.score += obj.score;
			}
			break;
		}
	},
	render: function(ctx) {
		ctx.strokePolygon2(this.pg, false);
//		ctx.strokeStyle = "magenta";
//		ctx.strokePolygon2(this.pgHull, false);
	},
	hitBy: function(obj) {
		this.game.explosionSound.play();
		this.hidden = true;
		this.game._assignTargets();
//		this.pos.set(1000, 1000);
		this.later(this.game.gracePeriod, function(){
			this.pos.set(this.homePos);
			this.hidden = false;
		});
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
			clipModeY: "none",
		}, opts));
		// Copy selected options as object attributes
		ArcadeJS.extendAttributes(this, opts, "score maxSpeed accel decel turnRate attackRange fireRate pg");
		this.target = null;
//		this.pgHull = this.pg.getConvexHull();
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
		var reached = driveToPosition(this, this.game.frameDuration, target.pos,
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
			ctx.strokeStyle = "lightblue";
		}
		ctx.strokePolygon2(this.pg, false);
//		ctx.strokeStyle = "magenta";
//		ctx.strokePolygon2(this.pgHull, false);
	},
	hitBy: function(obj) {
		this.game.explosionSound.play();
		this.game.score += this.score;
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
