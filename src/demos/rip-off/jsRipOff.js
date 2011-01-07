/*******************************************************************************
 * jsRipOff.js
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
		this.gunSound = new AudioJS(["fire.mp3", "fire.oga", "fire.wav"]);
		this.explosionSound = new AudioJS(["damage.mp3", "damage.oga"]);

		this.player1 =  this.addObject(new Tank({id: "player1", pos: new Point2(540, 100)})); 
		this.player2 =  null; //this.addObject(new Tank({id: "player2", pos: new Point2(100, 100)}));
		// Seed 8 canisters in the center
//		this.canisters = [];
		for(var i=0; i<8; i++){
			var pos = new Point2(LinaJS.random(250, 390), LinaJS.random(190, 290));
//			this.canisters[i] = this.addObject(new Canister({pos: pos}));
			this.addObject(new Canister({pos: pos}));
		}
		// 
		this.startWave();
		
		// Start render loop
		this.startLoop()
	},
	
	startWave: function(){
		var i,
			maxBandits = 5,
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
			ttl: 1 // live max. 1 second
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

var Tank = Movable.extend({
	init: function(opts) {
		this._super("tank", $.extend({
//			debug: {showBCircle: true}
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
		}, opts));
		this.pg = pgTank1.copy().transform(LinaJS.scale33(.8));
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
			maxSpeed = 100,
			self = this;

//		if(vTarget.length() < minCanisterDist){
//			
//		}
		// If a player is in reach, switch to attack mode
		this.attackMode = false;
		if( !this.isActivity("attack turn run")){
			this.game.visitObjects(function(obj){
				vDest = self.pos.vectorTo(obj.pos);
				if(vDest.length() < minAttackDist){
//					self.target = obj;
					target = obj;
					vTarget = vDest;
					self.attackMode = true;
					return false;
				}
			}, "tank");
		}
//		self.game.debug("vTarget.angle():" + vTarget.angle());
		// If a canister is in reach, go for it
		this.game.visitObjects(function(obj){
			vDest = obj.pos.vectorTo(self.pos);
			if(vDest.length() < minBuddyDist){
				self.velocity.accelerate(vDest.limit(3), 100);
			}
		}, "canister");
		if(this.isActivity("attach")){
			da = 2;
		}else if(this.isActivity("run")){
			
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
		// --- move to target
		vDest = this.pos.vectorTo(target.pos);
		this.velocity.accelerate(vDest.setLength(3), 100);
		// make sure we are heading to the moving direction
		this.orientation = this.velocity.angle() - 90*LinaJS.D2R;
//		this.game.debug("v: " + this.velocity);
		if( this.attackMode && vTarget.length() < minFireDist 
				&& Math.abs(vTarget.angle() - this.orientation - 90*LinaJS.D2R) < 25*LinaJS.D2R){
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
