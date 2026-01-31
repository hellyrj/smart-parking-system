document.addEventListener('DOMContentLoaded', function() {
    console.log("Contact page loaded");
    
    // Initialize user info
    const userEmail = localStorage.getItem('userEmail');
    if (userEmail) {
        document.getElementById('userEmail').textContent = userEmail;
    }
    
    // FAQ Accordion Functionality
    initFAQAccordion();
    
    // Contact Form Submission
    initContactForm();
});

function initFAQAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            // Close all other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                }
            });
            
            // Toggle current item
            item.classList.toggle('active');
        });
    });
}

function initContactForm() {
    const form = document.getElementById('contactForm');
    const submitBtn = document.getElementById('submitBtn');
    const successMessage = document.getElementById('successMessage');
    
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validate form
        if (!validateForm()) {
            return;
        }
        
        // Disable submit button and show loading
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        
        try {
            // Simulate API call (replace with actual API call)
            await simulateFormSubmission();
            
            // Show success message
            successMessage.classList.add('show');
            form.reset();
            
            // Hide success message after 5 seconds
            setTimeout(() => {
                successMessage.classList.remove('show');
            }, 5000);
            
            console.log("Contact form submitted successfully");
            
        } catch (error) {
            console.error("Form submission error:", error);
            showNotification('Error submitting form. Please try again.', 'error');
        } finally {
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
        }
    });
    
    // Real-time validation
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('blur', () => {
            validateField(input);
        });
    });
}

function validateForm() {
    const form = document.getElementById('contactForm');
    let isValid = true;
    
    const requiredFields = ['name', 'email', 'subject', 'message'];
    
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (!validateField(field)) {
            isValid = false;
        }
    });
    
    return isValid;
}

function validateField(field) {
    const errorElement = document.getElementById(field.id + 'Error');
    
    // Clear previous error
    errorElement.textContent = '';
    errorElement.classList.remove('show');
    
    // Check if field is empty
    if (!field.value.trim()) {
        errorElement.textContent = 'This field is required';
        errorElement.classList.add('show');
        return false;
    }
    
    // Email validation
    if (field.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(field.value.trim())) {
            errorElement.textContent = 'Please enter a valid email address';
            errorElement.classList.add('show');
            return false;
        }
    }
    
    // Message length validation
    if (field.id === 'message' && field.value.trim().length < 10) {
        errorElement.textContent = 'Message must be at least 10 characters long';
        errorElement.classList.add('show');
        return false;
    }
    
    return true;
}

function simulateFormSubmission() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ success: true });
        }, 1500);
    });
}

function showNotification(message, type = 'info') {
    // You can use the same notification function from other pages
    console.log(`${type}: ${message}`);
    
    // Create a temporary notification if needed
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: var(--radius);
        background: var(--card-bg);
        border-left: 4px solid ${type === 'error' ? 'var(--danger)' : 'var(--secondary)'};
        box-shadow: var(--shadow-lg);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 4000);
}