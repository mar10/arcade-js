/**
 * lina.js
 *
 * Copyright (c) 2010-2011,  Martin Wendt (http://wwWendt.de)
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
/*jslint laxbreak: true */
/*******************************************************************************
 * Tools
 */

/**
 * @namespace Namespace for global constants and functions.
 */
LinaJS = {
	// var identity33 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
	/**
	 * Factor that converts radians to degree.
	 *
	 * @constant
	 */
	RAD_TO_DEG: 180.0 / Math.PI,
	/**
	 * Factor that converts degree to radians.
	 * @constant
	 */
	DEG_TO_RAD: Math.PI / 180.0,
	/** Default epsilon value use in some comparisons.
	 * @constant
	 */
	EPS: 1e-5,
	/** Squared LinaJS.EPS.
	 * @constant
	 */
	EPS_SQUARED: 1e-5 * 1e-5,


	/**Return random float value f, with min <= f <= max').
	 * @example
	 * random(10); // return 0.00 .. 10.00
	 * random(2, 5); // return 2.00 .. 5.00
	 */
	random: function(min, max) {
		if( max === undefined ){
			max = min;
			min = 0;
		}
		return min + (max-min) * Math.random();
	},
	/**Return random integer value i, with min <= i <= max').
	 * @example
	 * randomInt(10); // return 0..10
	 * randomInt(2, 5); // return 2..5
	 */
	randomInt: function(min, max) {
		if( max === undefined ){
			max = min;
			min = 0;
		}
		return min + Math.floor((max-min+1) * Math.random());
	},
	/** Return a new Matrix3 (same as 'new Matrix3()'). */
	identity33: function() {
		return new Matrix3();
	},
	/** Return a new Matrix3 that represents a rotation about (0/0). */
	rotation33: function(a) {
		var s = Math.sin(a);
		var c = Math.cos(a);
		return new Matrix3( [ c, s, 0, -s, c, 0, 0, 0, 1 ]);
	},
	/** Return a new Matrix3 that represents a translation. */
	translation33: function(dx, dy) {
		return new Matrix3( [ 1, 0, 0, 0, 1, 0, dx, dy, 1 ]);
	},
	/** Return a new Matrix3 that represents a scaling about (0/0). */
	scale33: function(fx, fy) {
		if (fy === undefined){
			fy = +fx;
		}
		return new Matrix3( [ fx, 0, 0, 0, fy, 0, 0, 0, 1 ]);
	},

	/** Return polar coordinates {a:_, r:_} for a cartesian vector or point. */
	vecToPolar: function(x, y) {
		return {a: Math.atan2(y, x),
				r: Math.sqrt(x * x + y * y)};
	},

	/** Return a point {x:_, y:_} for the given polar coordinates. */
	polarToPt: function(a, r) {
		return { x: r * Math.cos(a),
				 y: r * Math.sin(a) };
	},

	/** Return a vector {dx:_, dy:_} for the given polar coordinates. */
	polarToVec: function(a, r) {
		return { dx: r * Math.cos(a),
				 dy: r * Math.sin(a) };
	},

	/**Reflect this vector (in-place) and return this instance.
	 * @param {Vec2} vec
	 * @param {Vec2} reflectionNormal Normal vector pointing from reflection
	 * line towards vec.
	 * @returns {Vec2}
	 */
	reflectedVector: function(vec, reflectionNormal) {
		// TODO: this can be optimized
		var perp = reflectionNormal.copy().perp();
		var a = vec.dot(perp);
		var b = vec.dot(reflectionNormal);
		var reflected = reflectionNormal.copy().scale(-b).add(perp.scale(a));
		//window.console.log("len(vec)"+vec.length()+", len(ref):"+reflected.length()+",a+b:"+(a+b))
		return reflected;
	},

	/** @private */
	_segmentsIntersect: function(pt1x, pt1y, pt2x, pt2y, pt3x, pt3y, pt4x, pt4y) {
		// public domain function by Darel Rex Finley, 2006
		// Return null, if the segments are colinear, even if they overlap.
		// Fail if either line segment is zero-length.
		if (pt1x==pt2x && pt1y==pt2y || pt3x==pt4x && pt3y==pt4y){
			return null;
		}
		// Fail if the segments share an end-point.
		if (pt1x==pt3x && pt1y==pt3y || pt2x==pt3x && pt2y==pt3y
			||  pt1x==pt4x && pt1y==pt4y || pt2x==pt4x && pt2y==pt4y) {
			return null;
		}
		// (1) Translate the system so that point A is on the origin.
		pt2x -= pt1x; pt2y -= pt1y;
		pt3x -= pt1x; pt3y -= pt1y;
		pt4x -= pt1x; pt4y -= pt1y;
		// Discover the length of segment A-B.
		var distAB = Math.sqrt(pt2x*pt2x + pt2y*pt2y);
		// (2) Rotate the system so that point B is on the positive X axis.
		var theCos = pt2x / distAB;
		var theSin = pt2y / distAB;
		var newX = pt3x * theCos + pt3y * theSin;
		pt3y = pt3y * theCos - pt3x * theSin;
		pt3x = newX;
		newX = pt4x * theCos + pt4y * theSin;
		pt4y = pt4y * theCos - pt4x * theSin;
		pt4x = newX;
		// Fail if segment C-D doesn't cross line A-B.
		if (pt3y<0 && pt4y<0 || pt3y>=0 && pt4y>=0 ){
			return null;
		}
		// (3) Discover the position of the intersection point along line A-B.
		var ABpos = pt4x + (pt3x - pt4x) * pt4y / (pt4y - pt3y);
		// Fail if segment C-D crosses line A-B outside of segment A-B.
		if (ABpos < 0 || ABpos > distAB ){
			return null;
		}
		// (4) Apply the discovered position to line A-B in the original coordinate system.
		return {x: pt1x + ABpos * theCos,
				y: pt1y + ABpos * theSin};
	},
	/** Return intersection point of line segment pt1/pt2 with with segment pt3/pt4.*/
	segmentsIntersect: function(pt1, pt2, pt3, pt4) {
		return LinaJS._segmentsIntersect(pt1.x, pt1.y, pt2.x, pt2.y,
				pt3.x, pt3.y, pt4.x, pt4.y);
	},
	/** @private */
	_linesIntersect: function(pt1x, pt1y, pt2x, pt2y, pt3x, pt3y, pt4x, pt4y) {
		// public domain function by Darel Rex Finley, 2006
		// Return null, if the segments are colinear, even if they overlap.
		// Fail if either line segment is zero-length.
		if (pt1x==pt2x && pt1y==pt2y || pt3x==pt4x && pt3y==pt4y){
			return null;
		}
		// (1) Translate the system so that point A is on the origin.
		pt2x -= pt1x; pt2y -= pt1y;
		pt3x -= pt1x; pt3y -= pt1y;
		pt4x -= pt1x; pt4y -= pt1y;
		// Discover the length of segment A-B.
		var distAB = Math.sqrt(pt2x*pt2x + pt2y*pt2y);
		// (2) Rotate the system so that point B is on the positive X axis.
		var theCos = pt2x / distAB;
		var theSin = pt2y / distAB;
		var newX = pt3x * theCos + pt3y * theSin;
		pt3y = pt3y * theCos - pt3x * theSin;
		pt3x = newX;
		newX = pt4x * theCos + pt4y * theSin;
		pt4y = pt4y * theCos - pt4x * theSin;
		pt4x = newX;
		//  Fail if the lines are parallel.
		if (pt4y == pt3y){
			return null;
		}
		// (3) Discover the position of the intersection point along line A-B.
		var ABpos = pt4x + (pt3x - pt4x) * pt4y / (pt4y - pt3y);
		// (4) Apply the discovered position to line A-B in the original coordinate system.
		return {x: pt1x + ABpos * theCos,
				y: pt1y + ABpos * theSin};
	},
	/** Return intersection point of line segment pt1/pt2 with with segment pt3/pt4.
	 *
	 * @returns {pt|null|undefined} intersection point {x:_, y:_} or null if there is no intersection.
	 * undefined is returned, if segments are collinear.
	 */
	linesIntersect: function(pt1, pt2, pt3, pt4) {
		return LinaJS._linesIntersect(pt1.x, pt1.y, pt2.x, pt2.y,
				pt3.x, pt3.y, pt4.x, pt4.y);
	},
	/** Return shortest (vertical) distance between a point and a line through ptA/ptB.*/
	distancePtLine: function(pt, ptA, ptB) {
		var dx = ptB.x - ptA.x;
		var dy = ptB.y - ptA.y;
		return Math.abs(dx*(ptA.y-pt.y) - dy*(ptA.x-pt.x)) / Math.sqrt(dx*dx + dy*dy);
	},
	/** Return shortest distance between a point and the line segment from ptA to ptB.*/
	distancePtSegment: function(pt, ptA, ptB) {
		// dot(ptA->ptB, ptB->pt)
		var dx = pt.x - ptB.x;
		var dy = pt.y - ptB.y;
		var dot = (ptB.x - ptA.x) * dx + (ptB.y - ptA.y) * dy;
		if(dot > 0){
			return Math.sqrt(dx*dx + dy*dy); // distance(ptB, pt);
		}
		// dot(ptB->ptA, ptA->pt)
		dx = pt.x - ptA.x;
		dy = pt.y - ptA.y;
		dot = (ptA.x - ptB.x) * dx + (ptA.y - ptB.y) * dy;
		if(dot > 0){
			return Math.sqrt(dx*dx + dy*dy); // distance(ptA, pt);
		}
		return LinaJS.distancePtLine(pt, ptA, ptB);
	},
	/**Intersection of two moving circles.
	 * @param c1 {x, y, vx, vy, r}
	 * @param c2 {x, y, vx, vy, r}
	 * @param {float} maxT
	 * @returns {ptColl, vColl, t} or null
	 */
	intersectMovingCircles: function(c1, c2, maxT) {
		// See http://compsci.ca/v3/viewtopic.php?t=14897
		maxT = maxT || 1;
		// Breaking down the formula for t
		var A = c1.vx*c1.vx + c1.vy*c1.vy - 2*c1.vx*c2.vx + c2.vx*c2.vx
				- 2*c1.vy*c2.vy + c2.vy*c2.vy;
		var B = -c1.x*c1.vx - c1.y*c1.vy + c1.vx*c2.x + c1.vy*c2.y + c1.x*c2.vx
				- c2.x*c2.vx + c1.y*c2.vy - c2.y*c2.vy;
		var C = c1.vx*c1.vx + c1.vy*c1.vy - 2*c1.vx*c2.vx + c2.vx*c2.vx
				- 2*c1.vy*c2.vy + c2.vy*c2.vy;
		var D = c1.x*c1.x + c1.y*c1.y - c1.r*c1.r - 2*c1.x*c2.x + c2.x*c2.x
				- 2*c1.y*c2.y + c2.y*c2.y - 2*c1.r*c2.r - c2.r*c2.r;
		var disc = (-2 * B) * (-2 * B) - 4 * C * D;
		// If the discriminent is non negative, a collision will occur and
		// we must compare the time to our current time of collision. We
		// update the time if we find a collision that has occurred earlier
		// than the previous one.
		if(disc <= 0){
			return false;
		}
		// We want the smallest time
		var t = Math.min(0.5 * (2 * B - Math.sqrt(disc)) / A,
				0.5 * (2 * B + Math.sqrt(disc)) / A);
		return {
			ptColl: null,
			vColl: null,
			t: t
		};
	},
	/** Return true, if lina.js objects a and b are the same (within eps).
	 * This function is not optimized for speed, but handy for unit tests.
	 * @param a {float|Point2|Vec2|Matrix3,JS-Object,...}
	 * @param b must have the same type as a
	 * @param eps {float} Maximum accepted difference, defaults to 0.00001
	 */
	compare: function(a, b, eps) {
		eps = (eps === undefined) ? LinaJS.EPS : eps;
		if( a === undefined || b === undefined ){
			// undefined is equal to nothing!
			return false;
		} else if( a === null || b === null ){
				return a === null && b === null;
		} else if( a.m !== undefined || b.m !== undefined){
			// Matrix3 (also allow comparison to an array)
			a = a.m || a;
			b = b.m || b;
			return LinaJS.compare(a, b, eps);
		} else if( a.xyList !== undefined || b.xyList !== undefined){
			// Polygon2 (also allow comparison to an array)
			a = a.xyList || a;
			b = b.xyList || b;
			return LinaJS.compare(a, b, eps);
		} else if( typeof a !== typeof b ){
				return false;
		} else if( typeof a === "string" ){
			return a === b;
		} else if( typeof a === "number" ){
			return Math.abs(a-b) <= eps;
		} else if( a && a.constructor === Array ){
			if( a.length !== b.length){
				return false;
			}
			for(var i=0; i<a.length; i++){
				if(!LinaJS.compare(a[i], b[i], eps)){
					return false;
				}
			}
		} else if( a.x !== undefined ){
			return LinaJS.compare(a.x, b.x, eps) && LinaJS.compare(a.y, b.y, eps);
		} else if( a.dx !== undefined ){
			return LinaJS.compare(a.dx, b.dx, eps) && LinaJS.compare(a.dy, b.dy, eps);
		} else if( a.a !== undefined ){
			return LinaJS.compare(a.a, b.a, eps) && LinaJS.compare(a.r, b.r, eps);
		} else if( a.xyList !== undefined ){
			// Polygon2
			return LinaJS.compare(a.xyList, b.xyList, eps);
		} else {
			alert("LinaJS.compare: unsupported types\n  " + a + "("+(typeof a)+"),\n  " + b+ "("+(typeof b)+")");
		}
		return true;
	},
	lastEntry : undefined
};


/*****************************************************************************/


/**
 * Point in 2D space that has an internal cartesian representation (x/y)
 * and support for transformations.
 * When applying transformations, a point is handled as [x, y, 1].
 * @constructor
 * @param {float|Point2|JS-object} x X-coordinate or a Point2 instance or {x:_, y:_}
 * @param {float} y Y-coordinate or undefined, if x is a Point2 instance or {x:_, y:_}
 * @example
 *   var pt1 = new Point2(3, 4);
 *   pt1.rotate(Math.PI).translate(1, 2);
 *   var pt2 = new Point2({x:2, y:1});
 *   var dist = pt1.distanceTo(pt2)
 *
 */
Point2 = function(x, y){
	this.set(x, y);
};
Point2.prototype = {
	/** Return string representation '(x/y)'. */
	toString: function(prec) {
		if(prec !== undefined){
			return "(" + this.x.toPrecision(prec) + "/" + this.y.toPrecision(prec)  + ")";
		}
		return "(" + this.x + "/" + this.y  + ")";
	},
	/** Set coordinates.
	 * @param {float|Point2|JS-object} x X-coordinate or a Point2 instance or {x:_, y:_}
	 * @param {float} y Y-coordinate or undefined, if x is a Point2 instance or {x:_, y:_}
	 * @returns {Point2}
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
	/** Return a new copy of this point.
	 * @returns {Point2}
	 */
	copy: function() {
		return new Point2(this.x, this.y);
	},
	/** Return squared distance from this to pt2. .
	 * @param {Point2|JS-Object} pt2 Second point.
	 * @returns {float}
	 */
	sqrDistanceTo: function(ptOrX, y) {
		var dx, dy;
		if(y === undefined) {
			dx = this.x - ptOrX.x;
			dy = this.y - ptOrX.y;
		}else{
			dx = this.x - ptOrX;
			dy = this.y - y;
		}
		return dx*dx + dy*dy;
	},
	/** Return distance from this to pt2. .
	 * @param {Point2|JS-Object} pt2 Second point.
	 * @returns {float}
	 */
	distanceTo: function(ptOrX, y) {
		return Math.sqrt(this.sqrDistanceTo(ptOrX, y));
	},
	/** Check if pt2 is (aproximately) equal to this.
	 * @param {Point2|JS-Object} pt2 Second point.
	 * @param {float} eps (optional) accepted maximum distance.
	 * @returns {boolean}
	 */
	isEqual: function(pt2, eps) {
		eps = ( eps === undefined ) ? LinaJS.EPS_SQUARED : eps * eps;
		return this.sqrDistanceToPt(pt2) <= eps;
	},
	/** Rotate this point (in-place) and return this instance.
	 * @param {float} a Angle in radians.
	 * @param {Point2} ptCenter (optional) center of rotation, defaults to (0/0).
	 * @returns {Point2}
	 */
	rotate: function(a, ptCenter) {
		var c = Math.cos(a);
		var s = Math.sin(a);
		var prevX = this.x;
		if(ptCenter === undefined){
			// rotate about 0/0
			this.x = c*prevX - s*this.y;
			this.y = s*prevX + c*this.y;
		}else {
			// TODO
			throw "not implemented";
		}
		return this;
	},
	/** Translate point (in-place) and return this instance.
	 * @param {float|Vec2} vecOrDx x-offset or offset vector
	 * @param {float|undefined} dy y-offset (omit this parameter, if x is a Vec2)
	 * @returns {Point2}
	 */
	translate: function(vecOrDx, dy) {
		if(dy === undefined){
			this.x += vecOrDx.dx;
			this.y += vecOrDx.dy;
		}else{
			this.x += vecOrDx;
			this.y += dy;
		}
		return this;
	},
	/** Apply transformation matrix (in-place) and return this instance.
	 * @returns {Point2}
	 */
	transform: function(m) {
		var xy = m.transformPt(this.x, this.y);
		this.x = xy.x;
		this.y = xy.y;
		return this;
	},
	/** Return vector from this to pt2.
	 * @param {Point2|JS-Object} pt2 Second point.
	 * @returns {Vec2}
	 */
	vectorTo: function(ptOrX, y) {
		if(y === undefined) {
			return new Vec2(ptOrX.x - this.x, ptOrX.y - this.y);
		}else{
			return new Vec2(ptOrX - this.x, y - this.y);
		}
	},
	__lastEntry: undefined
};

/** Return distance from this to pt2.
 * @param {Point2|JS-Object} pt1 First point.
 * @param {Point2|JS-Object} pt2 Second point.
 * @returns {float}
 */
Point2.distanceTo = function(pt1, ptOrX, y) {
	return pt1.distanceTo(ptOrX, y);
};

/** Check if pt2 is (aproximately) equal to pt1.
 * @param {Point2|JS-Object} pt1 First point.
 * @param {Point2|JS-Object} pt2 Second point.
 * @param {float} eps (optional) accepted maximum distance.
 * @returns {boolean}
 */
Point2.isEqual = function(pt1, pt2, eps) {
	return pt1.isEqual(pt2, eps);
};

/** Return rotated copy of pt.
 * @param {Point2} pt point that will be rotaded.
 * @param {float} a Angle in radians.
 * @param {Point2} ptCenter (optional) center of rotation, defaults to (0/0).
 * @returns {Point2}
 */
Point2.rotate = function(pt, a, ptCenter){
	return pt.copy().rotate(a, ptCenter);
};

/** Return a copy of pt transformed by m.
 * @param {Point2} pt point that will be transformed.
 * @param {Matrix3} m tranformation matrix.
 * @returns {Point2}
 */
Point2.transform = function(pt, m) {
	return pt.copy().transform(m);
};

/** Return a translated copy of pt.
 * @param {Point2} pt point that will be translated.
 * @param {float|Vec2} dx x-offset or offset vector
 * @param {float|undefined} dy y-offset (omit this parameter, if x is a Vec2)
 * @returns {Point2}
 */
Point2.translate = function(pt, dx, dy) {
	return pt.copy().translate(dx, dy);
};

/** Return vector from pt1 to pt2.
 * @param {Point2|JS-Object} pt1 First point.
 * @param {Point2|JS-Object} pt2 Second point.
 * @returns {float}
 */
Point2.vectorTo = function(pt1, ptOrX, y) {
	return pt1.vectorTo(ptOrX, y);
};

/**
 * 2D vector that has an internal cartesian representation (dx, dy)
 * and support for transformations.
 * When applying transformations, a vector is handled as [dx, dy, 0].
 * @constructor
 * @param {float|Vec2|JS-object} dx X-coordinate or a Vec2 instance or {dx:_, dy:_}
 * @param {float} dy Y-coordinate or undefined, if x is a Vec2 instance or {dx:_, dy:_}
 * @example
 *   var v = new Vec2(3, 4);
 *   v.rotate(Math.PI).translate(1, 2);
 *
 */
Vec2 = function(dx, dy){
	this.set(dx, dy);
};
Vec2.prototype = {
	/** Return string representation '(dx, dy)'. */
	toString: function(prec) {
		if(prec !== undefined){
			return "(" + this.dx.toPrecision(prec) + ", " + this.dy.toPrecision(prec)  + ")";
		}
		return "(" + this.dx + ", " + this.dy  + ")";
	},
	/** Set coordinates.
	 * @param {float|Vec2|JS-object} dx X-coordinate or a Vec2 instance or {dx:_, dy:_}
	 * @param {float} dy Y-coordinate or undefined, if y is a Vec2 instance or {dx:_, dy:_}
	 * @returns {Vec2}
	 */
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
	/** Return a new copy of this vector.
	 * @returns {Vec2}
	 */
	copy: function() {
		return new Vec2(this.dx, this.dy);
	},
	/** Calculate the dot product (inner product) of this vector and v2.
	 * @param {Vec2|JS-Object} v2 Other vector.
	 * @returns {float}
	 */
	dot: function(v2) {
		return this.dx * v2.dx + this.dy * v2.dy;
	},
	/** Calculate the cross product of this vector and v2.
	 * @param {Vec2|JS-Object} v2 Other vector.
	 * @returns {float}
	 */
	cross: function(v2) {
		return this.dx * v2.dy - this.dy * v2.dx;
	},
	/** Normalize to a unit vector (in-place) and return this instance.
	 * @returns {Vec2}
	 */
	normalize: function() {
		// Convert to unit vector.
		var l = this.length();
		if(l) {
			this.dx /= l;
			this.dy /= l;
		}
		return this;
	},
	/**Return vector length ^2.
	 * This is faster than calling length().
	 * @returns {float}
	 */
	sqrLength: function() {
		return this.dx * this.dx + this.dy * this.dy;
	},
	/**Return vector length.
	 * @returns {float}
	 */
	length: function() {
		try {
			return Math.sqrt(this.dx * this.dx + this.dy * this.dy);
		} catch (e) {
			return 0;
		}
	},
	/**Clamp vector length.
	 * @param {float} length Maximum length.
	 * @returns {Vec2}
	 */
	limit: function(length) {
		if(this.sqrLength() > length*length){
			this.scale(length / this.length());
		}
		return this;
	},
	/**Check, if vector is (0, 0)
	 * @returns {boolean}
	 */
	isNull: function() {
		return this.dx === 0 && this.dy === 0;
	},
	/**Set vector to (0, 0)
	 * @returns {Vec2}
	 */
	setNull: function() {
		return this.set(0, 0);
	},
	/**Return the angle between positive x axis and this vector.
	   @returns {float}  [-pi .. pi], ccw
	*/
	angle: function(){
		return Math.atan2(this.dy, this.dx);
	},
	/**Return the angle between this vector and v2.
	   @returns {float}  [-pi .. pi], ccw
	*/
	angleTo: function(v2){
//		return Math.acos(this.dot(v2) /  (this.length() * Math.sqrt(v2.dx * v2.dx + v2.dy * v2.dy)));
		return Math.asin(this.cross(v2) /  (this.length() * Math.sqrt(v2.dx * v2.dx + v2.dy * v2.dy)));
	},
	/** Multiply vector length by a factor (in-place) and return this instance.
	 * @param {float} f Scaling factor.
	 * @returns {Vec2}
	 */
	scale: function(f) {
		this.dx *= f;
		this.dy *= f;
		return this;
	},
	/** Flip this vector (in-place) and return this instance.
	 * @returns {Vec2}
	 */
	revert: function() {
		this.dx *= -1;
		this.dy *= -1;
		return this;
	},
	/** Rotate this vector (in-place) and return this instance.
	 * @param {float} a Angle in radians.
	 * @returns {Vec2}
	 */
	rotate: function(a) {
		var s = Math.sin(a), c = Math.cos(a);
		this.dx = this.dx * c - this.dy * s;
		this.dy = this.dy * c + this.dx * s;
		return this;
	},
	/** Apply transformation matrix (in-place) and return this instance.
	 * @returns {Vec2}
	 */
	transform: function(m) {
		var xy = m.transformVec(this.dx, this.dy);
		this.dx = xy.dx;
		this.dy = xy.dy;
		return this;
	},
	/** Set vector length (in-place) and return this instance.
	 * @param {float} length New length.
	 * @returns {Vec2}
	 */
	setLength: function(length) {
		this.scale(length / this.length());
		return this;
	},
	/** Return polar coordinates for this vector.
	 * @returns {JS-Object} {a:angle in rad, r: radius}.
	 */
	getPolar: function() {
		// TODO
		alert("Not implemented: Vec2.getPolar()");
	},
	/** Set vector orientation to perpendicular of itself (in-place) and return this
	 * instance.
	 * This is equivalent to a rotation by 90°, only faster.
	 * @returns {Vec2}
	 */
	perp: function() {
		var t = this.dx;
		this.dx = -this.dy;
		this.dy = t;
		return this;
	},
	/** Check if v2 is perpendicular to this vector.
	 * @param {Vec2|JS-Object} v2 Other vector.
	 * @returns {boolaen}
	 */
	isPerp: function(v2) {
		// Vectors are perpendicular if the dot product is zero.
		return Math.abs(this.dot(v2)) < LinaJS.EPS;
	},
	/** Check if v2 is parallel to this vector.
	 * @param {Vec2|JS-Object} v2 Other vector.
	 * @returns {boolaen}
	 */
	isColinear: function(v2) {
		// Vectors are colinear if the dot product is one.
		return Math.abs(1 - this.dot(v2)) < LinaJS.EPS;
	},
	/**Add another vector to this vector and return the current instance.
	 * @param {Vec2|JS-Object} vecOrDx Second vector.
	 * @returns {Vec2}
	 */
	add: function(vecOrDx, dy) {
		if(dy === undefined) {
			this.dx += vecOrDx.dx;
			this.dy += vecOrDx.dy;
		}else{
			this.dx += dx;
			this.dy += dy;
		}
		return this;
	},
	/**Subtract another vector from this vector and return the current instance.
	 * @param {Point2|JS-Object} vecOrDx Second point.
	 * @returns {Vec2}
	 */
	sub: function(vecOrDx, dy) {
		if(dy === undefined) {
			this.dx -= vecOrDx.dx;
			this.dy -= vecOrDx.dy;
		}else{
			this.dx -= dx;
			this.dy -= dy;
		}
		return this;
	},
	__lastEntry: undefined
};

/** Calculate the dot product (inner product) of this vector and v2.
 * @param {Vec2|JS-Object} v1 First vector.
 * @param {Vec2|JS-Object} v2 Other vector.
 * @returns {float}
 */
Vec2.dot = function(v1, v2) {
	return v1.dx * v2.dx + v1.dy * v2.dy;
};
/** Calculate the cross product of this vector and v2.
 * @param {Vec2|JS-Object} v1 First vector.
 * @param {Vec2|JS-Object} v2 Other vector.
 * @returns {float}
 */
Vec2.cross = function(v1, v2) {
	return v1.dx * v2.dy - v1.dy * v2.dx;
};
/** Return a normalized copy of v1.
 * @param {Vec2|JS-Object} v1.
 * @returns {Vec2}
 */
Vec2.normalize = function(v1) {
	return v1.copy().normalize();
};
/**Return copy of vector with limited length.
 * @param {Vec2|JS-Object} v1.
 * @param {float} length Maximum length.
 * @returns {Vec2}
 */
Vec2.limit = function(v1, length) {
	return v1.copy().limit(length);
};
/** Return a copy of v1 with length multiplied by a factor.
 * @param {Vec2|JS-Object} v1 First vector.
 * @param {float} f Scaling factor.
 * @returns {Vec2}
 */
Vec2.scale = function(v1, f) {
	return v1.copy().scale(f);
};
/** Return a flipped copy of vector.
 * @param {Vec2|JS-Object} v1 First vector.
 * @returns {Vec2}
 */
Vec2.revert = function(v1) {
	return v1.copy().revert();
};
/** Return a rotated copy of a vector.
 * @param {Vec2|JS-Object} v1 First vector.
 * @param {float} a Angle in radians.
 * @returns {Vec2}
 */
Vec2.rotate = function(v1, a) {
	return v1.copy().rotate(a);
};
/** Return a transformed copy of a vector.
 * @param {Vec2|JS-Object} v1 First vector.
 * @returns {Vec2}
 */
Vec2.transform = function(v1, m) {
	return v1.copy().transform(m);
};
/** Return a copy of vector with a defined length.
 * @param {Vec2|JS-Object} v1 First vector.
 * @param {float} length New length.
 * @returns {Vec2}
 */
Vec2.setLength = function(v1, length) {
	return v1.copy().setLength(length);
};
/** Return a perpendicluar copy of a vector.
 * This is equivalent to a rotation by 90°, only faster.
 * @param {Vec2|JS-Object} v1 First vector.
 * @returns {Vec2}
 */
Vec2.perp = function(v1) {
	return v1.copy().perp();
};
/**Return a new vector that combines two vectors.
 * @param {Vec2|JS-Object} v1 First vector.
 * @param {Vec2|JS-Object} vecOrDx Second vector.
 * @returns {Vec2}
 */
Vec2.add = function(v1, vecOrDx, dy) {
	return v1.copy().add(vecOrDx, dy);
};
/**Return a new vector that combines v1 minus v2.
 * @param {Vec2|JS-Object} v1 First vector.
 * @param {Vec2|JS-Object} vecOrDx Second vector.
 * @returns {Vec2}
 */
Vec2.sub = function(v1, vecOrDx, dy) {
	return v1.copy().sub(vecOrDx, dy);
};


/*******************************************************************************
 * Class Matrix3
 * 3x3 matrix
 */
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
};
Matrix3.prototype = {
	/**Return string representation '[[0, 1, 2], [3, 4, 5], [6, 7, 8]]'.
	 * @returns {string}
	 */
	toString: function() {
		var m = this.m;
		return "[["+m[0]+", "+m[1]+", "+m[2]+"], ["+m[3]+", "+m[4]+", "+m[5]+"], ["+m[6]+", "+m[7]+", "+m[8]+"]]";
	},
	/**Set the current matrix.
	 *  @param {Matrix3|float[9]} m (optional) defaults to identity matrix [1, 0, 0, 0, 1, 0, 0, 0, 1]
	 *  @returns {Matrix3}
	 */
	set: function(m) {
		if( m === undefined ) {
			/**Matrix value stored as array of 9 floats.
			 * @type {float[9]} */
			this.m = [1, 0, 0, 0, 1, 0, 0, 0, 1];
			/**Defines, if this matrix is non-perspective, i.e. the right column is
			 * [0, 0, 1] so that m[2] = m[5] = 0 and m[8] = 1.
			 * In this case transformations can be processed more efficiently.
			 * Default: true.
			 * @type {boolean} */
			this.isAffine = true;
		}else if( m.length === 9 ) {
			// Set from float[9]
			this.m = m.slice();
			this.isAffine = (m[2] === 0) && (m[5] === 0) && (m[8] === 1);
		}else{
			// Set from Matrix3
			this.m = m.m.slice();
			this.isAffine = m.isAffine;
		}
		return this;
	},
	/**Reset the current matrix to identity.
	 * @returns {Matrix3}
	 */
	reset: function() {
		return this.set();
	},
	/** Create and return a copy of this matrix.*/
	copy: function() {
		return new Matrix3(this.m);
	},
	/** Apply translation (in-place) and return this instance.*/
	translate: function(dx, dy) {
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
	},
	/** Apply scaling (in-place) and return this instance.*/
	scale: function(fx, fy) {
		if(fy === undefined){
			fy = +fx;
		}
		var m = this.m;
		m[0] *= fx;    m[1] *= fy;
		m[3] *= fx;    m[4] *= fy;
		m[6] *= fx;    m[7] *= fy;
		return this;
	},
	/** Apply rotation (in-place) and return this instance.*/
	rotate: function(a, pt) {
		if( pt === undefined ){
//			return this.mult(rotation33(a));
			var c = Math.cos(a);
			var s = Math.sin(a);
			var m = this.m;
			var t = m.slice(); // Temporary copy
			m[0] = c*t[0] - s*t[1];    m[1] = s*t[0] + c*t[1];
			m[3] = c*t[3] - s*t[4];    m[4] = s*t[3] + c*t[4];
			m[6] = c*t[6] - s*t[7];    m[7] = s*t[6] + c*t[7];
			return this;
		}else{
			return this.translate(-pt.x, -pt.y)
				.rotate(a)
				.translate(pt.x, pt.y);
		}
	},
	/** Apply transformation (in-place) and return this instance.*/
	mult: function(mb) {
		/* TODO: optimize
		 * http://www.euclideanspace.com/maths/algebra/matrix/resources/code/index.htm#mul3
		 * Newman, p.62ff
		 *
		 */
		mb = mb.length ? mb : mb.m;
		var ma = this.m,
			mc = [0,0,0, 0,0,0, 0,0,0],
			a, b, c, row, col, i;
		for(row=0; row<3; row++) {
			for(col=0; col<3; col++) {
				c = 3*row + col;
				for(i=0; i<3; i++) {
					a = 3*row + i;
					b = 3*i + col;
					mc[c] += ma[a] * mb[b];
				}
			}
		}
		this.set(mc);
		return this;
	},
	/** Return transformed x and y as JS-object {x:x', y:y'}.*/
	transformPt: function(x, y) {
		// Since a point is [x, y, 1], the translation part is applied.
		var m = this.m;
		if(this.isAffine){
			return {
				x: m[0]*x + m[3]*y + m[6],
				y: m[1]*x + m[4]*y + m[7]
			};
		}else{
			//TODO: untested
			var w = m[2]*x + m[5]*y + m[8];
			return {
				x: (m[0]*x + m[3]*y + m[6]) / w,
				y: (m[1]*x + m[4]*y + m[7]) / w
			};
		}
	},
	/** Return transformed dx and dy as JS-object {dx:_, dy:_}.*/
	transformVec: function(dx, dy) {
		// Since a vector is [dx, dy, 0], the translation part is ignored.
		//TODO: this assumes isAffine == true
		var m = this.m;
		if(this.isAffine){
			return {
				dx: m[0]*dx + m[3]*dy,
				dy: m[1]*dx + m[4]*dy
			};
		}else{
			//TODO: untested
			var w = m[2]*dx + m[5]*dy;
			return {
				dx: (m[0]*dx + m[3]*dy + m[6]) / w,
				dy: (m[1]*dx + m[4]*dy + m[7]) / w
			};
		}
	},
	/** Transpose (in-place) and return this instance.*/
	transpose: function() {
		var m = this.m, t;
		t = m[1]; m[1] = m[3]; m[3] = t;
		t = m[2]; m[2] = m[6]; m[6] = t;
		t = m[5]; m[5] = m[7]; m[7] = t;
		return this;
	},
	/**Calculate the determinant.
	 * @returns {float}
	 */
	det: function() {
		var m = this.m;
		if(this.isAffine){
			return m[0]*m[4] - m[1]*m[3];
		} else {
			// Rule of Sarrus
			return m[0]*m[4]*m[8] + m[1]*m[5]*m[6] + m[2]*m[3]*m[7]
				- m[0]*m[5]*m[7] - m[1]*m[3]*m[8] - m[2]*m[4]*m[6];
		}
	},
	/** Invert (in-place) and return this instance.
	* @returns {Matrix3}
	* @throws "Cannot invert", if det(m) == 0
	*/
	invert: function() {
		var det = this.det();
		if ( Math.abs(det) < LinaJS.EPS ) {
			throw "Cannot invert " + this;
		}
		var m = this.m;
		// http://en.wikipedia.org/wiki/Invertible_matrix
		var invdet = 1.0 / det;
//		var t = new Array(9); // make a copy
		var t = [ // make a copy
			 (m[4]*m[8] - m[7]*m[5]) * invdet,
			-(m[1]*m[8] - m[2]*m[7]) * invdet,
			 (m[1]*m[5] - m[2]*m[4]) * invdet,
			-(m[3]*m[8] - m[5]*m[6]) * invdet,
			 (m[0]*m[8] - m[2]*m[6]) * invdet,
			-(m[0]*m[5] - m[3]*m[2]) * invdet,
			 (m[3]*m[7] - m[6]*m[4]) * invdet,
			-(m[0]*m[7] - m[6]*m[1]) * invdet,
			 (m[0]*m[4] - m[3]*m[1]) * invdet
		];
		this.m = t;
		return this;
	},
	/**Calculate the vector (dx:0, dy:1) tranfromed by this.
	 * @returns {Vec2}
	 */
	orientation: function() {
		return new Vec2(this.transformVec(0, 1));
	},
	__lastEntry: undefined
};


/******************************************************************************/


/**
 * Creates 3x3 homogenous transformation that also maintains its own inversion.
 * This is usually more effient than calling m.invert().
 * @constructor
 * @param {undefined|Matrix3|float[9]} m
 */
BiTran2 = function(m){
	this.set(m);
};
BiTran2.prototype = {
	/**Return string representation '[[0, 1, 2], [3, 4, 5], [6, 7, 8]]'.
	 * @returns {string}
	 */
	toString: function() {
		return this.matrix.toString() + " - Inverse: " + this.inverse.toString();
	},
	/**Set the current matrix.
	 *  @param {Matrix3|float[9]} m (optional) defaults to identity matrix [1, 0, 0, 0, 1, 0, 0, 0, 1]
	 *  @returns {Matrix3}
	 */
	set: function(m) {
		if( m === undefined ) {
			/**Matrix3 that stores the transformation.
			 * @type Matrix3 */
			this.matrix = new Matrix3();
			/**Matrix3 that stores the inverse transformation.
			 * @type Matrix3 */
			this.inverse = new Matrix3();
		}else{
			this.matrix = new Matrix3(m);
			this.inverse = this.matrix.copy().invert();
		}
		return this;
	},
	/**Reset the current matrix to identity.
	 *  @returns {BiTran2}
	 */
	reset: function() {
		return this.set();
	},
	/** Create and return a copy of this matrix.*/
	copy: function() {
		return new BiTran2(this.matrix);
	},
	/** Apply translation (in-place) and return this instance.*/
	translate: function(dx, dy) {
		/* TODO: optimize
		 * for last column = [0, 0, 1] this simplifies to
		 *   this.m[6] += dx;
		 *   this.m[7] += dy;
		 */
		this.matrix.translate(dx, dy);
		// TODO: pre-concatenate the transformation inline.
		this.inverse = this.matrix.copy().invert();
		return this;
	},
	/** Apply scaling (in-place) and return this instance.*/
	scale: function(fx, fy) {
		this.matrix.scale(fx, fy);
		// TODO: pre-concatenate the transformation inline.
		this.inverse = this.matrix.copy().invert();
		return this;
	},
	/** Apply rotation (in-place) and return this instance.*/
	rotate: function(a, pt) {
		this.matrix.rotate(a, pt);
		// TODO: pre-concatenate the transformation inline.
		this.inverse = this.matrix.copy().invert();
		return this;
	},
	/** Apply transformation (in-place) and return this instance.*/
	mult: function(mb) {
		this.matrix.mult(mb);
		// TODO: pre-concatenate the transformation inline.
		this.inverse = this.matrix.copy().invert();
		return this;
	},
	__lastEntry: undefined
};


/******************************************************************************/


/**
 * Create a new 2d polygon.
 * @constructor
 * @param {Polygon2|float[]} xyList
 */
Polygon2 = function(xyList){
	this.set(xyList);
};
Polygon2.prototype = {
	set: function(xyList){
		if( xyList.length) {
			this.xyList = xyList.slice(0, xyList.length);
		}else{
			this.xyList = xyList.xyList.slice(0, xyList.xyList.length);
		}
	},
	/** Return string representation '[(x1,y1), (x2,y2), ...]'.*/
	toString: function() {
		var xy = this.xyList;
		var l = [];
		for(var i=0; i<xy.length; i+=2){
			l.push("("+xy[i]+","+xy[i+1]+")");
		}
		return "[" + l.join(", ") + "]";
	},
	/** Create and return a copy of this polygon.*/
	copy: function() {
		return new Polygon2(this.xyList);
	},
	/** Apply transformation matrix (in-place) and return this instance.*/
	transform: function(m) {
		var xy = this.xyList;
		for(var i=0; i<xy.length; i+=2){
			pt2 = m.transformPt(xy[i], xy[i+1]);
			xy[i] = pt2.x;
			xy[i+1] = pt2.y;
		}
		return this;
	},
	/** Revert vertex list (in-place) and return this instance.*/
	revert: function() {
		var xy = this.xyList, t;
		var len = xy.length;
		for(var i=0; i<(len-1)/2; i+=2){
			var j = len - i - 2;
			t = xy[i]; xy[i] = xy[j]; xy[j] = t;
			t = xy[i+1]; xy[i+1] = xy[j+1]; xy[j+1] = t;
		}
		return this;
	},
	/**Return polygon point by index.
	 * @param {int} idx
	 * @returns {x:_, y:_}
	 */
	getXY: function(idx) {
		idx *= 2;
		if(idx > this.xyList.length-2){
			throw("Polygon2.getXY: Index out of bounds");
		}
		return {x: this.xyList[idx], y: this.xyList[idx+1]};
	},
	/**Return polygon edge by index.
	 * If idx == last then the closing edge is returned.
	 * @param {int} idx Index of first point
	 * @returns {x0:_, y0:_, x1:_, y1:_}
	 */
	getSegment: function(idx0) {
		idx0 *= 2;
		if(idx0 >= this.xyList.length){
			throw("Polygon2.getSegment: Index out of bounds");
		}
		var idx1 = (idx0 + 2) % this.xyList.length;
		return {x0: this.xyList[idx0], y0: this.xyList[idx0+1],
				x1: this.xyList[idx1], y1: this.xyList[idx1+1]};
	},
	/**Check, if pt is inside this polygon.
	 * @param pt
	 */
	contains: function(pt) {
		// Check if pt is on the same side of all PG edges.
		// TODO: this only works for convex PGs(?)
		// Ray-testing may be better:
		// see http://local.wasp.uwa.edu.au/~pbourke/geometry/insidepoly/
		// and http://stackoverflow.com/questions/217578/point-in-polygon-aka-hit-test
		// for a better solution
		/*
		 int pnpoly(int npol, float *xp, float *yp, float x, float y)
		{
		  int i, j, c = 0;
		  for (i = 0, j = npol-1; i < npol; j = i++) {
			if ((((yp[i] <= y) && (y < yp[j])) ||
				 ((yp[j] <= y) && (y < yp[i]))) &&
				(x < (xp[j] - xp[i]) * (y - yp[i]) / (yp[j] - yp[i]) + xp[i]))
			  c = !c;
		  }
		  return c;
		}

		 */
		var x = pt.x,
			y = pt.y,
			sign, // >0: pt is on the left of a segment
			pt0, pt1,
			xy = this.xyList,
			len = xy.length;
		// sign = (y - y0)*(x1 - x0) - (x - x0)*(y1 - y0)
		// Start with last (closing) segment
		pt0 = {x: xy[len-2], y: xy[len-1]};
		for(var i=0; i<=len-2; i+=2){
			pt1 = {x: xy[i], y: xy[i+1]};
			var s = (y - pt0.y) * (pt1.x - pt0.x) - (x - pt0.x) * (pt1.y - pt0.y);
			if( s === 0){
				return true;
			} else if( sign === undefined){
				sign = (s > 0);
			} else if( (s>0) !== sign ) {
				return false;
			}
			pt0 = pt1;
		}
		return true;
	},
	/** Check, if this polygon intersects with another polygon.
	 */
	intersects: function(pg2, velocity) {
		// TODO:
		// See http://gpwiki.org
		// 'Simple non-convex polygons'
		alert("Not implemented: Polygon2.intersects()");
		return false;
	},
	/**Return polygon point nearest to pt.
	 * @param {Point2} pt
	 * @param {Vec2} cullingVector (optional) If we pass a velocity vector here,
	 * CCW oriented polygons will only consider objects aproaching from the
	 * outside.
	 */
	nearestPt: function(pt, cullingVector) {
		var xy = this.xyList,
			len = xy.length,
			dmin2 = Number.MAX_VALUE,
			d2,
			ptNearest = {x:0, y:0},
			ptA, ptB,
			vAB, vAP,
			e2, t, dx, dy;
		var res = {d: 0,
				pt: {},
				i: 0,
				t: 0};
		// Start with last (closing) segment
		ptA = {x: xy[len-2], y: xy[len-1]};
		for(var i=0; i<=len-2; i+=2){
			ptB = {x: xy[i], y: xy[i+1]};
			vAB = new Vec2(ptB.x - ptA.x, ptB.y - ptA.y);
			if(cullingVector && cullingVector.cross(vAB) < 0){
				//window.console.log(cullingVector.dot(vAB));
				ptA = ptB;
				continue;
			}
			vAP = new Vec2(pt.x - ptA.x, pt.y - ptA.y);

			e2 = vAB.dot(vAB);
			t = vAP.dot(vAB) / e2;
			if(t <= 0) {//LinaJS.EPS){ // TODO: <= EPS or 0.0?
				// Hit in ptA
				d2 = vAP.dx * vAP.dx + vAP.dy * vAP.dy;
				if( d2 < dmin2 ){
					dmin2 = d2;
					res.idx = i;
					res.t = 0;
					res.pt.x = ptA.x;
					res.pt.y = ptA.y;
					res.isCorner = true;
				}
			} else if(t >= 1.0) {
				// Hit in ptB: this will become ptA in the next loop
			} else {
				ptNearest.x = ptA.x + t * vAB.dx;
				ptNearest.y = ptA.y + t * vAB.dy;
				dx = ptNearest.x - pt.x;
				dy = ptNearest.y - pt.y;
				d2 = dx * dx + dy * dy;
				if( d2 < dmin2 ){
					dmin2 = d2;
					res.idx = i;
					res.t = t;
					res.pt.x = ptNearest.x;
					res.pt.y = ptNearest.y;
					res.isCorner = false;
				}
			}
			ptA = ptB;
		}
		// Fixup result to use Lina objects and real distance
		res.d = Math.sqrt(dmin2);
		res.pt = new Point2(res.pt);
		return res;
	},
	/**Check, if this polygon intersects with a (moving) circle.
	 * In case of a collision some additional information is calculated.
	 * @param {Circle2} circle
	 * @param {Vec2} velocity Relative speed (assuming this polygon is static)
	 * @returns false, if no intersection, otherwise {...}
	 */
	intersectsCircle: function(circle, velocity) {
		// Find point on polygon that is closest to circle.center.
		// We pass the velocity vector as culling, so CCW polygons will only
		// report collisions from the outside.
		var nearest = this.nearestPt(circle.center, velocity);
		if( nearest.d > circle.r ){
			return false;
		}
		// penetration depth
		var depth = circle.r - nearest.d;
//		var speed = velocity.length();
		// Collision normal
		var vNormal = nearest.pt.vectorTo(circle.center).normalize();
//		var vMTD = vNormal.copy().scale(depth);
		// Reflected velocity
		var vEdge = vNormal.copy().perp();
		var a = vEdge.dot(velocity);
		var b = vNormal.dot(velocity);
		var velocityReflected = vNormal.copy().scale(-b).add(vEdge.scale(a));
		// [0..1]: fraction of velocity after collision
		var tAfter = depth / velocity.length();
		var centerReflected = circle.center.copy()
			.translate((tAfter-1) * velocity.dx + tAfter * velocityReflected.dx,
					(tAfter-1) * velocity.dy + tAfter * velocityReflected.dy);
		// TODO: nearestPt should ignore edges if velocity is outbund
		return {
			pt: nearest.pt, // collsion point
			ptIdx: nearest.i, // index of first point of collision edge (ptA)
			edgeT: nearest.t, // [0..1]: pt = ptA + edgeT * (ptB - ptA)
			vNormal: vNormal, // collision normal (unit vector)
			vMTD: vNormal.copy().scale(depth), // minmum offset vector that translates circle to point of collision
			depth: depth, // penetration depth
			velocityReflected: velocityReflected, // new velocity, assuming a reflection on collision edge
			centerReflected: centerReflected, // new circle pos, assuming a reflection on collision edge
			t: 1-tAfter // [0..1]: fraction of velocity before collision
		};
	},
	/** Check, if line segment pt1, pt2 is inside this polygon.*/
	segmentIntersects: function(pt1, pt2) {
		// TODO: Gems II, 1.2 and page 473
		// See http://gpwiki.org
		// 'Simple non-convex polygons'
		alert("Not implemented: Polygon2.segmentIntersects()");
		return false;
	},
	/** @private */
	_signedDoubleArea: function() {
		var xy = this.xyList;
		var res = 0;
		for(var i=0; i<xy.length-3; i+=2){
			res += xy[i]*xy[i+3] - xy[i+1]*xy[i+2];
		}
		return res;
	},
	/** Return polygons area.
	 * This assumes an implicitly closed, non self-intersecting polygon.
	 */
	area: function() {
		return 0.5 * Math.abs(this._signedDoubleArea());
	},
	/** Check, if this polygon has a counterclocwise vertex order.*/
	isCCW: function() {
		return this._signedDoubleArea() > 0;
	},
	/** Make sure this polygon has a counterclocwise vertex order.*/
	makeCCW: function() {
		return this.isCCW() ? this : this.revert();
	},
	/** Make sure this polygon has a clocwise vertex order.*/
	makeCW: function() {
		return this.isCCW() ? this.revert() : this;
	},
	/** Return the smallest bounding circle as {center: {x:_,y:_}, r:_}.*/
	getBoundingCircle: function() {
		// TODO: Gems II, 1.4
		alert("Not implemented: Polygon2.getBoundingCircle()");
		return 0;
	},
	/**Return the total length of all line segments.
	 * @param {boolean} closed Include implicit closing segment (default: true).
	 */
	perimeter: function(closed) {
		// TODO:
		closed = (closed === undefined) ? true : !!closed;
		alert("Not implemented: Polygon2.perimeter()");
		return 0;
	},
	/** Return the bounding box as {min: {x:_,y:_}, max: {x:_,y:_}}.*/
	getBoundingBox: function(forceRecalc) {
		// TODO:
		alert("Not implemented: Polygon2.getBoundingBox()");
		return 0;
	},
	/** Return a new polygon that connects the extreme points of this polygon.
	 * Also known as 'convex hull'.
	 *	The result will be convex, non-intersecting.
	 */
	getBoundingPolygon: function() {
		// TODO: file:///C:/Prj/eclipse-ws/arcade-js/res/Math/Geometry%20Concepts%20Line%20Intersection%20and%20its%20Applications/tc.htm
		alert("Not implemented: Polygon2.getBoundingPolygon()");
		return null;
	},
	/** Return a new polygon that draws along the outer lines of this polygon.*/
	getShapePolygon: function() {
		// TODO:
		alert("Not implemented: Polygon2.getShapePolygon()");
		return null;
	},
	__lastEntry: undefined
};

/** Return a transformed copy of a polygon.*/
Polygon2.transform = function(pg, m) {
	return pg.copy().transform(m);
};
/** Return a reverse copy of a polygon.*/
Polygon2.revert = function(pg) {
	return pg.copy().revert();
};

/**
 * Create a new circle.
 * @constructor
 * @param {Point2} center
 * @param {float} r radius
 */
Circle2 = function(center, radius){
	this.set(center, radius);
};
Circle2.prototype = {
	set: function(center, r){
		if(center.center !== undefined){
			this.center = new Point2(center.center);
			this.r = center.r;
		}else{
			this.center = new Point2(center);
			this.r = +r;
		}
	},
	/** Return string representation 'Circle2((x,y), r=_)'.*/
	toString: function() {
		return "Circle2(" + this.center + ", r:" + this.r + ")";
	},
	/** Create and return a copy of this circle.*/
	copy: function() {
		return new Circle2(this);
	},
	/** Apply transformation matrix (in-place) and return this instance.*/
	transform: function(m) {
		this.center.transform(m);
		// FIXME: transform radius too
		return this;
	},
	/**Check, if pt is inside this polygon.
	 * @param pt
	 */
	contains: function(pt) {
		return this.center.distanceTo(pt) < this.r;
	},
//	/** Return polygon point nearest to pt.
//	 */
//	nearestPt: function(pt) {
//		// TODO:
//		alert("Not implemented: Circle2.intersects()");
//	},
	/**Check, if this circle intersects with another (moving) circle.
	 * Return false, if ther is no intersection within the current time frame.
	 * Otherwise return a dictionary with additional infos.
	 */
	intersectsCircle: function(circle2, velocity, velocity2) {
		var c1 = { x: this.center.x,
				   y: this.center.y,
				   r: this.r,
				   vx: velocity ? velocity.dx : 0,
				   vy: velocity ? velocity.dy : 0};
		var c2 = { x: circle2.center.x,
				   y: circle2.center.y,
				   r: circle2.r,
				   vx: velocity2 ? velocity2.dx : 0,
				   vy: velocity2 ? velocity2.dy : 0};
		var coll = LinaJS.intersectMovingCircles(c1, c2);
		if(!coll || coll.t < -1 || coll.t > 0){
			return false; // Intersection happens before prev. frame or in the future
		}
		// Calculate centers at the time when the collision occurred
		var tBefore = - coll.t;
		var tAfter = coll.t + 1;
		coll.t = tBefore;
		var vMTD1 = velocity.copy().scale(-tBefore);
		coll.center1 = this.center.copy().translate(vMTD1);
		var vMTD2 = velocity2.copy().scale(-tBefore);
		coll.center2 = circle2.center.copy().translate(vMTD2);
		// Collision normal is always along the two circle centers
		coll.vNormal = coll.center2.vectorTo(coll.center1).normalize();
		// Relative speed from circle towards circle2
		var vRel = velocity.copy().sub(velocity2);
		// split relative speed into a part along collision normal and the rest
		var c = coll.vNormal.dot(vRel);
		var vColl = coll.vNormal.copy().scale(c);
		var vPerp = vRel.copy().sub(vColl);
		// Total inelastic collision: circle1 transfers it's energy to circle2
		coll.velocityReflected1 = vPerp;
		coll.velocityReflected2 = velocity2.copy().add(vColl);
//		var e1 = velocity.length() + velocity2.length();
//		var e2 = coll.velocityReflected1.length() + coll.velocityReflected2.length();
//		if(Math.abs(e1-e2) > LinaJS.EPS){
//			window.console.log("e1:"+e1+", e2:"+e2);
//			window.console.log("vColl:"+vColl);
//		}
		// Calculate circle positions at t=1, assuming a total reflection
		coll.centerReflected1 = coll.center1.copy()
			.translate(tAfter * coll.velocityReflected1.dx,
					   tAfter * coll.velocityReflected1.dy);
		coll.centerReflected2 = coll.center2.copy()
			.translate(tAfter * coll.velocityReflected2.dx,
					   tAfter * coll.velocityReflected2.dy);

		return coll;
	},
	/** Return circle area (Pi*r^2).
	 * This assumes an implicitly closed, non self-intersecting polygon.
	 */
	area: function() {
		return Math.PI * this.r * this.r;
	},
	/**Return the circumference (2*Pi*r).
	 * @param {boolean} closed Include implicit closing segment (default: true).
	 */
	perimeter: function() {
		return 2 * Math.PI * this.r;
	},
	__lastEntry: undefined
};

/** Return a transformed copy of a cirlcle.*/
Circle2.transform = function(circle, m) {
	return circle.copy().transform(m);
};
