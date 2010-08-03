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


/******************************************************************************/


/**
 * Sound support

 */
AudioJS = function(opts){
	if(typeof opts == "string")
		opts = {url: opts};
	this.opts = $.extend({}, AudioJS.defaultOpts, opts);
	this.audio = AudioJS.load(opts.url);
}
// Static members
$.extend(AudioJS, {
	_soundElement: null,
	_audioList: {},
	audioObjSupport: undefined,
	basicAudioSupport: undefined,
	loopSupport: undefined,
	defaultOpts: {
		loop: false,
		volume: 1
	},
	/**Load and cache audio element for this URL.
	 *  @param {string} url 
	 *  @param {booelan} loop 
	 */
	load: function(url) {
		var audio = this._audioList[url];
		if( !audio ) {
			if( !this._soundElement ) {
				this._soundElement = document.createElement("div");
				this._soundElement.setAttribute("id", "AudioJS-sounds");
				this._soundElement.setAttribute("hidden", true);
				document.body.appendChild(this._soundElement);		
			}
			audio = this._audioList[url] = document.createElement("audio");
//			audio.setAttribute("autoplay", true);
			audio.setAttribute("preload", true);
			audio.setAttribute("src", url);
			this._soundElement.appendChild(audio);		
			$(audio).bind('ended',{}, function() {
//			  	$(this).trigger('play');
				window.console.log("AudioJS("+url+") ended");
			});
		}
		return audio;
	}
});
try {
	var audio = new Audio("");
	AudioJS.audioObjSupport = !!(audio.canPlayType);
	AudioJS.basicAudioSupport = !!(!AudioJS.audioObjSupport ? audio.play : false);
} catch (e) {
	AudioJS.audioObjSupport = false;
	AudioJS.basicAudioSupport = false;
}

AudioJS.prototype = {
	/**Return string representation.
	 * @returns {string}  
	 */
	toString: function() {
	    return "AudioJS("+this.opts.url+")";
	},
	/**Play this sound.
	 *  @param {booelan} loop 
	 */
	play: function(loop) {
		if(this.audio.ended){
			this.audio.play();
		}else{
			// Interrupt currently playing sound
			//this.audio.pause();
			this.audio.currentTime = 0;
			this.audio.play();
		}
	},
	lastEntry: undefined
}


/** *************************************************************************** */


var ArcadeJS = Class.extend(
/** @lends ArcadeJS.prototype */
{
	/**
     * A canvas based 2d game engine.
     * @param {canvas} canvas
     * @param {dictionary} opts
     * @constructs
     */
    init: function(canvas, opts) {
        // constructor
		this.canvas = canvas;
		this.context = canvas.getContext("2d");
		this.opts = $.extend(true, {}, ArcadeJS.defaultGameOptions, opts);

		$(this.canvas).css("backgroundColor", "black");
		
        this.objects = [];
        this.idMap = {};
        this.keyListeners = [];
        this.mouseListeners = [];
        this.typeMap = {};
        this.downKeyCodes = [];
        
        this.realFps = 0;
        this.fpsCorrection = 1.0;
        this._lastSecondTicks = 0;
        this._lastFrameTicks = 0;
        this.frameCount = 0;
        this.frameCache = {};
		this._deadCount = 0;

        this._runLoopId = null;
        
        // Bind keyboard events
        var self = this;
        $(document).bind("keyup keydown keypress", function(e){
//        	self.debug("e:%o", e);

        	if( e.type === "keyup"){
        		// TODO: only if no keys are still pressed
            	self.key = null;
            	self.keyCode = null;
//            	var idx = self.downKeyCodes.indexOf(ArcadeJS.keyCodeToString(e));
            	var idx = self.downKeyCodes.indexOf(e.keyCode);
            	if(idx >= 0)
            		self.downKeyCodes.splice(idx, 1);
            	self.debug("Keyup %s: %o", ArcadeJS.keyCodeToString(e), self.downKeyCodes);
        	} else if( e.type === "keydown"){
            	self.keyCode = e.keyCode;
            	self.key = ArcadeJS.keyCodeToString(e);
            	if( self.downKeyCodes.indexOf(self.keyCode) < 0)
            		self.downKeyCodes.push(self.keyCode);
            	self.debug("Keydown %s: %o", self.key, self.downKeyCodes);
        	} else {
        		// keypress
//            	self.keyCode = e.keyCode;
//            	self.key = ArcadeJS.keyCodeToString(e);
        	}
        	for(var i=0; i<self.keyListeners.length; i++) {
        		var obj = self.keyListeners[i];
        		if(e.type == "keypress" && obj.onKeypress)
        			obj.onKeypress(e, self.key);
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
	        		self.debug("dragging: %s", self.mousePos.vectorTo(self.clickPos));
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
		    this._stepAll();
		    this._redrawAll();
		} catch(e) {
		   this.stopLoop();
		   throw e;
		}
    },
    _stepAll: function() {
    	// Some bookkeeping and timings
    	this.frameCount++;
    	var ticks = new Date().getTime();
    	this.fpsCorrection = .001 * this.opts.fps * (ticks - this._lastFrameTicks);
//    	this.debug("fpsCorr=%s", this.fpsCorrection);
        this._lastFrameTicks = ticks;
    	if( (this.frameCount % this.opts.fps) == 0 ){
        	this.realFps = (ticks > this._lastSecondTicks) ? 1000.0 * this.opts.fps / (ticks - this._lastSecondTicks) : 0;
            this._lastSecondTicks = ticks;
    	} 
        this.frameCache = {};

        if(this.opts.onBeginStep)
    		this.opts.onBeginStep();

    	var ol = this.objects;
    	for(var i=0; i<ol.length; i++){
    		var o = ol[i];
    		if( !o._dead )
    			o._step();
    	}
    },
    _redrawAll: function() {
    	var ctx = this.context;
    	if(this.opts.onBeginDraw)
    		this.opts.onBeginDraw();
    	ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    	var ol = this.objects;
    	for(var i=0; i<ol.length; i++){
    		var o = ol[i];
    		if( !o._dead && !o.hidden ) {
    			o._redraw(ctx);
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
    	
    	this.purge(false);
    	
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
        	this.typeMap[o.type].push(o);
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
    /**Purge dead objects from object list.
     * @param: {boolean} force false: only if opts.purgeRate is reached. 
     */
    purge: function(force) {
    	// TODO: this should be a locked section!
    	var ol = this.objects;
    	if( this._purging
    		|| ol.length < 1 
    		|| !force && (this._deadCount/ol.length) < this.opts.purgeRate )
    		return false;
    	this._purging = true;
    	this.debug("Purging objects: " + this._deadCount + "/" + ol.length + " dead.");
    	this.objects = [];
    	this.keyListeners = [];
    	this.mouseListeners = [];
        this.idMap = {};
        this.typeMap = {};
    	for(var i=0; i<ol.length; i++){
    		var o = ol[i];
    		if( !o._dead )
    			this.addObject(o);
    	}
		this._deadCount = 0;
    	this._purging = false;
		return true;
    },
    /**Return an array of objects with a given type.
     * @param: {string} type 
     */
    getObjectsByType: function(type) {
		return this.typeMap[type] ? this.typeMap[type] : [];
    },
    /**Return true, if a key is currently pressed.
     * @param: {int} keyCode 
     * @returns {boolean} 
     */
    isKeyDown: function(keyCode) {
		return this.downKeyCodes.indexOf(keyCode) >= 0;
    },
    // --- end of class
    lastentry: undefined
});

ArcadeJS.nextId = 1;
ArcadeJS.defaultGameOptions = {
	name: "Generic ArcadeJS game",
	fps: 30,
	debugLevel: 1,
	purgeRate: 0.5,
	lastEntry: undefined
}


/******************************************************************************/


/**Render a Polygon2 to a canvas.
 * 
 * @param ctx canvas 2D context  
 * @param {Polygon2} polygon  
 * @param {string} mode 'outline' (default), 'line', 'solid' 
 */
ArcadeJS.renderPg = function(ctx, pg, mode)
{
	var xy = pg.xyList;
	ctx.beginPath();  
	ctx.moveTo(xy[0], xy[1]);  
	for(var i=2; i<xy.length; i+=2)
		ctx.lineTo(xy[i], xy[i+1]);
	switch (mode) {
	case "line":
		ctx.stroke();
		break;
	case "solid":
		ctx.fill();
		break;
	default:
		ctx.closePath();
		ctx.stroke();
	}
}

/**Render a circle to a canvas.
 * 
 * @param ctx canvas 2D context  
 * @param {Point2} center  
 * @param {string} mode 'outline' (default),'solid' 
 */
ArcadeJS.renderCircle = function(ctx, center, r, mode)
{
	ctx.beginPath();
	ctx.arc(center.x, center.y, r, 0, 2 * Math.PI, true);
	switch (mode) {
	case "solid":
		ctx.fill();
		break;
	default:
		ctx.closePath();
		ctx.stroke();
	}
}

/**
 * Return a nice string for a keyboard event. This function was inspired by
 * progressive.js.
 * 
 * @param {Event}
 *            e A jQuery event object.
 * @returns {string} 'a' for the key 'a', 'A' for Shift+a, '^a' for Ctrl+a,
 *          '[shift]' for
 */
ArcadeJS.keyCodeToString = function(e) {
	var code = e.keyCode; //e.charCode || e.keyCode;
	var shift = !!e.shiftKey;
	var key = null;
	
	// Map "shift + keyCode" to this code
	var shiftMap = {
		// Numbers
		48: 41, // )
		49: 33, // !
		50: 64, // @
		51: 35, // #
		52: 36, // $
		53: 37, // %
		54: 94, // ^
		55: 38, // &
		56: 42, // *
		57: 40, // (
		// Symbols and their shift-symbols
		107: 43,  // +
		219: 123, // {
		221: 125, // }
		222: 34   // "
	};
	// Coded keys
	var codeMap = {
			188: 44, // ,
			109: 45, // -
			190: 46, // .
			191: 47, // /
			192: 96, // ~
			219: 91, // [
			220: 92, // \
			221: 93, // ]
			222: 39  // '
		};
	var specialMap = {
		8: "backspace",
		9: "tab",
		10: "enter",
		13: "return",
		16: "shift",
		17: "control",
		18: "alt",
		27: "esc",
		37: "left",
		38: "up",
		39: "right",
		40: "down",
		127: "delete"
		};

	// Letters
	if ( code >= 65 && code <= 90) { // A-Z
		// Keys return ASCII for upcased letters.
		// Convert to downcase if shiftKey is not pressed.
		if ( !shift )
			code = code + 32;
		shift = false;
		key = String.fromCharCode(code);
	} else if (shiftMap[code]) {
		code = shiftMap[code];
		shift = false;
		key = String.fromCharCode(code);
	} else if (codeMap[code]) {
		code = codeMap[code];
		key = String.fromCharCode(code);
	} else if (specialMap[code]) {
		key = specialMap[code];
	} else {
		key = String.fromCharCode(code);
	}
	var prefix = "";
	if(shift)
		prefix = "shift+" + prefix;
	if(e.metaKey)
		prefix = "meta+" + prefix;
	if(e.ctrlKey)
		prefix = "ctrl+" + prefix;
	if(e.altKey)
		prefix = "alt+" + prefix;

	window.console.log("keyCode:%s -> using %s, '%s'", e.keyCode,  code, prefix + key);

	return prefix + key;
}

/** *************************************************************************** */

var Movable = Class.extend(
/** @lends Movable.prototype */
{
	/**Represents a game object with kinetic properties.
	 * @constructs
	 */
    init: function(type, id, opts) {
		this.type = type;
	    this.id = id || "#" + ArcadeJS.nextId++;
	    this.hidden = false;
	    this._dead = false;
	    // Set options
	    this.opts = $.extend(true, {}, Movable.defaultOptions, opts);
		opts = this.opts; 
		// Copy some options as direct attributes
        this.pos = opts.pos ? new Point2(opts.pos) : new Point2(0, 0);
        this.scale = opts.scale ? +opts.scale : 1.0;
        this.orientation = opts.orientation ? +opts.orientation : 0;
        this.move = opts.move ? new Vec2(opts.move) : new Vec2(0, 0);
        this.rotationalSpeed = opts.rotationalSpeed || null; //0.0 * LinaJS.DEG_TO_RAD;  // rad / tick
        this.screenModeX = opts.screenModeX || "none";
        this.screenModeY = opts.screenModeY || "none";
        this.timeout = opts.timeout;
        this.ttl = opts.ttl;
        
//        this.tran = new BiTran2();.translate();
    },
    toString: function() {
        return "Movable '" + this.id + "' " + this.pos + ", " + LinaJS.RAD_TO_DEG * this.orientation + "�";
    },
    /**
     * 
     */
    _step: function() {
    	// Fire timeout event, if one was scheduled
      	if( this.timeout > 0 && this.onTimeout ) {
    		this.timeout--;
    		if( this.timeout == 0) {
				this.onTimeout();
    		}
    	}
    	// Kill this instance and fire 'die' event, if time-to-live has expired
      	if( this.ttl > 0) {
    		this.ttl--;
    		if( this.ttl == 0) {
    			this.die();
    		}
    	}
      	// Save previous values
      	this.prevPos = this.pos;
      	this.prevOrientation = this.orientation;
      	this.prevMove = this.move;
    	this.prevRotationalSpeed = this.rotationalSpeed;
      	// Update MC-to-WC transformation
    	this.orientation += this.rotationalSpeed;
    	if(this.move) {
    		this.pos.translate(this.move);
			// wrap around at screen borders
    		var canvas = this.game.canvas;
    		if(this.screenModeX == "wrap"){
    			this.pos.x = (canvas.width + this.pos.x) % canvas.width; 
    		}
    		if(this.screenModeY == "wrap"){
    			this.pos.y = (canvas.height + this.pos.y) % canvas.height;
    		}
    	}
    	// Let derived class change it
    	if(typeof this.step == "function")
    		this.step();
      	// Update MC-to-WC transformation
    },
    _redraw: function(ctx) {
    	if( this.hidden ) {
    		return;
    	}
    	// Push current transformation and rendering context
		ctx.save();
		// Apply object translation, rotation and scale
    	ctx.translate(this.pos.x, this.pos.y);
    	if( this.scale && this.scale != 1.0 )
    		ctx.scale(this.scale, this.scale);
    	if( this.orientation )
    		ctx.rotate(this.orientation);
    	// Let object render itself
    	this.render(ctx);
    	// Render optional debug infos
    	ctx.strokeStyle = "#80ff00";
    	if(this.opts.debug.showBCircle && typeof this.getB){
    		var r = this.getBoundingRadius();
    		ArcadeJS.renderCircle(ctx, {x:0, y:0}, r);
    	}
    	// Restore previous transformation and rendering context
		ctx.restore();
    },
    die: function() {
    	if( this._dead )
    		return;
		this._dead = true;
		this.hidden = true;
		if( this.onDie )
			this.onDie();
		if(this._dead){
			this.game._deadCount++;
			this.game.purge(false);
		}
    },
    intersectsWith: function(otherObject) {
    	if( this.getBoundingRadius && otherObject.getBoundingRadius) {
    		return this.pos.distanceTo(otherObject.pos) 
    			<= (this.getBoundingRadius() + otherObject.getBoundingRadius());
    	}
    	return undefined;
    },
    /**@function Override this to apply additional transformations.
     */
    step: undefined,
    /**@function Draw the object to the canvas.
     * The objects transformation is already applied to the canvas when this
     * function is called. Drawing commands should use modeling coordinates. 
     * @param ctx Canvas 2D context.
     */
    render: undefined,
    /**@function Return bounding circle for fast a-priory collision checking.
     * @returns {float} radius of bounding circle. Center is assumed at (0/0)
     * in modelling coordinates.
     */
    getBoundingRadius: undefined,
    /**@function Return bounding box for fast a-priory collision checking.
     * @returns {BBox2}
     * in modelling coordinates.
     */
    getBoundingBox: undefined,
    /**@function Callback, triggered when this object dies.
     * @param {Event} e
     * @param {String} key stringified key.
     */
    onKeypress: undefined,
    /**@function Callback, triggered when mouse wheel was used.
     * Note: this requires to include the jquery.mouseweheel.js plugin.
     * @param {Event} e
     * @param {int} delta +1 or -1
     */
    onMousewheel: undefined,
    /**@function Callback, triggered when timeout counter reaches zero.
     */
    onTimeout: undefined,
    /**@function Callback, triggered when this object dies.
     */
    onDie: undefined,
    // --- end of class
    lastentry: undefined
});

/**Default options used when a Movable or derived object is constructed.*/
Movable.defaultOptions = {
//		type: undefined,
//		id: undefined,
//		tags: [],
	collisionList: [], // list of types and tags that will report collisions
//	eventList: [], // list of event names that this object wants
	pos: null,
	/**@field {string} 'wrap', 'bounce', 'collision', or 'none'.*/
	screenModeX: "wrap",
	screenModeY: "wrap",
	debug: {
		level: 1,
		showLabel: false,
		showBBox: false,
		showBCircle: true
	},
	lastEntry: undefined
}

