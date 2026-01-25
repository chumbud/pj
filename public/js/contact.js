/**
 * Contact Form Modal
 */
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('contact-modal');
    const openBtn = document.getElementById('contact-btn');
    const mobileOpenBtn = document.getElementById('mobile-contact-btn');
    const closeBtn = document.getElementById('contact-close-btn');
    const form = document.getElementById('contact-form');
    const statusEl = document.getElementById('contact-status');
    const submitBtn = document.getElementById('contact-submit');

    if (!modal) return;

    // Open modal function
    function openModal(e) {
        e.preventDefault();
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        // Clear previous status
        statusEl.textContent = '';
        statusEl.className = 'contact-status';
    }

    // Open modal from desktop nav
    if (openBtn) {
        openBtn.addEventListener('click', openModal);
    }

    // Open modal from mobile links
    if (mobileOpenBtn) {
        mobileOpenBtn.addEventListener('click', openModal);
    }

    // Close modal
    function closeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }

    closeBtn.addEventListener('click', closeModal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            closeModal();
        }
    });

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('contact-email').value;
        const message = document.getElementById('contact-message').value;
        const honeypot = document.getElementById('website-url').value;

        // Check honeypot - if filled, it's likely a bot
        if (honeypot) {
            // Silently fail - don't alert bots
            return;
        }

        // Disable button and show loading
        submitBtn.disabled = true;
        submitBtn.textContent = 'sending...';
        statusEl.textContent = '';
        statusEl.className = 'contact-status';

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, message }),
            });

            const data = await response.json();

            if (response.ok) {
                statusEl.textContent = 'sent! i\'ll get back to you soon :)';
                statusEl.className = 'contact-status success';
                form.reset();
                // Close modal after 2 seconds
                setTimeout(closeModal, 2000);
            } else {
                throw new Error(data.error || 'Failed to send message');
            }
        } catch (error) {
            console.error('Contact form error:', error);
            statusEl.textContent = 'oops, something went wrong. try again?';
            statusEl.className = 'contact-status error';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'send';
        }
    });
});
