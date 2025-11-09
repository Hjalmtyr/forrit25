/////////////////////////////////////////////////////////////////
//    Sýnidæmi í Tölvugrafík
//     Forrit til að kanna eiginleika dýptarminnis tölvunnar
//
//    Hjálmtýr Hafsteinsson, nóvember 2025
/////////////////////////////////////////////////////////////////
var gl;
var points;

window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }


    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    document.getElementById("Depth").innerHTML = gl.getParameter(gl.DEPTH_BITS);
    document.getElementById("ClearValue").innerHTML = gl.getParameter(gl.DEPTH_CLEAR_VALUE);
    document.getElementById("Range").innerHTML = gl.getParameter(gl.DEPTH_RANGE);
    
    
    var vertices = new Float32Array([-1, -1, 0, 1, 1, -1]);

    //  Configure WebGL

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    //  Load shaders and initialize attribute buffers
    
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    // Load the data into the GPU
    
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER,vertices, gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    render();
};


function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.TRIANGLES, 0, 3 );
}
