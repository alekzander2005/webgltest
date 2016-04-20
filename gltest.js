function GlTest()
{
    this.rotate = 0.0;
    this.animation = 0.0;
}

GlTest.prototype.prepareMatrices = function()
{
    this.memory = new ArrayBuffer(4 * 4 * 4 * 2);
    this.perspective = new Float32Array(this.memory, 0, 4 * 4);
    this.model = new Float32Array(this.memory, 4 * 4 * 4, 4 * 4);

    mat4.perspective(this.perspective, 0.52, this.displayWidth / this.displayHeight, 0.1, 100.0);
    mat4.fromTranslation(this.model, [0.0, 0.0, -10.0]);
};

GlTest.prototype.compileShader = function(shaderSource, shaderType)
{
  var shader = this.gl.createShader(shaderType);
 
  this.gl.shaderSource(shader, shaderSource);
 
  this.gl.compileShader(shader);
 
  var success = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);
  if (!success) {
    throw "could not compile shader:" + this.gl.getShaderInfoLog(shader) + " text: " + shaderSource;
  }
 
  return shader;
};

GlTest.prototype.prepareShader = function()
{
    this.shaderProgram = this.gl.createProgram();
    
    var vs = "precision mediump float;\n\
            attribute vec3 currentPosition;\n\
            attribute vec3 nextPosition;\n\
            uniform float animation;\n\
            uniform mat4 camera;\n\
            uniform mat4 model;\n\
            varying vec3 pos;\n\
            void main(void){\n\
            pos = mix(currentPosition, nextPosition, animation).xyz;\n\
            gl_Position = camera * model * vec4(pos, 1.0);\n\
            }";
    
    var fs = "precision mediump float;\n\
            varying vec3 pos;\n\
            void main(void){\n\
            gl_FragColor = vec4(pos, 1.0);\n\
            }";
    
    var vshader = this.compileShader(vs, this.gl.VERTEX_SHADER);
    var fshader = this.compileShader(fs, this.gl.FRAGMENT_SHADER);

    this.gl.attachShader(this.shaderProgram, vshader);
    this.gl.attachShader(this.shaderProgram, fshader);
    this.gl.linkProgram(this.shaderProgram);
    this.gl.useProgram(this.shaderProgram);
    
    this.shaderProgram.attribute0 = this.gl.getAttribLocation(this.shaderProgram, "currentPosition");
    this.shaderProgram.attribute1 = this.gl.getAttribLocation(this.shaderProgram, "nextPosition");

    this.shaderProgram.model = this.gl.getUniformLocation(this.shaderProgram, "model");
    this.shaderProgram.camera = this.gl.getUniformLocation(this.shaderProgram, "camera");
    this.shaderProgram.animation = this.gl.getUniformLocation(this.shaderProgram, "animation");
};

GlTest.prototype.init = function()
{
    this.canvas = document.getElementById("game");
    this.displayWidth = this.canvas.width;
    this.displayHeight = this.canvas.height;

    try{
        this.gl = this.canvas.getContext("webgl", {alpha: false, antialias:true});
    }catch(e){}
    
    if (this.gl === null)
        try{
            this.gl = this.canvas.getContext("experimental-webgl", {alpha: false, antialias:true});
        }
        catch(e){}
    
    try {
        this.gl.floatTextureExtension = this.gl.getExtension("OES_texture_float");
    }catch(e){}
    
    this.gl.clearColor(0.1, 0.1, 0.1, 1.0);                
                
    this.prepareShader();

	this.vertexBuffer = this.gl.createBuffer();
    var vertices = [1.0, -1.0, 0.0
		,-1.0, -1.0, 0.0
		,-1.0, 1.0,  0.0

		,-1.0, 1.0,  2.0
		,-1.0, -1.0, 2.0
		, 1.0, -1.0, 2.0

		, 1.0, 1.0,  2.0
		, 1.0, -1.0, 2.0
		, 1.0, -1.0, 0.0

		, 1.0, -1.0, 0.0
		, 1.0, -1.0, 2.0
		,-1.0, -1.0, 2.0

		,-1.0, -1.0, 2.0
		,-1.0, 1.0,  2.0
		,-1.0, 1.0,  0.0

		, 1.0, 1.0,  0.0
		,-1.0, 1.0,  0.0
		,-1.0, 1.0,  2.0

		, 1.0, 1.0,  0.0
		, 1.0, -1.0, 0.0
		,-1.0, 1.0,  0.0
		
		, 1.0, 1.0,  2.0
		,-1.0, 1.0,  2.0
		, 1.0, -1.0, 2.0
		
		, 1.0, 1.0,  0.0
		, 1.0, 1.0,  2.0
		, 1.0, -1.0, 0.0
		
		,-1.0, -1.0, 0.0
		, 1.0, -1.0, 0.0
		,-1.0, -1.0, 2.0
		
		,-1.0, -1.0, 0.0
		,-1.0, -1.0, 2.0
		,-1.0, 1.0,  0.0
		
		, 1.0, 1.0,  2.0
		, 1.0, 1.0,  0.0
		,-1.0, 1.0,  2.0];
    
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);

    this.prepareMatrices();
};

GlTest.prototype.draw = function()
{
    this.gl.viewport(0, 0, this.displayWidth, this.displayHeight);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    
    this.gl.disable(this.gl.CULL_FACE);
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.useProgram(this.shaderProgram);

    mat4.fromTranslation(this.model, [0.0, 0.0, -10.0]);
    mat4.rotate(this.model, this.model, this.rotate, [1.0, 1.0, 1.0])
    this.rotate = this.rotate + 0.01;
    this.animation += 0.01;
    if (this.animation > 1.0) this.animation = 0.0;
    
    this.gl.uniformMatrix4fv(this.shaderProgram.model, this.gl.FALSE, this.model);
    this.gl.uniformMatrix4fv(this.shaderProgram.camera, this.gl.FALSE, this.perspective);
    this.gl.uniform1f(this.shaderProgram.animation, this.animation);
    
    this.gl.enableVertexAttribArray(this.shaderProgram.attribute0);
    this.gl.enableVertexAttribArray(this.shaderProgram.attribute1);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.vertexAttribPointer(this.shaderProgram.attribute0, 3, this.gl.FLOAT, this.gl.FALSE, 0, 0);
    this.gl.vertexAttribPointer(this.shaderProgram.attribute1, 3, this.gl.FLOAT, this.gl.FALSE, 0, 0);
    
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 36);
    
    this.gl.disableVertexAttribArray(this.shaderProgram.attribute0);
    this.gl.disableVertexAttribArray(this.shaderProgram.attribute1);
    
    requestAnimationFrame(this.draw.bind(this));
};

function glTestStart()
{
    window.glText = new GlTest();
    window.glText.init();
    window.glText.draw();
}
