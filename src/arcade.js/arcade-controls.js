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

var TouchButton = Movable.extend({
    init: function(opts) {
	    this._super("button", $.extend({
	    	r1: 10,
	    	r2: 30
		}, opts));
		// Copy selected options as object attributes
        ArcadeJS.extendAttributes(this, this.opts, "r1 r2");
    },
    getBoundingRadius: function() {
    	return this.r2;
    },
    step: function() {
    },
    render: function(ctx) {
    	// Draw gray sphere
    	var gradient = ctx.createRadialGradient(0, 0, this.r1, 5, -5, this.r2);
    	gradient.addColorStop(0, "#fff");
    	gradient.addColorStop(0.7, "#ccc");
    	gradient.addColorStop(1, "#555");
    	ctx.fillStyle = gradient;    	
    	ctx.fillCircle2(0, 0, this.r2);
	},
    onDragstart: function(clickPos) {
		return true;
    },
//    onDrag: function(dragOffset) {
//		this.game.setActivity("idle");
//    },
    // --- end of class
    lastentry: undefined
});

/*----------------------------------------------------------------------------*/

var TouchStick = Movable.extend({
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
    	gradient.addColorStop(0, "#fff");
    	gradient.addColorStop(0.7, "#ccc");
    	gradient.addColorStop(1, "#555");
    	ctx.fillStyle = gradient;    	
    	ctx.fillCircle2(0, 0, this.r2);
    	// with the dragged stick
    	var vDrag = this.game.dragOffset;
    	var pos2 = new Point2(0, 0);
    	if(vDrag){
    		pos2.translate(vDrag.limit(this.r2));
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
    onTouchevent: function(e) {
		// We want drag events
        // http://developer.apple.com/safari/library/documentation/AppleApplications/Reference/SafariWebContent/HandlingEvents/HandlingEvents.html#//apple_ref/doc/uid/TP40006511-SW1
    	this.game.debug("Canvas touch event " + e.type + ": " + e);
    	switch (e.type) {
		case "touchmove":
//			if(e.targetTouches && e.targetTouches.length && e.targetTouches.length != 1)
				break; // only single finger(?)
        	var touchList = e.changedTouches;
//        	this.game.debug("Canvas touch event " + e.type + ", " + changedTouches);
        	for(var i=0; i<e.touchList.length; i++){
        		var touch = e.touchList[i];
            	this.game.debug("- changed page: " + touch.pageX + "/" + touch.pageY );
            	this.game.debug("- changed touch: " + touch);
            	this.touchPos = new Point2(touch.pageX, touch.pageY);
        	}
            e.preventDefault();
			break;
		}
    },
//    onDrag: function(dragOffset) {
//		this.game.setActivity("idle");
//    },
    // --- end of class
    lastentry: undefined
});

