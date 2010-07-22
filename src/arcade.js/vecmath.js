/**
 * @fileOverview 2d vector math helpers.
 * @author <a href="mailto:moogle17@wwwendt.de">Martin Wendt</a>
 * @version 0.0.1
 * Vector math helpers
 */

/**
 * Taken from John Resig's http://ejohn.org/blog/simple-javascript-inheritance/
 * Inspired by base2 and Prototype
 */
(function(){
  var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;

  // The base Class implementation (does nothing)
  this.Class = function(){};
 
  // Create a new Class that inherits from this class
  Class.extend = function(prop) {
    var _super = this.prototype;
   
    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    initializing = true;
    var prototype = new this();
    initializing = false;
   
    // Copy the properties over onto the new prototype
    for (var name in prop) {
      // Check if we're overwriting an existing function
      prototype[name] = typeof prop[name] == "function" &&
        typeof _super[name] == "function" && fnTest.test(prop[name]) ?
        (function(name, fn){
          return function() {
            var tmp = this._super;
           
            // Add a new ._super() method that is the same method
            // but on the super-class
            this._super = _super[name];
           
            // The method only need to be bound temporarily, so we
            // remove it when we're done executing
            var ret = fn.apply(this, arguments);       
            this._super = tmp;
           
            return ret;
          };
        })(name, prop[name]) :
        prop[name];
    }
   
    // The dummy class constructor
    function Class() {
      // All construction is actually done in the init method
      if ( !initializing && this.init )
        this.init.apply(this, arguments);
    }
   
    // Populate our constructed prototype object
    Class.prototype = prototype;
   
    // Enforce the constructor to be what we expect
    Class.constructor = Class;

    // And make this class extendable
    Class.extend = arguments.callee;
   
    return Class;
  };
})();


/*******************************************************************************
 * Tools
 */
/** @constant */
var RAD_TO_DEGREE = 180.0 / Math.PI;
/** @constant */
var DEGREE_TO_RAD = Math.PI / 180.0;

/** Return polar coordinates {a:_, r:_} for a cartesian vector or point. */
function vecToPolar(x, y) {
	return {a: Math.atan2(y, x), 
		    r: Math.sqrt(x * x + y * y)};
}

/** Return a point {x:_, y:_} for the given polar coordinates. */
function polarToPos(a, r) {
	return { x: r * Math.cos(a), 
		     y: r * Math.sin(a) };
}

/** Return a vector {dx:_, dy:_} for the given polar coordinates. */
function polarToVec(a, r) {
	return { dx: r * Math.cos(a), 
		     dy: r * Math.sin(a) };
}

/** Check, if line segment pt1, pt2 is inside this polygon.*/
function segmentIntersects(pt1, pt2) {
	// TODO: Gems II, 1.2 and page 473
    return false;
}
/*****************************************************************************/

var Pos2 = Class.extend(
/** @lends Pos2.prototype */
{
	/**
     * Description of constructor.
     * @class 2D position that has an internal cartesian representation (x/y) 
     * and support for transformations.
     * @param {float|Pos2|JS-object} x X-coordinate or a Pos2 instance or {x:_, y:_}   
     * @param {float} y Y-coordinate or undefined, if x is a Pos2 instance or {x:_, y:_}   
     * @example 
     *   var pt1 = new Pos2(3, 4);
     *   pt1.rotate(Math.PI).translate(1, 2);
     *   var pt2 = new Pos2({x:2, y:1});
     *   var dist = pt1.distanceTo(pt2)
     * @constructs
     */
    init: function(x, y) {
		this.set(x, y);
	},
    /** Return string representation '(x/y)'. */
    toString: function() {
        return "(" + this.x + "/" + this.y  + ")";
    },
    /** Set coordinates.
     * @param {float|Pos2|JS-object} x X-coordinate or a Pos2 instance or {x:_, y:_}   
     * @param {float} y Y-coordinate or undefined, if x is a Pos2 instance or {x:_, y:_}   
     */
    set: function(x, y) {
		if(y === undefined){
			// Copy from Pos2
	        this.x = +x.x;
	        this.y = +x.y;
		} else {
	        this.x = +x;
	        this.y = +y;
		}
		return this;
    },
    /** Return distance from this to pos2. */
    distanceTo: function(pos2) {
    	var dx = this.x - pos2.x;
    	var dy = this.y - pos2.y;
        return Math.sqrt(dx*dx + dy*dy);
    },
    /** Return distance from this to pos2. 
     * @param {float} a Angle in radians.   
     * @param {Pos2} pt (optional) center of rotation, if not (0/0).   
     */
    rotate: function(a, pt) {
    	if(pt === undefined){
    		// rotate about 0/0
    	}else {
    		throw "not implemented";
    	}
    	return this;
    },
    /** Translate point (in-place) and return this instance. 
     * @param {float|Vec2} dx x-offset or offset vector
     * @param {float|ubdefined} dy y-offset (omit this parameter, if x is a Vec2)
     */
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


/*****************************************************************************/

var Vec2 = Class.extend(
/** @lends Vec2.prototype */
{
	/**
     * Description of constructor.
     * @class 2D vector that has an internal cartesian representation (dx/dy) 
     * and support for transformations.
     * @example 
     *   var v = new Vec2(3, 4);
     *   v.rotate(Math.PI).translate(1, 2);
     * @constructs
     */
    init: function(dx, dy) {
		this.set(dx, dy);
    },
    /** Return string representation '(dx, dy)'. */
    toString: function() {
        return "(" + this.dx + ", " + this.dy  + ")";
    },
    set: function(dx, dy) {
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
		return this;
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

/******************************************************************************/

var Polar2 = Class.extend(
/** @lends Polar2.prototype */
{
	/**
     * Create a new vector in polar coordinates.
     * @class 2d vector that has an internal polar coordinate representation:
     * `a`: angle in radians
     * `r`: distance 
     * and support for transformations.
     * @constructs
     * @param {radians|Polar2|JS-object} a
     * @param {distance|undefined} r
     */
    init: function(a, r) {
		this.set(a, r);
    },
    /** Return string representation '(a=_°, r=_)'. */
    toString: function() {
        return "(a=" + RAD_TO_DEGREE*this.a + "°, r=" + this.r  + ")";
    },
    set: function(a, r) {
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
		return this;
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

/*******************************************************************************
 * Class Matrix3
 * 3x3 matrix
 */
//var identity33 = [1, 0, 0, 0, 1, 0, 0, 0, 1];

/** Return a new Matrix3 (same as 'new Matrix3()'). */
function identityMatrix3(a) {
	return new Matrix3();
}
/** Return a new Matrix3 that represents a rotation about (0/0). */
function rotationMatrix3(a) {
	var s = Math.sin(a);
	var c = Math.cos(a);
	return new Matrix3([c, -s, 0, s, c, 0, 0, 0, 1]);
}
/** Return a new Matrix3 that represents a translation. */
function translationMatrix3(dx, dy) {
	return new Matrix3([1, 0, dx, 0, 1, dy, 0, 0, 1]);
}
/** Return a new Matrix3 that represents a scaling about (0/0). */
function scaleMatrix3(fx, fy) {
	if(fy === undefined)
		fy = +fx;
	return new Matrix3([fx, 0, 0, 0, fy, 0, 0, 0, 1]);
}


/**
 * Creates a new 3x3 matrix for transforming in 2d space.
 * @constructor
 * @param {undefined|Matrix3|float[9]} m
 */
Matrix3 = function(m){
	this.set(m);
}
/** Return string representation '[[0, 1, 2], [3, 4, 5], [6, 7, 8]]'.*/
Matrix3.prototype.toString = function() {
	var m = this.m;
    return "[["+m[0]+", "+m[1]+", "+m[2]+"], ["+m[3]+", "+m[4]+", "+m[5]+"], ["+m[6]+", "+m[7]+", "+m[8]+"]]";
}
/** Return string representation '[[0, 1, 2], [3, 4, 5], [6, 7, 8]]'.*/
Matrix3.prototype.set = function(m) {
	if( m === undefined) {
		this.m = [1, 0, 0, 0, 1, 0, 0, 0, 1];
	}else if( m.length ) {
		this.m = m.slice(0, 9);
	}else{
		this.m = m.m.slice(0, 9);
	}
	return this;
}
/** Create an return a copy of this matrix.*/
Matrix3.prototype.copy = function() {
    return new Matrix3(this.m);
}
/** Apply translation (in-place) and return this instance.*/
Matrix3.prototype.translate = function(dx, dy) {
    this.m[2] += dx;
    this.m[5] += dy;
    return this;
}
/** Apply scaling (in-place) and return this instance.*/
Matrix3.prototype.scale = function(fx, fy) {
	if(fy === undefined)
		fy = +fx;
    this.m[0] *= fx;
    this.m[4] *= fy;
    return this;
}
/** Apply rotation (in-place) and return this instance.*/
Matrix3.prototype.rotate = function(a, pt) {
	// TODO
    return this;
}
/** Apply transformation (in-place) and return this instance.*/
Matrix3.prototype.mult = function(m) {
    this.m[0] *= dx;
    this.m[4] *= dy;
    return this;
}


/**
 * Create a new 2d polygon.
 * @constructor
 * @param {Polygon2|float[]} xyList
 */
Polygon2 = function(xyList){
	this.set(xyList);
}
Polygon2.prototype.set = function(xyList){
	if( xyList.length) {
		this.xyList = xyList.slice(0, xyList.length);
	}else{
		this.xyList = xyList.xyList.slice(0, xyList.xyList.length);
	}
}
/** Return string representation '[(x1,y1), (x2,y2), ...]'.*/
Polygon2.prototype.toString = function() {
	var xy = this.xyList; 
	var l = [];
	for(var i=0; i<xy.length; i+=2){
		l.push("("+xy[i]+","+xy[i+1]+")"); 
	}
	return "[" + l.join(", ") + "]";
}
/** Create an return a copy of this polygon.*/
Polygon2.prototype.copy = function() {
    return new Polygon2(this.xyList);
}
/** Apply transformation matrix (in-place) and return this instance.*/
Polygon2.prototype.transform = function(m) {
	// TODO:
    return this;
}
/** Revert vertex list (in-place) and return this instance.*/
Polygon2.prototype.revert = function() {
	// TODO:
    return this;
}
/** Check, if pt is inside this polygon.*/
Polygon2.prototype.isInside = function(pt) {
	// TODO:
    return false;
}
/** Check, if this polygon intersects with another polygon.*/
Polygon2.prototype.intersects = function(polygon) {
	// TODO:
    return false;
}
/** Check, pos is inside this polygon.*/
Polygon2.prototype.area = function() {
	// TODO: Gems II, 1.1
    return 0;
}
/** Check, if this polygon has a counterclocwise vertex order.*/
Polygon2.prototype.isCCW = function() {
	// TODO:
    return 0;
}
/** Return the smallest bounding circle as {center: {x:_,y:_}, r:_}.*/
Polygon2.prototype.getBoundingCircle = function() {
	// TODO: Gems II, 1.4
    return 0;
}
/** Return the bounding box as {min: {x:_,y:_}, max: {x:_,y:_}}.*/
Polygon2.prototype.getBoundingBox = function() {
	// TODO: 
    return 0;
}
