/**
 * Instant Navigation with Prefetching
 * Prefetches pages on hover for instant navigation
 * Hides images until they're loaded
 */

(function() {
    'use strict';

    // Track prefetched pages
    const prefetchedPages = new Set();

    /**
     * Prefetch a page's HTML content using link prefetch
     */
    function prefetchPage(url) {
        if (prefetchedPages.has(url)) {
            return;
        }

        // Use browser's native prefetching
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        link.as = 'document';
        document.head.appendChild(link);
        
        prefetchedPages.add(url);
    }

    /**
     * Setup image loading - hide images until loaded
     */
    function setupImageLoading() {
        const images = document.querySelectorAll('img:not([data-image-setup])');
        
        images.forEach(img => {
            // Mark as being set up
            img.setAttribute('data-image-setup', 'true');
            
            // Hide image initially with CSS
            img.style.opacity = '0';
            img.style.transition = 'opacity 0.3s ease-in';
            
            // If image is already loaded, show it immediately
            if (img.complete && img.naturalHeight !== 0) {
                img.style.opacity = '1';
                return;
            }

            // Load image asynchronously
            const imageLoader = new Image();
            
            imageLoader.onload = function() {
                // Update the actual image src if needed (for lazy loading)
                if (img.src !== this.src) {
                    img.src = this.src;
                }
                // Fade in the image
                requestAnimationFrame(() => {
                    img.style.opacity = '1';
                });
            };
            
            imageLoader.onerror = function() {
                // Show image even on error (fallback will handle it)
                img.style.opacity = '1';
            };
            
            // Start loading
            imageLoader.src = img.src || img.dataset.src || '';
        });
    }

    /**
     * Prefetch all navigation links on the page
     */
    function prefetchNavigationLinks() {
        const navLinks = document.querySelectorAll('a[href^="/"]:not([href^="//"]):not([href^="http"])');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && href !== window.location.pathname && !href.includes('#')) {
                prefetchPage(href);
            }
        });
    }

    /**
     * Initialize on page load
     */
    function init() {
        // Setup image loading for current page
        setupImageLoading();

        // Prefetch navigation links on hover for instant navigation
        const navLinks = document.querySelectorAll('a[href^="/"]:not([href^="//"]):not([href^="http"])');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            
            if (href && href !== window.location.pathname && !href.includes('#')) {
                // Prefetch on hover (triggers immediately on first hover)
                link.addEventListener('mouseenter', function() {
                    prefetchPage(href);
                }, { once: true });
                
                // Also prefetch on touchstart for mobile
                link.addEventListener('touchstart', function() {
                    prefetchPage(href);
                }, { once: true, passive: true });
            }
        });

        // Prefetch navigation links in background after a short delay
        setTimeout(prefetchNavigationLinks, 500);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Re-setup images when new content is added (for lazy loading)
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                setupImageLoading();
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();
