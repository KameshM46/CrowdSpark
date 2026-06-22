// Authentication page functionality

// Handle login form submission
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const data = await apiCall('/auth/login', 'POST', { email, password });
                
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userData', JSON.stringify(data.user));
                
                showSuccess('Login successful!');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } catch (error) {
                showError('Login failed. Please check your credentials.');
            }
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const firstName = document.getElementById('first-name').value;
            const role = document.getElementById('role').value;
            const confirmPassword = document.getElementById('confirmpassword').value;
            if(password !== confirmPassword){
            alert("Passwords do not match");
            return;
        }

            try {
                const data = await apiCall('/auth/signup', 'POST', {
                    username,
                    email,
                    password,
                    firstName,
                    role
                });
                
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userData', JSON.stringify(data.user));
                
                showSuccess('Account created successfully!');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } catch (error) {
                showError('Signup failed. Please try again.');
            }
        });
    }
});
