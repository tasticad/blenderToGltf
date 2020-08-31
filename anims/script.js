(function() {

	let scene,  
		renderer,
		camera,
		model,								// Our character
		mixer,								// THREE.js animations mixer
		root,
		idle,								// Idle, the default state our character returns to
		rght,								// Idle to the right
		left,								// Idle to the left
		trnR,
		trnL,
		look,								// References the Look animClip
		mAvi_mtl1,
		clock = new THREE.Clock(),			// Used for anims, which run to a clock instead of frame rate 
		currentlyAnimating = false,			// Check if anim other than idle is in progress
		loaderAnim = document.getElementById('js-loader')

	init()

	function init() {

		const canvas = document.querySelector('#c')
		const backgroundColor = 0xf1f1f1
		const MODEL_PATH = 'models/mAvi0.glb'

		// Scene init
		scene = new THREE.Scene()
		scene.background = new THREE.Color(backgroundColor)
		scene.fog = new THREE.Fog(backgroundColor, 60, 100)

		// Renderer init
		renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
		renderer.outputEncoding = THREE.sRGBEncoding
		renderer.physicallyCorrectLights = true
		renderer.shadowMap.enabled = true
		renderer.setPixelRatio(window.devicePixelRatio)
		document.body.appendChild(renderer.domElement)

		// Camera
		camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 1000 )
		camera.position.z = 3
		camera.position.y = 1.33
		camera.rotation.x = -0.05 * Math.PI

		// Texture
		let puffer_cl1 = new THREE.TextureLoader().load('images/puffer1/puffer_Color1.jpg')
			puffer_cl1.flipY = false
		let puffer_cl2 = new THREE.TextureLoader().load('images/puffer1/puffer_Color2.jpg')
			puffer_cl2.flipY = false
		let puffer_rgh = new THREE.TextureLoader().load('images/puffer1/puffer_Roughness.jpg')
			puffer_rgh.flipY = false
		let puffer_nrm = new THREE.TextureLoader().load('images/puffer1/puffer_Normal.jpg')
			puffer_nrm.flipY = false
		let puffer_amb = new THREE.TextureLoader().load('images/puffer1/puffer_AO.jpg')
			puffer_amb.flipY = false
		let puffer_mtl = new THREE.TextureLoader().load('images/puffer1/puffer_Metallic.jpg')
			puffer_mtl.flipY = false
		let jeans_txt1 = new THREE.TextureLoader().load('images/jeans_diff1.jpg')
			jeans_txt1.flipY = false

		// Materials
		let mAvi_mtl1 = new THREE.MeshStandardMaterial({ map: puffer_cl1, /*roughnessMap: puffer_rgh, normalMap: puffer_nrm,*/ metalnessMap: puffer_mtl, skinning: true })
		const mAvi_mtl2 = new THREE.MeshStandardMaterial({ map: jeans_txt1, roughness: 0.9, metalness: 0, skinning: true })
		const mAvi_mtl3 = new THREE.MeshStandardMaterial({ color: 'whitesmoke', roughness: 0.9, metalness: 0, skinning: true })
		const mAvi_mtl4 = new THREE.MeshStandardMaterial({ color: 0x383838, roughness: 0.5, metalness: 0, skinning: true })
		const mAvi_mtls = [ mAvi_mtl1, mAvi_mtl2, mAvi_mtl3, mAvi_mtl4 ]
		mAvi_mtl4.side = THREE.DoubleSide // Hairs

		// glTF loader
		let loader = new THREE.GLTFLoader()

		loader.load(
			MODEL_PATH,
			function(gltf) {
				let model = gltf.scene
				let clips = gltf.animations

				root = model.getObjectByName('BoneRoot')

				model.traverse(o => {

					// if (o.isBone) {
					// 	console.log(o.name)
					// }

					if ( o.isMesh && o.geometry ) {
						o.castShadow = true 
						o.receiveShadow = true

						let geo = o.geometry
						geo.addGroup(0, Infinity, 0) // puffer
						geo.addGroup(132966, Infinity, 1) // pants
						geo.addGroup(139743, Infinity, 2) // shoes
						geo.addGroup(162087, Infinity, 3) // char
						o.material = mAvi_mtls
					}

				})
				
				scene.add(model) // adds model to the scene

				loaderAnim.remove() // removes loader once model is loaded

				mixer = new THREE.AnimationMixer(model)

				let idleAnim = THREE.AnimationClip.findByName(clips, 'idle')
				let lookAnim = THREE.AnimationClip.findByName(clips, 'look')
				let turnRght = THREE.AnimationClip.findByName(clips, 'turn1')
				let turnLeft = THREE.AnimationClip.findByName(clips, 'turn2')
				let turnBack = THREE.AnimationClip.findByName(clips, 'turn3')

				let idleRght = idleAnim.clone()
				idleRght.name = 'idler'
				let idleLeft = idleAnim.clone()
				idleRght.name = 'idlel'

				if (THREE.AnimationClip.name = 'idler') {
					idleRght.tracks.splice(1, 1)
					root.rotation.z = -.5 * Math.PI	
				}
				if (THREE.AnimationClip.name = 'idlel') {
					idleLeft.tracks.splice(1, 1)
					root.rotation.z = .5 * Math.PI	
				}
							

				// idleRght.traverse(o => {
				// 	if (o.isBone && o.name === 'BoneRoot') { 
				// 		o.rotation.z = -.5 * Math.PI
				// 	}
				// })

				idle = mixer.clipAction(idleAnim)
				rght = mixer.clipAction(idleRght)
				left = mixer.clipAction(idleLeft)
				trnR = mixer.clipAction(turnRght)
				trnL = mixer.clipAction(turnLeft)
				trnB = mixer.clipAction(turnBack)
				look = mixer.clipAction(lookAnim)

				idle.play()

			},
			undefined, // We don't need this function
			function(error) {
				console.error(error)
			}
		)

		// Hemisphere light
		let hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 2.7)
		hemiLight.position.set(0, 50, 0)
		scene.add(hemiLight)

		// Directional light
		let d = 1.33 // distance
		let frontLight = new THREE.DirectionalLight(0xffffff, .5)
		frontLight.position.set(-5, 8, 5)
		frontLight.castShadow = true
		frontLight.shadow.mapSize = new THREE.Vector2(1024, 1024) // 1024, 2048, 4096
		frontLight.shadow.camera.near = 0.1
		frontLight.shadow.camera.far = 100
		frontLight.shadow.camera.left = d * -1
		frontLight.shadow.camera.right = d
		frontLight.shadow.camera.top = d
		frontLight.shadow.camera.bottom = d * -1
		scene.add(frontLight)

		let backLight = new THREE.DirectionalLight(0xffffff, .3)
		backLight.position.set(6, 2, -3)
		backLight.castShadow = true
		backLight.shadow.mapSize = new THREE.Vector2(1024, 1024)
		scene.add(backLight)

		// Floor geo & mat
		let floorGeometry = new THREE.PlaneGeometry(100, 100, 1, 1)
		let floorMaterial = new THREE.MeshPhongMaterial({ color: 0xeeeeee, shininess: 0	})
		let floor = new THREE.Mesh(floorGeometry, floorMaterial)
		floor.rotation.x = -0.5 * Math.PI // 1 PI rad = 180°
		floor.receiveShadow = true
		floor.position.y = 0
		scene.add(floor)
		
		// Background circle
		let circleGeometry = new THREE.CircleGeometry(1.2, 100)
		let material = new THREE.MeshBasicMaterial({ color: 0xedfff7 }) // 0x9bffaf 0xf5636c
		let circle = new THREE.Mesh(circleGeometry, material)
		// circleGeometry.setDrawRange( 0, 50 )
		circle.position.z = -1.5
		circle.position.y = 1.2
		scene.add(circle)
	}

	function update() {
		//  update the mixer to run continuously through the model animation
		if (mixer) {
			mixer.update(clock.getDelta())
		}
		// check + refresh window size
		if (resizeRendererToDisplaySize(renderer)) {
			const canvas = renderer.domElement
			camera.aspect = canvas.clientWidth / canvas.clientHeight
			camera.updateProjectionMatrix()
		}
		renderer.render(scene, camera)
		requestAnimationFrame(update)
	}
	update()

	function resizeRendererToDisplaySize(renderer) {
		const canvas = renderer.domElement
		let width = window.innerWidth
		let height = window.innerHeight
		let canvasPixelWidth = canvas.width / window.devicePixelRatio
		let canvasPixelHeight = canvas.height / window.devicePixelRatio

		const needResize =
			canvasPixelWidth !== width || canvasPixelHeight !== height
		if (needResize) {
			renderer.setSize(width, height, false)
		}
		return needResize
	}

	const btnSlct = document.getElementById('select')
	btnSlct.addEventListener('click', lookAndPoint)
	btnSlct.addEventListener('touchend', lookAndPoint)

	function lookAndPoint() {
		if (!currentlyAnimating) {
			currentlyAnimating = true
			playModifierAnimation(idle, 0.25, look, 0.5, idle) // Anim' blend in & blend out
		}
	}

	const btnTrnR = document.getElementById('right')
	btnTrnR.addEventListener('click', playTurnRight)
	btnTrnR.addEventListener('touchend', playTurnRight)

	function playTurnRight() {
		if (!currentlyAnimating) {
			currentlyAnimating = true
			playModifierAnimation(idle, 0.165, trnR, 0.233, rght) // Anim' blend in & blend out	
			// setTimeout(function() {
			// 	root.rotation.z = -.5 * Math.PI
			// }, trnR._clip.duration * (1000 - 233))		
		}
	}

	const btnTrnL = document.getElementById('left')
	btnTrnL.addEventListener('click', playTurnLeft)
	btnTrnL.addEventListener('touchend', playTurnLeft)

	function playTurnLeft() {
		if (!currentlyAnimating) {
			currentlyAnimating = true
			playModifierAnimation(idle, 0.165, trnL, 0.233, left) // Anim' blend in & blend out
		}
	}

	function playModifierAnimation(from, fSpeed, to, tSpeed, end) {
		to.setLoop(THREE.LoopOnce)
		to.reset()
		to.play()
		from.crossFadeTo(to, fSpeed, true)
		setTimeout(function() {
			end.enabled = true
			to.crossFadeTo(end, tSpeed, true)
			currentlyAnimating = false
			end.play()
		}, to._clip.duration * 1000 - ((tSpeed + fSpeed) * 1000))
	}

})()