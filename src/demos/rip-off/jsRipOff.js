/*******************************************************************************
 * jsRipOff.js
 * 
 * Main classes.
 * 
 */

/*******************************************************************************
 * Class Bullet
 */
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
 * Class Tank
 */
var Tank = Movable.extend({
    init: function(id, pos, orientation, move) {
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
    init: function(id, pos, orientation, move) {
        this._super("asteroid", id, pos, orientation, move);
        this.pg = new Polygon2([4, 0,
                                2.5, 1.5,
                                1.5, 3.5,
                                -1.5, 2.5,
                                -4, 0,
                                -1.5, -3.5,
                                2, -3.5,
                                4, 0]);
        this.pg.transform(LinaJS.scale33(8, -8));
    },
    step: function(p) {
		this._super(p);
		this.pos.x = (p.width + this.pos.x) % p.width; 
		this.pos.y = (p.height + this.pos.y) % p.height;
    },
    render: function(p) {
		p.noFill();
		p.stroke(255, 255, 255);

		p.beginShape();
		for(var i=0; i<this.pg.xyList.length; i+=2)
			p.vertex(this.pg.xyList[i], this.pg.xyList[i+1]);
		p.endShape(p.CLOSE);
    },
    getBoundingRadius: function() {
    	return 8;
    },
    // --- end of class
    lastentry: undefined
});

