/**
 * Globe Gallery - 3D Interactive Gallery using Three.js
 * A simplified implementation for better compatibility and performance
 */

const GlobeGallery = {
    // DOM Elements
    container: null,
    
    // Gallery items data
    galleryItems: [],
    
    // Three.js variables
    scene: null,
    camera: null,
    renderer: null,
    sphere: null,
    innerSphere: null,
    bgSphere: null,
    raycaster: null,
    mouse: null,
    INTERSECTED: null,
    controls: null,
    
    // Settings
    sphereRadius: 2,
    isInitialized: false,
    darkMode: false,
    rotationSpeed: 0.001,
    
    /**
     * Initialize the gallery
     * @param {string} containerId - ID of the container element
     */
    init: function(containerId) {
        try {
            // Get container
            this.container = document.getElementById(containerId);
            if (!this.container) {
                console.error(`Container with ID "${containerId}" not found`);
                return;
            }
            
            // Set dark mode
            this.darkMode = document.body.classList.contains('dark-theme');
            
            // Initialize Three.js objects
            this.raycaster = new THREE.Raycaster();
            this.mouse = new THREE.Vector2();
            
            // Load gallery items
            this.loadGalleryItems();
            
            // Initialize 3D scene
            this.initScene();
            
            // Add event listeners
            this.addEventListeners();
            
            // Start animation loop
            this.animate();
            
            this.isInitialized = true;
            console.log('Globe gallery initialized successfully');
        } catch (error) {
            console.error('Error initializing globe gallery:', error);
        }
    },
    
    /**
     * Load gallery items from the DOM
     */
    loadGalleryItems: function() {
        try {
            const items = document.querySelectorAll('.gallery-item');
            items.forEach(item => {
                const img = item.querySelector('img');
                if (!img) return;
                
                const category = item.querySelector('.gallery-category')?.textContent || '';
                const title = item.querySelector('.gallery-overlay span')?.textContent || img.alt;
                const dataCategory = item.getAttribute('data-category') || '';
                
                this.galleryItems.push({
                    element: item,
                    imgSrc: img.src,
                    category: category,
                    title: title,
                    dataCategory: dataCategory,
                    mesh: null,
                    visible: true
                });
            });
            
            console.log(`Loaded ${this.galleryItems.length} gallery items`);
        } catch (error) {
            console.error('Error loading gallery items:', error);
        }
    },
    
    /**
     * Initialize the 3D scene
     */
    initScene: function() {
        try {
            // Create scene
            this.scene = new THREE.Scene();
            
            // Create camera
            const aspect = this.container.clientWidth / this.container.clientHeight;
            this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
            this.camera.position.z = 5;
            
            // Create renderer
            this.renderer = new THREE.WebGLRenderer({ 
                antialias: true,
                alpha: true 
            });
            this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.container.appendChild(this.renderer.domElement);
            
            // Add ambient light
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
            this.scene.add(ambientLight);
            
            // Add directional light
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(5, 8, 5);
            this.scene.add(directionalLight);
            
            // Add point lights
            const accentColor = this.darkMode ? 0xDDA15E : 0x2C6E49;
            
            const pointLight1 = new THREE.PointLight(accentColor, 1.2, 15);
            pointLight1.position.set(5, 2, 3);
            this.scene.add(pointLight1);
            
            const pointLight2 = new THREE.PointLight(accentColor, 1.2, 15);
            pointLight2.position.set(-5, -2, 3);
            this.scene.add(pointLight2);
            
            // Create background sphere (larger than the main sphere)
            const bgSphereGeometry = new THREE.SphereGeometry(this.sphereRadius * 8, 32, 32);
            const bgSphereMaterial = new THREE.MeshBasicMaterial({
                color: this.darkMode ? 0x111111 : 0xEEEEEE,
                transparent: true,
                opacity: 0.7,
                wireframe: false,
                side: THREE.BackSide
            });
            this.bgSphere = new THREE.Mesh(bgSphereGeometry, bgSphereMaterial);
            this.scene.add(this.bgSphere);
            
            // Create sphere geometry
            const sphereGeometry = new THREE.SphereGeometry(this.sphereRadius, 64, 64);
            const sphereMaterial = new THREE.MeshPhongMaterial({
                color: this.darkMode ? 0x1A1A1A : 0xF5F5F5,
                transparent: true,
                opacity: 0.15,
                wireframe: true,
                shininess: 80,
                specular: this.darkMode ? 0x333333 : 0xCCCCCC
            });
            this.sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
            this.scene.add(this.sphere);
            
            // Add inner sphere
            const innerSphereGeometry = new THREE.SphereGeometry(this.sphereRadius * 0.98, 32, 32);
            const innerSphereMaterial = new THREE.MeshBasicMaterial({
                color: this.darkMode ? 0x111111 : 0xF0F0F0,
                transparent: true,
                opacity: 0.05,
                wireframe: false,
                side: THREE.BackSide
            });
            this.innerSphere = new THREE.Mesh(innerSphereGeometry, innerSphereMaterial);
            this.scene.add(this.innerSphere);
            
            // Position gallery items on sphere
            this.positionGalleryItems();
            
            // Add orbit controls if available
            if (typeof THREE.OrbitControls !== 'undefined') {
                this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
                this.controls.enableDamping = true;
                this.controls.dampingFactor = 0.05;
                this.controls.rotateSpeed = 0.5;
                this.controls.enableZoom = false;
                this.controls.enablePan = false;
                this.controls.autoRotate = true;
                this.controls.autoRotateSpeed = 0.5;
            } else {
                console.warn('OrbitControls not available, using basic rotation');
            }
        } catch (error) {
            console.error('Error initializing 3D scene:', error);
        }
    },
    
    /**
     * Position gallery items on sphere surface
     */
    positionGalleryItems: function() {
        try {
            const itemCount = this.galleryItems.length;
            if (itemCount === 0) return;
            
            const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle
            const textureLoader = new THREE.TextureLoader();
            
            this.galleryItems.forEach((item, i) => {
                try {
                    // Calculate position on sphere using fibonacci distribution
                    const y = 1 - (i / (itemCount - 1)) * 2;
                    const radius = Math.sqrt(1 - y * y);
                    const theta = phi * i;
                    
                    const x = Math.cos(theta) * radius;
                    const z = Math.sin(theta) * radius;
                    const position = new THREE.Vector3(x, y, z).multiplyScalar(this.sphereRadius);
                    
                    // Create plane geometry that preserves the original image aspect ratio
                    const img = new Image();
                    img.src = item.imgSrc;
                    
                    // Default dimensions in case image isn't loaded yet
                    let width = 0.8;
                    let height = 0.5;
                    
                    // If image is already loaded, use its aspect ratio
                    if (img.complete) {
                        const aspectRatio = img.width / img.height;
                        height = width / aspectRatio;
                    } else {
                        // Set up event listener to adjust after loading
                        img.onload = () => {
                            if (item.mesh) {
                                const aspectRatio = img.width / img.height;
                                const newHeight = width / aspectRatio;
                                
                                // Create new geometry with correct aspect ratio
                                const newGeometry = new THREE.PlaneGeometry(width, newHeight, 1, 1);
                                
                                // Update the mesh geometry
                                item.mesh.geometry.dispose();
                                item.mesh.geometry = newGeometry;
                            }
                        };
                    }
                    
                    const planeGeometry = new THREE.PlaneGeometry(width, height, 1, 1);
                    
                    // Load texture asynchronously
                    textureLoader.load(
                        item.imgSrc,
                        (texture) => {
                            texture.minFilter = THREE.LinearFilter;
                            texture.magFilter = THREE.LinearFilter;
                            
                            // Create material with loaded texture that preserves original image appearance
                            const material = new THREE.MeshBasicMaterial({
                                map: texture,
                                side: THREE.DoubleSide,
                                transparent: false,
                                opacity: 1.0
                            });
                            
                            // Create mesh for gallery item
                            const mesh = new THREE.Mesh(planeGeometry, material);
                            mesh.position.copy(position);
                            
                            // Make mesh face outward from center of sphere
                            mesh.lookAt(0, 0, 0);
                            mesh.rotateY(Math.PI); // Flip to face outward
                            
                            // Add slight random rotation for more natural look
                            mesh.rotation.z += (Math.random() - 0.5) * 0.2;
                            
                            // Add slight random scale variation
                            const scale = 0.9 + Math.random() * 0.2;
                            mesh.scale.set(scale, scale, scale);
                            
                            // Store reference to mesh
                            item.mesh = mesh;
                            this.scene.add(mesh);
                        },
                        undefined, // onProgress callback not needed
                        (error) => {
                            console.error('Error loading texture:', error);
                        }
                    );
                } catch (error) {
                    console.error('Error positioning gallery item:', error);
                }
            });
        } catch (error) {
            console.error('Error in positionGalleryItems:', error);
        }
    },
    
    /**
     * Add event listeners
     */
    addEventListeners: function() {
        try {
            // Mouse move event for hover effects
            this.container.addEventListener('mousemove', this.onMouseMove.bind(this));
            
            // Click event for item selection
            this.container.addEventListener('click', this.onMouseClick.bind(this));
            
            // Window resize event
            window.addEventListener('resize', this.onWindowResize.bind(this));
            
            // Theme change event
            document.querySelector('.theme-toggle')?.addEventListener('click', () => {
                // Wait for theme change to complete
                setTimeout(() => {
                    this.darkMode = document.body.classList.contains('dark-theme');
                    this.updateThemeColors();
                }, 100);
            });
        } catch (error) {
            console.error('Error adding event listeners:', error);
        }
    },
    
    /**
     * Handle mouse move event
     */
    onMouseMove: function(event) {
        try {
            // Calculate mouse position in normalized device coordinates (-1 to +1)
            const rect = this.container.getBoundingClientRect();
            this.mouse.x = ((event.clientX - rect.left) / this.container.clientWidth) * 2 - 1;
            this.mouse.y = -((event.clientY - rect.top) / this.container.clientHeight) * 2 + 1;
        } catch (error) {
            console.error('Error in onMouseMove:', error);
        }
    },
    
    /**
     * Handle mouse click event
     */
    onMouseClick: function(event) {
        try {
            // Check if we're intersecting with a gallery item
            this.raycaster.setFromCamera(this.mouse, this.camera);
            
            // Get valid meshes (filter out undefined meshes)
            const validMeshes = this.galleryItems
                .filter(item => item.mesh && item.visible !== false)
                .map(item => item.mesh);
            
            if (validMeshes.length === 0) return;
            
            const intersects = this.raycaster.intersectObjects(validMeshes);
            
            if (intersects.length > 0) {
                const object = intersects[0].object;
                const item = this.galleryItems.find(item => item.mesh === object);
                
                if (item && item.element) {
                    // Trigger click on the original DOM element
                    item.element.click();
                }
            }
        } catch (error) {
            console.error('Error in onMouseClick:', error);
        }
    },
    
    /**
     * Handle window resize event
     */
    onWindowResize: function() {
        try {
            if (!this.isInitialized) return;
            
            // Update camera
            this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
            this.camera.updateProjectionMatrix();
            
            // Update renderer
            this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        } catch (error) {
            console.error('Error in onWindowResize:', error);
        }
    },
    
    /**
     * Update colors based on theme
     */
    updateThemeColors: function() {
        try {
            // Update sphere color
            if (this.sphere) {
                this.sphere.material.color.set(this.darkMode ? 0x1A1A1A : 0xF5F5F5);
            }
            
            if (this.innerSphere) {
                this.innerSphere.material.color.set(this.darkMode ? 0x111111 : 0xF0F0F0);
            }
            
            if (this.bgSphere) {
                this.bgSphere.material.color.set(this.darkMode ? 0x111111 : 0xEEEEEE);
            }
            
            // Update point lights
            this.scene.children.forEach(child => {
                if (child instanceof THREE.PointLight) {
                    child.color.set(this.darkMode ? 0xDDA15E : 0x2C6E49);
                }
            });
        } catch (error) {
            console.error('Error updating theme colors:', error);
        }
    },
    
    /**
     * Update visible items based on gallery filters
     */
    updateVisibleItems: function() {
        try {
            // Get active filter
            const activeFilter = document.querySelector('.gallery-filter.active');
            const filterValue = activeFilter ? activeFilter.getAttribute('data-filter') : 'all';
            
            // Update visibility of items
            this.galleryItems.forEach(item => {
                const isVisible = filterValue === 'all' || item.dataCategory === filterValue;
                item.visible = isVisible;
                
                // Update mesh visibility
                if (item.mesh) {
                    item.mesh.visible = isVisible;
                }
            });
            
            console.log(`Updated visibility for filter: ${filterValue}`);
        } catch (error) {
            console.error('Error in updateVisibleItems:', error);
        }
    },
    
    /**
     * Check for intersections with mouse
     */
    checkIntersections: function() {
        try {
            // Update the picking ray with the camera and mouse position
            this.raycaster.setFromCamera(this.mouse, this.camera);
            
            // Get valid meshes (filter out undefined meshes)
            const validMeshes = this.galleryItems
                .filter(item => item.mesh && item.visible !== false)
                .map(item => item.mesh);
            
            if (validMeshes.length === 0) return;
            
            // Calculate objects intersecting the picking ray
            const intersects = this.raycaster.intersectObjects(validMeshes);
            
            // Reset all items except the currently intersected one
            this.galleryItems.forEach(item => {
                if (item.mesh && item !== this.INTERSECTED) {
                    item.mesh.scale.set(item.originalScale || 1, item.originalScale || 1, item.originalScale || 1);
                }
            });
            
            // Handle intersection
            if (intersects.length > 0) {
                const intersectedObject = intersects[0].object;
                const intersectedItem = this.galleryItems.find(item => item.mesh === intersectedObject);
                
                if (intersectedItem && intersectedItem !== this.INTERSECTED) {
                    // Reset previous intersected item
                    if (this.INTERSECTED && this.INTERSECTED.mesh) {
                        this.INTERSECTED.mesh.scale.set(
                            this.INTERSECTED.originalScale || 1,
                            this.INTERSECTED.originalScale || 1,
                            this.INTERSECTED.originalScale || 1
                        );
                    }
                    
                    // Set new intersected item
                    this.INTERSECTED = intersectedItem;
                    
                    // Store original scale if not already stored
                    if (!this.INTERSECTED.originalScale && this.INTERSECTED.mesh) {
                        this.INTERSECTED.originalScale = this.INTERSECTED.mesh.scale.x;
                    }
                    
                    // Highlight new intersected item with just a slight scale increase
                    if (this.INTERSECTED.mesh) {
                        const highlightScale = this.INTERSECTED.originalScale * 1.15;
                        this.INTERSECTED.mesh.scale.set(highlightScale, highlightScale, highlightScale);
                    }
                    
                    // Change cursor
                    this.container.style.cursor = 'pointer';
                }
            } else {
                // Reset when no intersection
                if (this.INTERSECTED) {
                    if (this.INTERSECTED.mesh) {
                        this.INTERSECTED.mesh.scale.set(
                            this.INTERSECTED.originalScale || 1,
                            this.INTERSECTED.originalScale || 1,
                            this.INTERSECTED.originalScale || 1
                        );
                    }
                    this.INTERSECTED = null;
                    
                    // Reset cursor
                    this.container.style.cursor = 'auto';
                }
            }
        } catch (error) {
            console.error('Error in checkIntersections:', error);
        }
    },
    
    /**
     * Animation loop
     */
    animate: function() {
        if (!this.isInitialized) return;
        
        requestAnimationFrame(this.animate.bind(this));
        
        try {
            // Auto-rotate sphere if controls are not available
            if (!this.controls) {
                this.sphere.rotation.y += this.rotationSpeed;
                
                // Rotate all gallery items to match sphere rotation
                this.galleryItems.forEach(item => {
                    if (item.mesh) {
                        item.mesh.rotation.y += this.rotationSpeed;
                    }
                });
            } else {
                // Update controls if available
                this.controls.update();
                
                // Add subtle floating animation to the gallery items
                const time = Date.now() * 0.001; // Convert to seconds
                this.galleryItems.forEach((item, index) => {
                    if (item.mesh && item.visible !== false) {
                        // Create subtle floating effect with different phases for each item
                        const phase = index * 0.2;
                        const floatOffset = Math.sin(time + phase) * 0.02;
                        
                        // Get the normalized direction from center to the item
                        const dir = new THREE.Vector3().copy(item.mesh.position).normalize();
                        
                        // Apply floating motion along the direction vector
                        const floatPos = new THREE.Vector3().copy(item.mesh.position);
                        floatPos.add(dir.multiplyScalar(floatOffset));
                        
                        // Smoothly interpolate to the new position
                        item.mesh.position.lerp(floatPos, 0.1);
                    }
                });
            }
            
            // Animate background sphere for a more immersive effect
            if (this.bgSphere) {
                this.bgSphere.rotation.y += this.rotationSpeed * 0.1;
                this.bgSphere.rotation.x += this.rotationSpeed * 0.05;
            }
            
            // Subtle rotation for inner sphere in opposite direction for parallax effect
            if (this.innerSphere) {
                this.innerSphere.rotation.y -= this.rotationSpeed * 0.3;
                this.innerSphere.rotation.x += this.rotationSpeed * 0.1;
            }
            
            // Check for intersections
            this.checkIntersections();
            
            // Render scene
            this.render();
        } catch (error) {
            console.error('Error in animation loop:', error);
        }
    },
    
    /**
     * Render the scene
     */
    render: function() {
        try {
            if (this.renderer && this.scene && this.camera) {
                this.renderer.render(this.scene, this.camera);
            }
        } catch (error) {
            console.error('Error rendering scene:', error);
        }
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Check if Three.js is loaded
        if (typeof THREE === 'undefined') {
            console.error('Three.js is not loaded. Please include the Three.js library.');
            return;
        }
        
        // Simple initialization - we've already included the necessary scripts in the HTML
        setTimeout(() => {
            try {
                // Create globe gallery
                GlobeGallery.init('globe-gallery-container');
                console.log('Globe gallery initialized successfully');
            } catch (error) {
                console.error('Error initializing globe gallery:', error);
            }
        }, 1000); // Longer delay to ensure everything is loaded
    } catch (error) {
        console.error('Error in globe gallery initialization:', error);
    }
});
