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
    	p.point(0, 0);
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
		this.pos.x = (p.width + this.pos.x) % p.width; 
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
    	var bullet = new Bullet(new Pos2(this.pos), aim, 100);
    	this.game.addObject(bullet);
    },
    // --- end of class
    lastentry: undefined
});

