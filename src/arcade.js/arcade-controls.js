/**
 * arcade-controls.js
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
			if(touch.identifier === id){
				return touch;
			}
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
	getBoundingCircle: function() {
		return new Circle2({x: this.pos.x, y: this.pos.y}, this.r);
	},
	render: function(ctx) {
		// Draw gray sphere
		var gradient = ctx.createRadialGradient(0, 0, 0, 5, -5, this.r);
		gradient.addColorStop(0, "rgba(255, 255, 255, 0.7)");
		if(!this.down){
			gradient.addColorStop(0.7, "rgba(192, 192, 192, 0.7)");
		}
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
		if(this.clicked && this.contains(this.game.mousePos)){
			this.onClick.call(this);
		}
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
		if(!touch){
			return;
		}
		// Otherwise, prevent default handling
		orgEvent.preventDefault();

		var touchPos = new Point2(
			touch.pageX - this.game.canvas.offsetLeft,
			touch.pageY - this.game.canvas.offsetTop);
		var isInside = this.contains(touchPos);

		// TODO: seems that we get touchend for both fingers, even if only the other
		// finger was lifted!
		// http://stackoverflow.com/questions/3695128/webkit-iphone-ipad-issue-with-mutl-touch
		if(e.type!="touchmove"){
			this.game.debug("button " + e.type + " - isInside: " + isInside + ", drag: " + this.touchDragOffset + ", id=" + touch.identifier);
		}

		switch (e.type) {
		case "touchstart":
		case "touchmove":
			this.down = isInside;
			if(isInside){
				this.touchDownId = touch.identifier;
			}
			break;
		case "touchend":
			if(this.down && isInside){
				this.onClick.call(this);
			}
			this.touchDownId = null;
			this.down = false;
			break;
		case "touchcancel":
			this.touchDownId = null;
			this.down = false;
			break;
		default:
			alert("not handled " + e.type);
		}
	},
	/**Return true if button is down (but mouse key is also still down). */
	isDown: function() {
		return this.down === true;
	},
	/**Called when button was clicked (i.e. pushed and released). */
	onClick: undefined,
	// --- end of class
	__lastentry: undefined
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
	getBoundingCircle: function() {
		return new Circle2({x: this.pos.x, y: this.pos.y}, this.r2);
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
			this.touchDragOffset = new Vec2(0, 0);
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
//    	this.game.debug("Canvas touch event '" + e.type + "',  id=" + this.touchDownId + ", pos=" + this.touchDownPos + ", drag=" + this.touchDragOffset);
		var touch = null;
		if(this.touchDownId){
			touch = _getTouchWithId(orgEvent.changedTouches, this.touchDownId);
//        	alert("1 Canvas touch event '" + e.type + "'"+touch);
		}else if(e.type == "touchstart" && orgEvent.changedTouches.length == 1) {
			touch =  orgEvent.changedTouches[0];
		}
		// Ignore event, if touch identifier is different from start event
		if(!touch){
			return;
		}
//    	if(e.type!="touchstart") alert("3 Canvas touch event '" + e.type + "'"+touch);

		// Otherwise, prevent default handling
		orgEvent.preventDefault();

		var touchPos = new Point2(
			touch.pageX - this.game.canvas.offsetLeft,
			touch.pageY - this.game.canvas.offsetTop);
//    	this.game.debug("Canvas touch event '" + e.type + "': id=" + touch.identifier + ", t=" + touch.target);
//      this.game.debug("- touchDownPos: id=" + this.touchDownId + ", " + this.touchDownPos + ", drag: " + this.touchDragOffset);
		if(e.type!="touchmove"){
			this.game.debug("stick " + e.type + " - isInside: " + this.contains(touchPos) + ", drag: " + this.touchDragOffset + ", id=" + touch.identifier);
		}
		// TODO: seems that we get touchend for both fingers, even if only the other
		// finger was lifted!
		// http://stackoverflow.com/questions/3695128/webkit-iphone-ipad-issue-with-mutl-touch
		switch (e.type) {
		case "touchstart":
			if(this.contains(touchPos)){
				this.touchDownPos = touchPos;
				this.touchDragOffset = new Vec2(0, 0);
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
		case "touchend":
		case "touchcancel":
//        	this.game.debug("*** stick " + e.type + " - touchDownPos: " + this.touchDownPos + ", drag: " + this.touchDragOffset);
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
//		return this.isActive() ? (this.game.mousePos.x - this.touchDownPos.x) / this.r2 : 0;
		return this.isActive() ? this.touchDragOffset.dx / this.r2 : 0;
	},
	/**Return y deflection [-1.0 .. +1.0]. */
	getY: function() {
		return this.isActive() ? this.touchDragOffset.dy / this.r2 : 0;
	},
	/**Return deflection vector with length [0..r2]. */
	getDeflection: function() {
		return this.isActive() ? this.touchDragOffset.copy().normalize() : 0;
	},
	/**Called when button was clicked (i.e. pushed and released). */
	onClick: undefined,
	// --- end of class
	__lastentry: undefined
});
