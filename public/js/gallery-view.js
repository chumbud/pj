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
let mainScrollContent; // ADDED: Global variable for the scrollable container

// Helper function to centralize error/fallback display logic
function displayFallbackMessage(title, description) {
    const mainTitle = document.getElementById('main-title');
    const mainDescription = document.getElementById('main-description');
    const mainPlaceholder = document.getElementById('loading-placeholder');
    const mainImage = document.getElementById('main-image');

    if (mainTitle) mainTitle.textContent = title;
    if (mainDescription) mainDescription.innerHTML = description;
    
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


document.addEventListener('DOMContentLoaded', () => {
    // 1. Retrieve pagination metadata
    const totalPagesElement = document.getElementById('total-pages');
    const currentPageElement = document.getElementById('current-page');

    if (totalPagesElement && currentPageElement) {
        totalPages = parseInt(totalPagesElement.dataset.value);
        currentPage = parseInt(currentPageElement.dataset.value);
    } else {
        console.error('Lazy loading metadata not found.');
        displayFallbackMessage("Initialization Error", "Metadata elements not found.");
        return;
    }

    // 2. Format the last updated date
    const lastUpdatedElement = document.getElementById('last-updated-date');
    if (lastUpdatedElement) {
        const isoString = lastUpdatedElement.dataset.timestamp;
        const date = new Date(isoString);
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

    // 3. Attach thumbnail click listeners
    const thumbnails = document.querySelectorAll('.gallery-thumbnail-link');
    thumbnails.forEach(link => {
        link.addEventListener('click', handleThumbnailClick);
    });

    // 4. Set the first block as the default selected item, with error resilience
    if (thumbnails.length > 0) {
        try {
            displayBlockDetails(thumbnails[0]);
            thumbnails[0].classList.add('selected-thumbnail');
        } catch (e) {
            console.error("CRITICAL ERROR: Failed to display the first block.", e);
            displayFallbackMessage("Critical Error Loading Block", "The first mineral's data is corrupted or the display failed. Try clicking a different thumbnail.");
        }
    } else {
        // Fallback display if no thumbnails were rendered
        displayFallbackMessage("No Image Blocks Available", "The channel either contains no images on the first page, or there was an error loading the initial content.");
    }
    
    // 5. FIND AND ATTACH SCROLL LISTENER TO THE NEW CONTAINER
    mainScrollContent = document.getElementById('main-scroll-content');
    if (mainScrollContent) {
        // We now listen for scroll events on the specific element, not the window
        mainScrollContent.addEventListener('scroll', handleScroll); // CHANGED: Listen on the element
    } else {
        console.error('CRITICAL ERROR: #main-scroll-content element not found. Vertical scroll and sync will fail.');
    }

    // Initial display check - if page 1 is the only page, stop loader.
    const loader = document.getElementById('loading-spinner');
    if (currentPage >= totalPages) {
        loader.textContent = "";
    }
});

/**
 * Updates the main display area with the details of the clicked block.
 * @param {HTMLElement} linkElement - The thumbnail anchor element that was clicked.
 */
function displayBlockDetails(linkElement) {
    const originalUrl = linkElement.dataset.originalUrl;
    const title = linkElement.dataset.title;
    // Store the raw content string from the data attribute
    const rawContent = linkElement.dataset.content || '""';
    
    let contentToRender = "";
    const mainImage = document.getElementById('main-image');
    const mainTitle = document.getElementById('main-title');
    const mainDescription = document.getElementById('main-description');
    const mainPlaceholder = document.getElementById('loading-placeholder');

    // 1. Attempt to parse the JSON content
    try {
        // Use JSON.parse to safely decode the data-content attribute
        contentToRender = JSON.parse(rawContent);
        // If content is empty after parsing, provide a helpful default
        if (contentToRender === null || contentToRender === "") {
             contentToRender = "<p><em>No description provided for this rock.</em></p>";
        }
    } catch (e) {
        console.error("JSON.parse failed on data-content. Raw content:", rawContent, e);
        // Diagnostic Fallback: If JSON.parse fails, use the raw data content.
        contentToRender = "<strong>DEBUG: PARSE FAILED.</strong> Raw Data Attribute Content:<br>" + rawContent.replace(/^"|"$/g, '');
    }

    // 2. Format the content for HTML display
    let finalHtmlContent = String(contentToRender || '');

    // FIX: Convert newlines (\n) to <br> tags for proper HTML line breaks
    finalHtmlContent = finalHtmlContent.replace(/\n/g, '<br>');


    // 3. Update Title and Content
    if (mainTitle) mainTitle.textContent = title;
    if (mainDescription) mainDescription.innerHTML = finalHtmlContent; // Use innerHTML to render as HTML

    // 4. Load Main Image with Placeholder
    if (mainImage && mainPlaceholder && originalUrl) {
        // Show Placeholder and clear previous image data
        mainPlaceholder.style.display = 'flex';
        mainPlaceholder.textContent = 'Loading Image...';
        mainImage.style.display = 'none';
        mainImage.src = '';

        // Load the new image
        mainImage.src = originalUrl;

        mainImage.onload = () => {
            mainPlaceholder.style.display = 'none'; // Hide placeholder
            mainImage.style.display = 'block'; // Show loaded image
        };

        mainImage.onerror = () => {
            mainPlaceholder.style.display = 'flex';
            mainPlaceholder.textContent = 'Error Loading Image'; // Change placeholder text on error
            mainImage.style.display = 'none'; // Keep image hidden
        };
    }

    // 5. Update the 'selected' class on thumbnails
    document.querySelectorAll('.gallery-thumbnail-link').forEach(link => {
        link.classList.remove('selected-thumbnail');
    });
    linkElement.classList.add('selected-thumbnail');
}

/**
 * Handles the click event on a thumbnail to update the main display.
 * @param {Event} e - The click event object.
 */
function handleThumbnailClick(e) {
    const linkElement = e.target.closest('.gallery-thumbnail-link');
    if (!linkElement) return;

    e.preventDefault();
    displayBlockDetails(linkElement);
}

/**
 * Renders newly fetched block thumbnails from the API.
 * @param {Array<Object>} blocks - Array of block objects from the API.
 */
function renderBlocks(blocks) {
    const container = document.getElementById('channel-content');
    if (!container) return;

    const fragment = document.createDocumentFragment();
    const newLinkElements = [];
    let currentBlockIndex = container.children.length; // Start index for new blocks

    blocks.forEach(block => {
        // We only want image blocks for the gallery view
        if (block.image && block.image.thumb) {
            const blockDiv = document.createElement('div');
            blockDiv.className = 'channel-block-thumbnail';

            const link = document.createElement('a');
            link.href = 'javascript:void(0);';
            link.className = 'gallery-thumbnail-link';
            
            // NOTE: Must use block.description in EJS to get human-entered text
            const content = JSON.stringify(block.description || ''); 

            link.dataset.index = currentBlockIndex++;
            link.dataset.originalUrl = block.image.original.url;
            link.dataset.thumbUrl = block.image.thumb.url;
            link.dataset.title = block.title || 'Are.na Image Block';
            link.dataset.content = content; 

            const img = document.createElement('img');
            img.src = block.image.thumb.url;
            img.alt = block.title || 'Are.na Image Block';
            img.onerror = function() {
                this.onerror = null;
                this.src = 'https://placehold.co/100x75?text=Error';
            };

            link.appendChild(img);
            blockDiv.appendChild(link);
            fragment.appendChild(blockDiv);
            newLinkElements.push(link);
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
    const channelSlug = document.getElementById('channel-slug').dataset.value;

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