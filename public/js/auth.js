
// In /js/auth.js
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('form[action="/login"]');
    const registerForm = document.querySelector('form[action="/register"]');
    const messageDiv = document.createElement('div');
    messageDiv.style.padding = '10px';
    messageDiv.style.margin = '10px 0';
    messageDiv.style.borderRadius = '5px';
    messageDiv.style.textAlign = 'center';

    function showMessage(message, isError = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message-container';
        const messageContent = document.createElement('div');
        messageContent.className = isError ? 'error-message' : 'success-message';
        messageContent.textContent = message;
        messageDiv.appendChild(messageContent);
        
        // Insert at the top of the body, right after the nav
        const nav = document.querySelector('nav');
        nav.parentNode.insertBefore(messageDiv, nav.nextSibling);
    
        // Fade out after 5 seconds
        setTimeout(() => {
            messageDiv.style.opacity = '0';
            setTimeout(() => messageDiv.remove(), 1000);
        }, 5000);
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(loginForm);
            
            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username: formData.get('username'),
                        password: formData.get('password')
                    })
                });

                const data = await response.json();
                if (response.ok && data.success) {
                    window.location.href = data.redirect;
                } else {
                    showMessage(data.error || 'Login failed', true);
                }
            } catch (error) {
                console.error('Login error:', error);
                showMessage('Login failed. Please try again.', true);
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(registerForm);
            
            if (formData.get('password') !== formData.get('confirm_password')) {
                showMessage('Passwords do not match', true);
                return;
            }

            try {
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username: formData.get('username'),
                        password: formData.get('password'),
                        confirm_password: formData.get('confirm_password'),
                        real_name: formData.get('real_name')
                    })
                });

                const data = await response.json();
                if (response.ok && data.success) {
                    showMessage(data.message);
                    registerForm.reset();
                } else {
                    showMessage(data.error || 'Registration failed', true);
                }
            } catch (error) {
                console.error('Registration error:', error);
                showMessage('Registration failed. Please try again.', true);
            }
        });
    }
});
