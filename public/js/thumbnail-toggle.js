/**
 * Thumbnail Toggle Functionality
 * Toggles thumbnail size to 50% smaller
 * Also provides a grid layout option with 1:1 aspect ratio
 * Keeps the center-most thumbnail in place during layout changes
 */

document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('thumbnail-toggle-btn');
    const gridBtn = document.getElementById('thumbnail-grid-btn');
    const scrollTopBtn = document.getElementById('scroll-top-btn');
    
    // Find the container - for likes page it's .arena-feed, for minerals it's .mineral-gallery-container
    const arenaFeed = document.querySelector('.arena-feed');
    const mineralContainer = document.querySelector('.mineral-gallery-container');
    const container = arenaFeed || mineralContainer;
    
    if (!container) return;

    // Set staggered animation delays on individual thumbnails
    const thumbnails = container.querySelectorAll('.channel-block, .channel-block-thumbnail');
    thumbnails.forEach((thumbnail, index) => {
        thumbnail.style.setProperty('--i', index);
    });

    // Scroll to top button handler
    if (scrollTopBtn) {
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // Get the option spans
    const smallerOption = toggleBtn?.querySelector('.option:first-child');
    const largerOption = toggleBtn?.querySelector('.option:last-child');
    const listOption = gridBtn?.querySelector('.option:first-child');
    const gridOption = gridBtn?.querySelector('.option:last-child');

    let isSmall = false;
    let isGrid = false;
    let isUpdatingToggle = false; // Flag to prevent recursive updates
    let lastAspectRatio = null; // Track last aspect ratio to detect threshold crossings

    /**
     * Find the thumbnail element closest to the center of the viewport
     * Returns the element and its offset from viewport center
     */
    function getAnchorElement() {
        // Get all thumbnail elements (works for both likes and minerals pages)
        const thumbnails = container.querySelectorAll('.channel-block, .channel-block-thumbnail');
        if (!thumbnails.length) return null;

        const viewportCenterY = window.scrollY + (window.innerHeight / 2);
        let closestElement = null;
        let closestDistance = Infinity;

        thumbnails.forEach(el => {
            const rect = el.getBoundingClientRect();
            const elementCenterY = window.scrollY + rect.top + (rect.height / 2);
            const distance = Math.abs(elementCenterY - viewportCenterY);

            if (distance < closestDistance) {
                closestDistance = distance;
                closestElement = el;
            }
        });

        if (closestElement) {
            const rect = closestElement.getBoundingClientRect();
            return {
                element: closestElement,
                offsetFromViewportCenter: rect.top + (rect.height / 2) - (window.innerHeight / 2)
            };
        }
        return null;
    }

    /**
     * Restore scroll position to keep the anchor element at the same viewport position
     */
    function restoreScrollPosition(anchor) {
        if (!anchor) return;

        requestAnimationFrame(() => {
            const rect = anchor.element.getBoundingClientRect();
            const currentOffsetFromCenter = rect.top + (rect.height / 2) - (window.innerHeight / 2);
            const scrollAdjustment = currentOffsetFromCenter - anchor.offsetFromViewportCenter;
            
            window.scrollBy(0, scrollAdjustment);
        });
    }

    /**
     * Set the thumbnail size toggle state
     * @param {boolean} shouldBeSmall - true for smaller, false for larger
     * @param {boolean} preserveScroll - whether to preserve scroll position (default: true)
     */
    function setThumbnailSize(shouldBeSmall, preserveScroll = true) {
        if (isSmall === shouldBeSmall) return; // Already in the desired state
        
        // Find anchor element before layout change
        const anchor = preserveScroll ? getAnchorElement() : null;
        
        isSmall = shouldBeSmall;
        
        // Toggle the class on the container and animate slider
        if (isSmall) {
            container.classList.add('thumbnails-small');
            toggleBtn.classList.remove('active-right');
            smallerOption?.classList.add('active');
            largerOption?.classList.remove('active');
        } else {
            container.classList.remove('thumbnails-small');
            toggleBtn.classList.add('active-right');
            smallerOption?.classList.remove('active');
            largerOption?.classList.add('active');
        }

        // Restore scroll position to keep anchor element in place
        if (preserveScroll) {
            restoreScrollPosition(anchor);
        }
    }

    /**
     * Update toggle based on viewport aspect ratio (minus nav)
     * Toggles to smaller when ratio goes under 1:1
     * Only toggles when crossing the threshold, not on every resize
     */
    function updateToggleBasedOnViewport() {
        // Prevent recursive calls
        if (isUpdatingToggle) return;
        
        // Get nav element to calculate available viewport dimensions
        const nav = document.querySelector('.nav');
        const navWidth = nav && window.getComputedStyle(nav).display !== 'none' ? nav.offsetWidth : 0;
        
        // Calculate viewport dimensions minus nav
        const viewportWidth = window.innerWidth - navWidth;
        const viewportHeight = window.innerHeight;
        const aspectRatio = viewportWidth / viewportHeight;
        const threshold = 1; // 1:1 ratio threshold
        
        // Toggle to smaller when ratio goes under 4:3
        const shouldBeSmall = aspectRatio < threshold;
        
        // If already in the correct state, just update lastAspectRatio and return
        if (isSmall === shouldBeSmall) {
            lastAspectRatio = aspectRatio;
            return;
        }
        
        // Only toggle if we've crossed the threshold (not on first check unless needed)
        if (lastAspectRatio !== null) {
            const wasBelowThreshold = lastAspectRatio < threshold;
            const isBelowThreshold = aspectRatio < threshold;
            
            // Only toggle if we crossed the threshold
            if (wasBelowThreshold === isBelowThreshold) {
                // Same side of threshold, don't toggle
                lastAspectRatio = aspectRatio;
                return;
            }
        }
        
        // We crossed the threshold (or this is the first check), update the toggle
        isUpdatingToggle = true;
        setThumbnailSize(shouldBeSmall, false); // Don't preserve scroll on automatic resize
        // Reset flag after a short delay to allow layout to settle
        setTimeout(() => {
            isUpdatingToggle = false;
        }, 200);
        
        lastAspectRatio = aspectRatio;
    }

    // Handle size toggle button
    if (toggleBtn) {
        // Initialize button state to larger (default)
        if (largerOption) {
            largerOption.classList.add('active');
            toggleBtn.classList.add('active-right');
        }
        
        toggleBtn.addEventListener('click', () => {
            isUpdatingToggle = true;
            setThumbnailSize(!isSmall, true);
            
            // Reset lastAspectRatio on manual toggle so it doesn't interfere
            lastAspectRatio = null;
            
            // Reset flag after a delay
            setTimeout(() => {
                isUpdatingToggle = false;
            }, 300);
        });

        // Initialize based on viewport aspect ratio
        updateToggleBasedOnViewport();

        // Watch for window resize to update toggle based on viewport
        let resizeTimeout;
        window.addEventListener('resize', () => {
            if (isUpdatingToggle) return; // Skip if we're already updating
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(updateToggleBasedOnViewport, 100);
        });
    }

    // Handle grid toggle button
    if (gridBtn) {
        gridBtn.addEventListener('click', () => {
            // Find anchor element before layout change
            const anchor = getAnchorElement();
            
            isGrid = !isGrid;
            
            // Toggle the grid class on the container and animate slider
            if (isGrid) {
                container.classList.add('thumbnails-grid');
                gridBtn.classList.add('active-right');
                listOption?.classList.remove('active');
                gridOption?.classList.add('active');
            } else {
                container.classList.remove('thumbnails-grid');
                gridBtn.classList.remove('active-right');
                listOption?.classList.add('active');
                gridOption?.classList.remove('active');
            }

            // Restore scroll position to keep anchor element in place
            restoreScrollPosition(anchor);
        });

        // Initialize: list (left) is active by default
        if (listOption) {
            listOption.classList.add('active');
        }
    }
});
