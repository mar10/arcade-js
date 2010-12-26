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

function logMsg(){
    if (window.console && window.console.log) {  
        window.console.log.apply(this, arguments);  
    }  
}


/*******************************************************************************
 * Module Load
 */
module("Vector math");

test("basic", function() {
    expect(2);

	var game = new ArcadeJS();
    ok(game.fps == 15, "Construct ArcadeJS");
});


/******************************************************************************/
});
