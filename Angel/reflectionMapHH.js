/////////////////////////////////////////////////////////////////
//    Sýnidæmi í Tölvugrafík
//     Sýnidæmi um teningsvörpun, byggt á sýnidæminu
//     reflectionMap í kafla 7 í kennslubókinni.
//
//    Hjálmtýr Hafsteinsson, október 2025
/////////////////////////////////////////////////////////////////
var canvas;
var gl;
var program;

var numVertices  = 36;

var movement = false;
var spinX = 0;
var spinY = 0;
var origX;
var origY;

var cubeMap;

var pointsArray = [];
var normalsArray = [];

var vertices = [
    vec4( -0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5,  0.5,  0.5, 1.0 ),
    vec4( 0.5,  0.5,  0.5, 1.0 ),
    vec4( 0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5, -0.5, -0.5, 1.0 ),
    vec4( -0.5,  0.5, -0.5, 1.0 ),
    vec4( 0.5,  0.5, -0.5, 1.0 ),
    vec4( 0.5, -0.5, -0.5, 1.0 )
];


window.onload = init;


var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = xAxis;

var theta = [0.0, 0.0, 0.0];

function configureCubeMap() {

    cubeMap = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap);
/*    
    var imgHaegri = document.getElementById("haegri");
    gl.texImage2D( gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, imgHaegri );
    var imgVinstri = document.getElementById("vinstri");
    gl.texImage2D( gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, imgVinstri );
    var imgToppur = document.getElementById("toppur");
    gl.texImage2D( gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, imgToppur );
    var imgBotn = document.getElementById("botn");
    gl.texImage2D( gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, imgBotn );
    var imgAftan = document.getElementById("aftan");
    gl.texImage2D( gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, imgAftan );
    var imgFraman = document.getElementById("framan");
    gl.texImage2D( gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, imgFraman );
*/
    var imgHaegri = document.getElementById("haegri");
    var imgVinstri = document.getElementById("vinstri");
    gl.texImage2D( gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, imgVinstri );
    gl.texImage2D( gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, imgHaegri );
    var imgToppur = document.getElementById("toppur");
    var imgBotn = document.getElementById("botn");
    gl.texImage2D( gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, imgToppur );
    gl.texImage2D( gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, imgBotn );
    var imgAftan = document.getElementById("aftan");
    var imgFraman = document.getElementById("framan");
    gl.texImage2D( gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, imgFraman );
    gl.texImage2D( gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, imgAftan );

    gl.texParameteri(gl.TEXTURE_CUBE_MAP,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
}

function quad(a, b, c, d) {

     var t1 = subtract(vertices[b], vertices[a]);
     var t2 = subtract(vertices[c], vertices[a]);
     var normal = cross(t1, t2);
     normal[3] = 0.0;

     pointsArray.push(vertices[a]); 
     normalsArray.push(normal); 

     pointsArray.push(vertices[b]); 
     normalsArray.push(normal);  

     pointsArray.push(vertices[c]); 
     normalsArray.push(normal);;  
    
     pointsArray.push(vertices[a]); 
     normalsArray.push(normal);;  

     pointsArray.push(vertices[c]); 
     normalsArray.push(normal);;  

     pointsArray.push(vertices[d]); 
     normalsArray.push(normal);;     
}

function colorCube()
{
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}

function init() {
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    colorCube();

    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );
    
    var vNormal = gl.getAttribLocation( program, "vNormal");
    gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray( vNormal);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
    
    var vPosition = gl.getAttribLocation( program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
//    var projectionMatrix = ortho(-2, 2, -2, 2, -10, 10);
    var projectionMatrix = perspective( 60.0, 1.0, 0.5, 100.0 );
    gl.uniformMatrix4fv( gl.getUniformLocation( program, "projectionMatrix" ), false, flatten(projectionMatrix) );

    configureCubeMap();
    gl.activeTexture( gl.TEXTURE0 );
    gl.uniform1i(gl.getUniformLocation(program, "texMap"),0); 
    

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
            spinX = ( spinX + (e.clientY - origY) ) % 360;
            origX = e.clientX;
            origY = e.clientY;
        }
    } );
    
    render();
}

var render = function(){
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // staðsetja áhorfanda og meðhöndla músarhreyfingu
    var mv = lookAt( vec3(0.0, 0.0, 1.0), vec3(0.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0) );
    mv = mult( mv, rotateX( spinX ) );
    mv = mult( mv, rotateY( spinY ) );
    mv = mult( mv, scalem( 0.5, 0.5, 0.5 ) );

    gl.uniformMatrix4fv( gl.getUniformLocation(program, "modelViewMatrix"), false, flatten(mv) );
            
    var normalMatrix = [
        vec3(mv[0][0], mv[0][1], mv[0][2]),
        vec3(mv[1][0], mv[1][1], mv[1][2]),
        vec3(mv[2][0], mv[2][1], mv[2][2])
    ];
	normalMatrix.matrix = true;
    
    
    gl.uniformMatrix3fv(gl.getUniformLocation(program, "normalMatrix"), false, flatten(normalMatrix) );

    gl.drawArrays( gl.TRIANGLES, 0, numVertices );
    requestAnimFrame(render);
}
