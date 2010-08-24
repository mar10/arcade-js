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

/*----------------------------------------------------------------------------*/

/**Button for touchscreen devices. 
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
    		gradient.addColorStop(0.7, "rgba(192, 192, 192, 0.7");
    	gradient.addColorStop(1, "rgba(80, 80, 80, 0.7");
    	ctx.fillStyle = gradient;    	
    	ctx.fillCircle2(0, 0, this.r);
	},
    onTouchevent: function(e, orgEvent) {
    	var touch = orgEvent.changedTouches[0];
    	var touchPos = touch ? new Point2(
        	touch.pageX - this.game.canvas.offsetLeft, 
        	touch.pageY - this.game.canvas.offsetTop) : null;
        var isInside = touchPos && this.contains(touchPos);
    	switch (e.type) {
		case "touchstart":
		case "touchmove":
        	this.down = isInside;
			break;
		case "touchend":
        	if(this.down && isInside){
        		this.onClick(this);
        	}
        	this.down = false;
			break;
		default:
        	this.down = false;
			break;
		}
	},
    // --- end of class
    lastentry: undefined
});

/*----------------------------------------------------------------------------*/

/**Joystick emulation for touchscreen devices. 
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
    },
    getBoundingRadius: function() {
    	return this.r2;
    },
    render: function(ctx) {
    	// Draw gray sphere
    	var gradient = ctx.createRadialGradient(0, 0, this.r1, 5, -5, this.r2);
//    	gradient.addColorStop(0, "#fff");
//    	gradient.addColorStop(0.7, "#ccc");
//    	gradient.addColorStop(1, "#555");
    	gradient.addColorStop(0, "rgba(255, 255, 255, 0.7)");
		gradient.addColorStop(0.7, "rgba(192, 192, 192, 0.7");
    	gradient.addColorStop(1, "rgba(80, 80, 80, 0.7");
    	ctx.fillStyle = gradient;    	
    	ctx.fillCircle2(0, 0, this.r2);
    	// with the dragged stick
    	var pos2 = new Point2(0, 0);
    	if(this.touchPos && this.contains(this.touchPos)){
    		pos2.translate(this.touchDrag.limit(this.r2));
//        	this.game.debug("Render: touchPos: " + this.touchPos+", "+this.touchDrag);
    	}else if(this.game.dragOffset) {
    		pos2.translate(this.game.dragOffset.limit(this.r2));
    	}
    	var gradient = ctx.createRadialGradient(pos2.x, pos2.y, 0, pos2.x+3, pos2.y-3, this.r1);
    	gradient.addColorStop(0, "#fff");
    	gradient.addColorStop(0.7, "#ccc");
    	gradient.addColorStop(1, "#555");
    	ctx.fillStyle = gradient;    	
    	ctx.fillCircle2(pos2.x, pos2.y, this.r1);
	},
    onDragstart: function(clickPos) {
		// We want drag events
		return true;
    },
    onTouchevent: function(e, orgEvent) {
		// We want drag events
        // http://developer.apple.com/safari/library/documentation/AppleApplications/Reference/SafariWebContent/HandlingEvents/HandlingEvents.html#//apple_ref/doc/uid/TP40006511-SW1
    	// http://www.sitepen.com/blog/2008/07/10/touching-and-gesturing-on-the-iphone/
//    	this.game.debug("Canvas touch event '" + e.type + "': e=" + e);
    	switch (e.type) {
		case "touchmove":
//			if(orgEvent.targetTouches.length != 1)
//				break; // only single finger(?)
        	var touchList = orgEvent.changedTouches;

        	for(var i=0; i<touchList.length; i++){
        		var touch = touchList[i];
            	// convert to canvas coords
            	this.touchPos = new Point2(
            		touch.pageX - this.game.canvas.offsetLeft, 
            		touch.pageY - this.game.canvas.offsetTop);
            	this.touchDrag = new Vec2(
            			this.touchPos.x - this.pos.x, 
            			this.touchPos.y - this.pos.y);
//            	this.game.debug("- touchPos: " + this.touchPos + ", " + this.touchDrag);
        	}
        	orgEvent.preventDefault();
			break;
		default:
        	this.touchPos = this.touchDrag = null;
			break;
		}
    },
//    onDrag: function(dragOffset) {
//		this.game.setActivity("idle");
//    },
    // --- end of class
    lastentry: undefined
});

