// YIPPEE Counter functionality with anime.js
class YippeeCounter {
    constructor() {
        this.ticker = document.getElementById('yippee-ticker');
        this.button = document.getElementById('yippee-button');
        
        // Check if required elements exist
        if (!this.ticker || !this.button) {
            console.error('YippeeCounter: Required elements not found. Ticker:', !!this.ticker, 'Button:', !!this.button);
            return;
        }
        
        this.digitContainers = this.ticker.querySelectorAll('.ticker-digit');
        this.digits = Array.from(this.digitContainers).map(container => container.querySelector('.ticker-digit-content'));
        this.message = document.getElementById('someone-yippeed-message');
        this.locationValue = document.getElementById('last-yippee-location-value');
        this.currentCount = 0;
        this.pendingIncrements = 0;
        this.socket = null;
        this.isLocalIncrement = false; // Track if increment is from local user
        this.currentLocation = null; // Store current user's location
        this.tapSound = null; // For tap sound
        
        // Array of yippee GIF images - all numbered by ID
        this.yippeeImages = [
            '/img/01-yippee-parrot.png',
            '/img/02-yippee-mario.png',
            '/img/03-yippee-wohooo.png',
            '/img/04-yippee-character.png',
            '/img/05-yippee-frog.png',
            '/img/06-yippee-cathappi.png',
            '/img/07-yippee-excited.png',
            '/img/08-yippee-milk.png',
            '/img/09-yippee-happy.png',
            '/img/10-yippee-kit.png',
            '/img/11-peanutbutterjellytime.png',
            '/img/12-hamtaroblushie.png',
            '/img/13-hyperheadbang.png',
            '/img/14-scarlettshuffle.png',
            '/img/15-blj.png',
            '/img/16-hypee.png',
            '/img/17-hyperblob.png',
            '/img/18-kittydance.png',
            '/img/19-shogihyperwiggle.png',
            '/img/20-cardclinicau67.png'
        ];
        
        // Store preloaded Image objects for instant cloning
        this.preloadedImages = [];
        // Store blob URLs for each image to force fresh animation instances
        this.imageBlobUrls = [];
        this.imagesReady = false;
        
        // Preload images and wait for them to fully load
        this.preloadImages();
        
        this.init();
    }
    
    async preloadImages() {
        // Preload all images and create blob URLs for fresh animation instances
        const loadPromises = this.yippeeImages.map(async (src) => {
            try {
                // Fetch the image as a blob
                const response = await fetch(src);
                if (!response.ok) {
                    console.warn(`Failed to fetch image: ${src}`);
                    this.preloadedImages.push(null);
                    this.imageBlobUrls.push(null);
                    return null;
                }
                
                const blob = await response.blob();
                // Create a blob URL that we can reuse
                const blobUrl = URL.createObjectURL(blob);
                
                // Also create a regular Image for compatibility
                const img = new Image();
                await new Promise((resolve, reject) => {
                    img.onload = async () => {
                        try {
                            if (img.decode) {
                                await img.decode();
                            }
                        } catch (e) {
                            // decode() may not be supported in all browsers
                        }
                        resolve(img);
                    };
                    img.onerror = reject;
                    img.src = blobUrl;
                });
                
                this.preloadedImages.push(img);
                this.imageBlobUrls.push(blobUrl);
                return { img, blobUrl };
            } catch (error) {
                console.warn(`Failed to preload image: ${src}`, error);
                this.preloadedImages.push(null);
                this.imageBlobUrls.push(null);
                return null;
            }
        });
        
        try {
            await Promise.all(loadPromises);
            this.imagesReady = true;
            console.log('All yippee images preloaded, decoded, and ready!');
        } catch (error) {
            console.warn('Some images failed to preload:', error);
            this.imagesReady = true; // Still allow usage even if some failed
        }
    }
    
    async init() {
        // Wait for anime.js to load
        await this.waitForAnime();
        
        // Small delay to ensure easing is registered
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Connect to WebSocket for real-time updates
        this.connectWebSocket();
        
        // Load from cache first for instant display
        this.loadFromCache();
        
        // Then sync with server in background
        this.loadCount();
        
        // Get user's location
        this.getUserLocation();
        
        // Set up button click handler - allow spam clicking
        if (this.button) {
            this.button.addEventListener('click', () => {
                this.playTapSound();
                this.spawnYippeeGif();
                this.increment();
            });
        }
        
        // Initialize tap sound
        this.initTapSound();

        this.setupMobileOffset();
    }
    
    initTapSound() {
        // Load the tap sound audio file
        try {
            this.tapSound = new Audio('/js/type.mp3');
            this.tapSound.preload = 'auto';
            this.tapSound.volume = 1.0; // Set volume to 100%
        } catch (e) {
            console.warn('Error loading tap sound:', e);
        }
    }

    setupMobileOffset() {
        const likeBubble = document.querySelector('.like-bubble');
        const yippeeContainer = document.querySelector('.yippee-counter-container');
        if (!likeBubble || !yippeeContainer) {
            return;
        }

        const root = document.documentElement;
        const mediaQuery = window.matchMedia('(max-width: 76.8rem)');
        const gapPx = 12;
        let resizeObserver = null;
        let resizeHandler = null;

        const updateOffset = () => {
            if (!mediaQuery.matches) {
                root.style.removeProperty('--yippee-mobile-offset');
                return;
            }

            root.style.setProperty('--yippee-mobile-offset', '0px');

            const bubbleRect = likeBubble.getBoundingClientRect();
            const yippeeRect = yippeeContainer.getBoundingClientRect();
            const overlaps =
                bubbleRect.right > yippeeRect.left &&
                bubbleRect.left < yippeeRect.right &&
                bubbleRect.bottom > yippeeRect.top &&
                bubbleRect.top < yippeeRect.bottom;

            if (overlaps) {
                root.style.setProperty('--yippee-mobile-offset', `${bubbleRect.height + gapPx}px`);
            }
        };

        const enableMobileOffset = () => {
            updateOffset();

            if (!resizeHandler) {
                resizeHandler = () => updateOffset();
                window.addEventListener('resize', resizeHandler);
            }

            if (!resizeObserver && window.ResizeObserver) {
                resizeObserver = new ResizeObserver(updateOffset);
                resizeObserver.observe(likeBubble);
            }
        };

        const disableMobileOffset = () => {
            root.style.removeProperty('--yippee-mobile-offset');

            if (resizeHandler) {
                window.removeEventListener('resize', resizeHandler);
                resizeHandler = null;
            }

            if (resizeObserver) {
                resizeObserver.disconnect();
                resizeObserver = null;
            }
        };

        const handleBreakpointChange = () => {
            if (mediaQuery.matches) {
                enableMobileOffset();
            } else {
                disableMobileOffset();
            }
        };

        handleBreakpointChange();

        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleBreakpointChange);
        } else if (mediaQuery.addListener) {
            mediaQuery.addListener(handleBreakpointChange);
        }
    }
    
    playTapSound() {
        if (!this.tapSound) {
            this.initTapSound();
            if (!this.tapSound) return;
        }
        
        try {
            // Reset to beginning and play
            this.tapSound.currentTime = 0;
            this.tapSound.play().catch(e => {
                // Ignore play errors (e.g., user hasn't interacted yet)
                console.warn('Could not play tap sound:', e);
            });
        } catch (e) {
            console.warn('Error playing tap sound:', e);
        }
    }
    
    spawnYippeeGif() {
        if (!this.button || !this.yippeeImages || this.yippeeImages.length === 0) return;
        if (!this.imagesReady) return; // Don't spawn if images aren't ready
        
        // Get button position
        const buttonRect = this.button.getBoundingClientRect();
        const scrollY = window.scrollY || window.pageYOffset;
        
        // Randomly select an image
        const randomIndex = Math.floor(Math.random() * this.yippeeImages.length);
        const imageSrc = this.yippeeImages[randomIndex];
        const preloadedImg = this.preloadedImages[randomIndex];
        
        // Random x position within button bounds
        const imageWidth = 50;
        const minX = buttonRect.left + imageWidth / 2;
        const maxX = buttonRect.left + buttonRect.width - imageWidth / 2;
        const randomX = minX + Math.random() * (maxX - minX);
        
        // Create wrapper div - optimized for GPU acceleration
        const wrapper = document.createElement('div');
        wrapper.setAttribute('data-yippee-gif', 'true');
        wrapper.className = 'yippee-gif-wrapper';
        // Use transform3d to force GPU layer, will-change for optimization hint
        wrapper.style.cssText = `
            position: fixed;
            left: ${randomX}px;
            top: ${buttonRect.top + scrollY}px;
            width: 50px;
            height: 50px;
            pointer-events: none;
            z-index: 9999;
            transform: translate3d(-50%, -50%, 0);
            opacity: 1;
            will-change: transform, opacity;
            backface-visibility: hidden;
            perspective: 1000px;
        `;
        
        // Use preloaded image directly - clone it to get a fresh instance
        // Since it's already loaded, we can use it immediately without waiting for onload
        let img;
        if (preloadedImg && preloadedImg.complete && preloadedImg.naturalWidth > 0) {
            // Clone the preloaded image element - this creates a fresh instance
            // but the image data is already loaded, so it's instant
            img = preloadedImg.cloneNode(false);
            img.setAttribute('data-image-setup', 'true');
            
            // Force animation restart by removing and re-adding src
            const originalSrc = img.src;
            img.removeAttribute('src');
            // Force a reflow
            void img.offsetWidth;
            // Set src back - this forces browser to restart animation
            img.src = originalSrc;
        } else {
            // Fallback: create new image if preloaded isn't ready
            img = document.createElement('img');
            img.setAttribute('data-image-setup', 'true');
            const uniqueId = performance.now() + Math.random();
            const separator = imageSrc.includes('?') ? '&' : '?';
            img.src = `${imageSrc}${separator}_t=${uniqueId}`;
        }
        
        // Set image styles - optimize for GPU
        img.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: contain;
            opacity: 1;
            display: block;
            transform: translateZ(0);
            backface-visibility: hidden;
        `;
        
        // Batch DOM operations - append both at once
        wrapper.appendChild(img);
        document.body.appendChild(wrapper);
        
        // Start animation on next frame - single RAF for better performance
        requestAnimationFrame(() => {
            wrapper.style.animation = 'yippeeFloat 1s ease-out forwards';
        });
        
        // Clean up after animation completes - use animationend event for precision
        const cleanup = () => {
            if (wrapper.parentNode) {
                wrapper.parentNode.removeChild(wrapper);
            }
        };
        
        // Listen for animation end for precise cleanup, fallback to timeout
        wrapper.addEventListener('animationend', cleanup, { once: true });
        setTimeout(cleanup, 1100); // Fallback timeout slightly longer than animation
    }
    
    
    spawnYippeeGifFallback(randomImage, buttonRect, scrollY) {
        // Fallback method if images aren't preloaded yet
        const imageWidth = 50;
        const minX = buttonRect.left + imageWidth / 2;
        const maxX = buttonRect.left + buttonRect.width - imageWidth / 2;
        const randomX = minX + Math.random() * (maxX - minX);
        
        const wrapper = document.createElement('div');
        wrapper.setAttribute('data-yippee-gif', 'true');
        wrapper.style.cssText = `
            position: fixed;
            left: ${randomX}px;
            top: ${buttonRect.top + scrollY}px;
            width: 50px;
            height: 50px;
            pointer-events: none;
            z-index: 9999;
            transform: translate(-50%, -50%);
            opacity: 1;
            transition: none !important;
            will-change: transform, opacity;
        `;
        
        const img = document.createElement('img');
        img.setAttribute('data-image-setup', 'true');
        img.src = randomImage;
        img.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: contain;
            opacity: 1 !important;
            transition: none !important;
        `;
        
        wrapper.appendChild(img);
        document.body.appendChild(wrapper);
        
        const anime = window.anime;
        anime({
            targets: wrapper,
            translateY: [0, -100],
            scale: [1, 1.2],
            duration: 1000,
            easing: 'easeOutQuint'
        });
        
        const startTime = performance.now();
        const fadeStartTime = 750;
        const fadeDuration = 250;
        
        function updateOpacity() {
            const elapsed = performance.now() - startTime;
            
            if (elapsed < fadeStartTime) {
                wrapper.style.opacity = '1';
                requestAnimationFrame(updateOpacity);
            } else if (elapsed < fadeStartTime + fadeDuration) {
                const fadeProgress = (elapsed - fadeStartTime) / fadeDuration;
                wrapper.style.opacity = String(Math.max(0, 1 - fadeProgress));
                requestAnimationFrame(updateOpacity);
            } else {
                wrapper.style.opacity = '0';
                setTimeout(() => {
                    if (wrapper.parentNode) {
                        wrapper.parentNode.removeChild(wrapper);
                    }
                }, 50);
            }
        }
        
        requestAnimationFrame(updateOpacity);
    }
    
    connectWebSocket() {
        // Wait for socket.io to be available
        if (typeof io === 'undefined') {
            // Retry after a short delay
            setTimeout(() => this.connectWebSocket(), 100);
            return;
        }
        
        // Connect to socket.io server
        // Use default configuration - let Socket.IO handle transport negotiation
        this.socket = io();
        
        // Handle connection events
        this.socket.on('connect', () => {
            console.log('Socket.IO connected successfully');
        });
        
        this.socket.on('connect_error', (error) => {
            console.warn('Socket.IO connection error:', error.message);
        });
        
        this.socket.on('disconnect', (reason) => {
            // Only log if it's not a normal transport close during reconnection
            if (reason !== 'transport close' && reason !== 'io server disconnect') {
                console.log('Socket.IO disconnected:', reason);
            }
        });
        
        // Listen for counter updates from other users
        this.socket.on('yippee-update', (data) => {
                const serverCount = data.count || 0;
                
                // Update location display if provided
                if (data.location) {
                    this.updateLocationDisplay(data.location);
                }
                
                // Only update if it's different and not from our own increment
                if (serverCount !== this.currentCount && !this.isLocalIncrement) {
                    const oldCount = this.currentCount;
                    this.currentCount = serverCount;
                    this.updateDisplay(this.currentCount, false);
                    
                    // Update cache
                    localStorage.setItem('yippee-count', serverCount.toString());
                    
                    // Show "someone yippee'd!" message and highlight digits
                    this.showSomeoneYippeedMessage();
                    
                    // Animate the change
                    this.animateTicker(oldCount, serverCount);
                }
                
                // Reset flag after processing
                setTimeout(() => {
                    this.isLocalIncrement = false;
                }, 100);
            });
        
        // Handle reconnection
        this.socket.on('connect', () => {
            // Request current count on reconnect
            this.loadCount();
        });
    }
    
    async waitForAnime() {
        // Wait for anime.js to be available
        while (!window.anime) {
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        // Register custom spring easing
        this.registerSpringEasing();
    }
    
    // Register custom spring easing function matching bounce: 0.65
    // Creates a strong bouncy spring effect
    registerSpringEasing() {
        const anime = window.anime;
        
        // anime.js v3 requires easings to be registered in anime.easings object
        // Ensure easings object exists (it should be initialized by anime.js)
        if (typeof anime.easings === 'undefined') {
            anime.easings = {};
        }
        
        // Register custom spring easing function matching bounce: 0.65
        // Use a function declaration (not arrow) for proper binding
        anime.easings.strongSpring = function(t) {
            if (t === 0) return 0;
            if (t === 1) return 1;
            
            // Strong bounce effect (bounce: 0.65)
            // ElasticOut easing with strong bounce parameter
            const c4 = (2 * Math.PI) / 3;
            const overshoot = 0.65;
            const elastic = Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4);
            // Normalize and apply bounce
            return 1 + elastic * overshoot;
        };
        
        // Verify it was registered
        if (!anime.easings.strongSpring) {
            console.warn('Failed to register strongSpring easing');
        }
    }
    
    getSpringEasing() {
        // Use built-in easeOutElastic which provides a strong bounce effect
        // This is close to what we want and works reliably in anime.js v3
        return 'easeOutElastic';
    }
    
    loadFromCache() {
        // Load from localStorage cache for instant display
        const cached = localStorage.getItem('yippee-count');
        if (cached !== null) {
            const cachedCount = parseInt(cached, 10);
            if (!isNaN(cachedCount)) {
                this.currentCount = cachedCount;
                this.updateDisplay(this.currentCount, false);
            }
        }
    }
    
    async loadCount() {
        try {
            const response = await fetch('/api/yippee');
            const data = await response.json();
            const serverCount = data.count || 0;
            
            // Only update if server count differs from cached count
            if (serverCount !== this.currentCount) {
                this.currentCount = serverCount;
                this.updateDisplay(this.currentCount, false);
            }
            
            // Update cache
            localStorage.setItem('yippee-count', serverCount.toString());
            
            // Update location display if provided, otherwise show placeholder
            if (data.location) {
                this.updateLocationDisplay(data.location);
            } else {
                this.updateLocationDisplay(null);
            }
        } catch (error) {
            console.error('Error loading YIPPEE count:', error);
            // Show placeholder on error
            this.updateLocationDisplay(null);
        }
    }
    
    increment() {
        // Mark as local increment to prevent double-animation from WebSocket
        this.isLocalIncrement = true;
        
        // Optimistic update - animate immediately without waiting for API
        const optimisticCount = this.currentCount + 1;
        
        // Animate immediately for instant feedback
        this.animateTicker(this.currentCount, optimisticCount);
        this.currentCount = optimisticCount;
        
        // Update cache immediately
        localStorage.setItem('yippee-count', optimisticCount.toString());
        
        // Fire API call in background (non-blocking)
        // Server will broadcast update via WebSocket to all clients
        fetch('/api/yippee/increment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                location: this.currentLocation
            })
        })
        .then(response => {
            // Check if response is ok before parsing JSON
            if (!response.ok) {
                return response.json().then(errorData => {
                    const errorMsg = errorData.error || `Server error: ${response.status}`;
                    const details = errorData.details ? ` (${errorData.details})` : '';
                    throw new Error(errorMsg + details);
                }).catch(() => {
                    // If JSON parsing fails, throw generic error
                    throw new Error(`Server error: ${response.status}`);
                });
            }
            return response.json();
        })
        .then(data => {
            // Check if data.count exists before using it
            if (data && typeof data.count !== 'undefined') {
                const serverCount = data.count;
                
                // Update cache with server value
                localStorage.setItem('yippee-count', serverCount.toString());
                
                // Update location display if provided
                if (data.location) {
                    this.updateLocationDisplay(data.location);
                }
                
                // Sync if needed (should match optimistic count, but handle race conditions)
                if (serverCount !== this.currentCount) {
                    const oldCount = this.currentCount;
                    this.currentCount = serverCount;
                    const oldStr = this.formatCount(oldCount);
                    const newStr = this.formatCount(serverCount);
                    if (oldStr !== newStr) {
                        this.animateTicker(oldCount, serverCount);
                    }
                }
            }
            
            // Reset flag after a short delay
            setTimeout(() => {
                this.isLocalIncrement = false;
            }, 200);
        })
        .catch(error => {
            console.error('Error incrementing YIPPEE count:', error);
            this.isLocalIncrement = false;
            // On error, revert to server state by fetching current count
            this.loadCount();
        });
    }
    
    formatCount(count) {
        return String(count).padStart(7, '0');
    }
    
    updateDisplay(count, animate = true) {
        const countStr = this.formatCount(count);
        
        this.digits.forEach((digit, index) => {
            if (digit) {
                digit.textContent = countStr[index];
            }
        });
    }
    
    showSomeoneYippeedMessage() {
        if (!this.message) return;
        
        // Show the message
        this.message.classList.add('show');
        
        // Highlight all digit containers
        this.digitContainers.forEach(container => {
            container.classList.add('highlight');
        });
        
        // Fade out after 1.5s
        setTimeout(() => {
            this.message.classList.remove('show');
            this.digitContainers.forEach(container => {
                container.classList.remove('highlight');
            });
        }, 1500);
    }
    
    async getUserLocation() {
        try {
            // Use backend proxy to avoid CORS issues
            const response = await fetch('/api/location');
            if (!response.ok) {
                // If server returns error status, log but don't throw
                console.warn('Location API returned error status:', response.status);
                return;
            }
            const data = await response.json();
            
            // Check if response contains an error message
            if (data.error) {
                console.warn('Location API error:', data.error);
                return;
            }
            
            // Only set location if we have valid data
            if (data.city && data.region && data.countryCode) {
                this.currentLocation = {
                    city: data.city,
                    region: data.region,
                    countryCode: data.countryCode
                };
            }
        } catch (error) {
            console.warn('Error getting location:', error.message);
            // Silently fail - location is optional
        }
    }
    
    getCountryFlag(countryCode) {
        if (!countryCode || countryCode.length !== 2) return '';
        
        // Convert country code to flag emoji
        // Each flag emoji is made of two regional indicator symbols (U+1F1E6 to U+1F1FF)
        const upperCode = countryCode.toUpperCase();
        
        // Validate that both characters are A-Z
        if (!/^[A-Z]{2}$/.test(upperCode)) {
            return '';
        }
        
        const codePoints = [
            0x1F1E6 + (upperCode.charCodeAt(0) - 65), // First letter
            0x1F1E6 + (upperCode.charCodeAt(1) - 65)  // Second letter
        ];
        
        try {
            return String.fromCodePoint(...codePoints);
        } catch (e) {
            console.error('Error generating flag emoji:', e, countryCode);
            return '';
        }
    }
    
    updateLocationDisplay(location) {
        if (!this.locationValue) return;
        
        if (!location) {
            // Show placeholder if no location
            this.locationValue.textContent = '...';
            return;
        }
        
        const { city, region, countryCode } = location;
        if (city && region) {
            let locationText = `${city}, ${region}`;
            
            if (countryCode) {
                const flag = this.getCountryFlag(countryCode);
                if (flag) {
                    this.locationValue.textContent = `${locationText} ${flag}`;
                } else {
                    this.locationValue.textContent = locationText;
                }
            } else {
                this.locationValue.textContent = locationText;
            }
        } else {
            this.locationValue.textContent = '...';
        }
    }
    
    animateTicker(oldCount, newCount) {
        const anime = window.anime;
        const oldStr = this.formatCount(oldCount);
        const newStr = this.formatCount(newCount);
        
        // Cancel ALL existing animations immediately for instant response
        // AND reset transforms to prevent stuck digits
        this.digits.forEach(digit => {
            if (digit) {
                anime.remove(digit);
                // Reset transform properties to prevent stuck digits
                digit.style.transform = '';
                digit.style.opacity = '';
                digit.style.translateY = '';
                digit.style.scale = '';
            }
        });
        anime.remove(this.ticker);
        
        // Update digits that changed
        this.digits.forEach((digit, index) => {
            if (!digit) return;
            
            const oldValue = oldStr[index];
            const newValue = newStr[index];
            
            if (oldValue !== newValue) {
                // Set value immediately
                digit.textContent = newValue;
                
                // Reset position before animating to prevent stuck state
                digit.style.transform = 'translateY(-15px) scale(0.8)';
                digit.style.opacity = '0.5';
                
                // Animate with super strong spring easing (225ms duration - 50% slower)
                // No delay for instant feedback during spam clicking
                anime({
                    targets: digit,
                    translateY: [-15, 0],
                    scale: [0.8, 1],
                    opacity: [0.5, 1],
                    easing: this.getSpringEasing(),
                    duration: 225,
                    complete: () => {
                        // Ensure final state is set after animation completes
                        digit.style.transform = '';
                        digit.style.opacity = '';
                    }
                });
            }
        });
    }
    
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new YippeeCounter();
    });
} else {
    new YippeeCounter();
}
