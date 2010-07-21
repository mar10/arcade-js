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


	function simulateClick(selector) {
	    var e = document.createEvent("MouseEvents");
	    e.initEvent("click", true, true);
	    $(selector).each(function(){
	        this.dispatchEvent(e);
	    });
	};

/*******************************************************************************
 * QUnit setup
 */
QUnit.log = function(result, message) {  
  if (window.console && window.console.log) {  
      window.console.log(result +' :: '+ message);  
  }  
}      


/*******************************************************************************
 * Module Load
 */
module("Vector math");

function logCartToPol(x, y){
	var pol = cartToPol(x, y);
    window.console.log("(%s, %s) -> (%s°, %s)", x, y, RAD_TO_DEGREE*pol.a, pol.r);
}

test("Vector math: Pos2", function() {
    expect(6);

    logCartToPol(3, 4);
	logCartToPol(0, 2);
	logCartToPol(0, -2);
	logCartToPol(1, 0);
	logCartToPol(-2, 0);
	logCartToPol(-3, -.01);
	logCartToPol(-3, 0);
	logCartToPol(-3, .01);
    
    window.console.log("%s", new Polar2(3, 2));
    
    
    ok(""+cartToPol(1, 2) == "()");

    var p1 = new Pos2(10, 11);
	ok(p1.x == 10 && p1.y == 11, "Pos2.constructor");
	ok(""+p1 == "(10/11)", "Pos2.toString");

	var p2 = new Pos2(p1);
	ok(p2.x == 10 && p2.y == 11, "Pos2.copy constructor");

	p1.translate(3, 7);
	ok(p1.x == 13 && p1.y == 18, "Pos2.translate");

	ok(p2.x == 10 && p2.y == 11, "Pos2.copy constructor is a real copy");
	
	var v1 = new Vec2(11, 13);
	p1.translate(v1);
	ok(p1.x == 24 && p1.y == 31, "Pos2.translate by vector");
});


test("Vector math: Vec2", function() {
    expect(3);

	var v1 = new Vec2(3, 7); 
	ok(v1.dx == 3 && v1.dy == 7, "Vec2.constructor");
	ok(""+v1 == "(3, 7)", "Vec2.toString");

	v1.rotate(Math.PI);
	ok(v1.dx == -3 && v1.dy == -7, "Vec2.rotate");
});

/*
timedTest(".click() add10000_deep", function() {
    $("#dynatree-id-_5").click();
});

test("Load 100 nodes (flat)", function() {
    var parent  = $("#tree").dynatree("getTree").getNodeByKey("_1");
//    addNodes(parent, 100, 0, 0)
    ok( true, "all pass" );
*/
/******************************************************************************/
});
