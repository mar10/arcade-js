/**
 * jsQuirks.js
 * 
 */


var QuirksGame = ArcadeJS.extend({
    init: function(canvas, customOpts) {
		// Init ArcadeJS
		var opts = $.extend({
			name: "jsQuirks",
			fps: 200
		}, customOpts);
        this._super(canvas, opts);
        
        // Create an object and add it to the game
        this.quirk = this.addObject(new Quirk());
        
        // Start render loop
        this.startLoop()
    },
    // --- end of class
    lastentry: undefined
});

/*----------------------------------------------------------------------------*/

var Quirk = Movable.extend({
    init: function(opts) {
		// Inititalize this game object
        this._super("quirk");
        this.maxLines = 50;
    	this.color = "#80ff80";
    	// Initialize the first of max. 50 lines and velocity
        this.lines = [];
        this.pos1 = new Point2(LinaJS.randomInt(100, 200), LinaJS.randomInt(100, 200));
        this.velocity1 = new Vec2(LinaJS.randomInt(2, 10), LinaJS.randomInt(1, 10));
        this.pos2 = new Point2(LinaJS.randomInt(100, 200), LinaJS.randomInt(100, 200));
        this.velocity2 = new Vec2(LinaJS.randomInt(2, 10), LinaJS.randomInt(1, 10));
    },
    step: function() {
    	// Add another line (discard oldest, if max. is reached)
    	// Note that we use pos.copy() so every line has it's own Point2 instance
    	while( this.lines.length > this.maxLines )
    		this.lines.shift();
    	this.lines.push({pos1: this.pos1.copy(), pos2: this.pos2.copy()});
    	// Calculate new position for first point
    	this.pos1.translate(this.velocity1);
    	// Invert velocity vector, when bouncing at the canvas borders
    	if((this.pos1.x < 0 && this.velocity1.dx < 0)
    		|| (this.pos1.x >= this.game.canvas.width && this.velocity1.dx > 0)) {
    		this.velocity1.dx *= -1;
    	}
    	if((this.pos1.y < 0 && this.velocity1.dy < 0)
        		|| (this.pos1.y >= this.game.canvas.height && this.velocity1.dy > 0)) {
        		this.velocity1.dy *= -1;
    	}
    	// Calculate new position and velocity for second point
    	this.pos2.translate(this.velocity2);
    	if((this.pos2.x < 0 && this.velocity2.dx < 0)
        		|| (this.pos2.x >= this.game.canvas.width && this.velocity2.dx > 0)) {
        		this.velocity2.dx *= -1;
    	}
    	if((this.pos2.y < 0 && this.velocity2.dy < 0)
        		|| (this.pos2.y >= this.game.canvas.height && this.velocity2.dy > 0)) {
        		this.velocity2.dy *= -1;
    	}
    },
    render: function(ctx) {
    	// Draw the list of lines to the canvas
    	ctx.strokeStyle = this.color;
//    	this.game.debug("render: " + this.color);
		for(var i=0; i<this.lines.length; i++){
			var l = this.lines[i];
			ctx.beginPath();  
			ctx.moveTo(l.pos1.x, l.pos1.y);  
			ctx.lineTo(l.pos2.x, l.pos2.y);
			ctx.stroke();
		} 
	},
    // --- end of class
    lastentry: undefined
});
