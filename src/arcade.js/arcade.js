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
 * Sound support based on &lt;audio> element.
 * @class
 * @example
 * var clickSound = new AudioJS('click.wav')
 * [...]
 * clickSound.play();
 */
AudioJS = function(opts){
	if(typeof opts == "string")
		opts = {url: opts};
	this.opts = $.extend({}, AudioJS.defaultOpts, opts);
	this.audio = AudioJS.load(opts.url);
}
// Static members
$.extend(AudioJS, 
	/** @lends AudioJS  */ 
	{
	_soundElement: null,
	_audioList: {},
	/**@field {boolean} */
	audioObjSupport: undefined,
	/**@field {boolean} */
	basicAudioSupport: undefined,
	/**@field {boolean} */
	loopSupport: undefined,
	defaultOpts: {
		loop: false,
		volume: 1
	},
	/**Load and cache audio element for this URL.
	 *  @param {string} url 
	 */
	load: function(url) {
		var audio = this._audioList[url];
		if( !audio ) {
			if( !this._soundElement ) {
				this._soundElement = document.createElement("div");
				this._soundElement.setAttribute("id", "AudioJS-sounds");
				this._soundElement.setAttribute("hidden", true);
				document.body.appendChild(this._soundElement);		
//				$(this._soundElement).bind('ended',{}, function() {
//					window.console.log("AudioJS("+this+") loaded");
//				});
			}
			audio = this._audioList[url] = document.createElement("audio");
//			audio.setAttribute("autoplay", true);
			audio.setAttribute("preload", true);
			audio.setAttribute("src", url);
			this._soundElement.appendChild(audio);		
			$(audio).bind('ended',{}, function() {
				// TODO: we can simulate looping if it is not natively supported:
//			  	$(this).trigger('play');
				if(window.console)
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
	 *  @param {boolean} loop Optional, default: false
	 */
	play: function(loop) {
		if(!this.audio.ended){
			// Interrupt currently playing sound
			//this.audio.pause();
			this.audio.currentTime = 0;
		}
		this.audio.play();
	},
	lastEntry: undefined
}


/*----------------------------------------------------------------------------*/


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
		/**Game options (defaultGameOptions + options passed to the constructor).*/
		this.opts = $.extend(true, {}, ArcadeJS.defaultGameOptions, opts);
		// Copy selected options as object attributes
		ArcadeJS.extendAttributes(this, this.opts, "name,fps,resizeMode");
		
		/**HTML5 canvas element*/
		this.canvas = canvas;
		/**Canvas 2d context*/
		this.context = canvas.getContext("2d");
//		this.context = _extendCanvasContext(this.context);
		$.extend(this.context, ArcadeCanvas);
		
        var $canvas = $(this.canvas);
        $canvas.css("backgroundColor", this.opts.backgroundColor);
        // Adjust canvas height and width (if specified as %, it would default to 300x150)
		this.canvas.width = $canvas.width();
		this.canvas.height = $canvas.height();
		this.context.strokeStyle = this.opts.strokeStyle;
		this.context.fillStyle = this.opts.fillStyle;
		
        this.objects = [];
        this.idMap = {};
        this.keyListeners = [ this ];
        this.mouseListeners = [ this ];
        this.touchListeners = [ this ];
        this.activityListeners = [ this ];
        this.dragListeners = [];
		this._draggedObjects = [];
        this.typeMap = {};
        this.downKeyCodes = [];
		this._activity = "idle";
        
		/**Frames per second rate that was achieved recently*/
        this.realFps = 0;
    	this.time = new Date().getTime();
		/**Correction factor that will assure constant screen speed when FpS drops.*/
        this.fpsCorrection = 1.0;
        this._lastSecondTicks = 0;
        this._lastFrameTicks = 0;
		/**Number of frames rendered so far.*/
        this.frameCount = 0;
        /**Temporary dictionary to store data during one render loop.*/
        this.frameCache = {};
		this._deadCount = 0;

        this._runLoopId = null;
    	this.stopRequest = false;
        
		this.clickPos = undefined;
		this.mousePos = undefined;
		this.dragOffset = undefined;
		this.keyCode = undefined;
		this.key = undefined;
    	this.downKeyCodes = [];

        // Bind keyboard events
        var self = this;
        $(document).bind("keyup keydown keypress", function(e){
        	if( e.type === "keyup"){
            	self.keyCode = null;
            	self.key = null;
            	var idx = self.downKeyCodes.indexOf(e.keyCode);
            	if(idx >= 0)
            		self.downKeyCodes.splice(idx, 1);
//            	self.debug("Keyup %s: %o", ArcadeJS.keyCodeToString(e), self.downKeyCodes);
        	} else if( e.type === "keydown"){
            	self.keyCode = e.keyCode;
            	self.key = ArcadeJS.keyCodeToString(e);
            	if( self.downKeyCodes.indexOf(self.keyCode) < 0)
            		self.downKeyCodes.push(self.keyCode);
//            	self.debug("Keydown %s: %o", self.key, self.downKeyCodes);
        	} else {
        		// keypress
        	}
        	for(var i=0; i<self.keyListeners.length; i++) {
        		var obj = self.keyListeners[i];
        		if(e.type == "keypress" && obj.onKeypress) {
        			obj.onKeypress(e);
        		} else if(e.type == "keyup" && obj.onKeyup) {
        			obj.onKeyup(e, self.key);
        		} else if(e.type == "keydown" && obj.onKeydown) {
        			obj.onKeydown(e, self.key);
        		}
        	}
        });
        // Bind mouse events
        // Note: jquery.mousehweel.js plugin is required for Mousewheel events
        $(document).bind("mousemove mousedown mouseup mousewheel", function(e){
        	// Mouse position in canvas coordinates
//        	self.mousePos = new Point2(e.clientX-e.target.offsetLeft, e.clientY-e.target.offsetTop);
        	self.mousePos = new Point2(e.pageX - self.canvas.offsetLeft, 
        			e.pageY - self.canvas.offsetTop);
        	var startDrag = false, drop = false, cancelDrag = false;
        	switch (e.type) {
			case "mousedown":
        		self.clickPos = new Point2(self.mousePos);
        		cancelDrag = !!self._dragging;
				self._dragging = false;
				break;
			case "mouseup":
        		self.clickPos = null;
        		drop = !!self._dragging;
				self._dragging = false;
				break;
			case "mousemove":
				if(self._dragging || self.clickPos && self.clickPos.distanceTo(self.mousePos) > 4 ){
					startDrag = !self._dragging;
					self._dragging = true;
	        		self.dragOffset = self.clickPos.vectorTo(self.mousePos);
//	        		self.debug("dragging: %s", self.dragOffset);
				} else {
	        		self.dragOffset = null;
				}
				break;
			}
        	for( var i=0; i<self.mouseListeners.length; i++) {
        		var obj = self.mouseListeners[i];
        		if(e.type == "mousemove" && obj.onMousemove) {
        			obj.onMousemove(arguments[0]);
        		} else if(e.type == "mousedown" && obj.onMousedown) {
        			obj.onMousedown(arguments[0]);
        		} else if(e.type == "mouseup" && obj.onMouseup) {
        			obj.onMouseup(arguments[0]);
        		} else if(e.type == "mousewheel" && obj.onMousewheel) {
        			obj.onMousewheel(arguments[0], arguments[1]);
        		}
        	}
        	if(startDrag){
        		self._draggedObjects = [];
            	for(var i=0; i<self.dragListeners.length; i++) {
            		var obj = self.dragListeners[i];
            		if( obj.contains(self.clickPos) && obj.onDragstart(self.clickPos) === true ) {
                		self._draggedObjects.push(obj);
            		} 
            	}
        	}else{
            	for(var i=0; i<self._draggedObjects.length; i++) {
            		var obj = self._draggedObjects[i];
            		if(drop && obj.onDrop) {
//            			obj.onDrop(self.clickPos.vectorTo(self.mousePos));
            			obj.onDrop(self.dragOffset);
            		} else if(cancelDrag && obj.onDragcancel) {
            			obj.onDragcancel(self.dragOffset);
            		} else if(self._dragging && e.type == "mousemove" && obj.onDrag) {
//            			obj.onDrag(self.clickPos.vectorTo(self.mousePos));
            			obj.onDrag(self.dragOffset);
            		}
            	}
//            	if(drop || cancelDrag)
//            		self._draggedObjects = [];
        	}
        });
        // Bind touch and gesture events
        $(canvas).bind("touchstart touchend touchmove touchcancel gesturestart gestureend gesturechange", function(e){
        	for( var i=0; i<self.touchListeners.length; i++) {
        		var obj = self.touchListeners[i];
        		if(obj.onTouchevent) {
        			obj.onTouchevent(e, e.originalEvent);
        		}
        	}
        });
        // Adjust canvas height and width on resize events
        $(window).resize(function(e){
        	if(!this.onResize || this.onResize(e) !== false) {
        		switch(self.resizeMode) {
				case "adjust":
					var $c = $(self.canvas);
	        		self.canvas.width = $c.width();
	        		self.canvas.height = $c.height();
					break;
				default:
					// Keep current coordinate range and zoom/shrink output(default 300x150)
				}
//        		self.debug("ArcadeJS resized to: %sx%s", self.canvas.width, self.canvas.height);
        	}
        });
    },
    toString: function() {
//        return "ArcadeJS '" + this.name + "', activity: '" + this._activity + "'";
        return "ArcadeJS<" + this.name + ">";
    },
    /**Output string to console.
     * @param: {string} msg
     */
    debug: function(msg) {
        if(window.console && window.console.log) {  
//        	var args = Array.prototype.slice.apply(arguments, [1]); 
            window.console.log.apply(window.console, arguments);  
        }  
    },
    /**Return current activity.
     * @returns {string}
     */
    getActivity: function() {
        return this._activity;  
    },
    /**Set current activity and trigger onSetActivity events.
     * @param {string} activity
     * @returns {string} previous activity
     */
    setActivity: function(activity) {
        var prev = this._activity;
        this._activity = activity;
    	for(var i=0; i<this.activityListeners.length; i++) {
    		var obj = this.activityListeners[i];
    		if(obj.onSetActivity)
    			obj.onSetActivity(this, activity, prev);
    	}
        return prev;
    },
    _renderLoop: function(){
//        try {
//        	p.focused = document.hasFocus();
//		} catch(e) {}
		try {
	        this.frameCache = {collisionCache: {}};
		    this._stepAll();
		    this._redrawAll();
		    if( this.stopRequest ){
		    	this.stopLoop();
		    	this.stopRequest = false;
		    }
		} catch(e) {
		   this.stopLoop();
		   this.debug("Exception in render loop: %o", e);
		   throw e;
		}
    },
    _stepAll: function() {
    	// Some bookkeeping and timings
    	this.frameCount++;
    	var ticks = new Date().getTime();
    	this.time = ticks;
    	this.fpsCorrection = .001 * this.fps * (ticks - this._lastFrameTicks);
//    	this.debug("fpsCorr=%s", this.fpsCorrection);
        this._lastFrameTicks = ticks;
    	if( (this.frameCount % this.fps) == 0 ){
        	this.realFps = (ticks > this._lastSecondTicks) ? 1000.0 * this.fps / (ticks - this._lastSecondTicks) : 0;
            this._lastSecondTicks = ticks;
    	} 

        if(this.preStep)
    		this.preStep();

    	var ol = this.objects;
    	for(var i=0; i<ol.length; i++){
    		var o = ol[i];
    		if( !o._dead )
    			o._step();
    	}
    	if(this.postStep)
    		this.postStep();
    },
    _redrawAll: function() {
    	var ctx = this.context;
    	ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    	// Push current transformation and rendering context
		ctx.save();
    	if(this.preDraw)
    		this.preDraw(ctx);
    	var ol = this.objects;
    	for(var i=0; i<ol.length; i++){
    		var o = ol[i];
    		if( !o._dead && !o.hidden ) {
    			o._redraw(ctx);
    		}
    	}
    	if(this.postDraw)
    		this.postDraw(ctx);
    	// Restore previous transformation and rendering context
		ctx.restore();
	    // Display FpS
    	if(this.opts.debug.showFps){
    		ctx.save();
        	ctx.font = "12px sans-serif";
        	ctx.fillText(this.realFps.toFixed(1) + " fps", this.canvas.width-50, 15);
    		ctx.restore();
    	}

		// Draw debug infos
		var infoList = [];
    	if(this.opts.debug.showKeys){
        	infoList.push("Keys: [" + this.downKeyCodes + "]");
    	}
    	if(this.opts.debug.showObjects){
        	infoList.push("Objects: " + this.objects.length + " (dead: "+ this._deadCount+")");
    	}
    	if(infoList.length){
    		ctx.save();
        	ctx.font = "12px sans-serif";
        	ctx.fillStyle = this.opts.debug.strokeStyle;
        	ctx.fillText(infoList.join(", "), 10, this.canvas.height - 5);
    		ctx.restore();
    	}
    },
//    _dispatchEvent: function(eventName, object, handler, e) {
//    },
    /**Start render loop.  
     */
    startLoop: function(){
    	if( !this._runLoopId) {
    		var self = this;
    	    this._runLoopId = window.setInterval(
    	    	function(){
    	    		self._renderLoop()
    	    	}, 1000/this.fps);
    	}
    },
    /**Stop render loop.
     */
    stopLoop: function(){
    	this.stopRequest = false;
    	if(this._runLoopId) {
    		window.clearInterval(this._runLoopId);
    		this._runLoopId = null;
    	}
    },
    /**Return true, if render loop is active.
     * @returns Boolean
     */
    isRunning: function(){
    	return !!this._runLoopId;
    },
    /**Add game object to object list.
     * @param: {Movable} o
     * @returns {Movable}  
     */
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
        if( typeof o.onTouchevent === "function") {
        	this.touchListeners.push(o);
        }
        if( typeof o.onSetActivity === "function") {
        	this.activityListeners.push(o);
        }
        if( typeof o.onDragstart === "function") {
        	this.dragListeners.push(o);
        }
        if( this.typeMap[o.type] ) {
        	this.typeMap[o.type].push(o);
        } else {
        	this.typeMap[o.type] = [ o ];
        }
        return o;
    },
    /**Purge dead objects from object list.
     * @param: {boolean} force false: only if opts.purgeRate is reached. 
     */
    purge: function(force) {
    	var ol = this.objects;
    	if( this._purging
    		|| ol.length < 1 
    		|| (!force && (this._deadCount/ol.length) < this.opts.purgeRate)
    		){
    		return false;
    	}
    	this._purging = true;
    	this.debug("Purging objects: " + this._deadCount + "/" + ol.length + " dead.");
    	this.objects = [];
    	this.keyListeners = [ this ];
    	this.mouseListeners = [ this ];
    	this.touchListeners = [ this ];
    	this.activityListeners = [ this ];
    	this.dragListeners = [ ];
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
    /**Return an array of objects with a given type (array may be empty).
     * @param: {string} type 
     */
    getObjectsByType: function(type) {
		return this.typeMap[type] ? this.typeMap[type] : [];
    },
    /**Call func(obj) for all objects.
     * @param: {function} func 
     * @param: {string} types Restrict objects to this comma separated typenames
     */
    visitObjects: function(func, types) {
    	if(typeof types == "string")
    		types = types.replace(" ", ",").split(",");
    	var __visitList = function(list){
    		for(var i=0; i<list.length; i++){
    			var obj = list[i];
    			if(obj._dead)
    				continue;
    			var res = func(obj);
    			if(res === false)
    				return false;
    		}
    	};
    	if(types && types.length){
    		for(var i=0; i<types.length; i++){
    			var list = this.typeMap[types[i]];
    			if(list && list.length) {
    				var res = __visitList(list);
    				if(res === false)
    					break;
    			}
    		}
    	}else{
    		__visitList(this.objects); 
    	} 
    },
    /**Return an array of objects at a given point.
     * @param: {Point2} pt Position in canvas coordinates 
     * @param: {string} types Restrict search to this comma separated typenames
     */
    getObjectsAtPosition: function(pt, types, stopOnFirst) {
    	pt = pt || this.mousePos;
    	var matches = [];
    	this.visitObjects(function(obj){
    		if(obj.contains(pt)){
				matches.push(obj);
				if(stopOnFirst)
					return false;
    		}
    	}, types); 
    	return matches;
    },
    /**Return true, if a key is currently pressed.
     * @param: {int} keyCode 
     * @returns {boolean} 
     * @see Movable.onKeypress
     */
    isKeyDown: function(keyCode) {
		return this.downKeyCodes.indexOf(keyCode) >= 0;
    },
    /**Wide check if object1 and object2 are collision candiates.
     * @param: {Movable} object1 
     * @param: {Movable} object2
     * @returns {boolean}
     */
    preCheckCollision: function(object1, object2) {
    	// Objects cannot collide with themselves
		if(object1 === object2) {
			return false;
		} else if(object1.hidden || object2.hidden || object1._dead || object2._dead ) {
			return false;
		}
		var id1 = ""+object1.id, id2 = ""+object2.id;
		var tag = (id1 < id2) ? id1 + "~" + id2 : id2 + "~" + id1;
		var cc = this.frameCache.collisionCache;
    	// This pair was already checked
		if( cc[tag] ) {
			return false;
		}
		cc[tag] = true;
		// Check bounding circles if possible
    	if( object1.getBoundingRadius && object2.getBoundingRadius
    		&& object1.pos.distanceTo(object2.pos) > (object1.getBoundingRadius() + object2.getBoundingRadius())) {
    		return false;
    	}
		// TODO: check if velocities are pointing away from each other
		// Narrow check required
		return true;
    },
    /**@function Called when window is resized (and on start).
     * The default processing depends on the 'resizeMode' option.
     * @param {Event} e
     * @returns false to prevent default handling
     */
    onResize: undefined,
    /**@function Called on miscelaneous touch... and gesture... events.
     * @param {Event} event jQuery event
     * @param {OriginalEvent} originalEvent depends on mobile device
     */
    onTouchevent: undefined,
    /**@function Called before object.step() is called on all game ojects.
     */
    preStep: undefined,
    /**@function Called after object.step() was called on all game ojects.
     */
    postStep: undefined,
    /**@function Called before object.render() is called on all game ojects.
     * object.step() calls have been executed and canvas was cleared. 
     * @param ctx Canvas 2D context.
     */
    preDraw: undefined,
    /**@function Called after object.render() was called on all game ojects.
     * @param ctx Canvas 2D context.
     */
    postDraw: undefined,
    // --- end of class
    lastentry: undefined
});

/**Copy selected dictionary members as object attributes.
 * @param {Class} object  
 * @param dict  
 * @param {string} attrNames comma seperated attribute names that will be 
 * shallow-copied from dict to object.
 * @throws "Attribute 'x' not found."
 */
ArcadeJS.extendAttributes = function(object, dict, attrNames){
	if(typeof attrNames === "string")
		attrNames = attrNames.replace(" ", ",").split(",");
	for(var i=0; i<attrNames.length; i++){
		var name = $.trim(attrNames[i]);
		if(dict[name] === undefined)
			throw("Attribute '" + name + "' not found in dictionary.");
		object[name] = dict[name];
	}
};

/**Used to generate unique object IDs.*/
ArcadeJS.nextId = 1;

/**Default options dictionary.*/
ArcadeJS.defaultGameOptions = {
	name: "Generic ArcadeJS application",
	//activity: "idle",
	backgroundColor: "black", // canvas background color
	strokeStyle: "#ffffff", // default line color
	fillStyle: "#c0c0c0", // default solid filll color
    resizeMode: "adjust",
	fps: 30,
	debug: {
		level: 1,
    	strokeStyle: "#80ff00",
		showKeys: false,
		showFps: true,
		showObjects: false
	},
	purgeRate: 0.5,
	lastEntry: undefined
}


/*----------------------------------------------------------------------------*/


/**Augmented HTML 5 canvas.
 * This functions are added to a ArcadeJS canvas. 
 * @class 
 * @augments Canvas  
 */ 
ArcadeCanvas = 
{
	__drawCircle: function(arg1, arg2, arg3) {
		this.beginPath();
		if(arguments.length === 3){
			this.arc(arg1, arg2, arg3, 0, 2 * Math.PI, true);
		} else if(arguments.length === 2){
			this.arc(arg1.x, arg1.y, arg2, 0, 2 * Math.PI, true);
		} else {
			this.arc(arg1.center.x, arg1.center.y, arg1.r, 0, 2 * Math.PI, true);
		}
	},
	/**Render a circle outline to a canvas.
	 * 
	 * @example  
	 * strokeCircle2(circle2)  
	 * strokeCircle2(point2, radius)  
	 * strokeCircle2(center.x, center.y, radius)  
	 */
	strokeCircle2: function() {
		this.__drawCircle.apply(this, arguments);
		this.closePath();
		this.stroke();
	},
	/**Render a filled circle to a canvas.
	 * @see strokeCircle2
	 */
	fillCircle2: function() {
		this.__drawCircle.apply(this, arguments);
		this.fill();
	},
	/**Render a Polygon2 outline to a canvas.
	 * 
	 * @param {Polygon2} pg  
	 * @param {Boolean} closed (optional) default: true 
	 */
	strokePolygon2: function(pg, closed){
		var xy = pg.xyList;
		this.beginPath();  
		this.moveTo(xy[0], xy[1]);  
		for(var i=2; i<xy.length; i+=2)
			this.lineTo(xy[i], xy[i+1]);
		if(closed !== false)
			this.closePath();
		this.stroke();
	},
	/**Render a filled Polygon2 to a canvas.
	 * 
	 * @param {Polygon2} pg  
	 */
	fillPolygon2: function(pg){
		var xy = pg.xyList;
		this.beginPath();  
		this.moveTo(xy[0], xy[1]);  
		for(var i=2; i<xy.length; i+=2)
			this.lineTo(xy[i], xy[i+1]);
		this.fill();
	},
	/**Render a vector to the canvas.
	 * @param {Vec2} vec  
	 * @param {Point2} origin (optional) default: (0/0)  
	 */
	strokeVec2: function(vec, origin) {
		origin = origin || new Point2(0, 0);
		var tip = 5;
		this.beginPath();
		this.moveTo(origin.x, origin.y);
		var ptTip = origin.copy().translate(vec);
		var pt = ptTip.copy();
		this.lineTo(pt.x, pt.y);
		this.closePath();
		this.stroke();
		if(vec.isNull())
			return;
		this.beginPath();
		var v = vec.copy().setLength(-tip);
		var vPerp = v.copy().perp().scale(.5);
		pt.translate(v).translate(vPerp);
		this.lineTo(pt.x, pt.y);
		pt.translate(vPerp.scale(-2));
		this.lineTo(pt.x, pt.y);
		this.lineTo(ptTip.x, ptTip.y);
//			this.lineTo(origin.x, origin.y);
		this.closePath();
		this.stroke();
	},
	/**Render a Point2 to the canvas.
	 * @param {Point2} pt  
	 * @param {float} size (optional) default: 4  
	 */
	strokePoint2: function(){
		if( pt.x ) {
			var size = arguments[1] || 4;
			this.rect(pt.x, pt.y, size, size);
		} else {
			var size = arguments[2] || 4;
			this.rect(arguments[0], arguments[1], size, size);
		}
	}, 
	/**Render a text field to the canvas.
	 */
	strokeBanner: function(text){
		
	} 
}


/**
 * Return a nice string for a keyboard event. This function was inspired by
 * progressive.js.
 * 
 * @param {Event} e A jQuery event object.
 * @returns {string} 'a' for the key 'a', 'A' for Shift+a, '^a' for Ctrl+a,
 *          '[shift]' for
 */
ArcadeJS.keyCodeToString = function(e) {
	var code = e.keyCode; 
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
	if(shift && code != 16)
		prefix = "shift+" + prefix;
	if(e.metaKey)
		prefix = "meta+" + prefix;
	if(e.ctrlKey && code != 17)
		prefix = "ctrl+" + prefix;
	if(e.altKey && code != 18)
		prefix = "alt+" + prefix;

	//window.console.log("keyCode:%s -> using %s, '%s'", e.keyCode,  code, prefix + key);

	return prefix + key;
}

/* ****************************************************************************/

var Movable = Class.extend(
/** @lends Movable.prototype */
{
	/**Represents a game object with kinetic properties.
	 * @constructs
	 */
    init: function(type, opts) {
		this.type = type;
	    this.id = (opts && opts.id) ? opts.id : "#" + ArcadeJS.nextId++;
	    this.hidden = false;
	    this._dead = false;
        this._activity = null;
	    // Set options
	    this.opts = $.extend(true, {}, Movable.defaultOptions, opts);
		opts = this.opts; 
		// Copy some options as direct attributes
        this.pos = opts.pos ? new Point2(opts.pos) : new Point2(0, 0);
        this.scale = opts.scale ? +opts.scale : 1.0;
        this.orientation = opts.orientation ? +opts.orientation : 0;
        this.velocity = opts.velocity ? new Vec2(opts.velocity) : new Vec2(0, 0);
        this.mass = opts.mass ? +opts.mass : 1;
        this.rotationalSpeed = opts.rotationalSpeed || null; //0.0 * LinaJS.DEG_TO_RAD;  // rad / tick
        this.screenModeX = opts.screenModeX || "none";
        this.screenModeY = opts.screenModeY || "none";
        this.timeout = +opts.timeout;
        this.ttl = +opts.ttl;
        
//        this.tran = new BiTran2();.translate();
    },
    toString: function() {
        return "Movable<"+this.type+"> '" + this.id + "' @ " + this.pos;
    },
    /**Return current activity.
     * @returns {string}
     */
    getActivity: function() {
        return this._activity;  
    },
    /**Set current activity and trigger onSetActivity events.
     * @param {string} activity
     * @returns {string} previous activity
     */
    setActivity: function(activity) {
        var prev = this._activity;
        this._activity = activity;
    	for(var i=0; i<this.game.activityListeners.length; i++) {
    		var obj = this.game.activityListeners[i];
    		if(obj.onSetActivity)
    			obj.onSetActivity(this, activity, prev);
    	}
        return prev;
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
      	this.prevVelocity = this.velocity;
    	this.prevRotationalSpeed = this.rotationalSpeed;
      	// Update MC-to-WC transformation
    	this.orientation += this.rotationalSpeed;
    	if(this.velocity) {
    		this.pos.translate(this.velocity);
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
    	if(this.opts.debug.showVelocity && this.velocity){
        	ctx.strokeStyle = this.opts.debug.strokeStyle;
    		ctx.strokeVec2(this.velocity.copy().scale(this.opts.debug.velocityScale));
    	}
    	if( this.orientation )
    		ctx.rotate(this.orientation);
    	// Let object render itself
    	this.render(ctx);
    	// Render optional debug infos
    	if(this.opts.debug.showBCircle && this.getBoundingRadius){
        	ctx.strokeStyle = this.opts.debug.strokeStyle;
        	var circle = new Circle2({x:0, y:0}, this.getBoundingRadius());
    		var r = this.getBoundingRadius();
    		ctx.strokeCircle2({center:{x:0, y:0}, r:this.getBoundingRadius()});
    	}
//    	if(this.opts.debug.showVelocity && this.velocity){
//        	ctx.strokeStyle = this.opts.debug.strokeStyle;
//    		ctx.strokeVec2(this.velocity.copy().scale(this.opts.debug.velocityScale));
//    	}

    	// Restore previous transformation and rendering context
		ctx.restore();
    },
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
    /**Remove this object from the game.
     */
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
    /**Return true, if point hits this object.
     * @param {Point2} pt Point in canvas coordinates
     * @returns {boolean}
     */
    contains: function(pt) {
    	if(this.getBoundingRadius) {
    		return this.pos.distanceTo(pt) <= this.getBoundingRadius();
    	}
    	return undefined;
    },
    /**Return true, if object intersects with this object.
     * @param {Movable} otherObject
     * @returns {boolean}
     */
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
     * function is called. Therefore drawing commands should use modeling 
     * coordinates. 
     * @param ctx Canvas 2D context.
     */
    render: undefined,
    /**@function Callback, triggered when document keydown event occurs.
     * @param {Event} e
     * @param {String} key stringified key, e.g. 'a', 'A', 'ctrl+a', or 'shift+enter'.
     */
    onKeydown: undefined,
    /**@function Callback, triggered when document keyup event occurs.
     * @param {Event} e
     * @param {String} key stringified key, e.g. 'a', 'A', 'ctrl+a', or 'shift+enter'.
     */
    onKeyup: undefined,
    /**@function Callback, triggered when document keypress event occurs.
     * Synchronous keys are supported
     * @param {Event} e
     * @see ArcadeJS.isKeyDown(keyCode)
     */
    onKeypress: undefined,
    /**@function Callback, triggered when mouse wheel was used.
     * Note: this requires to include the jquery.mouseweheel.js plugin.
     * @param {Event} e
     * @param {int} delta +1 or -1
     */
    onMousewheel: undefined,
    /**@function Callback, triggered when a mouse drag starts over this object.
     * @param {Point2} clickPos 
     * @returns {boolean} must return true, if object wants to receive drag events
     */
    onDragstart: undefined,
    /**@function Callback, triggered while this object is dragged.
     * @param {Vec2} dragOffset 
     */
    onDrag: undefined,
    /**@function Callback, triggered when a drag operation is cancelled.
     * @param {Vec2} dragOffset 
     */
    onDragcancel: undefined,
    /**@function Callback, triggered when a drag operation ends with mouseup.
     * @param {Vec2} dragOffset 
     */
    onDrop: undefined,
    /**@function Called on miscelaneous touch... and gesture... events.
     * @param {Event} event jQuery event
     * @param {OriginalEvent} originalEvent depends on mobile device
     */
    onTouchevent: undefined,
    /**@function Callback, triggered when game or an object activity changes.
     * @param {Movable} target object that changed its activity 
     * (May be the ArcadeJS object too).
     * @param {string} activity new activity
     * @param {string} prevActivity previous activity
     */
    onSetActivity: undefined,
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
//	collisionList: [], // list of types and tags that will report collisions
//	eventList: [], // list of event names that this object wants
	pos: null,
	/**@field {string} 'wrap', 'bounce', 'collision', or 'none'.*/
	screenModeX: "wrap",
	screenModeY: "wrap",
	debug: {
		level: 1,
		showLabel: false,
		showBBox: false,
		showBCircle: false,
		showVelocity: false,
		velocityScale: 1.0
	},
	lastEntry: undefined
}
