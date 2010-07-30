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
     * Create a new 2d 	arcade game.
     * @class A canvas based 2d game engine.
     * @constructs
     * @param {Processing} p
     */
    init: function(canvas, opts) {
        // constructor
		this.canvas = canvas;
		this.context = canvas.getContext("2d");
		this.opts = $.extend(true, {}, ArcadeJS.defaultGameOptions, opts);

		$(this.canvas).css("backgroundColor", "black");
		
        this.objects = [];
        this.idMap = {};
        this.keyListeners = []
        this.mouseListeners = [];
        this.typeMap = {};
        
        this.realFps = 0;
        this.fpsCorrection = 1.0;
        this._lastSecondTicks = 0;
        this._lastFrameTicks = 0;
        this.frameCount = 0;

        this._runLoopId = null;
        
        // Bind keyboard events
        var self = this;
        $(document).bind("keyup keydown keypress", function(e){
        	self.debug("e:%o", e);
        	for( var i=0; i<self.keyListeners.length; i++) {
        		var obj = self.keyListeners[i];
        		if(e.type == "keypress" && obj.onKeypress)
        			obj.onKeypress(e);
        	}
        });
        // Bind mouse events
        // Note: jquery.mousehweel.js plugin is required for Mousewheel events
        $(document).bind("mousemove mousedown mouseup mousewheel", function(e){
        	self.mousePos = new Point2(e.clientX-e.target.offsetLeft, e.clientY-e.target.offsetTop);
        	switch (e.type) {
			case "mousedown":
        		self.clickPos = new Point2(self.mousePos);
				self._dragging = false;
				break;
			case "mouseup":
        		self.clickPos = null;
				self._dragging = false;
				break;
			case "mousemove":
				if(self._dragging || self.clickPos && self.clickPos.distanceTo(self.mousePos) > 4 ){
					self._dragging = true;
	        		self.debug("draggin: %s", self.mousePos.sub(self.clickPos));
				}
				break;
			}
        	for( var i=0; i<self.mouseListeners.length; i++) {
        		var obj = self.mouseListeners[i];
        		if(e.type == "mousewheel" && obj.onMousewheel)
        			obj.onMousewheel(arguments[0], arguments[1]);
        	}
        });
    },
    toString: function() {
        return "ArcadeJS '" + this.name + "' ";
        
    },
    debug: function() {
        if (window.console && window.console.log) {  
            window.console.log.apply(this, arguments);  
        }  
    },
    _renderLoop: function(){
//        try {
//        	p.focused = document.hasFocus();
//		} catch(e) {}
		try {
		    this.stepAll();
		    this.redrawAll();
		} catch(e) {
		   this.stopLoop();
		   throw e;
		}
    },
    stepAll: function() {
    	// Some bookkeeping and timings
    	this.frameCount++;
    	var ticks = new Date().getTime();
    	this.fpsCorrection = .001 * this.opts.fps * (ticks - this._lastFrameTicks);
//    	var actFps = this.fps * 1000.0 / (ticks - this._lastFrameTicks);
//    	this.debug("fpsCorr=%s", this.fpsCorrection);
        this._lastFrameTicks = ticks;
    	if( (this.frameCount % this.opts.fps) == 0 ){
        	this.realFps = (ticks > this._lastSecondTicks) ? 1000.0 * this.opts.fps / (ticks - this._lastSecondTicks) : 0;
//        	window.console.log("realFps=%s", this.realFps);
            this._lastSecondTicks = ticks;
    	} 
    	if(this.opts.onBeginStep)
    		this.opts.onBeginStep();
    	
    	var ol = this.objects;
    	for(var i=0; i<ol.length; i++){
    		var o = ol[i];
    		if( !o.dead )
    			o.step();
    	}
    },
    redrawAll: function() {
    	var ctx = this.context;
//    	ctx.
    	if(this.opts.onBeginDraw)
    		this.opts.onBeginDraw();
    	ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    	var ol = this.objects;
    	for(var i=0; i<ol.length; i++){
    		var o = ol[i];
    		if( !o.dead && !o.hidden ) {
    			ctx.save();
    			o.redraw(ctx);
    			ctx.restore();
    		}
    	}
    	if(this.opts.onEndDraw)
    		this.opts.onEndDraw();
    },
    startLoop: function(){
    	if( !this._runLoopId) {
    		var self = this;
    	    this._runLoopId = window.setInterval(
    	    	function(){
    	    		self._renderLoop()
    	    	}, 1000/this.opts.fps);
    	}
    },
    stopLoop: function(){
    	if(this._runLoopId) {
    		window.clearInterval(this._runLoopId);
    		this._runLoopId = null;
    	}
    },
    addObject: function(o) {
    	if( this.idMap[o.id] ) {
    		throw "addObject("+o.id+"): duplicate entry";
    	}
    	// 
    	o.game = this;
    	
        this.objects.push(o);
        this.idMap[o.id] = o;
        if( typeof o.onKeydown === "function" 
        	|| typeof o.onKeypress === "function" 
        	|| typeof o.onKeyup === "function") {
        	this.keyListeners.push(o);
        }
        if( typeof o.onMousedown === "function" 
        	|| typeof o.onMousemove === "function" 
        	|| typeof o.onMouseup === "function"
        	|| typeof o.onMousewheel === "function") {
        	this.mouseListeners.push(o);
        }
        if( this.typeMap[o.type] ) {
        	this.typeMap[o.type].push(0);
        } else {
        	this.typeMap[o.type] = [ o ];
        }
        return o;
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
    	this.keyListeners = [];
    	this.mouseListeners = [];
        this.idMap = {};
        this.typeMap = {};
    	for(var i=0; i<ol.length; i++){
    		if( !o.dead )
    			this.addObject(o);
    	}
    },
    // --- end of class
    lastentry: undefined
});

ArcadeJS.nextId = 1;
ArcadeJS.defaultGameOptions = {
	name: "Generic ArcadeJS game",
	fps: 15,
	debugLevel: 1,
	lastEntry: undefined
}
ArcadeJS.defaultObjectOptions = {
//	type: undefined,
//	id: undefined,
//	tags: [],
	collisionList: [], // list of types and tags that will report collisions
	eventList: [], // list of event names that this object wants
	
	debug: {
		level: 1,
		showLabel: false,
		showBBox: false
	},
	lastEntry: undefined
}

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
        this.rotationalSpeed = 0.0 * LinaJS.DEG_TO_RAD;  // rad / tick
        this.scale = 1.0;
        this.hidden = false;
        this.dead = false;
        this.ttl = -1;
        
        this.tran = new BiTran2();
    },
    toString: function() {
        return "Movable '" + this.id + "' " + this.pos + ", " + LinaJS.RAD_TO_DEG * this.orientation + "°";
    },
    step: function() {
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
    	this.orientation += this.rotationalSpeed; 
		this.pos.x += this.move.dx;
		this.pos.y += this.move.dy;
    },
    redraw: function(ctx) {
    	if( this.hidden ) {
    		return;
    	}
    	ctx.translate(this.pos.x, this.pos.y);
    	if( this.scale && this.scale != 1.0 )
    		ctx.scale(this.scale);
    	ctx.rotate(this.orientation);

    	this.render(ctx);
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

