/////////////////////////////////////////////////////////////////
//    Sýnidæmi í Tölvugrafík
//     Sýnir mismunandi útgáfur af síun (filter) í mynsturvörpun.
//     Langur tvívíður veggur er skilgreindur og búið til MIPmap
//     mynstur sem er varpað á vegginn.  Sýnir vel eiginleika MIPmap
//     síana.
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
    vec2( 100.0, 0.0 ),
    vec2( 100.0, 1.0 ),
    vec2( 100.0, 1.0 ),
    vec2(  0.0, 1.0 ),
    vec2(  0.0, 0.0 )
];

// Búa til vigra fyrir mynstur (sjálfkrafa upphafsstillt sem 0)
var mipmapTex128 = new Uint8Array(4*128*128);
var mipmapTex64 = new Uint8Array(4*64*64);
var mipmapTex32 = new Uint8Array(4*32*32);
var mipmapTex16 = new Uint8Array(4*16*16);
var mipmapTex8 = new Uint8Array(4*8*8);
var mipmapTex4 = new Uint8Array(4*4*4);
var mipmapTex2 = new Uint8Array(4*2*2);
var mipmapTex1 = new Uint8Array(4*1*1);

function makeTextures( ) {
    var i, j;

    // Stærsta mipmap mynstrið er rautt
    for (i = 0; i < 128; i++) {
        for (j = 0; j < 128; j++) {
            mipmapTex128[4*(i*128+j)+0] = 255;
            mipmapTex128[4*(i*128+j)+1] = 0;
            mipmapTex128[4*(i*128+j)+2] = 0;
            mipmapTex128[4*(i*128+j)+3] = 255;
        }
    }
    // Þetta mipmap mynstur er grænt
    for (i = 0; i < 64; i++) {
        for (j = 0; j < 64; j++) {
            mipmapTex64[4*(i*64+j)+0] = 0;
            mipmapTex64[4*(i*64+j)+1] = 255;
            mipmapTex64[4*(i*64+j)+2] = 0;
            mipmapTex64[4*(i*64+j)+3] = 255;
        }
    }
    // Þetta mipmap mynstur er blátt
    for (i = 0; i < 32; i++) {
        for (j = 0; j < 32; j++) {
            mipmapTex32[4*(i*32+j)+0] = 0;
            mipmapTex32[4*(i*32+j)+1] = 0;
            mipmapTex32[4*(i*32+j)+2] = 255;
            mipmapTex32[4*(i*32+j)+3] = 255;
        }
    }
    // Þetta mipmap mynstur er gult
    for (i = 0; i < 16; i++) {
        for (j = 0; j < 16; j++) {
            mipmapTex16[4*(i*16+j)+0] = 255;
            mipmapTex16[4*(i*16+j)+1] = 255;
            mipmapTex16[4*(i*16+j)+2] = 0;
            mipmapTex16[4*(i*16+j)+3] = 255;
        }
    }
    // Þetta mipmap mynstur er fjólublátt (magenta)
    for (i = 0; i < 8; i++) {
        for (j = 0; j < 8; j++) {
            mipmapTex8[4*(i*8+j)+0] = 255;
            mipmapTex8[4*(i*8+j)+1] = 0;
            mipmapTex8[4*(i*8+j)+2] = 255;
            mipmapTex8[4*(i*8+j)+3] = 255;
        }
    }
    // Þetta mipmap mynstur er blágrænt (cyan)
    for (i = 0; i < 4; i++) {
        for (j = 0; j < 4; j++) {
            mipmapTex4[4*(i*4+j)+0] = 0;
            mipmapTex4[4*(i*4+j)+1] = 255;
            mipmapTex4[4*(i*4+j)+2] = 255;
            mipmapTex4[4*(i*4+j)+3] = 255;
        }
    }
    // Þetta mipmap mynstur er hvítt
    for (i = 0; i < 2; i++) {
        for (j = 0; j < 2; j++) {
            mipmapTex2[4*(i*2+j)+0] = 255;
            mipmapTex2[4*(i*2+j)+1] = 255;
            mipmapTex2[4*(i*2+j)+2] = 255;
            mipmapTex2[4*(i*2+j)+3] = 255;
        }
    }
    // Þetta mipmap mynstur er svart
    for (i = 0; i < 1; i++) {
        for (j = 0; j < 1; j++) {
            mipmapTex2[4*(i*1+j)+0] = 0;
            mipmapTex2[4*(i*1+j)+1] = 0;
            mipmapTex2[4*(i*1+j)+2] = 0;
            mipmapTex2[4*(i*1+j)+3] = 255;
        }
    }

}

function configureTexture( ) {
    texture = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture );

    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, 128, 128, 0, gl.RGBA, gl.UNSIGNED_BYTE, mipmapTex128 );
    gl.texImage2D( gl.TEXTURE_2D, 1, gl.RGBA, 64, 64, 0, gl.RGBA, gl.UNSIGNED_BYTE, mipmapTex64 );
    gl.texImage2D( gl.TEXTURE_2D, 2, gl.RGBA, 32, 32, 0, gl.RGBA, gl.UNSIGNED_BYTE, mipmapTex32 );
    gl.texImage2D( gl.TEXTURE_2D, 3, gl.RGBA, 16, 16, 0, gl.RGBA, gl.UNSIGNED_BYTE, mipmapTex16 );
    gl.texImage2D( gl.TEXTURE_2D, 4, gl.RGBA, 8, 8, 0, gl.RGBA, gl.UNSIGNED_BYTE, mipmapTex8 );
    gl.texImage2D( gl.TEXTURE_2D, 5, gl.RGBA, 4, 4, 0, gl.RGBA, gl.UNSIGNED_BYTE, mipmapTex4 );
    gl.texImage2D( gl.TEXTURE_2D, 6, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, mipmapTex2 );
    gl.texImage2D( gl.TEXTURE_2D, 7, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, mipmapTex1 );

//    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image );
//    gl.generateMipmap( gl.TEXTURE_2D );
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


    // Búa til mynstur og hlaða þeim inn
    makeTextures( );
    configureTexture( );

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
        document.getElementById("MagFilter").innerHTML = "gl.NEAREST";
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
    mv = mult( mv, rotate( parseFloat(spinX), [1, 0, 0] ) );
    mv = mult( mv, rotate( parseFloat(spinY), [0, 1, 0] ) );

    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));

    gl.drawArrays( gl.TRIANGLES, 0, numVertices );

    requestAnimFrame(render);
}
