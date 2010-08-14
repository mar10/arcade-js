/*******************************************************************************
 * jsRipOff.js
 * 
 * Main classes.
 * 
 */

/*******************************************************************************
 * Class Bullet
 */

var AsteroidsGame = ArcadeJS.extend({
    init: function(canvas, customOpts) {
		// Init ArcadeJS
		var opts = $.extend({
			name: "jsAsteroids",
			fps: 30
		}, customOpts);
        this._super(canvas, opts);
        
        // Set the scene
        var obj;
        // Player rocket
        obj = this.addObject(new Rocket())
        // Asteroids
        var speed = 0.5;
        obj = this.addObject(new Asteroid({
        	velocity: new Vec2(3, 4).setLength(speed),
        	rotationalSpeed: LinaJS.DEG_TO_RAD * 2
        }));
        obj = this.addObject(new Asteroid({
        	velocity: new Vec2(-3, -1).setLength(speed),
        	rotationalSpeed: LinaJS.DEG_TO_RAD * 2
        }));
        obj = this.addObject(new Asteroid({
        	velocity: new Vec2(-3, 3).setLength(speed),
        	rotationalSpeed: LinaJS.DEG_TO_RAD * 2
        }));
        obj = this.addObject(new Asteroid({
        	velocity: new Vec2(1, -4).setLength(speed),
        	rotationalSpeed: LinaJS.DEG_TO_RAD * 2
        }));
        // Cache sounds
        this.gunSound = new AudioJS("shot.wav");
        this.explosionSound = new AudioJS("damage.wav");
        // Start render loop
        this.startLoop()
    },
    // --- end of class
    lastentry: undefined
});


/******************************************************************************/


var Bullet = Movable.extend({
    init: function(opts) {
		opts = $.extend({
			scale: 2,
			ttl: 10
		}, opts);
        this._super("bullet", opts);
    },
    toString: function() {
        return "Bullet(" + this.id + ")";
    },
    step: function() {
    	var asteroids = this.game.getObjectsByType("asteroid");
    	for(var i=0; i<asteroids.length; i++) {
    		var a = asteroids[i];
    		if( this.pos.distanceTo(a.pos) < a.getBoundingRadius() ){
        		this.game.debug("bullet hits %s", a);
        		this.die();
        		a.die();
            	this.game.explosionSound.play();
        		//this.game.stopLoop();
    		}
    	}
    },
    render: function(ctx) {
		ctx.strokeStyle = "#ffffff";
    	ctx.beginPath();
    	ctx.moveTo(-this.velocity.dx,-this.velocity.dy);
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
                                4, -5
                                ]);
        this.pg.transform(LinaJS.scale33(2, -2));
    },
    step: function() {
		var c1 = {
    			x: this.pos.x,
    			y: this.pos.y,
    			vx: this.velocity.dx,
    			vy: this.velocity.dy,
    			r: this.getBoundingRadius()
    		}
    	var asteroids = this.game.getObjectsByType("asteroid");
    	for(var i=0; i<asteroids.length; i++) {
    		var a = asteroids[i];
    		if( this.pos.distanceTo(a.pos) > (a.getBoundingRadius() + c1.r))
    			continue;
    		var c2 = {
    			x: a.pos.x,
    			y: a.pos.y,
    			vx: a.velocity.dx,
    			vy: a.velocity.dy,
    			r: a.getBoundingRadius()
    		}
    		var coll = LinaJS.intersectMovingCircles(c1, c2, 5);
//    		this.game.debug("rocket %o vs. %o: %o", c1, c2, coll);
    		if( coll && Math.abs(coll.t) <= 1  ){
        		this.game.debug("rocket %o vs. %o: %o", c1, c2, coll);
            	this.game.explosionSound.play();
        		this.game.stopLoop();
    		}
    	}
    },
    render: function(ctx) {
		ctx.strokeStyle = "white"; //"rgb(255, 255, 255)";
		ArcadeJS.renderPg(ctx, this.pg, "outline");
    },
    getBoundingRadius: function() {
    	return 13;
    },
    onKeypress: function(e, key) {
    	this.game.debug("%s: '%s', %o", e.type, key, this.game.downKeyCodes);
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
    		e.stopPropagation();
    	}
    },
    onMousewheel: function(e, delta) {
    	this.game.debug("onMousewheel: %o, %s", e, delta);
    	this.rotationalSpeed += delta * LinaJS.DEG_TO_RAD;
		e.stopPropagation();
    },
    fire: function() {
    	var aim = LinaJS.polarToVec(this.orientation - 0.5 * Math.PI, 10);
    	var bullet = new Bullet(new Point2(this.pos), aim, 50);
    	this.game.addObject(new Bullet({
    		pos: this.pos,
    		ttl: 20,
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
			screenModeY: "wrap"
			}, opts);
        this._super("asteroid", opts);
        this.pg = new Polygon2([4, 0,
                                2.5, 1.5,
                                1.5, 3.5,
                                -1.5, 2.5,
                                -4, 0,
                                -1.5, -3.5,
                                2, -3.5
                                ]);
        this.pg.transform(LinaJS.scale33(8, -8));
    },
    /*
    step: function() {
    	// Let Movable base class calc the new transformations
//		this._super();
		// Implement wrap-around at screen borders
		var w = this.game.canvas.width;
		var h = this.game.canvas.height;
		this.pos.x = (w + this.pos.x) % w; 
		this.pos.y = (h + this.pos.y) % h;
    },*/
    render: function(ctx) {
		ctx.fillStyle = "#09F";
		ctx.strokeStyle = "white"; //"rgb(255, 255, 255)";
		ArcadeJS.renderPg(ctx, this.pg, "outline");
    },
    getBoundingRadius: function() {
    	return 8 * 4;
    },
    // --- end of class
    lastentry: undefined
});

