document.addEventListener('DOMContentLoaded', function() {
    // Handle model preview clicks
    const modelPreviews = document.querySelectorAll('.model-preview');
    modelPreviews.forEach(preview => {
        preview.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent event bubbling to parent
            const modelCard = this.closest('.model-card');
            const modelType = modelCard.getAttribute('data-model');
            openModelViewer(modelType);
        });
    });

    // Close model viewer when clicking the close button or outside the content
    const modelViewer = document.getElementById('modelViewer');
    const closeBtn = document.querySelector('.close-btn');
    
    closeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        closeModelViewer();
    });
    
    modelViewer.addEventListener('click', function(e) {
        if (e.target === modelViewer) {
            closeModelViewer();
        }
    });
    
    // Handle subscription form submission
    const subscribeForm = document.getElementById('subscribeForm');
    subscribeForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = this.querySelector('input[type="email"]').value;
        // Here you would typically send this to your server
        alert(`Thank you for subscribing with ${email}! We'll be in touch soon.`);
        this.reset();
    });
    
    // Initialize carousel with auto-rotation
    const myCarousel = new bootstrap.Carousel(document.getElementById('modelCarousel'), {
        interval: 5000,
        touch: true
    });
    
    // Pause carousel on hover for better UX
    const carousel = document.getElementById('modelCarousel');
    carousel.addEventListener('mouseenter', function() {
        const carouselInstance = bootstrap.Carousel.getInstance(carousel);
        if (carouselInstance) {
            carouselInstance.pause();
        }
    });
    
    carousel.addEventListener('mouseleave', function() {
        const carouselInstance = bootstrap.Carousel.getInstance(carousel);
        if (carouselInstance) {
            carouselInstance.cycle();
        }
    });
});

function closeModelViewer() {
    const viewer = document.getElementById('modelViewer');
    viewer.classList.remove('active');
    // Clean up Three.js scene when closing
    if (window.currentScene) {
        const container = document.getElementById('viewerContainer');
        container.innerHTML = ''; // Clear the container
        window.currentScene = null;
    }
}

function openModelViewer(modelType) {
    const viewer = document.getElementById('modelViewer');
    const container = document.getElementById('viewerContainer');
    
    // Show the viewer
    viewer.classList.add('active');
    
    // Initialize Three.js scene for the selected model
    initModelViewer(container, modelType);
}

function initModelViewer(container, modelType) {
    // Clear previous scene if it exists
    container.innerHTML = '';
    
    // Add loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-indicator';
    loadingDiv.textContent = 'Loading 3D model...';
    container.appendChild(loadingDiv);
    
    // Create a new scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0xf8f9fa, 1);
    container.appendChild(renderer.domElement);
    
    // Add orbit controls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);
    
    // Position camera
    camera.position.z = 5;
    
    // Create a group to hold the model
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);
    
    // Load 3D model based on type
    const loadModel = () => {
        // First, try to load the GLTF model
        try {
            const loader = new GLTFLoader();
            const modelPath = `3d_models/${modelType}.glb`;
            
            loader.load(
                // Resource URL
                modelPath,
                // onLoad callback
                (gltf) => {
                    modelGroup.add(gltf.scene);
                    
                    // Center the model
                    const box = new THREE.Box3().setFromObject(modelGroup);
                    const center = box.getCenter(new THREE.Vector3());
                    modelGroup.position.x = -center.x;
                    modelGroup.position.y = -center.y;
                    modelGroup.position.z = -center.z;
                    
                    // Adjust camera to fit the model
                    const size = box.getSize(new THREE.Vector3());
                    const maxDim = Math.max(size.x, size.y, size.z);
                    camera.position.z = maxDim * 1.5;
                    
                    loadingDiv.remove();
                },
                // onProgress callback
                (xhr) => {
                    const percentLoaded = (xhr.loaded / (xhr.total || 1)) * 100;
                    loadingDiv.textContent = `Loading 3D model... ${Math.round(percentLoaded)}%`;
                },
                // onError callback
                (error) => {
                    console.error('Error loading model:', error);
                    loadingDiv.textContent = 'Error loading 3D model. Using placeholder.';
                    
                    // Fallback to placeholder geometry if model fails to load
                    setTimeout(() => loadFallbackModel(), 1500);
                }
            );
        } catch (error) {
            console.error('Error initializing GLTF loader:', error);
            loadingDiv.textContent = 'Error initializing 3D viewer.';
            loadFallbackModel();
        }
    };
    
    // Fallback to simple geometry if GLTF loading fails
    const loadFallbackModel = () => {
        loadingDiv.textContent = 'Loading fallback model...';
        
        let geometry;
        switch(modelType) {
            case 'robot':
                geometry = new THREE.TorusKnotGeometry(1, 0.3, 100, 16);
                break;
            case 'car':
                geometry = new THREE.ConeGeometry(1, 2, 4);
                break;
            case 'building':
            default:
                geometry = new THREE.BoxGeometry(1, 1, 1);
                break;
        }
        
        const material = new THREE.MeshPhongMaterial({
            color: 0x3498db,
            shininess: 100,
            wireframe: false
        });
        
        const model = new THREE.Mesh(geometry, material);
        modelGroup.add(model);
        loadingDiv.remove();
    };
    
    // Start loading the model
    loadModel();
    
    // Handle window resize
    function onWindowResize() {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }
    
    window.addEventListener('resize', onWindowResize, false);
    
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        
        // Rotate the model group
        if (modelGroup) {
            modelGroup.rotation.x += 0.005;
            modelGroup.rotation.y += 0.01;
        }
        
        controls.update();
        renderer.render(scene, camera);
    }
    
    // Handle window resize
    function onWindowResize() {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }
    
    window.addEventListener('resize', onWindowResize, false);
    
    animate();
    
    // Store the current scene for cleanup
    window.currentScene = scene;
}
