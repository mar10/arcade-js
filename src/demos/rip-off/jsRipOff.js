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
 * @param {float} maxTurn
 * @param {float} maxAccel
 * @param {float} maxDecel
 */
function driveToPosition(movable, stepTime, targetPos, eps, maxSpeed, maxTurn, maxAccel, maxDecel){
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
			movable.orientation += Math.min(aTarget, stepTime * maxTurn);
		}else{
			movable.orientation -= Math.min(-aTarget, stepTime * maxTurn);
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
 * Adjust velocity (by applying acceleration force) to move an object towards
 * a target position.
 */
function floatToPosition(movable, targetPos, maxAccel, maxSpeed, maxDecel){
	//TODO
	var vDest = movable.pos.vectorTo(targetPos);
	movable.velocity.accelerate(vDest.setLength(maxAccel), maxSpeed);
	// make sure we are heading to the moving direction
	movable.orientation = movable.velocity.angle() - 90*LinaJS.D2R;
//	movable.game.debug("v: " + movable.velocity);
//	if( this.attackMode && vTarget.length() < minFireDist 
//			&& Math.abs(vTarget.angle() - this.orientation - 90*LinaJS.D2R) < 25*LinaJS.D2R){
//		this.fire();
//	}
}

/**
 * Rip-off game object
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
		this.setViewport(0, 0, 640, 480, "extend");
		
		// --- Status data -----------------------------------------------------
		this.wave = 0;
		this.score = 0;
		this.shotDelay = 250; // ms
		this.gracePeriod = 3; // seconds

		// --- Cache sounds ----------------------------------------------------
		this.gunSound = new AudioJS(["fire.mp3", "fire.oga"]);
		this.explosionSound = new AudioJS(["damage.mp3", "damage.oga"]);

		this.player1 =  this.addObject(new Tank({id: "player1", pos: new Point2(540, 100)})); 
		this.player2 =  null; //this.addObject(new Tank({id: "player2", pos: new Point2(100, 100)}));
		// Seed 8 canisters in the center
		for(var i=0; i<8; i++){
			var pos = new Point2(LinaJS.random(250, 390), LinaJS.random(190, 290));
			this.addObject(new Canister({pos: pos}));
		}
		// 
		this._startWave();
		
		// Start render loop
		this.startLoop()
	},
	
	_startWave: function(){
		var i,
			maxBandits = 3,
			canisters = this.getObjectsByType("canister"),
			forceAttack = false;
		this.banditHome = new Point2(320, 450);
		this.wave += 1;
		// Set player tanks to start position
		this.player1.pos.set(550, 100);

		// Remove old bandits and bullets
		this.visitObjects(function(obj){
			obj.die();
		}, "bandit bullet")
		// Create bandits and assign targets
		for(i=0; i<maxBandits; i++){
			var bandit = this.addObject(new Bandit({pos: this.banditHome}));
			if(forceAttack && i === 0){
				bandit.target = this.player1;
			}else if(i < canisters.length){
				bandit.target = canisters[i];
			}else{
				bandit.target = this.player1;
			}
		}
		
		this.setActivity("prepare");
		this.later(3, function(){
			this.setActivity("run");
		});
	},
	postStep: function(){
		var bandits = this.getObjectsByType("bandit");
//		this.debug("postStep: " + bandits);
		if( bandits.length < 1){
			var canisters = this.getObjectsByType("canister");
			if(canisters.length){
				this._startWave();
			}else{
				this.setActivity("over");
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
		ctx.font = "10px sans-serif";
//		ctx.fillScreenText("Copyright (c) 2011 Martin Wendt - Made with ArcadeJS", 0, -1);

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
	__lastentry: undefined
});

/*----------------------------------------------------------------------------*/

var Bullet = Movable.extend({
	init: function(opts) {
		this._super("bullet", $.extend({
			ttl: 1, // live max. 1 second
			clipModeX: "none",
			clipModeY: "none"
		}, opts));
		if(this.opts.ttl > 0){
			this.later(this.opts.ttl, function(){
				this.die();
			});
		}
	},
	getBoundingCircle: function() {
		return new Circle2(this.pos, 0.1);
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

var pgBandit30 = new Polygon2([
	 0,  5,
	 2, -2,
	 2,  3,
	 0, -3,
	-2,  3,
	-2, -2,
	 0,  5
]).transform(LinaJS.scale33(2.0));

var Tank = Movable.extend({
	init: function(opts) {
		this._super("tank", $.extend({
			clipModeX: "stop",
			clipModeY: "stop"
		}, opts));
		this.pg = pgTank1.copy();
	},
	getBoundingCircle: function() {
		return new Circle2(this.pos, 18);
	},
	step: function(p) {
		// --- Handle key controls ---
		if(this.game.isKeyDown(32)){ // [space]
			this.fire();
		}
		if(this.game.isKeyDown(38)){ // [up]
			var force = LinaJS.polarToVec(this.orientation + 90*LinaJS.D2R, 5);
			this.velocity.accelerate(force, 100);
		}else{
			this.velocity.accelerate(-3);
		}
		if(this.game.isKeyDown(37)){ // [left] 
			this.orientation += 3 * LinaJS.D2R;
			this.velocity.setAngle(this.orientation + 90*LinaJS.D2R);
		}else if(this.game.isKeyDown(39)){ // [right]
			this.orientation -= 3 * LinaJS.D2R;
			this.velocity.setAngle(this.orientation + 90*LinaJS.D2R);
		}
	},
	render: function(ctx) {
		ctx.strokePolygon2(this.pg, false);
	},
	fire: function() {
		if(this.game.time - this.lastFire < this.game.shotDelay){
			return;
		}
		this.lastFire = this.game.time;
		var bullet = new Bullet({
			pos: this.pos.copy(),
			velocity: LinaJS.polarToVec(this.orientation + 0.5 * Math.PI, 200),
			ttl: 1.0
			});
		this.game.addObject(bullet);
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
		this.pg = pgBandit30.copy().transform(LinaJS.scale33(1.5));
		this.target = null;
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
			minAttackDist = 150,
			minFireDist = 100,
			maxSpeed = 80, // WC units per second
			maxTurn = 90*LinaJS.D2R, // rad per second
			maxAccel = 50, // WC units per second
			maxDecel = 50, // WC units per second
			epsTarget = 5, // WC units
			self = this;

		// Drag attached canister
		if(this.canister){
			this.canister.pos = this.pos;
		}
		
		// If a player is in reach, switch to attack mode
		this.attackMode = false;
		if( !this.isActivity("escape")){
			this.game.visitObjects(function(obj){
				vDest = self.pos.vectorTo(obj.pos);
				if(vDest.length() < minAttackDist){
					// temporarily override target 
					target = obj;
					vTarget = vDest;
					self.attackMode = true;
					self.canister = null; // drop canister
					maxDecel = 0; // I don't break for players
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
		var reached = driveToPosition(this, this.game.frameDuration, target.pos, epsTarget, maxSpeed, maxTurn, maxAccel, maxDecel);
		if(reached){
			if(target.type == "canister"){
				// Reached a canister: attach and run home
				this.canister = target;
				this.target = {type: "home", pos: new Point2(-50, -50)};
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
					self.velocity.accelerate(vDest.limit(3), 100);
				}
			}
		}, "bandit");
		// --- fire, if a player is in front of us
		if( this.attackMode && vTarget.length() < minFireDist 
				&& LinaJS.angleDiff(vTarget.angle(), this.orientation - 90*LinaJS.D2R) < 25*LinaJS.D2R){
			this.fire();
		}

	},
	render: function(ctx) {
		if(this.attackMode){
			ctx.strokeStyle = "red";
		}
		ctx.strokePolygon2(this.pg, false);
	},
	fire: function() {
		if(this.game.time - this.lastFire < 1000){
			return;
		}
		this.lastFire = this.game.time;
		var bullet = new Bullet({
			pos: this.pos.copy(),
			velocity: LinaJS.polarToVec(this.orientation + 0.5 * Math.PI, 200),
			ttl: 1.0
			});
		this.game.addObject(bullet);
	},
	// --- end of class
	__lastentry: undefined
});
