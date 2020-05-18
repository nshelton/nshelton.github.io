
function genSeedTexture0(w, h) {
	var noise = []
	for( var i = 0; i < w * h * 4; i ++) {
		noise.push(0);
	}

	hw = Math.floor((w)/2); hh = Math.floor((h)/2);

	var stride = w * 4;

	// 5x5 grid
	var seed = [255,255,255,0,255,255,0,0,0,0,0,0,0,255,255,0,255,255,0,255,255,0,255,0,255];

	var seedi = 0
	for (var dx = -2; dx <= 2; dx ++) {
		for (var dy = -2; dy <= 2; dy ++) {
			var i = (dy + hh) * stride + 4 *(dx + hw);
			noise[i + 0] = seed[seedi];
			noise[i + 1] = seed[seedi];
			noise[i + 2] = seed[seedi];
			noise[i + 3] = seed[seedi];
			seedi++
		}
	}

	return noise;
}


function genSeedTexture1(w, h) {
	var noise = []
	for( var i = 0; i < w * h * 4; i ++) {
		noise.push(0);
	}

	hw = Math.floor((w)/2); hh = Math.floor((h)/2);

	var stride = w * 4;

	// 5x5 grid
	var seed = [1,1,1,1,1,1,1,1,0,1,1,1,1,1,0,0,0,1,1,1,0,0,0,0,0,0,1,1,1,1,1,1,1,0,1,1,1,1,1,0,0,0]

	var seedi = 0;
	for (var dx = -25; dx <= 25; dx ++) {
		var i = hh * stride + 4 *(dx + hw);
		noise[i + 0] = seed[seedi] * 255;
		noise[i + 1] = seed[seedi] * 255;
		noise[i + 2] = seed[seedi] * 255;
		noise[i + 3] = seed[seedi] * 255;
		seedi++
	}

	return noise;
}

function startLife(scale, init) {

	console.log(init)
	var container = document.getElementById( 'container' );
	var context;

	// init
	context = new GLOW.Context();
	container.appendChild( context.domElement );


	var w = Math.round(container.clientWidth / scale);
	var h = Math.round(container.clientHeight / scale);

	// random world Texture generation
	var noise = []
	var threshold = Math.random() * 0.6 + 0.3;
	for( var i = 0; i < w * h * 4; i ++) {
		noise[i] = Math.random() > threshold ? 0 : 255;
	}

	if (init == 1)
		noise = genSeedTexture0(w, h);
	if (init == 2)
		noise = genSeedTexture1(w, h);

	var worldFBO = new GLOW.FBO( { 
		width: w,
		height: h,
		minFilter: GL.NEAREST,
		magFilter: GL.NEAREST,
	    depth: false,
	    data: new Uint8Array( noise )
	});

	var worldFBOSwap = new GLOW.FBO( { 
		width: w,
		height: h,
		minFilter: GL.NEAREST,
		magFilter: GL.NEAREST,
	    depth: false,
	    data: new Uint8Array( noise )
	});

	var renderShader = {
		data: {
			vertices: GLOW.Geometry.Plane.vertices(),
			uvs: GLOW.Geometry.Plane.uvs(),
			world: worldFBO,
		},
		indices: GLOW.Geometry.Plane.indices(),
		vertexShader: [
			"attribute 	vec3 	vertices;",
			"attribute  vec2	uvs;",
			"varying 	vec2	uv;",
			"void main(void)",
			"{",
				"uv = uvs;",
				"gl_Position = vec4(vertices.x, vertices.y, 1.0, 1.0 );",
			"}"
		].join( "\n" ),
		fragmentShader: [
			"#ifdef GL_ES",
				"precision highp float;",
			"#endif",
			"varying vec2  		uv;",
			"uniform sampler2D 	world;",
			"void main()",
			"{",
				"vec3 color = vec3(0.0,1.0,1.0);",
				"gl_FragColor = vec4(texture2D(world, uv).x * color, 1.0);",
			"}"
		].join( "\n" )
	}

	var copyShader = {
		data: {
			vertices: GLOW.Geometry.Plane.vertices(),
			uvs: GLOW.Geometry.Plane.uvs(),
			world: worldFBOSwap,
		},
		indices: GLOW.Geometry.Plane.indices(),
		vertexShader: [
			"attribute 	vec3 	vertices;",
			"attribute  vec2	uvs;",
			"varying 	vec2	uv;",
			"void main(void)",
			"{",
				"uv = uvs;",
				"gl_Position = vec4(vertices.x, vertices.y, 1.0, 1.0 );",
			"}"
		].join( "\n" ),
		fragmentShader: [
			"#ifdef GL_ES",
				"precision highp float;",
			"#endif",
			"varying vec2  		uv;",
			"uniform sampler2D 	world;",

			"void main()",
			"{",
				"gl_FragColor = texture2D(world, uv);",
			"}"
		].join( "\n" )
	}

	var simulationShader = {
		data: {
			vertices: GLOW.Geometry.Plane.vertices(),
			uvs: GLOW.Geometry.Plane.uvs(),
			world: worldFBO,
			pixelsize: new GLOW.Vector2(1 / w , 1/ h )
		},
		indices: GLOW.Geometry.Plane.indices(),
		vertexShader: [
			"attribute 	vec3 	vertices;",
			"attribute  vec2	uvs;",
			"varying 	vec2	uv;",
			"void main(void)",
			"{",
				"uv = uvs;",
				"gl_Position = vec4(vertices.x, vertices.y, 1.0, 1.0 );",
			"}"
		].join( "\n" ),
		fragmentShader: [
			"#ifdef GL_ES",
				"precision highp float;",
			"#endif",
			"varying vec2  		uv;",
			"uniform sampler2D 	world;",
			"uniform vec2		pixelsize;",

			"void main()",
			"{",
				//count neighbors
				"float neighbors = 0.0;",
				"for( int i = -1; i <2; i ++ ){",
					"for( int j = -1; j <2; j ++ ){",
						"neighbors += texture2D(world, uv + vec2(pixelsize.x * float(i), pixelsize.y * float(j))).r;",
					"}",
				"}",
				// RULES OF LIFE HERE
				"float me = texture2D(world, uv).x;",
				"float result ;",
				// if neighbors == 3, always live
				"if (neighbors > 2.5 && neighbors < 3.5 ) ",
					"result = 1.0;",
				// if 4 neigbors, same
				"else if (neighbors > 3.5 && neighbors < 4.5) ",
					"result = me;",
				"else",
					"result = 0.0;",
				"gl_FragColor = vec4(vec3(result), 1.0);",
			"}"
		].join( "\n" )
	}

	renderer = new GLOW.Shader( renderShader );
	simulator = new GLOW.Shader( simulationShader );
	copier = new GLOW.Shader( copyShader );

	setInterval( render, 100 );

	var frame = 0;
	function render() {

		context.cache.clear();
		// Life Iteration : FBO -> FBO SWAP
		worldFBOSwap.bind();
		context.cache.clear();
		simulator.draw();
		worldFBOSwap.unbind();

		// // COPY FBO SWAP to FBO
		worldFBO.bind();
		context.cache.clear();
		copier.draw();
		worldFBO.unbind();

		// Render FBO to screen
		renderer.draw();
		frame++;
		$("#iter").text(frame)
	}
}