/**
 * Globe Gallery - 3D Interactive Gallery using Three.js
 * A simplified implementation for better compatibility and performance
 */

class GlobeGallery {
    constructor(containerId) {
        // DOM Elements
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`Container with ID "${containerId}" not found`);
            return;
        }

        // Gallery items data
        this.galleryItems = [];
        this.loadGalleryItems();

        // Three.js variables
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.sphere = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.INTERSECTED = null;
        this.controls = null;

        // Settings
        this.sphereRadius = 2;
        this.isInitialized = false;
        this.darkMode = document.body.classList.contains('dark-theme');
        this.rotationSpeed = 0.001;

        // Initialize the 3D scene
        this.init();
        this.animate();

        // Event listeners
        this.addEventListeners();
    }

    /**
     * Load gallery items from the DOM
     */
    loadGalleryItems() {
        const items = document.querySelectorAll('.gallery-item');
        items.forEach(item => {
            const img = item.querySelector('img');
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
    }
    
    /**
     * Update visible items based on gallery filters
     */
    updateVisibleItems() {
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
            
            // Update glow mesh visibility
            if (item.glowMesh) {
                item.glowMesh.visible = isVisible;
            }
            
            // Update label visibility
            if (item.label) {
                item.label.visible = isVisible;
            }
        });
        
        // Rearrange visible items on the sphere
        this.rearrangeVisibleItems();
    }
    
    /**
     * Rearrange visible items on the sphere
     */
    rearrangeVisibleItems() {
        // Get visible items
        const visibleItems = this.galleryItems.filter(item => item.visible);
        const itemCount = visibleItems.length;
        
        if (itemCount === 0) return;
        
        // Golden angle for even distribution
        const phi = Math.PI * (3 - Math.sqrt(5));
        
        // Animate items to new positions
        visibleItems.forEach((item, i) => {
            if (!item.mesh) return;
            
            // Calculate new position on sphere using fibonacci distribution
            const y = 1 - (i / (itemCount - 1)) * 2;
            const radius = Math.sqrt(1 - y * y);
            const theta = phi * i;
            
            const x = Math.cos(theta) * radius;
            const z = Math.sin(theta) * radius;
            
            // New position on sphere surface
            const newPosition = new THREE.Vector3(x, y, z).multiplyScalar(this.sphereRadius);
            
            // Animate to new position
            gsap.to(item.mesh.position, {
                x: newPosition.x,
                y: newPosition.y,
                z: newPosition.z,
                duration: 1,
                ease: 'power2.inOut',
                onUpdate: () => {
                    // Update look direction to always face outward
                    item.mesh.lookAt(0, 0, 0);
                    item.mesh.rotateY(Math.PI); // Flip to face outward
                    
                    // Update glow mesh position
                    if (item.glowMesh) {
                        item.glowMesh.position.copy(item.mesh.position);
                        item.glowMesh.lookAt(0, 0, 0);
                        item.glowMesh.rotateY(Math.PI);
                        item.glowMesh.position.sub(new THREE.Vector3().copy(item.mesh.position).normalize().multiplyScalar(0.01));
                    }
                    
                    // Update label position
                    if (item.label) {
                        const dir = new THREE.Vector3().copy(item.mesh.position).normalize();
                        const labelPos = new THREE.Vector3().copy(item.mesh.position).add(dir.multiplyScalar(0.1));
                        item.label.position.copy(labelPos);
                        item.label.lookAt(0, 0, 0);
                        item.label.rotateY(Math.PI);
                    }
                }
            });
        });
    }

    /**
     * Initialize the 3D scene
     */
    init() {
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
            
            // Add ambient light with softer illumination
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
            this.scene.add(ambientLight);
            
            // Add directional light with better positioning
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(5, 8, 5);
            this.scene.add(directionalLight);
            
            // Add point lights with colors that match the theme
            const accentColor = this.darkMode ? 0xDDA15E : 0x2C6E49;
            
            // Main accent light
            const pointLight1 = new THREE.PointLight(accentColor, 1.2, 15);
            pointLight1.position.set(5, 2, 3);
            this.scene.add(pointLight1);
            
            // Secondary accent light
            const pointLight2 = new THREE.PointLight(accentColor, 1.2, 15);
            pointLight2.position.set(-5, -2, 3);
            this.scene.add(pointLight2);
            
            // Add point light for better illumination
            const pointLight = new THREE.PointLight(0xffffff, 1, 100);
            pointLight.position.set(5, 3, 5);
            this.scene.add(pointLight);
            
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
            
            // Create sphere geometry with improved appearance
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
            
            // Add subtle inner sphere for better depth perception
            const innerSphereGeometry = new THREE.SphereGeometry(this.sphereRadius * 0.98, 32, 32);
            const innerSphereMaterial = new THREE.MeshBasicMaterial({
                color: this.darkMode ? 0x111111 : 0xF0F0F0,
                transparent: true,
                opacity: 0.05,
                wireframe: false,
                side: THREE.BackSide
            });
            this.innerSphere = new THREE.Mesh(innerSphereGeometry, innerSphereMaterial);
            
            this.scene.add(this.sphere);
            this.scene.add(this.innerSphere);
            
            // Position gallery items on sphere
            this.positionGalleryItems();
            
            // Add orbit controls
            if (typeof THREE.OrbitControls !== 'undefined') {
                this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
                this.controls.enableDamping = true;
                this.controls.dampingFactor = 0.05;
                this.controls.rotateSpeed = 0.5;
                this.controls.enableZoom = false;
                this.controls.enablePan = false;
                this.controls.autoRotate = this.autoRotate;
                this.controls.autoRotateSpeed = 0.5;
                
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
            } else {
                console.warn('OrbitControls not available');
            }
            
            this.isInitialized = true;
        } catch (error) {
            console.error('Error initializing 3D scene:', error);
        }
    }

    /**
     * Position gallery items on sphere surface
     */
    positionGalleryItems() {
        try {
            const itemCount = this.galleryItems.length;
            if (itemCount === 0) return;
            
            const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle
            
            const textureLoader = new THREE.TextureLoader();
            const planeGeometry = new THREE.PlaneGeometry(0.8, 0.5);
            
            this.galleryItems.forEach((item, i) => {
                try {
                    // Calculate position on sphere using fibonacci distribution
                    const y = 1 - (i / (itemCount - 1)) * 2;
                    const radius = Math.sqrt(1 - y * y);
                    const theta = phi * i;
                    
                    const x = Math.cos(theta) * radius;
                    const z = Math.sin(theta) * radius;
                    const position = new THREE.Vector3(x, y, z).multiplyScalar(this.sphereRadius);
                    
                    // Create plane geometry for gallery item
                    const planeGeometry = new THREE.PlaneGeometry(0.8, 0.5, 1, 1);
                    
                    // Load texture asynchronously
                    textureLoader.load(
                        item.imgSrc,
                        (texture) => {
                            texture.minFilter = THREE.LinearFilter;
                            texture.magFilter = THREE.LinearFilter;
                            
                            // Create material with loaded texture and better appearance
                            const material = new THREE.MeshPhongMaterial({
                                map: texture,
                                side: THREE.DoubleSide,
                                shininess: 30,
                                reflectivity: 0.2,
                                transparent: true,
                                opacity: 0.95
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
                            
                            // Add glow effect plane behind the image
                            const glowMaterial = new THREE.MeshPhongMaterial({
                                color: this.darkMode ? 0xDDA15E : 0x2C6E49,
                                transparent: true,
                                opacity: 0,
                                side: THREE.DoubleSide,
                                emissive: this.darkMode ? 0xDDA15E : 0x2C6E49,
                                emissiveIntensity: 0.5
                            });
                            
                            const glowPlane = new THREE.Mesh(planeGeometry, glowMaterial);
                            glowPlane.position.copy(mesh.position);
                            glowPlane.lookAt(0, 0, 0);
                            glowPlane.rotateY(Math.PI);
                            glowPlane.rotation.z = mesh.rotation.z; // Match the image rotation
                            glowPlane.scale.set(1.15, 1.15, 1.15);
                            glowPlane.position.sub(new THREE.Vector3().copy(mesh.position).normalize().multiplyScalar(0.02));
                        
                            item.glowMesh = glowPlane;
                            this.scene.add(glowPlane);
                    }, undefined, (error) => {
                        console.error('Error loading texture:', error);
                    });
                } catch (error) {
                    console.error('Error positioning gallery item:', error);
                }
            });
        } catch (error) {
            console.error('Error in positionGalleryItems:', error);
        }
    }

    // We've removed the createItemLabel method as it was causing issues

    // We've removed the setupPostProcessing method as it was causing issues

    /**
     * Add event listeners
     */
    addEventListeners() {
        // Mouse move event for hover effects
        this.container.addEventListener('mousemove', this.onMouseMove.bind(this));
        
        // Click event for item selection
        this.container.addEventListener('click', this.onMouseClick.bind(this));
        
        // Window resize event
        window.addEventListener('resize', this.onWindowResize.bind(this));
        
        // Theme change event
        document.querySelector('.theme-toggle').addEventListener('click', () => {
            // Wait for theme change to complete
            setTimeout(() => {
                this.darkMode = document.body.classList.contains('dark-theme');
                this.updateThemeColors();
            }, 100);
        });
    }

    /**
     * Update colors based on theme
     */
    updateThemeColors() {
        // Update sphere color
        this.sphere.material.color.set(this.darkMode ? 0x1A1A1A : 0xF5F5F5);
        
        // Update point lights
        this.scene.children.forEach(child => {
            if (child instanceof THREE.PointLight) {
                child.color.set(this.darkMode ? 0xDDA15E : 0x2C6E49);
            }
        });
        
        // Update glow colors for items
        this.galleryItems.forEach(item => {
            if (item.glowMesh) {
                item.glowMesh.material.color.set(this.darkMode ? 0xDDA15E : 0x2C6E49);
            }
        });
    }

    /**
     * Handle mouse move event
     */
    onMouseMove(event) {
        // Calculate mouse position in normalized device coordinates (-1 to +1)
        const rect = this.container.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / this.container.clientWidth) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / this.container.clientHeight) * 2 + 1;
    }

    /**
     * Handle mouse click event
     */
    onMouseClick(event) {
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
    }

    /**
     * Handle window resize event
     */
    onWindowResize() {
        if (!this.isInitialized) return;
        
        // Update camera
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        
        // Update renderer
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        
        // Update composers
        if (this.bloomComposer && this.finalComposer) {
            this.bloomComposer.setSize(this.container.clientWidth, this.container.clientHeight);
            this.finalComposer.setSize(this.container.clientWidth, this.container.clientHeight);
        }
    }

    /**
     * Animation loop
     */
    animate() {
            
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
            
            // Add glow effect plane behind the image
            const glowMaterial = new THREE.MeshPhongMaterial({
                color: this.darkMode ? 0xDDA15E : 0x2C6E49,
                transparent: true,
                opacity: 0,
                side: THREE.DoubleSide,
                emissive: this.darkMode ? 0xDDA15E : 0x2C6E49,
                emissiveIntensity: 0.5
            });
            
            // Reset all items except the currently intersected one
            this.galleryItems.forEach(item => {
                if (item.glowMesh && item !== this.INTERSECTED) {
                    item.glowMesh.material.opacity = 0;
                }
                if (item.mesh && item !== this.INTERSECTED) {
                    item.mesh.scale.set(1, 1, 1);
                }
            });
            
            // Handle intersection
            if (intersects.length > 0) {
                const intersectedObject = intersects[0].object;
                const intersectedItem = this.galleryItems.find(item => item.mesh === intersectedObject);
                
                if (intersectedItem && intersectedItem !== this.INTERSECTED) {
                    // Reset previous intersected item
                    if (this.INTERSECTED && this.INTERSECTED.glowMesh) {
                        this.INTERSECTED.glowMesh.material.opacity = 0;
                        if (this.INTERSECTED.mesh) {
                            this.INTERSECTED.mesh.scale.set(1, 1, 1);
                        }
                    }
                    
                    // Set new intersected item
                    this.INTERSECTED = intersectedItem;
                    
                    // Highlight new intersected item
                    if (this.INTERSECTED.glowMesh) {
                        this.INTERSECTED.glowMesh.material.opacity = 0.3;
                    }
                    if (this.INTERSECTED.mesh) {
                        this.INTERSECTED.mesh.scale.set(1.1, 1.1, 1.1);
                    }
                    
                    // Change cursor
                    this.container.style.cursor = 'pointer';
                }
            } else {
                    if (this.INTERSECTED.mesh) {
                        this.INTERSECTED.mesh.scale.set(1, 1, 1);
                    }
                }
                
                // Set new intersected item
                this.INTERSECTED = intersectedItem;
                
                // Highlight new intersected item
                if (this.INTERSECTED.glowMesh) {
                    this.INTERSECTED.glowMesh.material.opacity = 0.3;
                }
                if (this.INTERSECTED.mesh) {
                    this.INTERSECTED.mesh.scale.set(1.1, 1.1, 1.1);
                }
                
                // Change cursor
                this.container.style.cursor = 'pointer';
            }
        } else {
            // Reset when no intersection
            if (this.INTERSECTED) {
                if (this.INTERSECTED.glowMesh) {
                    this.INTERSECTED.glowMesh.material.opacity = 0;
                }
                if (this.INTERSECTED.mesh) {
                    this.INTERSECTED.mesh.scale.set(1, 1, 1);
                }
                this.INTERSECTED = null;
                
                // Reset cursor
                this.container.style.cursor = 'auto';
    render() {
        try {
            if (this.renderer && this.scene && this.camera) {
                this.renderer.render(this.scene, this.camera);
            }
        } catch (error) {
            console.error('Error rendering scene:', error);
        }
    }

    // We've removed the bloom effect helper methods as they were causing issues
}

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
                window.globeGallery = new GlobeGallery('globe-gallery-container');
                console.log('Globe gallery initialized successfully');
            } catch (error) {
                console.error('Error initializing globe gallery:', error);
            }
        }, 500); // Short delay to ensure everything is loaded
    } catch (error) {
        console.error('Error in globe gallery initialization:', error);
    }
});
