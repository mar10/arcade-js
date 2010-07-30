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
			fps: 100
		}, customOpts);
        this._super(canvas, opts);
        
        // Set the scene
        var obj;
        obj = this.addObject(new Asteroid())
        obj.move = new Vec2(3, 4);
        obj.rotationalSpeed = LinaJS.DEG_TO_RAD * 2;

        obj = this.addObject(new Asteroid())
        obj.move = new Vec2(-3, -1);
        obj.rotationalSpeed = LinaJS.DEG_TO_RAD * 2;

        obj = this.addObject(new Asteroid())
        obj.move = new Vec2(-3, 3);
        obj.rotationalSpeed = LinaJS.DEG_TO_RAD * 2;

        obj = this.addObject(new Asteroid())
        obj.move = new Vec2(1, -4);
        obj.rotationalSpeed = LinaJS.DEG_TO_RAD * 2;

        // Start render loop
        this.startLoop()
    },
    render: function(p) {
//    	p.point(0, 0);
    	var v
    	p.line(this.move.dx,this.move.dy, 0,0);
    },
    getBoundingRadius: function() {
    	return 0.1;
    },
    // --- end of class
    lastentry: undefined
});


var Bullet = Movable.extend({
    init: function(pos, move, ttl) {
        this._super("bullet", null, pos, 0, move);
		this.ttl = ttl;
        this.scale = 2;
    },
    toString: function() {
        return "Bullet(" + this.id + ")";
    },
    render: function(p) {
//    	p.point(0, 0);
    	var v
    	p.line(this.move.dx,this.move.dy, 0,0);
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
var Rocket = Movable.extend({
    init: function(id, m) {
        this._super("tank", id, pos, orientation, move);
    },
    step: function(p) {
		this._super(p);
		// wrap around screen borders
		/*
		this.pos.x = (p.width + this.pos.x) % p.width; 
		this.pos.y = (p.height + this.pos.y) % p.height;
		*/ 
		if(this.pos.x > p.width) {
			this.pos.x = p.width;
			this.move.dx *= -1;
		} else if(this.pos.x < 0) {
			this.pos.x = 0;
			this.move.dx *= -1;
		}
		this.pos.y = (p.height + this.pos.y) % p.height;
//		window.console.log(""+this);
    },
    render: function(p) {
		p.fill(255, 0, 0);
		p.stroke(0, 255, 0);
    	p.rect(-5, 2, 10, 8);
		p.triangle(0,-8, -5,7, 5,7);
//		p.ellipse(this.pos.x, this.pos.y, 5, 10);
    },
    getBoundingRadius: function() {
    	return 8;
    },
    fire: function() {
    	var aim = polarToVec(this.orientation - 0.5 * Math.PI, 10);
    	var bullet = new Bullet(new Point2(this.pos), aim, 50);
    	this.game.addObject(bullet);
    },
    // --- end of class
    lastentry: undefined
});

/*******************************************************************************
 * Class Asteroid
 */
var Asteroid = Movable.extend({
    init: function(id, initialTran) {
		var pos = new Point2(100, 100);
		var orientation = 0;
		var move = new Vec2(2, 3);
        this._super("asteroid", id, pos, orientation, move);
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
    step: function() {
    	// Let Movable base class calc the new transformations
		this._super();
		// Implement wrap-around at screen borders
		var w = this.game.canvas.width;
		var h = this.game.canvas.height;
		this.pos.x = (w + this.pos.x) % w; 
		this.pos.y = (h + this.pos.y) % h;
    },
    render: function(ctx) {
		ctx.fillStyle = "#09F";
		ctx.strokeStyle = "white"; //"rgb(255, 255, 255)";

		// Draw a polygon
		var xy = this.pg.xyList;
		ctx.beginPath();  
		ctx.moveTo(xy[0], xy[1]);  
		for(var i=2; i<xy.length; i+=2)
			ctx.lineTo(xy[i], xy[i+1]);
//		ctx.fill();
		ctx.closePath(); // not required, if fill() is called instead of stroke()
		ctx.stroke();
    },
    getBoundingRadius: function() {
    	return 8;
    },
    onKeypress: function(e) {
    	//alert("onKeypress" + e + ", t="+ this);
    },
    onMousewheel: function(e, delta) {
    	//alert("onMousewheel" + e + ", t="+ this);
    	this.game.debug("onMousewheel: %o, %s", e, delta);
    },
    // --- end of class
    lastentry: undefined
});

