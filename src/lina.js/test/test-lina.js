$(function(){
/*******************************************************************************
 * Tool functions
 */
function makeBenchWrapper(testName, callback) {
    return function() {
        var start = +new Date;
//	        callback.apply(this, arguments);
        callback.call();
        var elap = +new Date - start;
        ok(true, testName + " took " + elap + " milliseconds");
    }
}


function benchmark(testName, callback) {
    // Execute callback immediately and log timing as test result.
    // This function should be called inside a test() function.
    makeBenchWrapper(testName, callback).call();
}


function timedTest(testName, callback) {
    // Same as test(testName, callback), but adds a timing assertion.
    test(testName, makeBenchWrapper(testName, callback));
}

// Alias for linaCompare(a, b, eps);
cmp = linaCompare;
/*
function _makeConmpareWrapper(testName, callback) {
    return function() {
        var start = +new Date;
//	        callback.apply(this, arguments);
        callback.call();
        var elap = +new Date - start;
        ok(true, testName + " took " + elap + " milliseconds");
    }
}
*/
function assertEqual(a, b, msg) {
    //_makeCompareWrapper(testName, callback).call();
	var res = linaCompare(a, b);
	if(res){
		ok(true, msg);
	}else{
		msg = msg || "no info";
		ok(false, msg + " (expected " + b + ", got " + a);
		logMsg("linaCompare failed: expected %o, got %o", b, a);
	}
}

function assertNotEqual(a, b, msg) {
    //_makeCompareWrapper(testName, callback).call();
	var res = linaCompare(a, b);
	if(!res){
		ok(true, msg);
	}else{
		msg = msg || "no info";
		ok(false, msg + " (expected NOT " + b + ", got " + a);
		logMsg("linaCompare accepted %o === %o", b, a);
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

test("Vector math: linaCompare", function() {
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


test("Vector math: tools", function() {
    expect(2);
    assertEqual(vecToPolar(2, 0), {a:0, r:2}, "vecToPolar");
    assertEqual(vecToPolar(0, 2), {a:Math.PI/2, r:2}, "vecToPolar");
});


test("Vector math: Point2", function() {
    expect(6);

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
});


test("Vector math: Vec2", function() {
    expect(3);

	var v1 = new Vec2(3, 7); 
	ok(v1.dx == 3 && v1.dy == 7, "Vec2.constructor");
	assertEqual(""+v1, "(3, 7)", "Vec2.toString");

	v1.rotate(Math.PI);
	assertEqual(v1, {dx:-3, dy:-7}, "Vec2.rotate");
});


test("Vector math: Matrix3", function() {
    expect(8);
    
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
    assertEqual(identityMatrix3().rotate(a),
    		rotationMatrix3(a),
    		"m.rotate() == rotationMatrix3()");
    a = Math.PI;
    assertEqual(identityMatrix3().rotate(a),
    		rotationMatrix3(a),
    		"m.rotate() == rotationMatrix3()");
    a = Math.PI / 4;
    assertEqual(identityMatrix3().rotate(a),
    		rotationMatrix3(a),
    		"m.rotate() == rotationMatrix3()");

    
    var m = new Matrix3();
    m.translate(1, 2);
    assertEqual(m.transformXY(0, 0), {x:1, y:2}, "transformXY");
    assertEqual(m.transformXY(1, 1), {x:2, y:3}, "transformXY");
});


test("Vector math: Polygon2", function() {
    expect(4);
    
    var pg = new Polygon2([0,0, 1,0, 1,1, 0,1]);

//    assertEqual(pg.area(), 1.0, "area()");
    
    var pgRevert = pg.copy().revert();
    assertEqual(pg, [0,0, 1,0, 1,1, 0,1], "copy()");
    assertEqual(pgRevert, [0,1, 1,1, 1,0, 0,0], "revert()");
//    ok(pg.isCCW(), "isCCW()");
//    ok(!pgRevert.isCCW(), "isCCW()");
    
    // totate 90° ccw
    var m = rotationMatrix3(0.5 * Math.PI);
    logMsg("M90: %s", m);
    var pg2 = pg.copy().transform(m);
    logMsg("pg: %s", pg);
    logMsg("pg rotated ccw by 90°: %s", pg2);
    assertEqual(pg2, [0,0, 0,1, -1,1, -1,0], "transform() 90° ccw");

    
    pg2.transform(m);
    assertEqual(pg2, [0,0, -1,0, -1,-1, 0,-1], "transform() another 90° ccw");
    logMsg("PG rotated by 90°: %s", pg2);
});

/******************************************************************************/
});
