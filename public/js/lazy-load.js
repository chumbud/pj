/**
 * Infinite Scroll / Lazy Loading Logic for Are.na Blocks
 * * This script handles scroll detection, API fetching, and displaying full-resolution
 * * images in a modal, now with a loading placeholder.
 */

// Global variables initialized from EJS template data passed via hidden data-attributes
let currentPage = 1;
let totalPages = 1;
let isFetching = false; // Flag to prevent multiple concurrent fetches
const fetchedPages = new Set([1]); // Track which pages have been fetched (page 1 is pre-rendered)
let currentModalLink = null; // Track the currently displayed image link for keyboard navigation

document.addEventListener('DOMContentLoaded', () => {
    // 1. Retrieve pagination metadata passed from the server via hidden elements
    const totalPagesElement = document.getElementById('total-pages');
    const currentPageElement = document.getElementById('current-page');

    if (totalPagesElement && currentPageElement) {
        totalPages = parseInt(totalPagesElement.dataset.value);
        currentPage = parseInt(currentPageElement.dataset.value);
    } else {
        console.error('Lazy loading metadata not found. Check likes.ejs footer for data-attributes.');
        return;
    }

    const loader = document.getElementById('loading-spinner');

    // Initial display check - if page 1 is the only page, stop here.
    if (currentPage >= totalPages) {
        loader.textContent = "End of Channel.";
    }

    // 2. Attach the scroll listener to the window
    window.addEventListener('scroll', handleScroll);

    // 3. Set up the Modal event listener (close buttons, etc.)
    setupModalListeners();

    // 4. Attach click listeners to all existing image blocks for the modal
    document.querySelectorAll('.image-link').forEach(link => {
        link.addEventListener('click', handleImageClick);
    });

    const lastUpdatedElement = document.getElementById('last-updated-date');
    if (lastUpdatedElement) {
        const isoString = lastUpdatedElement.dataset.timestamp;
        const date = new Date(isoString);
        
        // Format the date for display (e.g., "Oct 26, 2025 at 10:30 PM")
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        
        lastUpdatedElement.textContent = formattedDate;
    }
});

/**
 * Handles the click event on an image link to open the modal.
 * @param {Event} e - The click event object.
 */
function handleImageClick(e) {
    const linkElement = e.target.closest('.image-link');

    // Only proceed if a link element was found
    if (!linkElement) return;

    e.preventDefault();

    openModalFromLink(linkElement);
}

/**
 * Opens the modal from a link element.
 * @param {HTMLElement} linkElement - The image link element to display.
 */
function openModalFromLink(linkElement) {
    const originalUrl = linkElement.dataset.originalUrl;
    const title = linkElement.dataset.title;
    const sourceUrl = linkElement.dataset.sourceUrl;

    if (originalUrl) {
        currentModalLink = linkElement; // Track current link for keyboard nav
        openModal(originalUrl, title, sourceUrl);
    }
}

/**
 * Shows the modal and loads the high-resolution image with a placeholder.
 * @param {string} url - The URL of the original image.
 * @param {string} title - The title of the image (for alt text/display).
 * @param {string} sourceUrl - The external link URL for the block's source.
 */
function openModal(url, title, sourceUrl) {
    const modal = document.getElementById('full-image-modal');
    const modalImg = document.getElementById('modal-image');
    const modalTitleElement = document.getElementById('modal-title');
    const modalTitleLink = document.getElementById('modal-title-link');
    const modalPlaceholder = document.getElementById('modal-placeholder');

    if (modal && modalImg && modalPlaceholder && modalTitleElement && modalTitleLink) {
        // 1. Show Placeholder and Clear Previous Image
        modalPlaceholder.style.display = 'flex';
        modalPlaceholder.innerHTML = 'Loading Full Image...';
        modalImg.style.display = 'none';
        modalImg.src = '';

        // SET TITLE TEXT AND LINK HREF
        modalTitleElement.textContent = title;
        modalTitleLink.href = sourceUrl || '#'; // Fallback to '#' if the sourceUrl is empty/null
        modalTitleLink.target = '_blank'; // Ensure it opens in a new tab

        // 2. Display Modal and Stop Scroll
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevent background scrolling

        // 3. Start Loading the New Image
        modalImg.src = url;

        // 4. Define handlers for when the new image is done loading
        modalImg.onload = () => {
            modalPlaceholder.style.display = 'none'; // Hide placeholder
            modalImg.style.display = 'block'; // Show loaded image
        };

        // 5. Define what happens if the image fails to load
        modalImg.onerror = () => {
            modalPlaceholder.style.display = 'flex';
            modalPlaceholder.innerHTML = 'Error Loading Image'; // Change placeholder text on error
            modalImg.style.display = 'none'; // Keep image hidden
        };
    }
}

/**
 * Hides the modal.
 */
function closeModal() {
    const modal = document.getElementById('full-image-modal');
    const modalImg = document.getElementById('modal-image');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = ''; // Restore background scrolling
        // Clear the image source when closing the modal to save memory
        modalImg.src = '';
        currentModalLink = null; // Clear tracked link
    }
}

/**
 * Navigates to a random block from the entire channel (not just loaded blocks).
 */
async function navigateToRandomBlock() {
    const modalPlaceholder = document.getElementById('modal-placeholder');
    const modalImg = document.getElementById('modal-image');
    
    // Show loading state
    if (modalPlaceholder) {
        modalPlaceholder.style.display = 'flex';
        modalPlaceholder.innerHTML = 'Finding random block...';
    }
    if (modalImg) {
        modalImg.style.display = 'none';
    }
    
    try {
        const response = await fetch('/api/random-block');
        
        if (!response.ok) {
            throw new Error('Failed to fetch random block');
        }
        
        const data = await response.json();
        
        // Clear current link tracking since this block may not be in the DOM
        currentModalLink = null;
        
        // Open the random block in the modal
        openModal(data.block.originalUrl, data.block.title, data.block.sourceUrl);
        
    } catch (error) {
        console.error('Error fetching random block:', error);
        if (modalPlaceholder) {
            modalPlaceholder.innerHTML = 'Error loading random block';
        }
    }
}

/**
 * Shakes the modal image as feedback when user can't navigate further.
 */
function shakeModalImage() {
    const modalImg = document.getElementById('modal-image');
    const modalPlaceholder = document.getElementById('modal-placeholder');
    const target = modalImg.style.display !== 'none' ? modalImg : modalPlaceholder;
    
    target.classList.add('shake');
    setTimeout(() => target.classList.remove('shake'), 300);
}

/**
 * Navigates to the previous or next image in the modal.
 * @param {string} direction - 'prev' or 'next'
 */
async function navigateModal(direction) {
    if (!currentModalLink) return;

    const allLinks = Array.from(document.querySelectorAll('.image-link'));
    const currentIndex = allLinks.indexOf(currentModalLink);

    if (currentIndex === -1) return;

    if (direction === 'prev') {
        if (currentIndex === 0) {
            // At first block, shake as feedback
            shakeModalImage();
            return;
        }
        openModalFromLink(allLinks[currentIndex - 1]);
    } else {
        if (currentIndex === allLinks.length - 1) {
            // At last block, try to load more
            if (currentPage < totalPages && !isFetching) {
                await fetchMoreBlocks();
                // Check if new blocks were added
                const updatedLinks = Array.from(document.querySelectorAll('.image-link'));
                if (updatedLinks.length > allLinks.length) {
                    openModalFromLink(updatedLinks[currentIndex + 1]);
                } else {
                    // No more blocks to load, shake as feedback
                    shakeModalImage();
                }
            } else {
                // Already at end of channel, shake as feedback
                shakeModalImage();
            }
            return;
        }
        openModalFromLink(allLinks[currentIndex + 1]);
    }
}

/**
 * Sets up the close handlers for the modal overlay.
 */
function setupModalListeners() {
    const modal = document.getElementById('full-image-modal');
    const closeBtn = document.getElementById('modal-close-btn');

    if (modal) {
        // Close via close button
        closeBtn.addEventListener('click', closeModal);

        // Close via clicking the backdrop
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        // Keyboard controls when modal is open
        document.addEventListener('keydown', (e) => {
            if (modal.style.display !== 'flex') return;

            switch (e.key) {
                case 'Escape':
                    closeModal();
                    break;
                case 'a':
                case 'A':
                case 'ArrowLeft':
                    navigateModal('prev');
                    break;
                case 'd':
                case 'D':
                case 'ArrowRight':
                    navigateModal('next');
                    break;
                case 's':
                case 'S':
                    navigateToRandomBlock();
                    break;
            }
        });
    }
}


/**
 * Renders newly fetched blocks from the API.
 * @param {Array<Object>} blocks - Array of block objects from the API.
 */
function renderBlocks(blocks) {
    const container = document.getElementById('channel-content');
    if (!container) return;

    // Use a DocumentFragment for efficient DOM insertion
    const fragment = document.createDocumentFragment();
    const newLinkElements = []; // Store new link elements for listener attachment
    const newBlockDivs = []; // Store new block divs for animation delay

    blocks.forEach(block => {
        if (block.image && block.image.original) {
            // Create the main block div
            const blockDiv = document.createElement('div');
            blockDiv.className = 'channel-block';

            // Create the clickable anchor tag
            const link = document.createElement('a');
            link.href = 'javascript:void(0);';
            link.className = 'image-link';
            link.dataset.originalUrl = block.image.original.url;
            link.dataset.title = block.title || 'Are.na Image Block';

            link.dataset.sourceUrl = (block.source && block.source.url) ? block.source.url : '#';

            // Create the image element
            const img = document.createElement('img');
            img.src = block.image.thumb.url;
            img.alt = block.title || 'Are.na Image Block';
            img.onerror = function() {
                this.onerror = null;
                this.src = 'https://placehold.co/400x300/F0F0F0/606060?text=Image+Error';
            };

            // Assemble the block: link -> img, blockDiv -> link
            link.appendChild(img);
            blockDiv.appendChild(link);
            fragment.appendChild(blockDiv);

            // Keep track of the new link element and block div
            newLinkElements.push(link);
            newBlockDivs.push(blockDiv);

        } else if (block.content) {
            const blockDiv = document.createElement('div');
            blockDiv.className = 'channel-block';
            const contentDiv = document.createElement('div');
            contentDiv.className = 'content';
            contentDiv.innerHTML = block.content;
            blockDiv.appendChild(contentDiv);
            fragment.appendChild(blockDiv);
            newBlockDivs.push(blockDiv);
        }
    });

    // Set staggered animation delays on new blocks
    newBlockDivs.forEach((blockDiv, index) => {
        blockDiv.style.setProperty('--i', index);
    });

    // Append all new blocks to the container at once
    container.appendChild(fragment);

    // Attach click listeners to the new image links
    newLinkElements.forEach(link => {
        link.addEventListener('click', handleImageClick);
    });
}

/**
 * Fetches the next page of blocks from the server API.
 */
async function fetchMoreBlocks() {
    if (isFetching || currentPage >= totalPages) {
        // If already fetching or at the end of content, do nothing.
        return;
    }

    const nextPage = currentPage + 1;
    
    // Prevent fetching the same page twice
    if (fetchedPages.has(nextPage)) {
        currentPage = nextPage;
        return;
    }

    isFetching = true;
    currentPage = nextPage;
    fetchedPages.add(currentPage); // Mark this page as fetched
    const loader = document.getElementById('loading-spinner');

    // Show loading indicator
    loader.style.display = 'block';

    try {
        const response = await fetch(`/api/blocks?page=${currentPage}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.blocks.length > 0) {
            renderBlocks(data.blocks);
        }

        // Update total pages in case it changed (less common)
        totalPages = data.totalPages;

    } catch (error) {
        console.error('Error fetching more blocks:', error);
        // Remove from fetched set and decrement page count if failed, so it can be retried
        fetchedPages.delete(currentPage);
        currentPage -= 1;
        loader.textContent = "Error loading content. Try refreshing.";

    } finally {
        isFetching = false;

        // Hide spinner or show "end of content" message
        if (currentPage >= totalPages) {
            loader.textContent = "End of Channel.";
        } else {
            loader.style.display = 'none';
        }
    }
}

/**
 * Checks if the user has scrolled near the bottom of the page.
 */
function handleScroll() {
    const scrollThreshold = 300; // Load when user is 300px from the bottom

    // Check if we are near the bottom of the document
    if ((window.innerHeight + window.scrollY + scrollThreshold) >= document.body.offsetHeight) {
        fetchMoreBlocks();
    }
}
