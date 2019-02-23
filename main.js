var canvas =document.getElementById("main");
var gl =canvas.getContext('webgl2');

let WIDTH = canvas.width;
let HEIGHT = canvas.height;
let NUM_METABALLS=7;
console.log(gl);
console.log(gl.getParameter(gl.SHADING_LANGUAGE_VERSION));
console.log(gl.getParameter(gl.VERSION));

function compileShader(shaderSource, shaderType) {
    var shader = gl.createShader(shaderType);
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw "Shader compile failed with: " + gl.getShaderInfoLog(shader);
    }

    return shader;
}


var vertexShader = compileShader('#version 300 es \n\
in vec2 position;\n\
\n\
void main() {\n\
    // position specifies only x and y.\n\
    // We set z to be 0.0, and w to be 1.0\n\
    gl_Position = vec4(position, 0.0, 1.0);\n\
}\
', gl.VERTEX_SHADER);



var fragmentShader = compileShader('#version 300 es \n\
precision highp float;\n\
uniform vec3 metaballs[' + NUM_METABALLS + '];\n\
const float WIDTH = ' + WIDTH + '.0;\n\
const float HEIGHT = ' + HEIGHT + '.0;\n\
\n\
out vec4 color;     \n\
void main(){\n\
    float x = gl_FragCoord.x;\n\
    float y = gl_FragCoord.y;\n\
    float v = 0.0;\n\
    for (int i = 0; i < ' + NUM_METABALLS + '; i++) {\n\
        vec3 mb = metaballs[i];\n\
        float dx = mb.x - x;\n\
        float dy = mb.y - y;\n\
        float r = mb.z;\n\
        v += r*r/(dx*dx + dy*dy);\n\
    }\n\
    if (v > 1.0) {\n\
        color = vec4(x/WIDTH, y/HEIGHT,\n\
                                0.0, 1.0);\n\
    } else {\n\
        color = vec4(0.0, 0.0, 0.0, 1.0);\n\
    }\n\
}\n\
', gl.FRAGMENT_SHADER);

let program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program,fragmentShader);
gl.linkProgram(program);
gl.useProgram(program);


let vertexData  = new Float32Array([
-1.0,1.0,
-1.0,-1.0,
1.0,1.0,
1.0,-1.0,
]);


let vbo = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER,vbo);
gl.bufferData(gl.ARRAY_BUFFER,vertexData,gl.STATIC_DRAW);


//attrib setup

function getAttribLocation(program,name){
let location = gl.getAttribLocation(program,name);
if(location===-1)
throw 'Can not find attribute'+ name +'.';

return location;
}

let positionLocation = getAttribLocation(program , 'position');
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer (positionLocation,2,
    gl.FLOAT,gl.FALSE,
    2*4,0);


let metaballs=[];
for (let i=0;i<NUM_METABALLS;i++){
    let radius =Math.random()*60+10;
    metaballs.push({
        x:Math.random()*(WIDTH-2*radius)+radius,
        y:Math.random()*(HEIGHT-2*radius)+radius,
        vx:Math.random()*10-5,
        vy:Math.random()*10-5,
        r:radius
    });

}

function getUniformLocation(program, name) {
    var uniformLocation = gl.getUniformLocation(program, name);
    if (uniformLocation === -1) {
        throw 'Can not find uniform ' + name + '.';
    }
    return uniformLocation;
}

let metaballsPosition= getUniformLocation(program,'metaballs');


/// simulation

let step = function(){

for (let i=0;i<NUM_METABALLS;i++){
    let mb= metaballs[i];

    mb.x+=mb.vx;
    if(mb.x - mb.r <0){
        mb.x=mb.r+1;
        mb.vx=Math.abs(mb.vx);
    }else if(mb.x +mb.r>WIDTH){
        mb.x=WIDTH-mb.r;
        mb.vx=-Math.abs(mb.vx);
    }
    mb.y+= mb.vy;
    if(mb.y-mb.r<0){
        mb.y=mb.r+1;
        mb.vy=Math.abs(mb.vy);
    }else if (mb.y +mb.r>HEIGHT){
        mb.y=HEIGHT-mb.r;
        mb.vy=-Math.abs(mb.vy);
    }
}

let gpuData = new Float32Array(3*NUM_METABALLS);
for (let i=0;i<NUM_METABALLS;i++){
 let index=3*i;
 let mb =metaballs[i];
 gpuData[index+0]=mb.x;
 gpuData[index+1]=mb.y;
 gpuData[index+2]=mb.r;

}

gl.uniform3fv(metaballsPosition,gpuData);
gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
requestAnimationFrame(step);

}

step();