/*******************************************************************************
 * jsRipOff.js
 * 
 * Main classes.
 * 
 */

/*******************************************************************************
 * Class Moveable
 */

var Game = Class.extend({
    init: function(p) {
        // constructor
		this.p = p;
        this.objects = [];
        this.idMap = {};
        this.typeMap = {};
        this.fps = 15;
    },
    toString: function() {
        return "Game '" + this.id + "' " + this.pos;
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
    purge: function(o) {
    	var ol = this.objects;
    	for(var i=0; i<ol.length; i++){
    		// TODO
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

Game.nextId = 1;

/*******************************************************************************
 * Class Moveable
 */

var Moveable = Class.extend({
    init: function(type, id, pos, orientation, move) {
        // constructor
		if(!pos || pos.x ===  undefined) { // missing args or passing 'Pos2' instead of 'new Pos2'
			throw "Moveable requires Pos2";
		}
		if(!move || move.dx === undefined) { // missing args or passing 'Vec2' instead of 'new Vec2'
			throw "Moveable requires Vec2";
		}
		this.type = type;
        this.id = id || "#" + Game.nextId++;
        this.pos = pos;  // Pos2
        this.orientation = +orientation;  // rad
        this.move = move || new Vec2(0, 0);
        this.turnRate = 0.0 * DEGREE_TO_RAD;  // rad / tick
        this.scale = 1.0;
        this.hidden = false;
        this.dead = false;
        this.ttl = -1;
    },
    toString: function() {
        return "Moveable '" + this.id + "' " + this.pos + ", " + RAD_TO_DEGREE * this.orientation + "°";
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
    	if( this.ttl > 0) {
    		this.ttl--;
    		if( this.ttl == 0) {
    			this.dead = true;
    			this.hidden = true;
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
    // --- end of class
    lastentry: undefined
});

/*******************************************************************************
 * Class Bullet
 */
var Bullet = Moveable.extend({
    init: function(pos, move, ttl) {
        this._super("bullet", null, pos, 0, move);
		this.ttl = ttl;
        this.scale = 2;
    },
    toString: function() {
        return "Bullet(" + this.id + ")";
    },
    render: function(p) {
    	p.point(0, 0);
    },
    getBoundingRadius: function() {
    	return 0.1;
    },
    // --- end of class
    lastentry: undefined
});

/*******************************************************************************
 * Class Tank
 */
var Tank = Moveable.extend({
    init: function(id, pos, orientation, move) {
        this._super("tank", id, pos, orientation, move);
    },
    step: function(p) {
		this._super(p);
		// wrap around screen borders
		this.pos.x = (p.width + this.pos.x) % p.width; 
		this.pos.y = (p.height + this.pos.y) % p.height; 
//		window.console.log(""+this);
    },
    render: function(p) {
		p.fill(255, 0, 0);
		p.stroke(0, 255, 0);
    	p.rect(-5, 2, 10, 8);
		p.triangle(0,-8, -5,7, 5,7);
//		p.ellipse(this.pos.x, this.pos.y, 5, 10);
    },
    getBoundingRadius: function() {
    	return 8;
    },
    fire: function() {
    	var aim = polarToVec(this.orientation - 0.5 * Math.PI, 10);
    	var bullet = new Bullet(new Pos2(this.pos), aim, 100);
    	this.game.addObject(bullet);
    },
    // --- end of class
    lastentry: undefined
});

