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
				showKeys: true,
				showFps: true,
				showObjects: true
			}
		}, customOpts);
        this._super(canvas, opts);
        
        // --- Status data -----------------------------------------------------
        this.liveCount = 3;
        this.level = 1;
        this.score = 0;
        this.shotTtl = 40;
        this.shotDelay = 250; // ms
        this.gracePeriod = 500; // frames

        // --- Cache sounds ----------------------------------------------------
//        this.gunSound = new AudioJS("shot.wav");
        this.gunSound = new AudioJS("fire.wav");
        this.explosionSound = new AudioJS("damage.wav");
        
        // Set the scene
        var obj;
        // Player rocket
        obj = this.addObject(new Rocket())
        this._restartGame();

        // --- Start render loop -----------------------------------------------
        this.startLoop()
    },
    _restartGame: function(){
        this.setActivity("prepare");

        // Asteroids
        var speed = 0.5 * (1.0 + (this.level - 1) * 0.3);
        var pt0 = new Point2(0, 0);
        for(var i=0; i<this.level; i++)
			this._makeAsteroid(3, pt0, new Vec2(LinaJS.random(-3, 3), LinaJS.random(-3, 3)).setLength(speed));
        /*
		this._makeAsteroid(3, pt0, new Vec2(3, 4).setLength(speed));
		this._makeAsteroid(3, pt0, new Vec2(-3, -1).setLength(speed));
		this._makeAsteroid(3, pt0, new Vec2(-3, 3).setLength(speed));
		if(this.level > 1)
			this._makeAsteroid(3, pt0, new Vec2(1, -4).setLength(speed));
			*/
        this.setTimeout(2000, function(){
            this.setActivity("running");
        });
    },
    _makeAsteroid: function(size, pos, velocity){
    	this.addObject(new Asteroid({
    		size: size,
    		pos: new Point2(pos.x + LinaJS.random(-10, 10), pos.y + LinaJS.random(-10, 10)),
    		velocity: new Vec2(velocity.dx + LinaJS.random(-0.2, +0.2), velocity.dx + LinaJS.random(-0.2, +0.2)),
    		rotationalSpeed: LinaJS.random(-2*LinaJS.DEG_TO_RAD, 2*LinaJS.DEG_TO_RAD),
			debug: {
				showBCircle: true,
				showVelocity: true,
				velocityScale: 15.0
			}
    	}));
    },
	preStep: function(){
    	var hasAsteroids = this.getObjectsByType("asteroid").length > 0;
    	if(!hasAsteroids){
    		this.level += 1;
    		this.score += 1000;
    		this._restartGame();
    	}
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
    	if(this.getActivity() === "prepare"){
        	ctx.font = "30px sans-serif";
    		ctx.strokeText("Level " + this.level, 200, 200);
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


/* ****************************************************************************/


var Bullet = Movable.extend({
    init: function(opts) {
		opts = $.extend({
//			scale: 2,
			ttl: 20,
		}, opts);
        this._super("bullet", opts);
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
		ctx.strokeStyle = "#ffffff";
    	ctx.beginPath();
    	ctx.moveTo(-this.velocity.dx, -this.velocity.dy);
    	ctx.lineTo(0, 0);
    	ctx.stroke();
    },
    getBoundingRadius: function() {
    	return 0.1;
    },
    // --- end of class
    lastentry: undefined
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
			screenModeX: "wrap",
			screenModeY: "wrap"
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
        
        this.lastShotTime = 0;
    },
    getBoundingRadius: function() {
    	return 13;
    },
    step: function() {
    	var list = this.game.getObjectsByType("asteroid");
    	for(var i=0; i<list.length; i++) {
    		var obj = list[i];
    		if(!this.game.preCheckCollision(this, obj))
    			continue;
    		if(this.getActivity() === "grace")
    			continue;
    		// Pre-check is exact enough for our purpose...
    		this.game.debug("%s vs. %s", this, obj);
    		obj.hitBy(this);
        	this.game.explosionSound.play();
        	this.game.liveCount -= 1;
        	if(this.game.liveCount > 0){
                this.setActivity("grace");
                this.timeout = this.game.gracePeriod;
        	} else {
                this.game.setActivity("over");
        	}
//    		this.game.stopLoop();
    	}
    },
    render: function(ctx) {
		ctx.strokeStyle = "white";
		ctx.strokePolygon2(this.pg);
		if(this.getActivity() === "grace"){
			var circle = new Circle2(new Point2(0,0), this.getBoundingRadius() + LinaJS.random(-1, +1));
			ctx.strokeStyle = "#88f";
			ctx.strokeCircle2(circle);
		}
		if(this.game.isKeyDown(38)){ // Up
			ctx.strokeStyle = "#f80";
			ctx.translate(LinaJS.random(-1, +1), LinaJS.random(-1, +1));
			ctx.strokePolygon2(this.pgThrust);
    	}
    },
    onTimeout: function() {
		if(this.getActivity() === "grace" && this.game.liveCount > 0){
            this.setActivity("idle");
		}
    },
    onKeypress: function(e) {
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
    		var vAccel = LinaJS.polarToVec(this.orientation - 90*LinaJS.DEG_TO_RAD, 0.1);
    		this.velocity.add(vAccel);
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
		if(this.getActivity() === "grace" )
			return;
    	if((this.game.time - this.lastShotTime) < this.game.shotDelay )
    		return;
        this.lastShotTime = this.game.time;
    	var aim = LinaJS.polarToVec(this.orientation - 0.5 * Math.PI, 10);
    	var bullet = new Bullet(new Point2(this.pos), aim, 50);
    	this.game.addObject(new Bullet({
    		pos: this.pos,
    		ttl: this.game.shotTtl,
    		velocity: aim
    		}));
    	this.game.gunSound.play();
    },
    // --- end of class
    lastentry: undefined
});

/*******************************************************************************
 * Class Asteroid
 */
var Asteroid = Movable.extend({
    init: function(opts) {
		opts = $.extend({
			screenModeX: "wrap",
			screenModeY: "wrap",
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
    getBoundingRadius: function() {
    	return 2*this.size * 4;
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
    lastentry: undefined
});

