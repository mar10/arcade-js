/*************************************************************************
	(c) 2010 Martin Wendt
 *************************************************************************/

function viewSourceCode()
{
	window.location = "view-source:" + window.location.href;
	
}

function initCodeSamples() {
	$('a.codeExample').each (
			function( i ) {
				$( this ).after( '<pre class="codeExample prettyprint"><code></code></pre>' );
			}
	)
	$( 'pre.codeExample' ).hide();
	$('a.codeExample').toggle( 
			function() {
				if( !this.old ){
					this.old = $(this).html();
				}
				$(this).html('Hide Code');
				parseCode(this);
			},
			function() {
				$(this).html(this.old);
				$(this.nextSibling).hide();
			}
	)
	function parseCode(o){
		if(!o.nextSibling.hascode){
			$.get (o.href, function(code){
				// Doesn't work (only accepts simple/restricted html strings, not a full html page):
//				logMsg("code.html: %o", $(code).html());

				// Remove <!-- Start_Exclude [...] End_Exclude --> blocks:
				code = code.replace(/<!-- Start_Exclude(.|\n|\r)*?End_Exclude -->/gi, "<!-- (Irrelevant source removed.) -->");

/*
				code = code.replace(/&/mg,'&#38;')
					.replace(/</mg,'&#60;')
					.replace(/>/mg,'&#62;')
					.replace(/\"/mg,'&#34;')
					.replace(/\t/g,'  ')
					.replace(/\r?\n/g,'<br>')
					.replace(/<br><br>/g,'<br>');
					.replace(/ /g,'&nbsp;');
*/
				// Reduce tabs from 8 to 4 characters
				code = code.replace(/\t/g, "    ");
				$("code", o.nextSibling).text(code);
				o.nextSibling.hascode = true;
				// Format code samples
				try {
					prettyPrint();
				} catch (e) { }
			});
		}
		$(o.nextSibling).show();
	}
}

/*******************************************************************************
 * Handle debug controls
 */
function initArcadeGameDebugControls(game)
{
	// Handle debug controls
    $("#cbDebug")
    .attr("checked", false)
    .click(function(){
        var flag = $(this).is(":checked");
        game.opts.debug.showActivity = flag;
        game.opts.debug.showVelocity = flag;
        game.opts.debug.showBCircle = flag;
        game.opts.debug.showKeys = flag;
        game.opts.debug.showObjects = flag;
        game.opts.debug.showMouse = flag;
    });
    $("#cbLogToCanvas")
    .attr("checked", false)
    .click(function(){
        var flag = $(this).is(":checked");
        game.opts.debug.logToCanvas = flag;
    });
    $("#cbMaxFps")
    .attr("checked", false)
    .click(function(){
        if($(this).is(":checked")){
            game.fps = 1000;
        }else{
            game.fps = game.opts.fps;
        }
        game.stopLoop();
        game.startLoop();
        game.freezeMode = false;
        $("#rbStepmode1").attr("checked", true);
    });
    $("#cbTimeCorrection")
    .attr("checked", true)
    .click(function(){
        game.timeCorrection = $(this).is(":checked");
    });
    $("#rbStepmode1")
    .attr("checked", true)
    .click(function(){
        game.freezeMode = false;
        game.startLoop();
    });
    $("#rbStepmode2").click(function(){
        game.freezeMode = true;
        game.startLoop();
    });
    $("#rbStepmode3").click(function(){
        game.stopLoop();
    });
    $("#btnStep").click(function(){
        game.stopRequest = true;
        $("#rbStepmode3").attr("checked", true);
        if( !game.isRunning() ){
            game.startLoop();
        }
    });
}
