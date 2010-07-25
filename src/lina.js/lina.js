/**
 * lina.js
 * Copyright (c) 2010,  Martin Wendt (http://wwWendt.de)
 * 
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://code.google.com/p/arcade-js/wiki/LicenseInfo
 *
 * A current version and some documentation is available at
 *     http://arcade-js.googlecode.com/
 * 
 * @fileOverview An independent object oriented library for points, vectors, 
 * and homogeneous transformations in 2D space.
 * A polygon class helps with collision detection and hit testing.
 * 
 * @author Martin Wendt
 * @version 0.0.1
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

/** Return intersection point of line segment pt1/pt2 with with segment pt3/pt4.*/
function segmentsIntersect(pt1, pt2, pt3, pt4) {
	// TODO: Gems II, 1.2 and page 473
    return null;
}

/** Return intersection point of line segment pt1/pt2 with with segment pt3/pt4.
 *
 * @returns {pt|null|undefined} intersection point {x:_, y:_} or null if there is no intersection.
 * undefined is returned, if segments are collinear.
 */
function lineIntersection(pt1, pt2, pt3, pt4) {
	// TODO: 
    return null;
}

/** Return shortest distance between a point and a line through ptA/ptB.*/
function distancePtLine(pt, ptA, ptB) {
	// TODO: Gems II, 1.3
    return 0;
}

/** Return shortest distance between a point and the line segment from ptA to ptB.*/
function distancePtSegment(pt, ptA, ptB) {
	// TODO: Gems II, 1.3
    return 0;
}

/** Return true, if lina.js objects a and b are the same (within eps).
 * This function is not optimized for speed, but handy for unit tests.
 * @param a {float|Point2|Vec2|Matrix3,JS-Object,...}  
 * @param b must have the same type as a  
 * @param eps {float} Maximum accepted difference, defaults to 0.00001
 */

function linaCompare(a, b, eps) {
	var eps = eps === undefined ? 1e-6 : eps;
	if( a === undefined || b === undefined ){
		// undefined is equal to nothing! 
		return false;
	} else if( a.m !== undefined || b.m !== undefined){
		// Matrix3 (also allow comparison to an array)
		a = a.m || a;
		b = b.m || b;
		return linaCompare(a, b, eps);
	} else if( a.xyList !== undefined || b.xyList !== undefined){
		// Polygon2 (also allow comparison to an array)
		a = a.xyList || a;
		b = b.xyList || b;
		return linaCompare(a, b, eps);
	} else if( typeof a !== typeof b ){
			return false;
	} else if( typeof a === "string" ){
		return a === b;
	} else if( typeof a === "number" ){
		return Math.abs(a-b) <= eps;
	} else if( a && a.constructor === Array ){
		if( a.length !== b.length)
			return false;
		for(var i=0; i<a.length; i++)
			if(!linaCompare(a[i], b[i], eps))
				return false;
	} else if( a.x !== undefined ){
		return linaCompare(a.x, b.x, eps) && linaCompare(a.y, b.y, eps);
	} else if( a.dx !== undefined ){
		return linaCompare(a.dx, b.dx, eps) && linaCompare(a.dy, b.dy, eps);
	} else if( a.a !== undefined ){
		return linaCompare(a.a, b.a, eps) && linaCompare(a.r, b.r, eps);
	} else if( a.xyList !== undefined ){
		// Polygon2
		return linaCompare(a.xyList, b.xyList, eps);
	} else {
		alert("linaCompare: unsupported types\n  " + a + "("+(typeof a)+"),\n  " + b+ "("+(typeof b)+")");
	}
    return true;
}


/*****************************************************************************/

var Point2 = Class.extend(
/** @lends Point2.prototype */
{
	/**
     * Description of constructor.
     * @class 2D position that has an internal cartesian representation (x/y) 
     * and support for transformations.
     * @param {float|Point2|JS-object} x X-coordinate or a Point2 instance or {x:_, y:_}   
     * @param {float} y Y-coordinate or undefined, if x is a Point2 instance or {x:_, y:_}   
     * @example 
     *   var pt1 = new Point2(3, 4);
     *   pt1.rotate(Math.PI).translate(1, 2);
     *   var pt2 = new Point2({x:2, y:1});
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
     * @param {float|Point2|JS-object} x X-coordinate or a Point2 instance or {x:_, y:_}   
     * @param {float} y Y-coordinate or undefined, if x is a Point2 instance or {x:_, y:_}   
     */
    set: function(x, y) {
		if(y === undefined){
			// Copy from Point2
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
     * @param {Point2} pt (optional) center of rotation, if not (0/0).   
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
	return new Matrix3([ c, s, 0, 
	                    -s, c, 0, 
	                     0, 0, 1]);
}
/** Return a new Matrix3 that represents a translation. */
function translationMatrix3(dx, dy) {
	return new Matrix3([ 1,  0, 0, 
	                     0,  1, 0, 
	                    dx, dy, 1]);
}
/** Return a new Matrix3 that represents a scaling about (0/0). */
function scaleMatrix3(fx, fy) {
	if(fy === undefined)
		fy = +fx;
	return new Matrix3([fx,  0, 0, 
	                     0, fy, 0, 
	                     0,  0, 1]);
}


/**
 * Creates a new 3x3 matrix for transforming in 2d space.
 * @constructor
 * @param {undefined|Matrix3|float[9]} m
 * 
 * Translation:
 * @example
 * [1  0  0,
 *  0  1  0,
 *  Tx Ty 1]
 *  
 * Scale:
 * @example
 * [Sx 0  0,
 *  0  Sy 0,
 *  0  0  1]
 *  
 * Rotation:
 * @example
 * [ c  s 0,
 *  -s  c 0,
 *   0  0 1]
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
	/* TODO: optimize 
	 * for last column = [0, 0, 1] this simplifies to 
	 *   this.m[6] += dx;
	 *   this.m[7] += dy;
	 */
	var m = this.m;
	m[0] += dx*m[2];    m[1] += dy*m[2];
	m[3] += dx*m[5];    m[4] += dy*m[5];
	m[6] += dx*m[8];    m[7] += dy*m[8];
    return this;
}
/** Apply scaling (in-place) and return this instance.*/
Matrix3.prototype.scale = function(fx, fy) {
	if(fy === undefined)
		fy = +fx;
	var m = this.m;
    m[0] *= fx;    m[1] *= y;
    m[3] *= fx;    m[4] *= y;
    m[6] *= fx;    m[7] *= y;
    return this;
}
/** Apply rotation (in-place) and return this instance.*/
Matrix3.prototype.rotate = function(a, pt) {
	if( pt === undefined ){
//		return this.mult(rotationMatrix3(a));
		var c = Math.cos(a);
		var s = Math.sin(a);
		var m = this.m;
		var t = m.slice(0, 9); // Temporary copy
		m[0] = c*t[0] - s*t[1];    m[1] = s*t[0] + c*t[1];
		m[3] = c*t[3] - s*t[4];    m[4] = s*t[3] + c*t[4];
		m[6] = c*t[6] - s*t[7];    m[7] = s*t[6] + c*t[7];
		return this;
	}else{
		return this.translate(-pt.x, -pt.y)
			.rotate(a)
			.translate(pt.x, pt.y);
	}
}
/** Apply transformation (in-place) and return this instance.*/
Matrix3.prototype.mult = function(mb) {
	/* TODO: optimize 
	 * http://www.euclideanspace.com/maths/algebra/matrix/resources/code/index.htm#mul3
	 * Newman, p.62ff
	 * 
	 */
	var ma = this.m;
	var mb = mb.length ? mb : mb.m;
	var mc = [0,0,0, 0,0,0, 0,0,0];
//	alert(ma+"\n*"+mb);
	for(var row=0; row<3; row++) {
		for(var col=0; col<3; col++) {
			var c = 3*row + col;
			for(var i=0; i<3; i++) {
				var a = 3*row + i;
				var b = 3*i + col;
				mc[c] += ma[a] * mb[b];   
			}
		}
	}
//	alert(ma+"\n*"+mb+"\n="+mc);
	this.set(mc);
    return this;
}
/** Return transformed x and y as JS-object {x:x', y:y'}.*/
Matrix3.prototype.transformXY = function(x, y) {
	/*
	 * TODO: optimize
	 * TODO: this assumes last col is [0,0,1]
	 * See Newman, p.64
	 */
	var m = this.m;
    return {
    	x: m[0]*x + m[3]*y + m[6],
    	y: m[1]*x + m[4]*y + m[7]
    };
}
/** Transpose (in-place) and return this instance.*/
Matrix3.prototype.transpose = function() {
	var m = this.m, t;
	t = m[1]; m[1] = m[3]; m[3] = t;
	t = m[2]; m[2] = m[6]; m[6] = t;
	t = m[5]; m[5] = m[7]; m[7] = t;
    return this;
}
/** Invert (in-place) and return this instance.*/
Matrix3.prototype.invert = function() {
	// TODO
	alert("Not implemented: Matrix3.invert()");
    return this;
}
/** Calculate the determinant.*/
Matrix3.prototype.det = function() {
	// TODO
	alert("Not implemented: Matrix3.det()");
    return 0;
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
	var xy = this.xyList; 
	for(var i=0; i<xy.length; i+=2){
		pt2 = m.transformXY(xy[i], xy[i+1]);
		xy[i] = pt2.x;
		xy[i+1] = pt2.y;
	}
    return this;
}
/** Revert vertex list (in-place) and return this instance.*/
Polygon2.prototype.revert = function() {
	var xy = this.xyList, t;
	var len = xy.length;
	for(var i=0; i<(len-1)/2; i+=2){
		var j = len - i - 2;
		t = xy[i]; xy[i] = xy[j]; xy[j] = t;
		t = xy[i+1]; xy[i+1] = xy[j+1]; xy[j+1] = t;
	}
    return this;
}
/** Check, if pt is inside this polygon.*/
Polygon2.prototype.isInside = function(pt) {
	// TODO:
	alert("Not implemented: Polygon2.isInside()");
    return false;
}
/** Check, if this polygon intersects with another polygon.*/
Polygon2.prototype.intersects = function(polygon) {
	// TODO:
	alert("Not implemented: Polygon2.intersects()");
    return false;
}
/** Check, if line segment pt1, pt2 is inside this polygon.*/
Polygon2.prototype.segmentIntersects = function (pt1, pt2) {
	// TODO: Gems II, 1.2 and page 473
	alert("Not implemented: Polygon2.segmentIntersects()");
    return false;
}
/** Check, pos is inside this polygon.*/
Polygon2.prototype.area = function() {
	// TODO: Gems II, 1.1
	alert("Not implemented: Polygon2.area()");
    return 0;
}
/** Check, if this polygon has a counterclocwise vertex order.*/
Polygon2.prototype.isCCW = function() {
	// TODO:
	alert("Not implemented: Polygon2.isCCW()");
    return 0;
}
/** Return the smallest bounding circle as {center: {x:_,y:_}, r:_}.*/
Polygon2.prototype.getBoundingCircle = function() {
	// TODO: Gems II, 1.4
	alert("Not implemented: Polygon2.getBoundingCircle()");
    return 0;
}
/** Return the bounding box as {min: {x:_,y:_}, max: {x:_,y:_}}.*/
Polygon2.prototype.getBoundingBox = function() {
	// TODO: 
	alert("Not implemented: Polygon2.getBoundingBox()");
    return 0;
}
/** Return a new polygon that connects the extreme points of this polygon.*/
Polygon2.prototype.getBoundingPolygon = function() {
	// TODO: 
	alert("Not implemented: Polygon2.getBoundingPolygon()");
    return null;
}
/** Return a new polygon that draws along the outer lines of this polygon.*/
Polygon2.prototype.getShapePolygon = function() {
	// TODO: 
	alert("Not implemented: Polygon2.getBoundingPolygon()");
    return null;
}
