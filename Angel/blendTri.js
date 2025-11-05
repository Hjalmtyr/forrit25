/////////////////////////////////////////////////////////////////
//    Sýnidæmi í Tölvugrafík
//     Sýnir blöndun tveggja þríhyrninga
//
//    Hjálmtýr Hafsteinsson, nóvember 2025
/////////////////////////////////////////////////////////////////
var gl;

// Global variables
var zDist = -5.0;
var fovy = 70.0;
var near = 0.2;
var far = 100.0;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);
var raudifyrst = true;
var modelViewMatrixLoc;
var projectionMatrixLoc;

var locPosition;
var locColor;
var bufferIdR;
var bufferIdG;
var colorR = vec4(1.0, 0.0, 0.0, 0.5);
var colorG = vec4(0.0, 1.0, 0.0, 0.5);

window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    
    // Two triangles
    var verticesR = [ vec3( -1.0, -1.0, 0.0 ), vec3( 1.0, -1.0, 0.0 ), vec3(  0.0, 1.0, 0.0 ) ]; 
    var verticesG = [ vec3(  0.0, -1.0, -1.0 ), vec3( 1.0,  1.0, -1.0 ), vec3( -1.0, 1.0, -1.0 ) ];

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    //  Load shaders and initialize attribute buffers
    
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    // Define two VBOs and load the data into the GPU
    bufferIdR = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferIdR );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(verticesR), gl.STATIC_DRAW );

    bufferIdG = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferIdG );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(verticesG), gl.STATIC_DRAW );

    // Get location of shader variable vPosition
    locPosition = gl.getAttribLocation( program, "vPosition" );
    gl.enableVertexAttribArray( locPosition );

    locColor = gl.getUniformLocation( program, "rcolor" );

    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
    projectionMatrix = perspective( fovy, 1.0, near, far );
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );

    gl.enable( gl.BLEND );
//    gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );
    gl.blendFunc( gl.ONE, gl.ONE_MINUS_SRC_ALPHA );

    document.getElementById("btnRaudi").onclick = function(){
        raudifyrst = true;
        document.getElementById("Fyrstur").innerHTML = "Rauður fyrstur";
        render();
    };

    document.getElementById("btnGraeni").onclick = function(){
        raudifyrst = false;
        document.getElementById("Fyrstur").innerHTML = "Grænn fyrstur";
        render();
    };

    document.getElementById("btnZbuffON").onclick = function(){
        gl.enable( gl.DEPTH_TEST );
        render();
    };

    document.getElementById("btnZbuffOFF").onclick = function(){
        gl.disable( gl.DEPTH_TEST );
        render();
    };

    // Event listener for mousewheel
     window.addEventListener("mousewheel", function(e){
         if( e.wheelDelta > 0.0 ) {
             zDist += 0.2;
         } else {
             zDist -= 0.2;
         }
         render();
     }  );  


    render();
};


function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );
    
    var mv = lookAt( vec3(0.0, 0.0, zDist), vec3(0.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mv));

    if( raudifyrst ) {
	    // Teikna rauða þríhyrning    
	    gl.bindBuffer( gl.ARRAY_BUFFER, bufferIdR );
	    gl.vertexAttribPointer( locPosition, 3, gl.FLOAT, false, 0, 0 );
	    gl.uniform4fv( locColor, flatten(colorR) );
	    gl.drawArrays( gl.TRIANGLES, 0, 3 );

	    // Teikna græna þríhyrning
	    gl.bindBuffer( gl.ARRAY_BUFFER, bufferIdG );
	    gl.vertexAttribPointer( locPosition, 3, gl.FLOAT, false, 0, 0 );
	    gl.uniform4fv( locColor, flatten(colorG) );
	    gl.drawArrays( gl.TRIANGLES, 0, 3 );
    } else {
	    // Teikna græna þríhyrning
	    gl.bindBuffer( gl.ARRAY_BUFFER, bufferIdG );
	    gl.vertexAttribPointer( locPosition, 3, gl.FLOAT, false, 0, 0 );
	    gl.uniform4fv( locColor, flatten(colorG) );
	    gl.drawArrays( gl.TRIANGLES, 0, 3 );
    
	    // Teikna rauða þríhyrning    
	    gl.bindBuffer( gl.ARRAY_BUFFER, bufferIdR );
	    gl.vertexAttribPointer( locPosition, 3, gl.FLOAT, false, 0, 0 );
	    gl.uniform4fv( locColor, flatten(colorR) );
	    gl.drawArrays( gl.TRIANGLES, 0, 3 );
    }
}
