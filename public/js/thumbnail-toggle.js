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

    // Handle size toggle button
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            // Find anchor element before layout change
            const anchor = getAnchorElement();
            
            isSmall = !isSmall;
            
            // Toggle the class on the container
            if (isSmall) {
                container.classList.add('thumbnails-small');
                smallerOption?.classList.add('active');
                largerOption?.classList.remove('active');
            } else {
                container.classList.remove('thumbnails-small');
                smallerOption?.classList.remove('active');
                largerOption?.classList.add('active');
            }

            // Restore scroll position to keep anchor element in place
            restoreScrollPosition(anchor);
        });

        // Initialize: larger is active by default
        if (largerOption) {
            largerOption.classList.add('active');
        }
    }

    // Handle grid toggle button
    if (gridBtn) {
        gridBtn.addEventListener('click', () => {
            // Find anchor element before layout change
            const anchor = getAnchorElement();
            
            isGrid = !isGrid;
            
            // Toggle the grid class on the container
            if (isGrid) {
                container.classList.add('thumbnails-grid');
                listOption?.classList.remove('active');
                gridOption?.classList.add('active');
            } else {
                container.classList.remove('thumbnails-grid');
                listOption?.classList.add('active');
                gridOption?.classList.remove('active');
            }

            // Restore scroll position to keep anchor element in place
            restoreScrollPosition(anchor);
        });

        // Initialize: list is active by default
        if (listOption) {
            listOption.classList.add('active');
        }
    }
});
