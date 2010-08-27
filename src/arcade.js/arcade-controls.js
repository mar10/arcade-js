/**
 * arcade-mobile.js
 * Copyright (c) 2010,  Martin Wendt (http://wwWendt.de)
 * 
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://code.google.com/p/arcade-js/wiki/LicenseInfo
 *
 * A current version and some documentation is available at
 *     http://arcade-js.googlecode.com/
 * 
 * @fileOverview Controls and tools for ArcadeJS on mobile devices.
 * 
 * @author Martin Wendt
 * @version 0.0.1
 */

function _getTouchWithId(touchList, id){
	if(id && touchList && touchList.length){
		for(var i=0; i<touchList.length; i++) {
			var touch = touchList[i]; 
			if(touch.identifier === id)
				return touch;
		}
	}
	return null;
}

/*----------------------------------------------------------------------------*/

/**Button for mouse touch screen devices. 
 * @class
 * @extends Movable 
 */

var TouchButton = Movable.extend(
/** @lends TouchButton.prototype */
{
    init: function(opts) {
	    this._super("button", $.extend({
	    	r: 20,
	    	onClick: function() { alert("onClick is mandatory"); }
		}, opts));
		// Copy selected options as object attributes
        ArcadeJS.extendAttributes(this, this.opts, "r onClick");
        this.touchDownId = null;
        this.clicked = false;
        this.down = false;
    },
    getBoundingRadius: function() {
    	return this.r;
    },
    render: function(ctx) {
    	// Draw gray sphere
    	var gradient = ctx.createRadialGradient(0, 0, 0, 5, -5, this.r);
    	gradient.addColorStop(0, "rgba(255, 255, 255, 0.7)");
    	if(!this.down)
    		gradient.addColorStop(0.7, "rgba(192, 192, 192, 0.7)");
    	gradient.addColorStop(1, "rgba(80, 80, 80, 0.7)");
    	ctx.fillStyle = gradient;    	
    	ctx.fillCircle2(0, 0, this.r);
	},
    onMousedown: function(e) {
    	this.down = this.clicked = this.contains(this.game.mousePos);
    },
    onMousemove: function(e) {
    	this.down = this.clicked && this.contains(this.game.mousePos);
    },
    onMouseup: function(e) {
    	if(this.clicked && this.contains(this.game.mousePos))
    		this.onClick.call(this);
    	this.down = this.clicked = false;
    },
    onTouchevent: function(e, orgEvent) {
    	var touch = null;
    	if(this.touchDownId){
    		touch = _getTouchWithId(orgEvent.changedTouches, this.touchDownId);    		
    	}else if(e.type == "touchstart" && orgEvent.changedTouches.length == 1) {
        	touch =  orgEvent.changedTouches[0];
    	}
    	// Ignore event, if touch identifier is different from start event
    	if(!touch)
    		return;
    	// Otherwise, prevent default handling
    	orgEvent.preventDefault();

    	var touchPos = new Point2(
        	touch.pageX - this.game.canvas.offsetLeft, 
        	touch.pageY - this.game.canvas.offsetTop);
        var isInside = this.contains(touchPos);
    	switch (e.type) {
		case "touchstart":
		case "touchmove":
        	this.touchDownId = touch.identifier;
        	this.down = isInside;
			break;
		case "touchend":
        	if(this.down && isInside){
        		this.onClick.call(this);
        	}
        	this.touchDownId = null;
        	this.down = false;
			break;
		default:
        	this.touchDownId = null;
        	this.down = false;
			break;
		}
	},
	/**Return true if button is down (but mouse key is also still down). */
    isDown: function() {
		return this.down === true;
    },
	/**Called when button was clicked (i.e. pushed and released). */
    onClick: undefined,
    // --- end of class
    lastentry: undefined
});

/*----------------------------------------------------------------------------*/

/**Joystick emulation for mouse and touch screen devices. 
 * @class
 * @extends Movable 
 */
var TouchStick = Movable.extend(
/** @lends TouchStick.prototype */
{
    init: function(opts) {
	    this._super("joystick", $.extend({
	    	r1: 10,
	    	r2: 30
		}, opts));
		// Copy selected options as object attributes
        ArcadeJS.extendAttributes(this, this.opts, "r1 r2");
		this.active = false; 
        this.touchDownPos = null;
        this.touchDownId = null;
        this.touchDragOffset = null;
    },
    getBoundingRadius: function() {
    	return this.r2;
    },
    render: function(ctx) {
    	// Draw gray sphere
    	var gradient = ctx.createRadialGradient(0, 0, this.r1, 5, -5, this.r2);
    	gradient.addColorStop(0, "rgba(255, 255, 255, 0.7)");
		gradient.addColorStop(0.7, "rgba(192, 192, 192, 0.7)");
    	gradient.addColorStop(1, "rgba(80, 80, 80, 0.7)");
    	ctx.fillStyle = gradient;    	
    	ctx.fillCircle2(0, 0, this.r2);
    	// with the dragged stick
    	var pos2 = new Point2(0, 0);
    	if(this.touchDragOffset){
    		pos2.translate(this.touchDragOffset.limit(this.r2));
    	}
//    	var pos2 = new Point2(0, 0);
//    	if(this.touchDragOffset){
//    		pos2.translate(this.touchDragOffset.limit(this.r2));
////        	this.game.debug("Render: touchPos: " + this.touchPos+", "+this.touchDragOffset);
//    	}else if(this.game.dragOffset) {
//    		pos2.translate(this.game.dragOffset.limit(this.r2));
//    	}
    	var gradient = ctx.createRadialGradient(pos2.x, pos2.y, 0, pos2.x+3, pos2.y-3, this.r1);
    	gradient.addColorStop(0, "#fff");
    	gradient.addColorStop(0.7, "#ccc");
    	gradient.addColorStop(1, "#555");
    	ctx.fillStyle = gradient;    	
    	ctx.fillCircle2(pos2.x, pos2.y, this.r1);
	},
    onDragstart: function(clickPos) {
		if(this.contains(this.game.mousePos)){
			this.touchDownPos = this.pos;
			return true;
		}
		this.touchDownPos = null;
		return false;
    },
    onDrag: function(dragOffset) {
		if(this.touchDownPos){
        	this.touchDragOffset = dragOffset.copy();
		}
    },
    onDragcancel: function(dragOffset) {
    	this.touchDownPos = this.touchDownId = this.touchDragOffset = null;
    },
    onDrop: function(dragOffset) {
    	this.touchDownPos = this.touchDownId = this.touchDragOffset = null;
    },
    onTouchevent: function(e, orgEvent) {
        // http://developer.apple.com/safari/library/documentation/AppleApplications/Reference/SafariWebContent/HandlingEvents/HandlingEvents.html#//apple_ref/doc/uid/TP40006511-SW1
    	// http://www.sitepen.com/blog/2008/07/10/touching-and-gesturing-on-the-iphone/
    	this.game.debug("Canvas touch event '" + e.type + "',  id=" + this.touchDownId + ", pos=" + this.touchDownPos + ", drag=" + this.touchDragOffset);
    	var touch = null;
    	if(this.touchDownId){
    		touch = _getTouchWithId(orgEvent.changedTouches, this.touchDownId);    		
    	}else if(e.type == "touchstart" && orgEvent.changedTouches.length == 1) {
        	touch =  orgEvent.changedTouches[0];
    	}
    	// Ignore event, if touch identifier is different from start event
    	if(!touch)
    		return;
    	// Otherwise, prevent default handling
    	orgEvent.preventDefault();

    	var touchPos = new Point2(
        	touch.pageX - this.game.canvas.offsetLeft, 
        	touch.pageY - this.game.canvas.offsetTop);
//    	this.game.debug("Canvas touch event '" + e.type + "': id=" + touch.identifier + ", t=" + touch.target);
//      this.game.debug("- touchDownPos: id=" + this.touchDownId + ", " + this.touchDownPos + ", drag: " + this.touchDragOffset);
        switch (e.type) {
		case "touchstart":
			if(this.contains(touchPos)){
	        	this.touchDownPos = touchPos;
	        	this.touchDownId = touch.identifier;
			}
			break;
		case "touchmove":
			// Drag vector is always relative to controls center
        	this.touchDragOffset = new Vec2(
        		touchPos.x - this.pos.x, 
        		touchPos.y - this.pos.y);
//            	this.game.debug("- touchDownPos: " + this.touchDownPos + ", drag: " + this.touchDragOffset);
			break;
		default:
        	this.touchDownPos = this.touchDownId = this.touchDragOffset = null;
			break;
		}
    },
	/**Return true if joystick is currently used. */
    isActive: function() {
		return !!this.touchDownPos;
    },
	/**Return x deflection [-1.0 .. +1.0]. */
    getX: function() {
		return this.isActive() ? (this.game.mousePos.x - this.touchDownPos.x) / this.r2 : 0;
    },
	/**Return y deflection [-1.0 .. +1.0]. */
    getY: function() {
		return this.isActive() ? (this.game.mousePos.y - this.touchDownPos.y) / this.r2 : 0;
    },
	/**Return deflection vector with length [0..r2]. */
    getDeflection: function() {
		if(!this.isActive())
			return Vec2(0, 0);
		return this.touchDownPos.vectorTo(this.game.mousePos).limit(this.r2);
    },
	/**Called when button was clicked (i.e. pushed and released). */
    onClick: undefined,
    // --- end of class
    lastentry: undefined
});

