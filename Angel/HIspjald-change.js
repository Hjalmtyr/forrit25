/////////////////////////////////////////////////////////////////
//    Sýnislausn á dæmi 3 í Heimadæmum 7 í Tölvugrafík
//     Tvívítt spjald skilgreint og varpað á það mynd sem er
//     lesin inn.  Hægt að minnka eða auka einstaka grunnliti
//     (R, G, B) með því að halda niðri r, g eða b og hreyfa
//     músina upp eða niður.
//
//    Hjálmtýr Hafsteinsson, nóvember 2025
/////////////////////////////////////////////////////////////////
var canvas;
var gl;

var numVertices  = 6;

var program;

var pointsArray = [];
var texCoordsArray = [];

var texture;

var movement = false;
var spinX = 0;
var spinY = 0;
var origX;
var origY;

var mouseY;             // Núv. x-staðsetning músar
var rgb_mouse;          // Upph. staðsetning músar fyrir litabreytingu
var r_down = false;     // Er r-hnappur niðri?
var g_down = false;     // Er g-hnappur niðri?
var b_down = false;     // Er b-hnappur niðri?
var rIncr = 0.0;        // Hve mikið á að breyta R lit
var gIncr = 0.0;        // Hve mikið á að breyta G lit
var bIncr = 0.0;        // Hve mikið á að breyta B lit

var zDist = 3.0;

var proLoc;
var mvLoc;

//    4-------3  2
//    |     /  / |
//    |   /  /   |       
//    | /  /     |
//    5  0-------1
//
// Tveir þríhyrningar sem mynda spjald í z=0 planinu
var vertices = [
    vec4( -1.0, -1.0, 0.0, 1.0 ),      // neðri vinstri
    vec4(  1.0, -1.0, 0.0, 1.0 ),      // neðri hægri
    vec4(  1.0,  1.0, 0.0, 1.0 ),      // efri hægri
    vec4(  1.0,  1.0, 0.0, 1.0 ),      // efri hægri
    vec4( -1.0,  1.0, 0.0, 1.0 ),      // efri vinstri
    vec4( -1.0, -1.0, 0.0, 1.0 )       // neðri vinstri
];

// Mynsturhnit fyrir spjaldið
var texCoords = [
    vec2( 0.0, 0.0 ),
    vec2( 1.0, 0.0 ),
    vec2( 1.0, 1.0 ),
    vec2( 1.0, 1.0 ),
    vec2( 0.0, 1.0 ),
    vec2( 0.0, 0.0 )
];


function configureTexture( image ) {
    texture = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image );
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR );
    
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

    // Ná í mynstur úr html-skrá:
    var image = document.getElementById("texImage");
    configureTexture( image );


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
        mouseY = e.clientY;
        if(r_down) {
            rIncr += (rgb_mouse - e.clientY)/300.0;
        }
        if(g_down) {
            gIncr += (rgb_mouse - e.clientY)/300.0;
        }
        if(b_down) {
            bIncr += (rgb_mouse - e.clientY)/300.0;
        }
        if(movement) {
    	    spinY = ( spinY + (e.clientX - origX) ) % 360;
            spinX = ( spinX + (e.clientY - origY) ) % 360;
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
            case 82:    // r
                r_down = true;
                rgb_mouse = mouseY;
                break;
            case 71:    // g
                g_down = true;
                rgb_mouse = mouseY;
                break;
            case 66:    // b
                b_down = true;
                rgb_mouse = mouseY;
                break;
         }
     }  );  

    // Event listener for keyboard
     window.addEventListener("keyup", function(e){
         switch( e.keyCode ) {
            case 82:    // r
                r_down = false;
                rIncr = 0.0;
                break;
            case 71:    // g
                g_down = false;
                gIncr = 0.0;
                break;
            case 66:    // b
                b_down = false;
                bIncr = 0.0;
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
       
    render();
 
}

var render = function(){
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // staðsetja áhorfanda og meðhöndla músarhreyfingu
    var mv = lookAt( vec3(0.0, 0.0, zDist), vec3(0.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0) );
    mv = mult( mv, rotateX( spinX ) );
    mv = mult( mv, rotateY( spinY ) );
    
    gl.uniform1i( gl.getUniformLocation( program, "rDown" ), r_down );
    gl.uniform1f( gl.getUniformLocation( program, "rIncr" ), rIncr );
    gl.uniform1i( gl.getUniformLocation( program, "gDown" ), g_down );
    gl.uniform1f( gl.getUniformLocation( program, "gIncr" ), gIncr );
    gl.uniform1i( gl.getUniformLocation( program, "bDown" ), b_down );
    gl.uniform1f( gl.getUniformLocation( program, "bIncr" ), bIncr );

    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));

    gl.drawArrays( gl.TRIANGLES, 0, numVertices );

    requestAnimFrame(render);
}
