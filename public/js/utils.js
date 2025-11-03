export const TYPING_SPEED_MS = 10; 

/**
 * Helper function to simulate a typewriter effect on an element.
 * It iterates through the text and uses setTimeout to delay character insertion.
 * @param {HTMLElement} element - The DOM element (span or a) to type the text into.
 * @param {string} text - The full string of text to be typed.
 */
export function typeText(element, text) {
    return new Promise(resolve => {
        let i = 0;
        
        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, TYPING_SPEED_MS);
            } else {
                resolve();
            }
        }
        
        type();
    });
}
