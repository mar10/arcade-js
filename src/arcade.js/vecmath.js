/*******************************************************************************
 * Vector math helpers
 */

/*******************************************************************************
 * Tools
 */
var RAD_TO_DEGREE = 180.0 / Math.PI;
var DEGREE_TO_RAD = Math.PI / 180.0;

function vecToPolar(x, y) {
	return {a: Math.atan2(y, x), 
		    r: Math.sqrt(x * x + y * y)};
}

function polarToPos(a, r) {
	return { x: r * Math.cos(a), 
		     y: r * Math.sin(a) };
}

function polarToVec(a, r) {
	return { dx: r * Math.cos(a), 
		     dy: r * Math.sin(a) };
}

/*******************************************************************************
 * Class Pos2
 */
var Pos2 = Class.extend({
    init: function(x, y) {
		if(y === undefined){
			// Copy from Pos2
	        this.x = +x.x;
	        this.y = +x.y;
		} else {
	        this.x = +x;
	        this.y = +y;
		}
    },
    toString: function() {
        return "(" + this.x + "/" + this.y  + ")";
    },
    distanceTo: function(pos2) {
    	var dx = this.x - pos2.x;
    	var dy = this.y - pos2.y;
        return Math.sqrt(dx*dx + dy*dy);
    },
    rotate: function(a, pos) {
    	if(pos == undefined){
    		// rotate about 0/0
    	}else {
    		throw "not implemented";
    	}
    },
    translate: function(dx, dy) {
    	if(dy === undefined){
    		this.x += dx.dx; 
    		this.y += dx.dy; 
    	}else{
    		this.x += dx; 
    		this.y += dy; 
    	}
    },
    // --- end of class
    lastentry: undefined
});

/*******************************************************************************
 * Class Vec2
 * 2d vector that has an internal cartesian representation (x/y).
 */
var Vec2 = Class.extend({
    init: function(dx, dy) {
		if(dy === undefined){
			if(dx.a !== undefined){
				// Copy from Polar2
				this.dx = dx.r * Math.cos(dx.a);
    		    this.dy = dx.r * Math.sin(dx.a);
			}else{
				// Copy from Vec2
		        this.dx = +dx.dx;
		        this.dy = +dx.dy;
			}
		} else {
	        this.dx = +dx;
	        this.dy = +dy;
		}
    },
    toString: function() {
        return "(" + this.dx + ", " + this.dy  + ")";
    },
    rotate: function(a) {
    	var s = Math.sin(a), c = Math.cos(a);
    	this.dx = this.dx * c - this.dy * s;
    	this.dy = this.dy * c + this.dx * s;
    },
    normalize: function() {
    	// Convert to unit vector.
    	var l = this.length();
    	if(l) {
    		this.dx /= l;
    		this.dy /= l;
    	}
    },
    length: function() {
    	try {
			return Math.sqrt(this.dx * this.dx + this.dy * this.dy);
		} catch (e) {
			return 0;
		}
    },
    scale: function(f) {
		this.dx *= f;
		this.dy *= f;
    },
    setLength: function(l) {
    	this.scale(l / this.length());
    },
    getPolar: function() {
    	// Return {a:rad, r:length}
		throw "not implemented";
    },
    // --- end of class
    lastentry: undefined
});


/*******************************************************************************
 * Class Polar2
 * 2d vector that has an internal polar coordinate representation:
 * `a`: angle in radians
 * `r`: distance
 */
var Polar2 = Class.extend({
    init: function(a, r) {
		if(r === undefined){
			if(a.a !== undefined){
				// Copy from Polar2
		        this.a = +a.a;
		        this.r = +a.r;
			}else{
				// Copy from Vec2
				this.a = Math.atan2(a.dy, a.dx);
		    	this.r = Math.sqrt(a.dx * a.dx + a.dy * a.dy);
			}
		} else {
	        this.a = +a;
	        this.r = +r;
		}
		if( r === 0.0 )
			throw "invalid argument";
    },
    toString: function() {
        return "(a=" + RAD_TO_DEGREE*this.a + "°, r=" + this.r  + ")";
    },
    getCartesian: function() {
    	// Return {x:.., y:..}
    	return {x: this.r * Math.cos(a),
    		    y: this.r * Math.sin(a) };
    },
    rotate: function(a) {
		this.a += a;
    },
    normalize: function() {
		this.r = 1;
    },
    scale: function(f) {
		this.r *= 1;
    },
    setLength: function(l) {
		this.r = l;
    },
    // --- end of class
    lastentry: undefined
});


