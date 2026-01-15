// File: public/js/gallery-view.js

/**
 * Gallery View / Lazy Loading Logic for Are.na Minerals Blocks
 * * This script handles block selection, main content display updates,
 * * lazy loading of new thumbnail blocks, and **ISOLATED scroll synchronization**.
 */

// Global variables initialized from EJS template data
let currentPage = 1;
let totalPages = 1;
let isFetching = false; // Flag to prevent multiple concurrent fetches

// Global variable for the scrollable content container
let mainScrollContent;

// ----------------------------------------------------------------------
// CORE UTILITIES & HELPER FUNCTIONS
// ----------------------------------------------------------------------

/**
 * Basic Sanitizer: Strips all HTML tags except for those you explicitly allow (<br>).
 * It prevents Cross-Site Scripting (XSS) by using textContent for stripping.
 * @param {string} html - The unsanitized string containing <br> tags.
 */
function sanitizeText(html) {
    // 1. Replace all <br> tags with a unique placeholder string
    let protectedHtml = html.replace(/<br>/gi, '___BR_TAG___');
    
    // 2. Use a temporary div to strip ALL other HTML tags.
    // By setting textContent, the browser automatically escapes/strips all tags.
    let tempDiv = document.createElement('div');
    tempDiv.textContent = protectedHtml; 
    
    // 3. Convert the placeholder back to safe <br> tags and return.
    return tempDiv.textContent.replace(/___BR_TAG___/g, '<br>');
}


// Helper function to centralize error/fallback display logic
function displayFallbackMessage(title, description) {
    // FIX: Select all elements with the new classes
    const mainTitles = document.querySelectorAll('.main-title-text');
    const mainDescriptions = document.querySelectorAll('.main-description-text');
    const mainImage = document.getElementById('main-image'); // Unique ID for the main image
    const mainPlaceholder = document.getElementById('loading-placeholder'); // Unique ID for the placeholder

    // Update all matching titles and descriptions
    mainTitles.forEach(el => {
        el.textContent = title;
    });
    mainDescriptions.forEach(el => {
        el.innerHTML = description;
    });
    
    // Clear image elements
    if (mainImage) {
        mainImage.src = '';
        mainImage.style.display = 'none';
    }
    // Show/hide placeholder
    if (mainPlaceholder) {
        mainPlaceholder.textContent = title;
        mainPlaceholder.style.display = 'flex';
    }
}


/**
 * Updates the main display area with the details of the clicked block.
 * @param {HTMLElement} linkElement - The thumbnail anchor element that was clicked.
 */

function displayBlockDetails(linkElement) {
    const originalUrl = linkElement.dataset.originalUrl;
    const title = linkElement.dataset.title;
    const rawJsonContent = linkElement.dataset.content || '""'; 
    
    let contentToRender = "";
    
    // FIX: Use querySelectorAll to select ALL elements with these new classes
    const mainTitles = document.querySelectorAll('.main-title-text');
    const mainDescriptions = document.querySelectorAll('.main-description-text');
    const specialDetailsContainers = document.querySelectorAll('.special-details-area');
    
    // Image and placeholder remain as IDs (assuming they are unique)
    const mainImage = document.getElementById('main-image');
    const mainPlaceholder = document.getElementById('loading-placeholder');

    // Clear all special details areas
    specialDetailsContainers.forEach(container => {
        container.innerHTML = '';
    });

// --- Content Parsing ---
    try {
        const decodedJsonContent = decodeURIComponent(rawJsonContent);

        // Parse the JSON string from the data-attribute
        contentToRender = JSON.parse(decodedJsonContent); 
        
        if (contentToRender === null || contentToRender === "") {
             contentToRender = "No description provided for this mineral.";
        }
    } catch (e) {
        console.error("CRITICAL ERROR: JSON.parse failed on data-content. The raw content was:", rawJsonContent, e);
        displayFallbackMessage(title, "Error loading block content. Check console for details.");
        return; 
    }
    
    let finalHtmlContent = String(contentToRender || '').trim();
    let mainDescriptionHtml = finalHtmlContent;
    let specialDetailsHtml = '';
    
    const delimiter = "\nBLURB:"; 
    const delimiterIndex = finalHtmlContent.indexOf(delimiter);

    if (delimiterIndex !== -1) {
        mainDescriptionHtml = finalHtmlContent.substring(0, delimiterIndex).trim();
        specialDetailsHtml = finalHtmlContent.substring(delimiterIndex + delimiter.length).trim();
    }

    mainDescriptionHtml = mainDescriptionHtml.replace(/\n/g, '<br>');
    specialDetailsHtml = specialDetailsHtml.replace(/\n/g, '<br>');

    const safeMainDescriptionHtml = sanitizeText(mainDescriptionHtml);
    const safeSpecialDetailsHtml = sanitizeText(specialDetailsHtml);
    
    // 4. Update ALL matching Titles and Descriptions
    mainTitles.forEach(el => {
        el.textContent = title;
    });
    
    mainDescriptions.forEach(el => {
        el.innerHTML = safeMainDescriptionHtml;
    });
    
    // 5. Render the special details content in ALL matching containers
    specialDetailsContainers.forEach(container => {
        // Clear container content first
        container.innerHTML = '';
        if (safeSpecialDetailsHtml) {
             container.innerHTML = `<div class="styled-info-box">${safeSpecialDetailsHtml}</div>`;
        }
    });

    // 6. Update the main image
    if (mainImage && mainPlaceholder) {
        mainImage.style.display = 'none'; // Hide image while loading
        mainPlaceholder.style.display = 'flex'; // Show placeholder

        // Set the new image source (full resolution image)
        mainImage.src = originalUrl;
    
        // When the image loads, hide the placeholder and show the image
        mainImage.onload = () => {
            mainPlaceholder.style.display = 'none';
            mainImage.style.display = 'block';
        };
    
        // If image loading fails, show an error message in the placeholder
        mainImage.onerror = () => {
            mainPlaceholder.textContent = "Image failed to load.";
            mainPlaceholder.style.display = 'flex';
            mainImage.style.display = 'none';
        };
    }
}

/**
 * Handles the click event on a thumbnail.
 * @param {Event} event - The click event.
 */
function handleThumbnailClick(event) {
    event.preventDefault();

    // 1. Remove 'selected' class from the currently active thumbnail
    const currentlySelected = document.querySelector('.selected-thumbnail');
    if (currentlySelected) {
        currentlySelected.classList.remove('selected-thumbnail');
    }

    // 2. Add 'selected' class to the clicked thumbnail
    const linkElement = event.currentTarget;
    linkElement.classList.add('selected-thumbnail');

    // 3. Update the main display area
    displayBlockDetails(linkElement);
    
    // 4. Update URL hash for permalink
    const blockId = linkElement.dataset.blockId;
    if (blockId) {
        window.history.replaceState(null, '', `#${blockId}`);
    }
}

/**
 * Fetches a block by ID from the API and displays it in the gallery view.
 */
async function fetchBlockByIdForGallery(blockId) {
    try {
        const response = await fetch(`/api/block-by-id?id=${blockId}&channel=my-rock-slop`);
        if (!response.ok) throw new Error('Failed to fetch block');
        
        const { block } = await response.json();
        const tempLink = Object.assign(document.createElement('a'), {
            className: 'gallery-thumbnail-link',
            dataset: {
                originalUrl: block.originalUrl,
                thumbUrl: block.thumbUrl || block.originalUrl,
                title: block.title,
                content: encodeURIComponent(JSON.stringify('')),
                blockId: block.id
            }
        });
        
        displayBlockDetails(tempLink);
        
        const actualThumbnail = document.querySelector(`[data-block-id="${blockId}"] .gallery-thumbnail-link`);
        if (actualThumbnail) {
            actualThumbnail.classList.add('selected-thumbnail');
            actualThumbnail.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    } catch (error) {
        console.error('Error fetching block by ID:', error);
        displayFallbackMessage("Block Not Found", "The requested block could not be loaded.");
    }
}

// ----------------------------------------------------------------------
// INITIALIZATION & LAZY LOADING LOGIC
// ----------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    // 1. Retrieve pagination metadata
    const totalPagesElement = document.getElementById('total-pages');
    const currentPageElement = document.getElementById('current-page');

    if (totalPagesElement && currentPageElement) {
        totalPages = parseInt(totalPagesElement.dataset.value);
        currentPage = parseInt(currentPageElement.dataset.value);
    } else {
        console.error('Lazy loading metadata not found.');
    }

    // Get the main scrollable container
    mainScrollContent = document.getElementById('main-scroll-content');
    
    // Format last updated date
    const lastUpdatedElement = document.getElementById('last-updated-date');
    if (lastUpdatedElement?.dataset.timestamp) {
        const date = new Date(lastUpdatedElement.dataset.timestamp);
        lastUpdatedElement.textContent = date.toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true
        });
    }

    // 3. Attach click listeners to all existing thumbnails
    const thumbnails = document.querySelectorAll('.gallery-thumbnail-link');
    thumbnails.forEach(link => {
        link.addEventListener('click', handleThumbnailClick);
    });

    // Check for URL hash and display corresponding block, or display first block
    if (!thumbnails.length) {
        displayFallbackMessage("No Blocks Found", "This Are.na channel appears to be empty.");
        return;
    }
    
    const blockId = window.location.hash.substring(1);
    let blockToDisplay = blockId 
        ? document.querySelector(`[data-block-id="${blockId}"] .gallery-thumbnail-link`)
        : null;
    
    if (blockId && !blockToDisplay) {
        fetchBlockByIdForGallery(blockId);
        return;
    }
    
    if (!blockToDisplay) blockToDisplay = thumbnails[0];
    
    try {
        displayBlockDetails(blockToDisplay);
        blockToDisplay.classList.add('selected-thumbnail');
        if (!blockId && blockToDisplay.dataset.blockId) {
            window.history.replaceState(null, '', `#${blockToDisplay.dataset.blockId}`);
        }
    } catch (e) {
        console.error("CRITICAL ERROR: Failed to display the block.", e);
        displayFallbackMessage("Critical Error Loading Block", "The mineral's data is corrupted or the display failed. Check console.");
    }

    // 5. Setup Infinite Scroll Listener
    const loader = document.getElementById('loading-spinner');
    if (currentPage >= totalPages) {
        if (loader) loader.textContent = "";
    } else {
        // Attach the scroll listener to the specific container
        if (mainScrollContent) {
            mainScrollContent.addEventListener('scroll', handleScroll);
        } else {
            console.error("Scroll container #main-scroll-content not found for lazy loading.");
        }
    }
});


/**
 * Renders the new block elements fetched from the API and appends them to the container.
 * @param {Array} blocks - An array of block objects from the Are.na API.
 */
function renderBlocks(blocks) {
    const container = document.getElementById('channel-content');
    if (!container) return;

    const fragment = document.createDocumentFragment();
    const newLinkElements = []; // To store the new anchor elements for click listeners

    blocks.forEach(block => {
        // Only process image blocks with valid image data and ID
        if (block.image && block.image.thumb && block.id) {
            const div = document.createElement('div');
            div.className = 'channel-block-thumbnail';
            div.setAttribute('data-block-id', block.id);

            const a = document.createElement('a');
            a.href = "javascript:void(0);";
            a.className = 'gallery-thumbnail-link';
            a.setAttribute('data-block-id', block.id);

            a.dataset.originalUrl = block.image.original.url;
            a.dataset.thumbUrl = block.image.thumb.url;
            a.dataset.title = block.title || 'Are.na Image Block';
            
            // FIX: Convert content to a JSON string, then URL-encode it for safe embedding
            // into a data-attribute to prevent HTML/JSON string termination errors.
            a.dataset.content = encodeURIComponent(JSON.stringify(block.description || ''));
            const img = document.createElement('img');
            img.src = block.image.thumb.url;
            img.alt = block.title || 'Are.na Image Block';
            img.onerror = function() { this.onerror = null; this.src = 'https://placehold.co/100x75?text=Error'; };

            a.appendChild(img);
            div.appendChild(a);
            fragment.appendChild(div);
            newLinkElements.push(a);
        }
    });

    container.appendChild(fragment);

    // Attach click listeners to the new thumbnails
    newLinkElements.forEach(link => {
        link.addEventListener('click', handleThumbnailClick);
    });
}


/**
 * Fetches the next page of blocks from the server API.
 */
async function fetchMoreBlocks() {
    if (isFetching || currentPage >= totalPages) {
        return;
    }

    isFetching = true;
    currentPage += 1;
    const loader = document.getElementById('loading-spinner');
    const channelSlugElement = document.getElementById('channel-slug');
    const channelSlug = channelSlugElement ? channelSlugElement.dataset.value : 'default-channel'; 

    loader.style.display = 'block';
    loader.textContent = "Loading more blocks...";

    try {
        const response = await fetch(`/api/blocks?page=${currentPage}&channel=${channelSlug}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.blocks.length > 0) {
            renderBlocks(data.blocks);
        }

        totalPages = data.totalPages;

    } catch (error) {
        console.error('Error fetching more blocks:', error);
        currentPage -= 1;
        loader.textContent = "Error loading content. Try refreshing.";

    } finally {
        isFetching = false;

        if (currentPage >= totalPages) {
            loader.textContent = "";
        } else {
            loader.style.display = 'none';
        }
    }
}

// ----------------------------------------------------------------------
// SCROLL SYNC LOGIC
// ----------------------------------------------------------------------

/**
 * Synchronizes the horizontal scroll of the thumbnail strip with the vertical scroll of the main content.
 */
function syncThumbnailScroll() {
    if (!mainScrollContent) return;
    
    const thumbnailStrip = document.getElementById('channel-content');
    if (!thumbnailStrip) return;

    // 1. Get current vertical scroll position (scrollY) and total scrollable height (maxScrollY).
    const scrollY = mainScrollContent.scrollTop;
    const maxScrollY = mainScrollContent.scrollHeight - mainScrollContent.clientHeight;

    // Handle case where content is not scrollable (maxScrollY is 0)
    if (maxScrollY <= 0) {
        return;
    }

    // 2. Calculate the vertical scroll progress as a percentage (0 to 1).
    const scrollPercentage = scrollY / maxScrollY;

    // 3. Calculate the maximum possible horizontal scroll distance for the strip.
    const maxScrollX = thumbnailStrip.scrollWidth - thumbnailStrip.offsetWidth;
    
    if (maxScrollX <= 0) {
        return;
    }

    // 4. Calculate the desired horizontal scroll position.
    let scrollX = maxScrollX * scrollPercentage;
    
    // 5. Apply the calculated scroll position.
    thumbnailStrip.scrollLeft = scrollX;
}


/**
 * Checks if the user has scrolled near the bottom of the page (on the new container) 
 * AND handles horizontal scroll.
 */
function handleScroll() {
    if (!mainScrollContent) return; // Exit if the element is missing

    const scrollThreshold = 300; // Load when user is 300px from the bottom

    // 1. Handle Lazy Loading (using the element's scroll properties)
    // clientHeight is the visible height. scrollTop is the current position. scrollHeight is total height.
    if ((mainScrollContent.clientHeight + mainScrollContent.scrollTop + scrollThreshold) >= mainScrollContent.scrollHeight) {
        fetchMoreBlocks();
    }
    
    // 2. Handle Horizontal Scroll Sync
    syncThumbnailScroll();
}

document.addEventListener('click', function (e) {
    const link = e.target.closest('.gallery-thumbnail-link');
    if (!link) return;
    // Option A: scroll the whole window to top (smooth)
    window.scrollTo({ top: 0, behavior: 'auto' });
});