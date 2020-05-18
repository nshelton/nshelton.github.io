
			// create a context and set white background
		
			var context = new GLOW.Context();
			context.setupClear( { red: 0.18, green: 0.82, blue: 1 } );


			// attach the context's DOM element
		
			var container = document.getElementById( "container" );
			container.appendChild( context.domElement );



			var noise = []
			for( var i = 0; i < container.innerWidth * container.innerHeight * 3; i ++) {
				noise[i] = Math.random();
			}

			var FBO1 = new GLOW.FBO( { width: container.innerWidth,
		                               height: container.innerHeight,
		                               type: GL.FLOAT,
		                               magFilter: GL.NEAREST,
		                               minFilter: GL.NEAREST,
		                               depth: false,
		                               data: new Float32Array( noise ) } );
			// setup the post effect shader object
			

			var postEffectShader = {

				// create vertex shader
				
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

				// create fragment shader
				fragmentShader: [ 	
					"#ifdef GL_ES",
						"precision highp float;",
					"#endif",		

					"uniform 	sampler2D 	fboTexture;",
					"uniform	float		time;",
					"varying 	vec2		uv;",

					"void main( void )",
					"{",
						"gl_FragColor = texture2D( fboTexture, vec2( uv.x , uv.y)) + 0.01 ;",
					"}"

				].join( "\n" ),

				// create uniforms and attributes
				// note that we use the FBO as texture

				data: {

					fboTexture: FBO1,
					time: new GLOW.Float(),
					vertices: GLOW.Geometry.Plane.vertices(),
					uvs: GLOW.Geometry.Plane.uvs()
				},

				// create primitives

				indices: GLOW.Geometry.Plane.indices(),
				primitives: GLOW.Geometry.Plane.primitives()
			};
			
			
			// then create a shader using the object created above
			
			var postEffect = new GLOW.Shader( postEffectShader );
			
			
			// Update the default camera position
			
			// GLOW.defaultCamera.localMatrix.setPosition( 0, 0, 1500 );
			// GLOW.defaultCamera.update();
			
			
			// Render (using setInterval as WebGL Inspector have problem with requestAnimationFrame)
 
			setInterval( render, 1000 / 60 );

			function render() {

				// update rotation on cube and the time value for the post shader
				cube.transform.addRotation( 0.01, 0.005, 0.0025 );
				// postEffect.time.add( 0.01 );

				// clear the context's cache
				context.cache.clear();

				// bind the FBO so we render to it
				FBO.bind();

				// clear (the FBO)
				context.clear();

				// draw cube
				context.cache.clear();
				cube.draw();

				// unbind the FBO se we render to the screen
				
				FBO.unbind();
				
				// then draw the FBO.texture using the post effect shader
				
				postEffect.draw();
			}