/////////////////////////////////////////////////////////////////
//    Sýnidæmi í Tölvugrafík
//     Sýnir mismunandi útgáfur af síun (filter) í mynsturvörpun.
//     Langur tvívíður veggur er skilgreindur og varpað á hann
//     mynd sem er lesin inn.  Hægt að snúa spjaldinu og færa til.
//     Nú líka með ójafnhliða (anisotropic) síun.
//
//    Hjálmtýr Hafsteinsson, október 2025
/////////////////////////////////////////////////////////////////
var canvas;
var gl;

var numVertices  = 6;

var program;

var pointsArray = [];
var colorsArray = [];
var texCoordsArray = [];

var texture;

var anisotropyExtension = null;
var anisotropyMax;

var movement = false;
var spinX = 0;
var spinY = 0;
var origX;
var origY;

var zDist = -5.0;

var proLoc;
var mvLoc;

// Tveir þríhyrningar sem mynda spjald í z=0 planinu
var vertices = [
    vec4( -100.0, -1.0, 0.0, 1.0 ),
    vec4(  100.0, -1.0, 0.0, 1.0 ),
    vec4(  100.0,  1.0, 0.0, 1.0 ),
    vec4(  100.0,  1.0, 0.0, 1.0 ),
    vec4( -100.0,  1.0, 0.0, 1.0 ),
    vec4( -100.0, -1.0, 0.0, 1.0 )
];

// Mynsturhnit fyrir spjaldið
var texCoords = [
    vec2(  0.0, 0.0 ),
    vec2( 200.0, 0.0 ),
    vec2( 200.0, 2.0 ),
    vec2( 200.0, 2.0 ),
    vec2(  0.0, 2.0 ),
    vec2(  0.0, 0.0 )
];


function configureTexture( image ) {
    texture = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image );
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
    
    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
}


window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.9, 1.0, 1.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    
    var tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW );
    
    var vTexCoord = gl.getAttribLocation( program, "vTexCoord" );
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vTexCoord );

    anisotropyExtension = gl.getExtension("EXT_texture_filter_anisotropic");
    if( anisotropyExtension ) {
        anisotropyMax = gl.getParameter(anisotropyExtension.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
    }

    var image = document.getElementById("texImage");
    configureTexture( image );

    document.getElementById("MagFilter").innerHTML = "gl.NEAREST";
    document.getElementById("MinFilter").innerHTML = "gl.NEAREST";


    proLoc = gl.getUniformLocation( program, "projection" );
    mvLoc = gl.getUniformLocation( program, "modelview" );

    var proj = perspective( 50.0, 1.0, 0.2, 100.0 );
    gl.uniformMatrix4fv(proLoc, false, flatten(proj));
    

    //event listeners for mouse
    canvas.addEventListener("mousedown", function(e){
        movement = true;
        origX = e.clientX;
        origY = e.clientY;
        e.preventDefault();         // Disable drag and drop
    } );

    canvas.addEventListener("mouseup", function(e){
        movement = false;
    } );

    canvas.addEventListener("mousemove", function(e){
        if(movement) {
    	    spinY = ( spinY + (e.clientX - origX) ) % 360;
            spinX = ( spinX + (origY - e.clientY) ) % 360;
            origX = e.clientX;
            origY = e.clientY;
        }
    } );
    
    // Event listener for keyboard
     window.addEventListener("keydown", function(e){
         switch( e.keyCode ) {
            case 38:	// upp ör
                zDist += 0.1;
                break;
            case 40:	// niður ör
                zDist -= 0.1;
                break;
         }
     }  );  

    // Event listener for mousewheel
     window.addEventListener("wheel", function(e){
         if( e.deltaY > 0.0 ) {
             zDist += 0.2;
         } else {
             zDist -= 0.2;
         }
     }  );  

    // Event listeners for buttons
    document.getElementById("btnMagNear").onclick = function(){
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
        document.getElementById("MagFilter").innerHTML = "gl.NEAREST";
        render();
    };

    document.getElementById("btnMagLinear").onclick = function(){
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR );
        document.getElementById("MagFilter").innerHTML = "gl.LINEAR";
        render();
    };

    document.getElementById("btnNear").onclick = function(){
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST );
        document.getElementById("MinFilter").innerHTML = "gl.NEAREST";
        render();
    };

    document.getElementById("btnLinear").onclick = function(){
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR );
        document.getElementById("MinFilter").innerHTML = "gl.LINEAR";
        render();
    };

    document.getElementById("btnNearNear").onclick = function(){
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST );
        document.getElementById("MinFilter").innerHTML = "gl.NEAREST_MIPMAP_NEAREST";
        render();
    };

    document.getElementById("btnNearLinear").onclick = function(){
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR );
        document.getElementById("MinFilter").innerHTML = "gl.NEAREST_MIPMAP_LINEAR";
        render();
    };

    document.getElementById("btnLinearNear").onclick = function(){
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST );
        document.getElementById("MinFilter").innerHTML = "gl.LINEAR_MIPMAP_NEAREST";
        render();
    };

    document.getElementById("btnLinearLinear").onclick = function(){
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR );
        document.getElementById("MinFilter").innerHTML = "gl.LINEAR_MIPMAP_LINEAR";
        render();
    };

    document.getElementById("chkAnisostropic").onchange = function(){
        if (document.getElementById("chkAnisostropic").checked) {
            gl.texParameteri(gl.TEXTURE_2D, anisotropyExtension.TEXTURE_MAX_ANISOTROPY_EXT, anisotropyMax);
        }
        else {
            gl.texParameteri(gl.TEXTURE_2D, anisotropyExtension.TEXTURE_MAX_ANISOTROPY_EXT, 1);
        }
        render();
    };

    render();
 
}

var render = function(){
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // staðsetja áhorfanda og meðhöndla músarhreyfingu
    var mv = lookAt( vec3(0.0, 0.0, zDist), vec3(0.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0) );
    mv = mult( mv, rotateX( spinX ) );
    mv = mult( mv, rotateY( spinY ) );
    
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));

    gl.drawArrays( gl.TRIANGLES, 0, numVertices );

    requestAnimFrame(render);
}
