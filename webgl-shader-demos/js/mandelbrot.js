var container;
var context, mandel, julia, t = 0;

// init
context = new GLOW.Context();
document.getElementById( 'container' ).appendChild( context.domElement );

var mandelShader = {
	data: {
		vertices: GLOW.Geometry.Plane.vertices(),
		uvs: GLOW.Geometry.Plane.uvs(),
		zoom: new GLOW.Vector2( 3.0, 3.0 * window.innerHeight / window.innerWidth ),
		center: new GLOW.Vector2( -2, -1 ),
		mouse: new GLOW.Vector2(0, 0)
	},
	indices: GLOW.Geometry.Plane.indices(),
	
	vertexShader: [
		"attribute 	vec3 	vertices;",
		"attribute  vec2	uvs;",
		"varying 	vec2	uv;",
		"void main(void)",
		"{",
			"uv = uvs;",
			"gl_Position = vec4( vertices.x, vertices.y, 1.0, 1.0 );",
		"}"
	].join( "\n" ),	
	fragmentShader: [
		"#ifdef GL_ES",
			"precision highp float;",
		"#endif",
		"varying vec2  uv;",
		"uniform vec2 	zoom;",
		"uniform vec2  	center;",

		"void main()",
		"{",

		    "float   real  = uv.x * zoom.x + center.x;",
		    "float   imag  = uv.y * zoom.y + center.y;",
		    "float   cReal = real;",
		    "float   cImag = imag;",
		    "float r2 = 0.0;",
			"float tempreal;",
			"int iter;",
		    "for( int i = 0; i < 50; i++ )",
			"{",
				"if( r2 >= 4.) break;",
				"iter = i;",
	        	"tempreal = real;",
	        	"real = (tempreal * tempreal) - (imag * imag) + cReal;",
	        	"imag = 2.0 * tempreal * imag + cImag;",
	        	"r2   = (real * real) + (imag * imag);",
		    "}",
		    "vec3 color;",
		    "if( r2 < 4.0 )",
		        "color = vec3(1.0);",
		    "else",
		        "color = mix( vec3(0.0), vec3(0.0, 0.0, 1.0), fract( float( iter ) / 50.));",
		    "gl_FragColor = vec4(color, 1.0);",
		"}"
	].join( "\n" )
}

var FBO = new GLOW.FBO( { 
	depth : true,
	stencil : false
});

var juliaShader = {
	data: {
		vertices: GLOW.Geometry.Plane.vertices(),
		uvs: GLOW.Geometry.Plane.uvs(),
		mouse: new GLOW.Vector2(0, 0),
		fboTexture: FBO,
		aspectratio: new GLOW.Float(window.innerHeight/window.innerWidth),
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
		"uniform vec2   	mouse;",
		"uniform sampler2D 	fboTexture;",
		"uniform float 		aspectratio;",

		"void main()",
		"{",
			"vec2 	window 		= vec2(3.0,3.0 * aspectratio);",
			"vec2 	bottomleft 	= vec2(-1.5, -1.5 * aspectratio);",
			"float	real 		= uv.x * window.x + bottomleft.x;",
			"float	imag 		= uv.y * window.y + bottomleft.y;",
			"float	tempreal 	= 0.0;",
			"float	cReal 		= mouse.x;",
		    "float	cImag 		= mouse.y;",

		    "float r2 = 0.0;",
		    "int iter;",
 			"for( int i = 0; i < 100; i++ )",
			"{",
				"if( r2 >=4.) break;",
				"iter = i;",
	        	"tempreal = real;",
	        	"real = (tempreal * tempreal) - (imag * imag) + cReal;",
	        	"imag = 2.0 * tempreal * imag + cImag;",
	        	"r2   = (real * real) + (imag * imag);",
		    "}",
		    "float julia;",
		    "if( r2 < 4.0 )",
		        "julia = 1.0;",
		    "else",
		        "julia = float( iter ) / 100.0;",

		    "float mandel = texture2D(fboTexture, uv).b;",

		    "vec3 m = vec3(1.0 - mandel);",

			"gl_FragColor = vec4(m.r + julia, m.g - julia, m.b - julia, 1.0);",

		"}"
	].join( "\n" )
}

mandel = new GLOW.Shader( mandelShader );
julia = new GLOW.Shader( juliaShader );

setInterval( render, 1000 / 30 );

function render() {
	
	FBO.bind();
	context.cache.clear();
	context.clear();
	mandel.draw();
	FBO.unbind();

	context.clear();
	context.cache.clear();
	julia.draw();

}

// mouse controls
var dragging = false;
var mousestart = new GLOW.Vector2();
var centerstart = new GLOW.Vector2();

$("#container").mousedown(function(event) {
	mousestart.set(-(event.pageX /window.innerWidth), event.pageY / window.innerHeight );
	centerstart.copy(mandel.center);
	dragging = true;
});

$("#container").mouseup(function() {
	dragging = false;
});

$("#container").mousemove(function(event) {
	if(dragging) {
		var mouse = new GLOW.Vector2(-(event.pageX /window.innerWidth), (event.pageY / window.innerHeight));
		mouse.sub(mouse,mousestart);
		mouse.multiplySelf(mandel.zoom);
		mandel.center.add(centerstart, mouse);
	} else {
		var pos = new GLOW.Vector2(event.pageX /window.innerWidth, 1 - event.pageY / window.innerHeight);
		pos.multiplySelf(mandel.zoom).addSelf(mandel.center)
		$("#coords").html( pos.value[0].toPrecision(5)+ " + " + pos.value[1].toPrecision(5) + "	<i> i </i>");
		julia.mouse.copy(pos);
	}
});

$( "#container" ).mousewheel(function(event) {
	var z = mandel.zoom.clone();
	var crop = event.deltaY > 0 ? 0.05 : -0.05;
	mandel.center.addSelf(z.multiplyScalar(crop/2));
	mandel.zoom.multiplyScalar(1 - crop);
});