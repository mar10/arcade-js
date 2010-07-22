/*******************************************************************************
 * Helpers
 */

/*******************************************************************************
 * Class ArcadeJS
 */

var ArcadeJS = Class.extend(
/** @lends ArcadeJS.prototype */
{
	/**
     * Create a new 2d arcade game.
     * @class A canvas based 2d game engine.
     * @constructs
     * @param {Processing} p
     */
    init: function(p) {
        // constructor
		this.p = p;
        this.objects = [];
        this.idMap = {};
        this.typeMap = {};
        this.fps = 15;
    },
    toString: function() {
        return "ArcadeJS '" + this.id + "' " + this.pos;
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

ArcadeJS.nextId = 1;

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
		if(!pos || pos.x ===  undefined) { // missing args or passing 'Pos2' instead of 'new Pos2'
			throw "Movable requires Pos2";
		}
		if(!move || move.dx === undefined) { // missing args or passing 'Vec2' instead of 'new Vec2'
			throw "Movable requires Vec2";
		}
		this.type = type;
        this.id = id || "#" + ArcadeJS.nextId++;
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
        return "Movable '" + this.id + "' " + this.pos + ", " + RAD_TO_DEGREE * this.orientation + "°";
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
    /** @function Callback, triggered when this object dies.
     * @param x a parms 
     */
    onDie: undefined,
    // --- end of class
    lastentry: undefined
});

