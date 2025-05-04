// Initialize AOS (Animate on Scroll)
document.addEventListener('DOMContentLoaded', function() {
    // Initialize slideshow
    const slides = document.querySelectorAll('.slide');
    let currentSlide = 0;
    let interval;

    function showSlide(index) {
        slides[currentSlide].classList.remove('active');
        currentSlide = index;
        slides[currentSlide].classList.add('active');
    }

    function showNextSlide() {
        showSlide((currentSlide + 1) % slides.length);
    }

    function showPrevSlide() {
        showSlide((currentSlide - 1 + slides.length) % slides.length);
    }

    function startSlideshow() {
        interval = setInterval(showNextSlide, 7000);
    }

    function pauseSlideshow() {
        clearInterval(interval);
    }

    // Add hover effect to pause slideshow
    document.querySelector('.hero-section').addEventListener('mouseenter', pauseSlideshow);
    document.querySelector('.hero-section').addEventListener('mouseleave', startSlideshow);

    // Add manual controls
    const prevBtn = document.querySelector('.prev');
    const nextBtn = document.querySelector('.next');

    prevBtn.addEventListener('click', () => {
        showPrevSlide();
        pauseSlideshow();
        startSlideshow();
    });

    nextBtn.addEventListener('click', () => {
        showNextSlide();
        pauseSlideshow();
        startSlideshow();
    });

    // Start the slideshow
    startSlideshow();

    // Initialize AOS
    AOS.init({
        duration: 800,
        easing: 'ease-out',
        once: false,
        offset: 100,
        delay: 100
    });

    // Variables
    const navbar = document.getElementById('navbar');
    const themeToggle = document.querySelector('.theme-toggle');
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const modals = document.querySelectorAll('.modal');
    const modalTriggers = document.querySelectorAll('[data-modal]');
    const closeModalButtons = document.querySelectorAll('.close-modal');
    const contactForm = document.getElementById('contact-form');
    const galleryItems = document.querySelectorAll('.gallery-item');
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.querySelector('.lightbox-image');
    const lightboxCaption = document.querySelector('.lightbox-caption');
    const closeLightbox = document.querySelector('.close-lightbox');
    const lightboxPrev = document.querySelector('.lightbox-prev');
    const lightboxNext = document.querySelector('.lightbox-next');
    
    let currentImageIndex = 0;

    // Navbar scroll effect with parallax
    window.addEventListener('scroll', function() {
        const scrollPosition = window.scrollY;
        
        // Navbar effect
        if (scrollPosition > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        // Parallax effect for hero section
        const heroSection = document.querySelector('.hero-section');
        if (heroSection) {
            heroSection.style.backgroundPositionY = `calc(50% + ${scrollPosition * 0.4}px)`;
        }
        
        // Move hero content slightly on scroll for depth
        const heroContent = document.querySelector('.hero-content');
        if (heroContent && scrollPosition < window.innerHeight) {
            heroContent.style.transform = `translateY(${scrollPosition * 0.1}px)`;
        }
    });

    // Theme toggle with smooth transition
    themeToggle.addEventListener('click', function() {
        // Add transition class to body
        document.body.classList.add('theme-transition');
        
        // Toggle theme after a small delay to allow for smooth icon transition
        setTimeout(() => {
            document.body.classList.toggle('dark-theme');
            
            if (document.body.classList.contains('dark-theme')) {
                themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
                localStorage.setItem('theme', 'dark');
            } else {
                themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
                localStorage.setItem('theme', 'light');
            }
            
            // Remove transition class after theme change is complete
            setTimeout(() => {
                document.body.classList.remove('theme-transition');
            }, 500);
        }, 50);
    });

    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }

    // Mobile menu toggle
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
    });

    // Close mobile menu when clicking on a link
    const navLinkElements = document.querySelectorAll('.nav-links a');
    navLinkElements.forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });

    // Modal functionality
    modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', function() {
            const modalId = this.getAttribute('data-modal');
            const modal = document.getElementById(modalId);
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        });
    });

    closeModalButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
        });
    });

    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        modals.forEach(modal => {
            if (e.target === modal) {
                modal.classList.remove('show');
                document.body.style.overflow = 'auto';
            }
        });
    });

    // Contact form validation
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            let isValid = true;
            const nameInput = document.getElementById('name');
            const emailInput = document.getElementById('email');
            const messageInput = document.getElementById('message');
            
            // Reset error messages
            document.querySelectorAll('.error-message').forEach(error => {
                error.style.display = 'none';
            });
            
            // Validate name
            if (nameInput.value.trim() === '') {
                showError(nameInput, 'Please enter your name');
                isValid = false;
            }
            
            // Validate email
            if (emailInput.value.trim() === '') {
                showError(emailInput, 'Please enter your email');
                isValid = false;
            } else if (!isValidEmail(emailInput.value)) {
                showError(emailInput, 'Please enter a valid email');
                isValid = false;
            }
            
            // Validate message
            if (messageInput.value.trim() === '') {
                showError(messageInput, 'Please enter your message');
                isValid = false;
            }
            
            // If form is valid, simulate form submission
            if (isValid) {
                // In a real application, you would send the form data to a server
                // For demo purposes, we'll just show a success message
                contactForm.innerHTML = '<div class="success-message"><i class="fas fa-check-circle"></i><h3>Thank you!</h3><p>Your message has been sent successfully. I will get back to you soon.</p></div>';
            }
        });
    }
    
    function showError(input, message) {
        const errorElement = input.nextElementSibling;
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
    
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Gallery filtering
    const galleryFilters = document.querySelectorAll('.gallery-filter');
    
    if (galleryFilters.length > 0) {
        galleryFilters.forEach(filter => {
            filter.addEventListener('click', function() {
                // Remove active class from all filters
                galleryFilters.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked filter
                this.classList.add('active');
                
                const filterValue = this.getAttribute('data-filter');
                
                // Filter gallery items
                galleryItems.forEach(item => {
                    if (filterValue === 'all' || item.getAttribute('data-category') === filterValue) {
                        item.style.display = 'block';
                        // Re-trigger AOS animation
                        setTimeout(() => {
                            AOS.refresh();
                        }, 100);
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        });
    }
    
    // Enhanced Gallery lightbox
    galleryItems.forEach((item, index) => {
        item.addEventListener('click', function() {
            const imgSrc = this.querySelector('img').getAttribute('src');
            const imgAlt = this.querySelector('img').getAttribute('alt');
            const category = this.querySelector('.gallery-category')?.textContent || '';
            const caption = this.querySelector('.gallery-overlay span')?.textContent || imgAlt;
            
            lightboxImage.setAttribute('src', imgSrc);
            lightboxCaption.innerHTML = `<span class="lightbox-category">${category}</span><h3>${caption}</h3>`;
            lightbox.classList.add('show');
            document.body.style.overflow = 'hidden';
            
            // Store visible gallery items for navigation
            const visibleItems = Array.from(galleryItems).filter(item => item.style.display !== 'none');
            currentImageIndex = visibleItems.indexOf(this);
            updateLightboxNavigation(visibleItems);
        });
    });
    
    closeLightbox.addEventListener('click', function() {
        lightbox.classList.remove('show');
        document.body.style.overflow = 'auto';
    });
    
    // Enhanced Lightbox navigation
    lightboxPrev.addEventListener('click', function() {
        navigateLightbox('prev');
    });
    
    lightboxNext.addEventListener('click', function() {
        navigateLightbox('next');
    });
    
    function navigateLightbox(direction) {
        // Get only visible gallery items
        const visibleItems = Array.from(galleryItems).filter(item => item.style.display !== 'none');
        
        if (direction === 'prev') {
            currentImageIndex = (currentImageIndex - 1 + visibleItems.length) % visibleItems.length;
        } else {
            currentImageIndex = (currentImageIndex + 1) % visibleItems.length;
        }
        
        updateLightbox(visibleItems);
    }
    
    function updateLightbox(visibleItems) {
        visibleItems = visibleItems || Array.from(galleryItems).filter(item => item.style.display !== 'none');
        
        const currentItem = visibleItems[currentImageIndex];
        const imgSrc = currentItem.querySelector('img').getAttribute('src');
        const category = currentItem.querySelector('.gallery-category')?.textContent || '';
        const caption = currentItem.querySelector('.gallery-overlay span')?.textContent || currentItem.querySelector('img').getAttribute('alt');
        
        // Fade out current image
        lightboxImage.style.opacity = 0;
        
        // Change image after fade out
        setTimeout(() => {
            lightboxImage.setAttribute('src', imgSrc);
            lightboxCaption.innerHTML = `<span class="lightbox-category">${category}</span><h3>${caption}</h3>`;
            
            // Fade in new image
            setTimeout(() => {
                lightboxImage.style.opacity = 1;
            }, 50);
        }, 300);
        
        updateLightboxNavigation(visibleItems);
    }
    
    function updateLightboxNavigation(visibleItems) {
        visibleItems = visibleItems || Array.from(galleryItems).filter(item => item.style.display !== 'none');
        
        if (visibleItems.length <= 1) {
            lightboxPrev.style.display = 'none';
            lightboxNext.style.display = 'none';
        } else {
            lightboxPrev.style.display = 'block';
            lightboxNext.style.display = 'block';
        }
    }
    
    // Close lightbox when clicking outside the image
    lightbox.addEventListener('click', function(e) {
        if (e.target === lightbox) {
            lightbox.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
    });

    // Enhanced Keyboard navigation for lightbox
    document.addEventListener('keydown', function(e) {
        if (lightbox.classList.contains('show')) {
            if (e.key === 'Escape') {
                lightbox.classList.remove('show');
                document.body.style.overflow = 'auto';
            } else if (e.key === 'ArrowLeft') {
                navigateLightbox('prev');
            } else if (e.key === 'ArrowRight') {
                navigateLightbox('next');
            }
        }
    });
    
    // Add CSS for lightbox category styling
    const lightboxStyle = document.createElement('style');
    lightboxStyle.textContent = `
        .lightbox-image {
            transition: opacity 0.3s ease;
        }
        .lightbox-category {
            display: inline-block;
            font-size: 0.8rem;
            color: var(--accent-color);
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 5px;
        }
        .lightbox-caption h3 {
            margin: 5px 0 0 0;
            font-size: 1.2rem;
        }
    `;
    document.head.appendChild(lightboxStyle);

    // Typewriter effect for about section
    const typewriterElement = document.querySelector('.typewriter');
    if (typewriterElement) {
        const text = typewriterElement.textContent;
        typewriterElement.textContent = '';
        typewriterElement.style.width = '0';
        
        let charIndex = 0;
        
        function typeWriter() {
            if (charIndex < text.length) {
                typewriterElement.textContent += text.charAt(charIndex);
                charIndex++;
                setTimeout(typeWriter, 50);
            } else {
                // Remove the cursor when typing is complete
                setTimeout(() => {
                    typewriterElement.style.borderRight = 'none';
                }, 1000);
            }
        }
        
        // Start the typewriter effect when the element is in view
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setTimeout(typeWriter, 500);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        observer.observe(typewriterElement);
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 70,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Enhanced scrollspy effect for nav links
    const sections = document.querySelectorAll('section');
    
    const scrollSpy = () => {
        const scrollPosition = window.scrollY + 300; // Offset for earlier activation
        
        // Find the current section
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionBottom = sectionTop + section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                // Remove active class from all links
                navLinks.forEach(link => {
                    link.classList.remove('active');
                });
                
                // Add active class to corresponding link
                const activeLink = document.querySelector(`.nav-links a[href="#${sectionId}"]`);
                if (activeLink) {
                    activeLink.classList.add('active');
                }
            }
        });
    };
    
    // Initial call to set active link on page load
    scrollSpy();
    
    // Call scrollSpy on scroll with throttling for performance
    let scrollTimeout;
    window.addEventListener('scroll', function() {
        if (!scrollTimeout) {
            scrollTimeout = setTimeout(() => {
                scrollSpy();
                scrollTimeout = null;
            }, 100);
        }
    });
    
    // Add CSS class for theme transition
    const style = document.createElement('style');
    style.textContent = `
        .theme-transition,
        .theme-transition * {
            transition: background-color 0.5s ease, color 0.5s ease, border-color 0.5s ease, box-shadow 0.5s ease !important;
        }
    `;
    document.head.appendChild(style);
});
