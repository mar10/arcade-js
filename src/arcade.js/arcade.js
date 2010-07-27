/**
 * arcade.js
 * Copyright (c) 2010,  Martin Wendt (http://wwWendt.de)
 * 
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://code.google.com/p/arcade-js/wiki/LicenseInfo
 *
 * A current version and some documentation is available at
 *     http://arcade-js.googlecode.com/
 * 
 * @fileOverview A 2D game engine that provides a render loop and support for
 * multiple moving objects. 
 * 
 * @author Martin Wendt
 * @version 0.0.1
 */
/*******************************************************************************

 * Helpers
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
 * Class ArcadeJS
 */

var ArcadeJS = Class.extend(
/** @lends ArcadeJS.prototype */
{
	/**
     * Create a new 2d arcade game.
     * @class A canvas based 2d game engine.
     * @constructs
     * @param {Processing} p
     */
    init: function(p) {
        // constructor
		this.p = p;
    	this.canvas = this.p.canvas;
    	this.context = this.p.context;

        this.objects = [];
        this.idMap = {};
        this.typeMap = {};
        this.fps = 15;
        this.realFps = 0;
        this.fpsCorrection = 1.0;
        this._lastSecondTicks = 0;
        this._lastFrameTicks = 0;
        this.frameCount = 0;
    },
    toString: function() {
        return "ArcadeJS '" + this.id + "' " + this.pos;
    },
    addObject: function(o) {
    	if( this.idMap[o.id] ) {
    		throw "addObject("+o.id+"): duplicate entry";
    	}
    	o.game = this;
    	
        this.objects.push(o);
        this.idMap[o.id] = o;
        if( this.typeMap[o.type] ) {
        	this.typeMap[o.type].push(0);
        } else {
        	this.typeMap[o.type] = [ o ];
        }
    },
    removeObject: function(o) {
    	if( this.idMap[o] ) {
    		o = this.idMap[o];
    	}
    	// TODO
    },
    purge: function() {
    	var ol = this.objects;
    	this.objects = [];
        this.idMap = {};
        this.typeMap = {};
    	for(var i=0; i<ol.length; i++){
    		if( !o.dead )
    			this.addObject(o);
    	}
    },
    draw: function(p) {
    	var ol = this.objects;
    	for(var i=0; i<ol.length; i++){
    		var o = ol[i];
    		if( !o.dead && !o.hidden )
    			o.draw(p);
    	}
    },
    step: function(p) {
    	// Some bookkeeping and timings
    	this.frameCount++;
    	var ticks = new Date().getTime();
    	this.fpsCorrection = .001 * this.fps * (ticks - this._lastFrameTicks);
//    	var actFps = this.fps * 1000.0 / (ticks - this._lastFrameTicks);
    	window.console.log("fpsCorr=%s", this.fpsCorrection);
        this._lastFrameTicks = ticks;
    	if( (this.frameCount % this.fps) == 0 ){
        	this.realFps = (ticks > this._lastSecondTicks) ? 1000.0 * this.fps / (ticks - this._lastSecondTicks) : 0;
//        	window.console.log("realFps=%s", this.realFps);
            this._lastSecondTicks = ticks;
    	} 

    	var ol = this.objects;
    	for(var i=0; i<ol.length; i++){
    		var o = ol[i];
    		if( !o.dead )
    			o.step(p);
    	}
    },
    // --- end of class
    lastentry: undefined
});

ArcadeJS.nextId = 1;

/******************************************************************************/

var Movable = Class.extend(
/** @lends Movable.prototype */
{
	/**
     * Create a new movable game object.
     * @class Represents a game object with kinetic properties.
     * @constructs
     */
    init: function(type, id, pos, orientation, move) {
        // constructor
		if(!pos || pos.x ===  undefined) { // missing args or passing 'Point2' instead of 'new Point2'
			throw "Movable requires Point2";
		}
		if(!move || move.dx === undefined) { // missing args or passing 'Vec2' instead of 'new Vec2'
			throw "Movable requires Vec2";
		}
		this.type = type;
        this.id = id || "#" + ArcadeJS.nextId++;
        this.pos = pos;  // Point2
        this.orientation = +orientation;  // rad
        this.move = move || new Vec2(0, 0);
        this.turnRate = 0.0 * LinaJS.DEG_TO_RAD;  // rad / tick
        this.scale = 1.0;
        this.hidden = false;
        this.dead = false;
        this.ttl = -1;
        
        this.mc2wc = new Matrix3();
        this.wc2mc = new Matrix3();
    },
    toString: function() {
        return "Movable '" + this.id + "' " + this.pos + ", " + LinaJS.RAD_TO_DEG * this.orientation + "°";
    },
    draw: function(p) {
    	if( this.hidden ) {
    		return;
    	}
    	p.pushMatrix();
    	p.translate(this.pos.x, this.pos.y);
    	if( this.scale != 1.0 )
    		p.scale(this.scale);
    	p.rotate(this.orientation);

    	this.render(p);
    	
    	p.popMatrix();
    },
    step: function(p) {
        //alert("G:STEP"+this.game);

    	if( this.ttl > 0) {
    		this.ttl--;
    		if( this.ttl == 0) {
    			this.dead = true;
    			this.hidden = true;
    			if( this.onDie )
    				this.onDie();
    		}
    	}
    	this.orientation += this.turnRate; 
		this.pos.x += this.move.dx;
		this.pos.y += this.move.dy;
    },
    intersectsWith: function(otherObject) {
    	if( this.getBoundingRadius && otherObject.getBoundingRadius) {
    		return this.pos.distanceTo(otherObject.pos) 
    			<= (this.getBoundingRadius() + otherObject.getBoundingRadius());
    	}
    	return undefined;
    },
    /**@function Callback, triggered when this object dies.
     * @param x a parms 
     */
    onDie: undefined,
    // --- end of class
    lastentry: undefined
});

