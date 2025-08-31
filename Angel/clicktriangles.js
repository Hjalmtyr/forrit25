/////////////////////////////////////////////////////////////////
//    Sýnidæmi í Tölvugrafík
//     Sýnislausn á dæmi 4 í Heimadæmum 2.  Teiknar þríhyrning
//     á strigann þar sem notandinn smellir með músinni
//
//    Hjálmtýr Hafsteinsson, ágúst 2025
/////////////////////////////////////////////////////////////////
var canvas;
var gl;

// Þarf hámarksfjölda punkta til að taka frá pláss í grafíkminni
var maxNumPoints = 600;  
var index = 0;
var TRISIZE = 10;  // Stærð þríhyrninga í punktum


window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.95, 1.0, 1.0, 1.0 );

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 8*maxNumPoints, gl.DYNAMIC_DRAW);
    
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    canvas.addEventListener("mousedown", function(e){

        gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
        
        // Þurfum nú að reikna staðsetningu 3ja hornpunkta þríhyrnings út frá miðpunkti
        var t1 = vec2(2*(e.offsetX-TRISIZE)/canvas.width-1, 2*(canvas.height-(e.offsetY+TRISIZE))/canvas.height-1);
        var t2 = vec2(2*e.offsetX/canvas.width-1, 2*(canvas.height-(e.offsetY-TRISIZE))/canvas.height-1);
        var t3 = vec2(2*(e.offsetX+TRISIZE)/canvas.width-1, 2*(canvas.height-(e.offsetY+TRISIZE))/canvas.height-1);
    
        // Bæta þessum þremur punktum í fylkið og hækka teljara (index)
        gl.bufferSubData(gl.ARRAY_BUFFER, 8*index++, flatten(t1));
        gl.bufferSubData(gl.ARRAY_BUFFER, 8*index++, flatten(t2));
        gl.bufferSubData(gl.ARRAY_BUFFER, 8*index++, flatten(t3));
    } );

    render();
}


function render() {
    
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.TRIANGLES, 0, index );

    window.requestAnimFrame(render);
}
