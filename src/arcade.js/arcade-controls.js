/**
 * arcade-controls.js
 * Copyright (c) 2010-2011,  Martin Wendt (http://wwWendt.de)
 *
 * Released under the MIT license
 * http://www.opensource.org/licenses/mit-license.php
 *
 * A current version and some documentation is available at
 *     https://github.com/mar10/arcade-js/
 *
 * @fileOverview Controls and tools for ArcadeJS on mobile devices.
 *
 * @author Martin Wendt
 * @version 0.0.1
 */

function _getTouchWithId(touchList, id){
	// `0` is a valid id on Android!
	if(id !== null && touchList && touchList.length){
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

/**Base class for screen controls.
 *
 * As opposed to a 'normal' Movable, this class sets pos to `undefined` and uses
 * posCC instead.
 *
 * @class
 * @extends Movable
 */

var CanvasObject = Movable.extend(
/** @lends CanvasObject.prototype */
{
	init: function(type, opts) {
		this._super(type, $.extend({
			useCC: true,
			isBackground: true,
			onClick: function() { 
				// not mandatory, since we may use button.
				// alert("onClick is mandatory: " + JSON.stringify(type));
			}
		}, opts));
		// Copy selected options as object attributes
		ArcadeJS.extendAttributes(this, this.opts, "onClick onResize useCC isBackground");
//		ArcadeJS.assertAttributes(this, this.opts, "onClick pos useCC");
	},
	/**Return true, if point hits this object.
	 * @param {Point2} pt Point in canvas coordinates
	 * @returns {boolean}
	 */
	containsCC: undefined,
	contains: undefined, // in useCC mode, this shouldn't be called
	/**@function Called when window is resized (and on start).
	 * The default processing depends on the 'resizeMode' option.
	 * @param {Int} width
	 * @param {Int} height
	 * @param {Event} e
	 * @returns false to prevent default handling
	 */
	onResize: undefined,
	/**Called when button was clicked (i.e. pushed and released). */
	onClick: undefined,
	// --- end of class
	__lastentry: undefined
});

/*----------------------------------------------------------------------------*/

/**Button for mouse touch screen devices.
 * Either overload `onClick` or call `isDown()` / `isClicked()` 
 * @class
 * @extends CanvasObject
 */

var TouchButton = CanvasObject.extend(
/** @lends TouchButton.prototype */
{
	init: function(opts) {
		this._super("button", $.extend({
			r: 20,
			r3: 40//,
//			onClick: function() { alert("onClick is mandatory"); }
		}, opts));
		// Copy selected options as object attributes
		ArcadeJS.extendAttributes(this, this.opts, "r r3 onClick");
		this.touchDownId = null;
		this.clicked = false;
		this.down = false;
		this.lastReportedClick = 0;
	},
	containsCC: function(ptCC) {
		return this.pos.distanceTo(ptCC) <= this.r3;
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
		this.down = this.clicked = this.containsCC(this.game.mousePosCC);
		this.lastReportedClick = 0;
	},
	onMousemove: function(e) {
		this.down = this.clicked && this.containsCC(this.game.mousePosCC);
	},
	onMouseup: function(e) {
		if(this.clicked && this.containsCC(this.game.mousePosCC)){
			this.onClick.call(this);
		}
		this.down = this.clicked = false;
	},
	onTouchevent: function(e, orgEvent) {
		var touch = null,
			game = this.game;
		if(this.touchDownId !== null){
			touch = _getTouchWithId(orgEvent.changedTouches, this.touchDownId);
		}else if(e.type == "touchstart" && orgEvent.changedTouches.length == 1) {
			touch =  orgEvent.changedTouches[0];
		}
//		alert("e.type: " + e.type + ", id=" + (touch ? touch.identifier : "?"));
		// Ignore event, if touch identifier is different from start event
		if(!touch){
			return;
		}
		// Otherwise, prevent default handling
		orgEvent.preventDefault();

		var touchPos = new Point2(
			touch.pageX - game.canvas.offsetLeft,
			touch.pageY - game.canvas.offsetTop);
		var isInside = this.containsCC(touchPos);

		// TODO: seems that we get touchend for both fingers, even if only the other
		// finger was lifted!
		// http://stackoverflow.com/questions/3695128/webkit-iphone-ipad-issue-with-mutl-touch
//		if(e.type!="touchmove"){
//			game.debug("button " + e.type + " - isInside: " + isInside + ", drag: " + this.touchDragOffset + ", id=" + touch.identifier);
//		}

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
				this.lastReportedClick = 0;
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
	/**Return true if button was clicked since last call.
	 * 
	 * @param: {float} [minDelayMS=0]
	 * @param: {float} [repeatDelayMS=false]
	 * @returns {boolean}
	 */
	isClicked: function(minDelayMS, repeatDelayMS) {
		var now = Date.now(),
			last = this.lastReportedClick,
			elap = now - last,
			res = false;

		if( this.clicked && (!minDelayMS || elap >= minDelayMS) ) {
			res = true;
		} else if ( this.clicked && typeof repeatDelayMS === "number" && 
				elap >= repeatDelayMS ) {
			res = true;
		}
		if( res ) {
			this.lastReportedClick = now;
			// this.clicked = false;
		}
		return res;
	},
	/**Called when button was clicked (i.e. pushed and released). */
	onClick: undefined,
	// --- end of class
	__lastentry: undefined
});

/*----------------------------------------------------------------------------*/

/**Joystick emulation for mouse and touch screen devices.
 * @class
 * @extends CanvasObject
 */
var TouchStick = CanvasObject.extend(
/** @lends TouchStick.prototype */
{
	init: function(opts) {
		this._super("joystick", $.extend({
			r1: 10,
			r2: 30,
			r3: 50
		}, opts));
		// Copy selected options as object attributes
		ArcadeJS.extendAttributes(this, this.opts, "r1 r2 r3");
		this.active = false;
		this.touchDownPos = null;
		this.touchDownId = null;
		this.touchDragOffset = null;
	},
	containsCC: function(ptCC) {
		return this.pos.distanceTo(ptCC) <= this.r3;
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
		if(this.containsCC(this.game.mousePosCC)){
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
		var touch = null,
			game = this.game;
		if(this.touchDownId !== null){
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
			touch.pageX - game.canvas.offsetLeft,
			touch.pageY - game.canvas.offsetTop);
//		if(e.type!="touchmove"){
//			game.debug("stick " + e.type + " - isInside: " + this.contains(touchPos) + ", drag: " + this.touchDragOffset + ", id=" + touch.identifier);
//		}
		// TODO: seems that we get touchend for both fingers, even if only the other
		// finger was lifted!
		// http://stackoverflow.com/questions/3695128/webkit-iphone-ipad-issue-with-mutl-touch
		switch (e.type) {
		case "touchstart":
			if(this.containsCC(touchPos)){
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
			break;
		case "touchend":
		case "touchcancel":
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

/* *Text area with click event.
 * @class
 * @extends CanvasObject
 */
/*
var TouchArea = CanvasObject.extend(
/ ** @lends TouchArea.prototype * /
{
	init: function(opts) {
		this._super("touchArea", $.extend({
			width: 20,
			height: 40,
			text: "Ok\nsoweit?",
			border: true,
			onResize: function(width, height){
				this.textWidth = this.game.context.measureText(this.text).width;
				this.textHeight = this.game.context.measureText("M").width;
				this.box = {
						top: 0.5 * (height - this.textHeight) - this.padding,
						left: 0.5 * (width - this.textWidth) - this.padding,
						width: this.textWidth + 2 *  this.padding,
						height: this.textHeight + 2 *  this.padding
						};
				this.pos.set(this.box.left + this.padding, this.box.top + this.padding + this.textHeight);
			},
			padding: 5
//			onClick: function() { alert("onClick is mandatory"); }
		}, opts));
		// Copy selected options as object attributes
		ArcadeJS.extendAttributes(this, this.opts, "width height padding text onClick");
		this.touchDownId = null;
		this.clicked = false;
		this.down = false;
	},
	containsCC: function(ptCC) {
		var box = this.box;
		return ptCC.x >= box.left && ptCC.x <= box.left + box.width
			ptCC.y >= box.top && ptCC.y <= box.top + box.height;
	},
	render: function(ctx) {
		ctx.save();
		ctx.resetTransform(); // TODO: why is this required?
		var box = this.box;
		ctx.strokeRect(box.left, box.top, box.width, box.height);
		ctx.strokeText(this.text, this.pos.x, this.pos.y);
		ctx.restore();
	},
	onMousedown: function(e) {
		this.down = this.clicked = this.containsCC(this.game.mousePosCC);
	},
	onMousemove: function(e) {
		this.down = this.clicked && this.containsCC(this.game.mousePosCC);
	},
	onMouseup: function(e) {
		if(this.clicked && this.containsCC(this.game.mousePosCC)){
			this.onClick.call(this);
		}
		this.down = this.clicked = false;
	},
	onTouchevent: function(e, orgEvent) {
		var touch = null,
			game = this.game;
		if(this.touchDownId !== null){
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
			touch.pageX - game.canvas.offsetLeft,
			touch.pageY - game.canvas.offsetTop);
		var isInside = this.containsCC(touchPos);

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
	/ **Return true if button is down (but mouse key is also still down). * /
	isDown: function() {
		return this.down === true;
	},
	/ **Called when button was clicked (i.e. pushed and released). * /
	onClick: undefined,
	// --- end of class
	__lastentry: undefined
});
*/

/**HTML overlay, attached to canvas.
 * @class
 * @extends Class
 */

var HtmlOverlay = Class.extend(
/** @lends HtmlOverlay.prototype */
{
	_defaultCss: {
		position: "absolute",
//		display: "none",
		left: 0,
		top: 0,
		display: "none",
		padding: 10,
		border: "1px solid white",
		zIndex: 1000,
		color: "black",
//		backgroundColor: "transparent",
		backgroundColor: "#f1f3f2",
//		filter: "alpha(opacity=20)",
//		opacity: 0.2,
		borderRadius: "5px",
		"-moz-border-radius": "5px",
		"-webkit-border-radius": "5px",
		boxShadow: "3px 3px 10px #bfbfbf",
		"-moz-box-shadow": "3px 3px 10px #bfbfbf",
		"-webkit-box-shadow": "3px 3px 10px #bfbfbf"
	},
	init: function(opts){
		// Define and override default properties
		ArcadeJS.guerrillaDerive(this, {
			game: undefined, // (mandatory) parent canvas element
			pos: {x: 0, y: 0}, // Centered on screen
//			title: null, // Title
			html: undefined, // (mandatory) Box content
			onClick: null, // Called when box is clicked or touched
			onClose: null, // Called after box was closed
			closeOnClick: false,
			blockClicks: true,
			showSpeed: "normal",
			hideSpeed: "normal",
			timeout: 0 // [ms], 0: never
		}, opts);
		this.css = $.extend({}, this._defaultCss, opts.css);
		var self = this;
		this.canvas = this.game.canvas;
		this.down = false;
		this.inside = false;
		this.touchDownId = null;

		this.$div = $("<div class='arcadePopup'>" + this.html + "</div>")
			.hide(0)
			.css(this.css)
			.appendTo("body")
			.click(function(e){
				if(e.target.nodeName == "A"){ return; } // Allow <a> tags to work
				self._clicked(e);
			}).bind("mousedown", function(e){
				if(e.target.nodeName == "A"){ return; } // Allow <a> tags to work
				self.inside = self.down = true;
				// 'eat' this event, so it isn't dispatched to the parent canvas
				return !self.blockClicks;
			}).bind("mouseup", function(e){
				self.down = false;
			}).bind("touchstart", function(e){
				self.game.debug("HtmlOverlay got " + e.type + ", node:" + e.target.nodeName);
				if(e.target.nodeName == "A"){ return; } // Allow <a> tags to work
//				if(e.target.nodeName == "CANVAS"){ return; } // Allow <a> tags to work
				if(self.touchDownId !== null && e.originalEvent.changedTouches.length > 1){ return; } // Already have a touch
				e.originalEvent.preventDefault();
				self.touchDownId = e.originalEvent.changedTouches[0].identifier;
				self.game.debug("    nChanged:" + e.originalEvent.changedTouches.length + ", id=" + self.touchDownId);
//				$(this).css("backgroundColor", "red");
				self.down = true;
				self._clicked(e);
//			}).bind("touchenter", function(e){
//				self.inside = false;
//			}).bind("touchleave", function(e){
//				self.inside = false;
			}).bind("touchend touchcancel", function(e){
				self.game.debug("HtmlOverlay got " + e.type + ", node:" + e.target.nodeName);
				self.game.debug("    id=" + self.touchDownId + ", t=" + _getTouchWithId(e.originalEvent.changedTouches, self.touchDownId));
				e.originalEvent.preventDefault();
				if(!_getTouchWithId(e.originalEvent.changedTouches, self.touchDownId)){
					return; // touch event was for another target
				}
				self.touchDownId = null;
//				$(this).css("backgroundColor", "white");
				self.inside = self.down = false;
			});
		$(window).resize(function(e){
			self._resized(e);
		});
//		$("button", this.$div).click(function(e){
//			alert(e);
//		});
		this._resized(null);
		this.$div.show("normal");
	},
	/**Hide and remove this box (triggers onClose callback).*/
	close: function() {
		var self = this;
		this.$div.hide(this.hideSpeed, function(){
			self.$div.remove();
			if(self.onClose){
				self.onClose();
			}
		});
	},
	/**Return true if button is down (but mouse key / finger is also still down). */
	isDown: function() {
		return this.down === true;
	},
	/**Called when element was clicked or touched (triggers onClick callback).*/
	_clicked: function(e){
		var oe = e.originalEvent,
			res = true;
		if(this.onClick){
			res = this.onClick(e);
		}
		if(this.closeOnClick){
			this.close();
		}
		return res;
	},
	/**Called when element was clicked or touched. */
	_closed: function(e){
		var oe = e.originalEvent;
		if(this.closeOnClick){
			this.close();
		}
	},
	/**Adjust element relative to canvas center / borders.*/
	_resized: function(e){
		var x, y,
			$c = $(this.canvas),
			cx = $c.offset().left,
			cy = $c.offset().top;

		if(this.pos.x === 0){
			x = cx + 0.5 * ($c.width() - this.$div.outerWidth());
		}else if(this.pos.x < 0){
			x = cx + ($c.width() - this.$div.outerWidth() + this.pos.x + 1);
		}else{
			x = cx + this.pos.x - 1;
		}
		if(this.pos.y === 0){
			y = cy + 0.5 * ($c.height() - this.$div.outerHeight());
		}else if(this.pos.y < 0){
//			alert("cy:" + cy + ", ch:" + $c.height() + ", dh:" + this.$div.outerHeight() + ", py:" + this.pos.y);
			y = cy + ($c.height() - this.$div.outerHeight() + this.pos.y + 1);
		}else{
			y = cy + this.pos.y - 1;
		}
		this.$div.css({left: x, top: y});
	},
	// --- end of class
	__lastentry: undefined
});


/**Maintains a virtual joystick and 8 buttons, connected to an iCade controller
 * (see https://en.wikipedia.org/wiki/ICade).
 *
 * Use icade.isDown(), .isClicked(), or $(document).on("icadeclick", ...) to handle
 * controller events.
 *
 * @class
 * @extends Class
 */
var IcadeController = Class.extend(
/** @lends IcadeController.prototype */
{
	init: function(opts){
		// Define and override default properties
		ArcadeJS.guerrillaDerive(this, {
//			onClick: null, // Called when button is clicked
			game: undefined
		}, opts);

		/* iCade control Ids:
		   https://en.wikipedia.org/wiki/ICade
		   https://www.ionaudio.com/downloads/ICADE_QuickStart.pdf

			Button ID layout:

			    up
			left + right    TR  TLB  TRB  TW
			   down         BR  BLB  BRB  BW

			Buttons and stick generate different key events when pressed and
			released.
			Buttons also have a digit assigned, that is used for entering the
			Bluetooth PIN:

			ID              down  up   #
			// Stick
			up              w     e    1        north
			down            x     y    2        south
			left            a     q    3        west
			right           d     c    4        east
			// Buttons
			btnTR           z     t    5        top red
			btnBR           h     r    6        bottom red
			btnTLB          u     f    7        top left black
			btnBLB          j     n    8        bottom left black
			btnTRB          i     m    9        top right black
			btnBRB          k     p    0        bottom right black
			btnTW           o     g    (Enter)  top white 
			btnBW           l     v    (Enter)  bottom white
		*/
		var i,
			self = this,
			iCadeAttrs = "up down left right btnTR btnBR btnTLB btnBLB btnTRB btnBRB btnTW btnBW".split(" "),
			ctrlCodes = {
				87: {id: "up", val: true}, 		// 'w'
				69: {id: "up", val: false}, 	// 'e'
				88: {id: "down", val: true}, 	// 'x'
				89: {id: "down", val: false}, 	// 'y'
				65: {id: "left", val: true}, 	// 'a'
				81: {id: "left", val: false}, 	// 'q'
				68: {id: "right", val: true}, 	// 'd'
				67: {id: "right", val: false}, 	// 'c'
				90: {id: "btnTR", val: true}, 	// 'z'
				84: {id: "btnTR", val: false}, 	// 't'
				72: {id: "btnBR", val: true}, 	// 'h'
				82: {id: "btnBR", val: false}, 	// 'r'
				85: {id: "btnTLB", val: true}, 	// 'u'
				70: {id: "btnTLB", val: false}, // 'f'
				74: {id: "btnBLB", val: true}, 	// 'j'
				78: {id: "btnBLB", val: false}, // 'n'
				73: {id: "btnTRB", val: true}, 	// 'i'
				77: {id: "btnTRB", val: false}, // 'm'
				75: {id: "btnBRB", val: true}, 	// 'k'
				80: {id: "btnBRB", val: false}, // 'p'
				79: {id: "btnTW", val: true}, 	// 'o'
				71: {id: "btnTW", val: false}, 	// 'g'
				76: {id: "btnBW", val: true}, 	// 'l'
				86: {id: "btnBW", val: false} 	// 'v'
			};

		// Up/down status by button ID:
		this.downMap = {};
		// for( i=0; i<iCadeAttrs.length; i++) {
		// 	this.downMap[iCadeAttrs[i]] = false;
		// }
		// Time stamps of down push by button ID
		this.clickMap = {};
		// Time stamps of last queried 'down' by button ID:
		this.lastClickReportMap = {};

		$(document).on("keydown", function(e){
			var code = ctrlCodes[e.which];

			if( code ) {
				if( code.val && !self.downMap[code.id] ) {
					// Store time when button was pushed
					self.clickMap[code.id] = Date.now();
					if( $(document).trigger("icadeclick", [{btnId: code.id}]) === false ) {
						delete self.clickMap[code.id];
					}
					// Hold top red & click bottom white to toggle debug mode
					if( code.id === "btnBW" && self.downMap["btnTR"] ) {
						self.game.setDebug("toggle");
					}
				}
				self.downMap[code.id] = code.val;
				// console.log("icade: " + e.which + " => " + self);
				// self.game.debug("icade: " + e.which + " => " + self);
			}
		});
	},
	toString: function() {
		states = [];
		for(var k in this.downMap) {
			if( this.downMap[k] ) { states.push(k); }
		}
		return "<IcadeController(" + states.join(",") + ")>";
	},
	/** Return true if button or stick position is 'down'.
	 *
	 * @param {string} btnId One of 'up', 'down', 'left', 'right', 'btnTR',
	 *	         'btnBR', 'btnTLB', 'btnBLB', 'btnTRB', 'btnBRB', 'btnTW', 'btnBW'
	 * @returns {boolean}
	 */
	isDown: function(btnId) {
		return !!this.downMap[btnId];
	},
	/** Return true if button (or stick position) was clicked since last call.
	 *
	 * The `minDelay` argument may be used to throttle the maximum click rate.
	 * The `repeatDelayMS` argument defines the maximum permanent fire rate of 
	 * buttons, i.e. when keeping the button pushed.
	 *
	 * @param {string} btnId One of 'up', 'down', 'left', 'right', 'btnTR',
	 *	         'btnBR', 'btnTLB', 'btnBLB', 'btnTRB', 'btnBRB', 'btnTW', 'btnBW'
	 * @param {float} [minDelayMS=0] minimum delay between two fast clicks in miliseconds
	 *                    0: maximum rate. 
	 * @param {float} [repeatDelayMS=false] minimum delay between permanent fire triggers in miliseconds
	 *                    0: maximum rate, i.e. once per frame
	 *                    false: no auto-repeat
	 * @returns {boolean}
	 */
	isClicked: function(btnId, minDelayMS, repeatDelayMS) {
		var now = Date.now(),
			last = this.lastClickReportMap[btnId] || 0,
			elap = now - last,
			res = false;

		// this.debug("isKeyClicked(" + btnId + ", " + minDelaySecs + ", "
		// 	+ repeatDelaySecs + "): " + elap);
		if( this.clickMap[btnId] && (!minDelayMS || elap >= minDelayMS) ) {
			res = true;
		} else if ( this.downMap[btnId] && typeof repeatDelayMS === "number" && 
				elap >= repeatDelayMS ) {
			res = true;
		}
		if( res ) {
			// this.debug("isKeyClicked(" + btnId + ", " + minDelayMS + ", "
			// 	+ repeatDelayMS + "): " + res);
			this.lastClickReportMap[btnId] = now;
			delete this.clickMap[btnId];
		}
		return res;
	},
	// --- end of class
	__lastentry: undefined
});
