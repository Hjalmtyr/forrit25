/////////////////////////////////////////////////////////////////
//    Sýnidæmi um aðra leið til að nálga kúlu í Tölvugrafík
//     Kúla sem lituð er með Gouraud litun.  Hægt að snúa henni
//     með músinni og auka/minnka nákvæmni kúlunnar með hnöppum.
//     Betri nálgun á kúlu en sú sem er í kennslubók Angel.
//     Byggt á kóða frá learningwebgl.com (lesson 11)
//
//    Hjálmtýr Hafsteinsson, október 2025
/////////////////////////////////////////////////////////////////
var canvas;
var gl;

var numBands = 20;
 
var vertexPosition;
var normalsArray;
var pointsArray;

var movement = false;     // Do we rotate?
var spinX = 0;
var spinY = 0;
var origX;
var origY;

var zDist = -3.0;

var fovy = 50.0;
var near = 0.2;
var far = 100.0;

var va = vec4(0.0, 0.0, -1.0,1);
var vb = vec4(0.0, 0.942809, 0.333333, 1);
var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
var vd = vec4(0.816497, -0.471405, 0.333333,1);
    
var lightPosition = vec4(1.0, 1.0, 1.0, 0.0 );
var lightAmbient = vec4(0.1, 0.1, 0.1, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.6, 0.2, 1.0 );
var materialDiffuse = vec4( 1.0, 0.6, 0.2, 1.0 );
var materialSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialShininess = 40.0;

var ctm;
var ambientColor, diffuseColor, specularColor;

var mv, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;

var normalMatrix, normalMatrixLoc;

var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

// Builds sphere from triangles into arrays pointsArray and normalsArray
function makeSphere( latitudeBands, longitudeBands ) {

	vertexPosition = [];

     // Find all vertices of the sphere
	for (var latNumber = 0; latNumber <= latitudeBands; latNumber++) {
	   var theta = latNumber * Math.PI / latitudeBands;
	   var sinTheta = Math.sin(theta);
	   var cosTheta = Math.cos(theta);
	   for (var longNumber = 0; longNumber <= longitudeBands; longNumber++) {
		  var phi = longNumber * 2 * Math.PI / longitudeBands;
		  var sinPhi = Math.sin(phi);
		  var cosPhi = Math.cos(phi);
		  var x = cosPhi * sinTheta;
		  var y = cosTheta;
		  var z = sinPhi * sinTheta;
		  vertexPosition.push(vec4(x, y, z, 1.0));
	   }
	 }
	 
	  pointsArray = [];
      normalsArray = [];
      
      // Build triangles from vertex data
	  for (var latNumber = 0; latNumber < latitudeBands; latNumber++) {
	    for (var longNumber = 0; longNumber < longitudeBands; longNumber++) {
		  var first = (latNumber * (longitudeBands + 1)) + longNumber;
		  var second = first + longitudeBands + 1;
         
          // Coordinates for first triangle
          pointsArray.push(vertexPosition[first]);
          pointsArray.push(vertexPosition[second]);
          pointsArray.push(vertexPosition[first + 1]);
         
          // Coordinates for second triangle
          pointsArray.push(vertexPosition[second]);
          pointsArray.push(vertexPosition[second + 1]);
          pointsArray.push(vertexPosition[first + 1]);
         
          // Normal vectors for first triangle
          normalsArray.push(vertexPosition[first]);
          normalsArray.push(vertexPosition[second]);
          normalsArray.push(vertexPosition[first + 1]);

          // Normal vectors for second triangle
          normalsArray.push(vertexPosition[second]);
          normalsArray.push(vertexPosition[second + 1]);
          normalsArray.push(vertexPosition[first + 1]);
	    }
	 }

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
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);


    // The number of longitude bands is twice the number of latitude bands on earth
    makeSphere( numBands , 2*numBands );


    document.getElementById("NrBands").innerHTML = numBands;
    document.getElementById("NrVertices").innerHTML = pointsArray.length;

    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );
    
    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
    
    var vPosition = gl.getAttribLocation( program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
    normalMatrixLoc = gl.getUniformLocation( program, "normalMatrix" );

    projectionMatrix = perspective( fovy, 1.0, near, far );
    
    gl.uniform4fv( gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct) );	
    gl.uniform4fv( gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program, "shininess"), materialShininess );

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
    
    document.getElementById("btnIncrease").onclick = function(){
        numBands += 2;
        document.getElementById("NrBands").innerHTML = numBands;
        init();
    };
    document.getElementById("btnDecrease").onclick = function(){
        numBands -= 2;
        document.getElementById("NrBands").innerHTML = numBands;
        init();
    };


    // Event listener for mousewheel
     window.addEventListener("mousewheel", function(e){
         if( e.wheelDelta > 0.0 ) {
             zDist += 0.1;
         } else {
             zDist -= 0.1;
         }
     }  );  

    render();
}


function render() {
    
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    mv = lookAt( vec3(0.0, 0.0, zDist), at, up );
    mv = mult( mv, rotateY( spinY ) );
    mv = mult( mv, rotateX( spinX ) );

    // normal matrix only really need if there is nonuniform scaling
    // it's here for generality but since there is
    // no scaling in this example we could just use modelView matrix in shaders
    normalMatrix = [
        vec3(mv[0][0], mv[0][1], mv[0][2]),
        vec3(mv[1][0], mv[1][1], mv[1][2]),
        vec3(mv[2][0], mv[2][1], mv[2][2])
    ];
	normalMatrix.matrix = true;
            
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mv) );
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix) );

    gl.drawArrays( gl.TRIANGLES, 0, pointsArray.length );

    window.requestAnimFrame(render);
}
