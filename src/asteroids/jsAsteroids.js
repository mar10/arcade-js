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
        var speed = 1;
        obj = this.addObject(new Asteroid({
        	move: new Vec2(3, 4).setLength(speed),
        	rotationalSpeed: LinaJS.DEG_TO_RAD * 2
        }));
        obj = this.addObject(new Asteroid({
        	move: new Vec2(-3, -1).setLength(speed),
        	rotationalSpeed: LinaJS.DEG_TO_RAD * 2
        }));
        obj = this.addObject(new Asteroid({
        	move: new Vec2(-3, 3).setLength(speed),
        	rotationalSpeed: LinaJS.DEG_TO_RAD * 2
        }));
        obj = this.addObject(new Asteroid({
        	move: new Vec2(1, -4).setLength(speed),
        	rotationalSpeed: LinaJS.DEG_TO_RAD * 2
        }));
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
        this._super("bullet", null, opts);
    },
    toString: function() {
        return "Bullet(" + this.id + ")";
    },
    render: function(ctx) {
		ctx.strokeStyle = "#ffffff";
    	ctx.beginPath();
    	ctx.moveTo(-this.move.dx,-this.move.dy);
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
			move: new Vec2(0, 0),
			pos: new Point2(320, 200),
			screenModeX: "wrap",
			screenModeY: "wrap"
			}, opts);
        this._super("rocket", "player1", opts);
        this.pg = new Polygon2([0, 5,
                                -4, -5,
                                4, -5
                                ]);
        this.pg.transform(LinaJS.scale33(2, -2));
    },
    step: function() {
    },
    render: function(ctx) {
		ctx.strokeStyle = "white"; //"rgb(255, 255, 255)";
		ArcadeJS.renderPg(ctx, this.pg, "outline");
    },
    getBoundingRadius: function() {
    	return 13;
    },
    onKeypress: function(e, key) {
    	switch(key){
    	case " ":
    		this.fire();
    		break;
    	case "left":
    		this.orientation -= 5 * LinaJS.DEG_TO_RAD;
    		break;
    	case "right":
    		this.orientation += 5 * LinaJS.DEG_TO_RAD;
    		break;
    	case "up":
    		var vAccel = LinaJS.polarToVec(this.orientation - 90*LinaJS.DEG_TO_RAD, 0.1);
    		this.move.add(vAccel);
    		break;
    	}
    },
    onMousewheel: function(e, delta) {
    	this.game.debug("onMousewheel: %o, %s", e, delta);
    	this.rotationalSpeed += delta * LinaJS.DEG_TO_RAD;
    },
    fire: function() {
    	var aim = LinaJS.polarToVec(this.orientation - 0.5 * Math.PI, 10);
    	var bullet = new Bullet(new Point2(this.pos), aim, 50);
    	this.game.addObject(new Bullet({
    		pos: this.pos,
    		ttl: 20,
    		move: aim
    		}));
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
//        this._super("asteroid", id, pos, orientation, move);
        this._super("asteroid", null, opts);
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

