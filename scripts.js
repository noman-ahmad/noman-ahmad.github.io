document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const sections = document.querySelectorAll('section');
    const navItems = document.querySelectorAll('nav a');
    const themeToggle = document.querySelector('.theme-toggle');
    const root = document.documentElement;

    // Theme toggle functionality
    function setTheme(theme) {
        root.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        updateNavColors();
    }

    function toggleTheme() {
        const currentTheme = root.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    }

    // Initialize theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);

    // Add theme toggle event listener
    themeToggle.addEventListener('click', toggleTheme);

    // Hamburger menu functionality
    hamburger.addEventListener('click', function() {
        navLinks.classList.toggle('active');
        this.classList.toggle('active');
    });

    // Section highlighting and color sync functionality
    function updateNavColors() {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.scrollY >= (sectionTop - sectionHeight/3)) {
                current = section.getAttribute('id');
            }
        });

        // Update navigation background based on current section
        switch(current) {
            case 'home':
                root.style.setProperty('--current-section-bg', 'var(--section-bg-1)');
                break;
            case 'about':
                root.style.setProperty('--current-section-bg', 'var(--section-bg-2)');
                break;
            case 'experience':
                root.style.setProperty('--current-section-bg', 'var(--section-bg-3)');
                break;
            default:
                root.style.setProperty('--current-section-bg', 'var(--section-bg-1)');
        }

        // Update navigation links
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href').slice(1) === current) {
                item.classList.add('active');
            }
        });
    }

    // Add scroll event listener
    window.addEventListener('scroll', updateNavColors);

    // Initial color check
    updateNavColors();

    // Update current section in nav title
    const updateCurrentSection = () => {
        const sections = document.querySelectorAll('section');
        const navTitle = document.getElementById('current-section');
        
        // Get the middle of the viewport
        const viewportMiddle = window.scrollY + (window.innerHeight / 2);
        
        // Find which section is currently most visible
        let currentSection = sections[0]; // Default to first section
        let maxVisibility = 0;
        
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            const sectionTop = rect.top + window.scrollY;
            const sectionBottom = sectionTop + rect.height;
            
            // Calculate how much of the section is visible
            const visibleTop = Math.max(sectionTop, window.scrollY);
            const visibleBottom = Math.min(sectionBottom, window.scrollY + window.innerHeight);
            const visibleHeight = Math.max(0, visibleBottom - visibleTop);
            
            if (visibleHeight > maxVisibility) {
                maxVisibility = visibleHeight;
                currentSection = section;
            }
        });
        
        // Update the nav title
        const sectionTitle = currentSection.getAttribute('data-section-title');
        navTitle.textContent = sectionTitle;
    };

    // Add scroll event listener
    window.addEventListener('scroll', () => {
        requestAnimationFrame(updateCurrentSection);
    });

    // Initial call to set correct section on page load
    document.addEventListener('DOMContentLoaded', updateCurrentSection);

    // Update section on hash change (when clicking nav links)
    window.addEventListener('hashchange', updateCurrentSection);

    // Close mobile menu when clicking a link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });
});

// Projects carousel scrolling
document.addEventListener('DOMContentLoaded', () => {
    const projectsGrid = document.querySelector('.projects-grid');
    const scrollLeft = document.querySelector('.scroll-left');
    const scrollRight = document.querySelector('.scroll-right');
    const scrollAmount = 400; // Slightly more than card width to ensure next card is fully visible

    if (scrollLeft && scrollRight && projectsGrid) {
        // Update scroll indicators visibility
        const updateScrollButtons = () => {
            scrollLeft.style.display = projectsGrid.scrollLeft > 0 ? 'flex' : 'none';
            scrollRight.style.display = 
                projectsGrid.scrollLeft < (projectsGrid.scrollWidth - projectsGrid.clientWidth - 10) 
                ? 'flex' 
                : 'none';
        };

        // Initial visibility check
        updateScrollButtons();

        // Scroll handlers
        scrollLeft.addEventListener('click', () => {
            projectsGrid.scrollBy({
                left: -scrollAmount,
                behavior: 'smooth'
            });
        });

        scrollRight.addEventListener('click', () => {
            projectsGrid.scrollBy({
                left: scrollAmount,
                behavior: 'smooth'
            });
        });

        // Update button visibility on scroll
        projectsGrid.addEventListener('scroll', updateScrollButtons);

        // Update button visibility on window resize
        window.addEventListener('resize', updateScrollButtons);
    }
});

// Storybook Navigation
document.addEventListener('DOMContentLoaded', () => {
    const storybook = document.querySelector('.storybook');
    const pages = document.querySelectorAll('.storybook-page');
    const indicators = document.querySelectorAll('.indicator');
    const prevBtn = document.querySelector('.control-btn.prev');
    const nextBtn = document.querySelector('.control-btn.next');
    let currentPage = 1;

    function updatePage(pageNumber) {
        // Update active page
        pages.forEach(page => {
            page.classList.remove('active');
            if (page.dataset.page === pageNumber.toString()) {
                page.classList.add('active');
            }
        });

        // Update indicators
        indicators.forEach(indicator => {
            indicator.classList.remove('active');
            if (indicator.dataset.page === pageNumber.toString()) {
                indicator.classList.add('active');
            }
        });

        // Update current page
        currentPage = parseInt(pageNumber);
    }

    // Navigation buttons
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            updatePage(currentPage - 1);
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentPage < pages.length) {
            updatePage(currentPage + 1);
        }
    });

    // Indicator clicks
    indicators.forEach(indicator => {
        indicator.addEventListener('click', () => {
            updatePage(indicator.dataset.page);
        });
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' && currentPage > 1) {
            updatePage(currentPage - 1);
        } else if (e.key === 'ArrowRight' && currentPage < pages.length) {
            updatePage(currentPage + 1);
        }
    });

    // Touch swipe support
    let touchStartX = 0;
    let touchEndX = 0;

    storybook.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });

    storybook.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });

    function handleSwipe() {
        const swipeThreshold = 50;
        const swipeDistance = touchEndX - touchStartX;

        if (Math.abs(swipeDistance) > swipeThreshold) {
            if (swipeDistance > 0 && currentPage > 1) {
                updatePage(currentPage - 1);
            } else if (swipeDistance < 0 && currentPage < pages.length) {
                updatePage(currentPage + 1);
            }
        }
    }
});
