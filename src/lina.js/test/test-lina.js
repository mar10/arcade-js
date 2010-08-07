$(function(){
/*******************************************************************************
 * Tool functions
 */
function makeBenchWrapper(testName, loopCount, callback) {
    return function() {
        var start = +new Date();
        callback.call();
        var elap = +new Date() - start;
        var msg = testName + " took " + elap + " milliseconds";
        if( loopCount > 0 && elap > 0) {
//        	msg += " ("+ 1000*.01*Math.round(100*loopCount/elap) +" operations/sec)";
        	msg += " ("+ Math.round(1000.0*loopCount/elap) +" operations/sec)";
        }
        ok(true, msg);
    }
}


function benchmark(testName, loopCount, callback) {
    // Execute callback immediately and log timing as test result.
    // This function should be called inside a test() function.
    makeBenchWrapper(testName, loopCount, callback).call();
}


function timedTest(testName, loopCount, callback) {
    // Same as test(testName, callback), but adds a timing assertion.
    test(testName, makeBenchWrapper(testName, loopCount, callback));
}

// Alias for LinaJS.compare(a, b, eps);
cmp = LinaJS.compare;

function assertEqual(a, b, msg) {
    //_makeCompareWrapper(testName, callback).call();
	var res = LinaJS.compare(a, b);
	if(res){
		ok(true, msg);
	}else{
		msg = msg || "no info";
		ok(false, msg + " (expected " + b + ", got " + a + ")");
		logMsg("LinaJS.compare failed: expected %o, got %o", b, a);
	}
}

function assertNotEqual(a, b, msg) {
    //_makeCompareWrapper(testName, callback).call();
	var res = LinaJS.compare(a, b);
	if(!res){
		ok(true, msg);
	}else{
		msg = msg || "no info";
		ok(false, msg + " (expected NOT " + b + ", got " + a + ")");
		logMsg("LinaJS.compare accepted %o === %o", b, a);
	}
}


/*******************************************************************************
 * QUnit setup
 */
QUnit.log = function(result, message) {  
  if (window.console && window.console.log) {  
      window.console.log(result +' :: '+ message);  
  }  
}  

function logMsg(){
    if (window.console && window.console.log) {  
        window.console.log.apply(this, arguments);  
    }  
}


/*******************************************************************************
 * Module Load
 */
module("Vector math");

test("LinaJS.compare", function() {
    expect(20);

    ok(!cmp(undefined, undefined), "undefined != undefined");
    ok(!cmp(1, undefined), "undefined != float");
    ok(!cmp(undefined, 1), "undefined != float");
    ok(cmp(1, 1), "1 == 1");
    ok(!cmp(1, 2), "1 != 2");
    ok(!cmp(1.0, 1.0001), "1 != 1.0001");
    ok(!cmp(1.0, 1.00002), "1 != 1.00002");
//    alert(Math.abs(1.0 - 1.00001));
//    ok(cmp(1.0, 1.00001), "1 == ~1");  // even this has rounding errors
    ok(cmp(1.0, 1.000001), "1 == ~1");

    ok(cmp({x:1, y:2}, {x:1,y:2}));
    ok(!cmp({x:1, y:2}, {x:1,y:2.1}));
    ok(!cmp({x:1, z:2}, {x:1,y:2}));
    ok(cmp({dx:1, dy:2}, {dx:1,dy:2}));
    ok(!cmp({dx:1, dy:2}, {dx:1.1,dy:2}));
//    cmp(new Point2(1,2), new Point2(1,2));
    var pt1 = new Point2(1, 2);
    ok(cmp(pt1, new Point2(1,2)), "Point2 == Point2");
    ok(!cmp(pt1, new Point2(1.1,2)), "Point2 != Point2");
    ok(!cmp(pt1, new Vec2(1,2)), "Point2 != Vec2");
    ok(cmp(pt1, {x:1, y:2}), "Point2 == {x,y}");

    var m1 = new Matrix3();
    var m2 = m1.copy();
    ok(cmp(m1, m2), "Matrix3 == Matrix3");
    m2.translate(0.000001, 0.000001);
    ok(cmp(m1, m2), "Matrix3 == ~ Matrix3");
    m2.translate(0.0001, 0);
    ok(!cmp(m1, m2), "Matrix3 != Matrix3");
});


test("tools", function() {
    expect(13);
    assertEqual(LinaJS.vecToPolar(2, 0), {a:0, r:2}, "LinaJS.vecToPolar");
    assertEqual(LinaJS.vecToPolar(0, 2), {a:Math.PI/2, r:2}, "LinaJS.vecToPolar");
    
    assertEqual(LinaJS.distancePtLine({x:0, y:0}, {x:0, y:1}, {x:1, y:0}),
    		0.5*Math.sqrt(2),
    		"LinaJS.distancePtLine");

    assertEqual(LinaJS.segmentsIntersect(
    		{x:0, y:0}, {x:1, y:1}, {x:0, y:1}, {x:1, y:0}),
    		{x:0.5, y:0.5},
    		"LinaJS.segmentsIntersect");
    assertEqual(LinaJS.segmentsIntersect(
    		{x:3, y:0}, {x:1, y:1}, {x:0, y:1}, {x:1, y:0}),
    		null,
    		"LinaJS.segmentsIntersect");
    
    assertEqual(LinaJS.linesIntersect(
    		{x:0, y:0}, {x:1, y:1}, {x:0, y:1}, {x:1, y:0}),
    		{x:0.5, y:0.5},
    		"LinaJS.linesIntersect");
    assertEqual(LinaJS.linesIntersect(
    		{x:3, y:0}, {x:1, y:1}, {x:0, y:1}, {x:1, y:0}),
    		{x:-1, y:2},
    		"LinaJS.linesIntersect");
    
    assertEqual(LinaJS.distancePtLine(
    		{x:1, y:1}, {x:2, y:2}, {x:4, y:2}),
    		1,
    		"LinaJS.distancePtLine");
    assertEqual(LinaJS.distancePtLine(
    		{x:3, y:1}, {x:2, y:2}, {x:4, y:2}),
    		1,
    		"LinaJS.distancePtLine");
    assertEqual(LinaJS.distancePtLine(
    		{x:5, y:1}, {x:2, y:2}, {x:4, y:2}),
    		1,
    		"LinaJS.distancePtLine");

    assertEqual(LinaJS.distancePtSegment(
    		{x:1, y:1}, {x:2, y:2}, {x:4, y:2}),
    		1.4142135623730951,
    		"LinaJS.distancePtSegment");
    assertEqual(LinaJS.distancePtSegment(
    		{x:3, y:1}, {x:2, y:2}, {x:4, y:2}),
    		1,
    		"LinaJS.distancePtSegment");
    assertEqual(LinaJS.distancePtSegment(
    		{x:5, y:1}, {x:2, y:2}, {x:4, y:2}),
    		1.4142135623730951,
    		"LinaJS.distancePtSegment");

//    for(var i=0; i<20; i++){
//    	logMsg(LinaJS.randomInt(-2,5));
//    }
//    for(var i=0; i<20; i++){
//    	logMsg(LinaJS.random(-2,5));
//    }
});


test("Point2", function() {
    expect(7);

    var p1 = new Point2(10, 11);
	ok(p1.x == 10 && p1.y == 11, "Point2.constructor");
	assertEqual(""+p1, "(10/11)", "Point2.toString");

	var p2 = new Point2(p1);
	ok(p2.x == 10 && p2.y == 11, "Point2.copy constructor");

	p1.translate(3, 7);
	assertEqual(p1, {x:13, y:18}, "Point2.translate");
	assertEqual(p2, {x:10, y:11}, "Point2.copy constructor is a real copy");
	
	var v1 = new Vec2(11, 13);
	p1.translate(v1);
	assertEqual(p1, {x:24, y:31}, "Point2.translate by vector");

	assertEqual(new Point2(1,2).rotate(0.5*Math.PI), 
			{x:-2, y:1}, "Point2.rotate by 90°");
});


test("Vec2", function() {
    expect(8);

	var v1 = new Vec2(3, 7); 
	ok(v1.dx == 3 && v1.dy == 7, "Vec2.constructor");
	assertEqual(""+v1, "(3, 7)", "Vec2.toString");

	var vPerp = v1.copy().perp(); 
	assertEqual(vPerp, {dx:-7, dy:3}, "Vec2.perp()");
	ok(vPerp.isPerp(v1), "Vec2.isPerp");

	v1.rotate(Math.PI);
	assertEqual(v1, {dx:-3, dy:-7}, "Vec2.rotate");
	
	var v1 = new Vec2(1, 1);
	var v2 = new Vec2(-1, 1);
	assertEqual(v1.angle(v2), 90*LinaJS.DEG_TO_RAD, "Vec2.angle");
	v1 = new Vec2(1, 0);
	assertEqual(v1.angle({dx:1, dy:+0.1}), +0.09966865249116204, "Vec2.angle");
	assertEqual(v1.angle({dx:1, dy:-0.1}), -0.09966865249116204, "Vec2.angle");
});


test("Matrix3", function() {
    expect(15);
    
    var mi = new Matrix3();
    assertEqual(mi, [1, 0, 0,
                     0, 1, 0,
                     0, 0, 1], "Matrix3 constructor");

    var ma = new Matrix3([1,2,3,
                          4,5,6,
                          7,8,9]);
    var mb = new Matrix3([10, 16,  6,
                          14, 12, 20,
                           9,  7, 11]);
 
    var mc = ma.copy().mult(mb);
    assertEqual(mc, [ 65,  61,  79, 
                     164, 166, 190, 
                     263, 271, 301], "Matrix3.mult");
    
    var mt = ma.copy().transpose();
    assertEqual(mt, [1, 4, 7,
                     2, 5, 8,
                     3, 6, 9], "Matrix3.transpose");
    
    var a = 0;
    assertEqual(LinaJS.identity33().rotate(a),
    		LinaJS.rotation33(a),
    		"m.rotate() == rotation33()");
    a = Math.PI;
    assertEqual(LinaJS.identity33().rotate(a),
    		LinaJS.rotation33(a),
    		"m.rotate() == rotation33()");
    a = Math.PI / 4;
    assertEqual(LinaJS.identity33().rotate(a),
    		LinaJS.rotation33(a),
    		"m.rotate() == rotation33()");

    
    var m = new Matrix3();
    m.translate(1, 2);
    assertEqual(m.transformPt(0, 0), {x:1, y:2}, "transformPt");
    assertEqual(m.transformPt(1, 1), {x:2, y:3}, "transformPt");

    m.reset();
    assertEqual(m.det(), 1, "det(identity)")
    m.translate(1, 2);
    assertEqual(m.det(), 1, "det(m-translated)")
    m.rotate(45*LinaJS.DEG_TO_RAD);
    assertEqual(m.det(), 1, "det(m-rotated)")
    m.scale(2);
    assertEqual(m.det(), 4, "det(m-scaled)")
    
    m.reset();
    assertEqual(m.invert(), m, "invert(identity)")
    
    m.set([1,2,3, 
           0,1,4, 
           5,6,0]);
    assertEqual(m.invert(), [-24, 18, 5, 
                              20,-15,-4, 
                              -5,  4, 1], "invert(m)")
    
    var m2 = m.copy().invert().invert();
    assertEqual(m2, m, "invert(invert(m)) == m")
});


test("BiTran2", function() {
    expect(2);
    
    t = new BiTran2();
    t.translate(1, 2)
    	.scale(2)
    	.rotate(2*LinaJS.DEG_TO_RAD);
    //alert(t);
    
    assertEqual(t.matrix.copy().mult(t.inverse),
    		LinaJS.identity33(),
    		"BiTran2.matrix * Bitran2.inverse == I");
    assertEqual(t.inverse.copy().mult(t.matrix),
    		LinaJS.identity33(),
    		"BiTran2.inverse * Bitran2.matrix == I");
});


test("Transformation benchmarks", function() {
    expect(3);
    
    var loopCount = 10000;
    benchmark(loopCount + " x Matrix3.mult", loopCount, function(){
        var ma = new Matrix3([1,2,3,
                              4,5,6,
                              7,8,9]);
        var mb = new Matrix3([10, 16,  6,
                              14, 12, 20,
                               9,  7, 11]);
        for(var i=0; i<loopCount; i++)
        	ma.mult(mb);
    });
    benchmark(loopCount + " x Matrix3.invert", loopCount, function(){
        var m = new Matrix3([1,2,3, 
                             0,1,4, 
                             5,6,0]);
        
        for(var i=0; i<loopCount; i++) {
        	m.invert();
        }
    });
    benchmark(loopCount + " x Polygon2(8 points).transform", loopCount, function(){
        var m = new Matrix3()
        	.scale(1.5, -1)
        	.rotate(LinaJS.DEG_TO_RAD * 2)
        	.translate(1.1, -1.3);
    	var pg = new Polygon2([4, 0,
    	                       2.5, 1.5,
    	                       1.5, 3.5,
    	                       -1.5, 2.5,
    	                       -4, 0,
    	                       -1.5, -3.5,
    	                       2, -3.5,
    	                       4, 0]);
        for(var i=0; i<loopCount; i++) {
        	pg.transform(m);
        }
    });
});


test("Polygon2", function() {
    expect(14);
    
    var pg = new Polygon2([0,0, 1,0, 1,1, 0,1]);

    
    var pgRevert = pg.copy().revert();
    assertEqual(pg, [0,0, 1,0, 1,1, 0,1], "copy()");
    ok(pg.isCCW(), "isCCW()");
    assertEqual(pg.area(), 1.0, "area()");

    assertEqual(pgRevert, [0,1, 1,1, 1,0, 0,0], "revert()");
    assertEqual(pgRevert.area(), 1.0, "area()");
    ok(!pgRevert.isCCW(), "isCCW()");
    // rotate 90° ccw
    var m = LinaJS.rotation33(0.5 * Math.PI);
    logMsg("M90: %s", m);
    var pg2 = pg.copy().transform(m);
    logMsg("pg: %s", pg);
    logMsg("pg rotated ccw by 90°: %s", pg2);
    assertEqual(pg2, [0,0, 0,1, -1,1, -1,0], "transform() 90° ccw");

    pg2.transform(m);
    assertEqual(pg2, [0,0, -1,0, -1,-1, 0,-1], "transform() another 90° ccw");
    logMsg("PG rotated by 90°: %s", pg2);

    assertEqual(pg.getXY(0), {x:0, y:0}, "getXY()");
    assertEqual(pg.getXY(3), {x:0, y:1}, "getXY()");
//    logMsg("Edge 3: %o", pg.getEdge(3));
    

    var pt = new Point2(.5, .5);
    ok(pg.hasInside(pt), "hasInside");
    ok(pgRevert.hasInside(pt), "hasInside");
    pt = new Point2(1.1, .5);
    ok(!pg.hasInside(pt), "hasInside");
    pt = new Point2(-.1, .5);
    ok(!pg.hasInside(pt), "hasInside");
});

/******************************************************************************/
});
