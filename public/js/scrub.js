document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('animation-container');
    
    // --- Configuration Constants ---
    const COLS = 5;       
    const ROWS = 7;       
    const FRAME_COUNT = 31; 
    
    const FRAME_WIDTH = 250;  
    const FRAME_HEIGHT = 250; 
    
    const ANIMATION_SPEED_MS = 100;
    const PIXELS_PER_FRAME = 20;    // Sensitivity: 20 pixels of drag = 1 frame change
    // ----------------------------------

    let isDragging = false;
    let initialStartX = 0;   // Stores the X position when drag starts
    let currentFrame = 0; 
    let initialFrame = 0;    // Stores the frame when drag starts
    let timerId = null; 

    // --- Frame Update Function ---
    const updateFrame = (frameIndex) => {
        // Ensure frame index is positive and loops within FRAME_COUNT
        const frame = (frameIndex % FRAME_COUNT + FRAME_COUNT) % FRAME_COUNT; 
        
        const col = frame % COLS;
        const row = Math.floor(frame / COLS);
        
        const xPos = -(col * FRAME_WIDTH);
        const yPos = -(row * FRAME_HEIGHT);
        
        container.style.backgroundPosition = `${xPos}px ${yPos}px`;
        currentFrame = frame;
    };
    
    // --- Animation Control Functions (Unchanged) ---
    
    const startAnimation = () => {
        if (timerId) clearInterval(timerId); 
        timerId = setInterval(() => {
            updateFrame(currentFrame + 1); 
        }, ANIMATION_SPEED_MS);
    };

    const stopAnimation = () => {
        if (timerId) {
            clearInterval(timerId);
            timerId = null;
        }
    };

    // --- Interaction (Drag) Event Handlers ---
    
    const startDrag = (e) => {
        isDragging = true;
        stopAnimation(); // PAUSE the animation
        
        // Store the initial state when the drag begins
        initialStartX = e.clientX || e.touches[0].clientX;
        initialFrame = currentFrame; 
        
        container.style.cursor = 'grabbing';
    };

    const onDrag = (e) => {
        if (!isDragging) return;

        const clientX = e.clientX || e.touches[0].clientX;
        
        // **KEY FIX:** Calculate the total drag distance from the *initial* start position
        const dragDistance = clientX - initialStartX;
        
        // Calculate the total number of frames that should have been advanced/retreated
        // Note: Math.round() is often better here than Math.floor() for backward scrolling consistency
        const frameOffset = Math.round(dragDistance / PIXELS_PER_FRAME);
        
        // Calculate the target frame by adding the offset to the initial frame
        const targetFrame = initialFrame + frameOffset;

        // Only update if the target frame is different from the current frame
        if (targetFrame !== currentFrame) {
            updateFrame(targetFrame);
        }
        // IMPORTANT: Do NOT update initialStartX here.
    };

    const stopDrag = () => {
        if (isDragging) {
            isDragging = false;
            container.style.cursor = 'grab';
            startAnimation(); // RESUME the animation
        }
    };

    // --- Event Listeners (Unchanged) ---
    container.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', onDrag);
    window.addEventListener('mouseup', stopDrag);
    
    container.addEventListener('touchstart', (e) => startDrag(e));
    window.addEventListener('touchmove', (e) => onDrag(e));
    window.addEventListener('touchend', stopDrag);

    // --- Initialization (Unchanged) ---
    updateFrame(0);
    startAnimation();
});