async function apiCall(endpoint, method = "GET", data = null) {
    const response = await fetch(`http://localhost:5500${endpoint}`, {
        method,
        headers: {
            "Content-Type": "application/json",
        },
        body: data ? JSON.stringify(data) : undefined,
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(result.message || "Request failed");
    }

    return result;
}

function showFormMessage(form, message) {
    let messageBox = form.querySelector(".form-message");
    if (!messageBox) {
        messageBox = document.createElement("p");
        messageBox.className = "form-message";
        form.insertBefore(messageBox, form.firstChild);
    }
    messageBox.textContent = message;
}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".password-toggle").forEach((button) => {
        button.addEventListener("click", () => {
            const targetId = button.getAttribute("data-target");
            const input = document.getElementById(targetId);
            if (!input) return;

            const isPassword = input.type === "password";
            input.type = isPassword ? "text" : "password";
            button.textContent = isPassword ? "Hide" : "Show";
            button.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");
        });
    });

    const loginForm = document.getElementById("login-form");
    const signupForm = document.getElementById("signup-form");

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;

            try {
                const data = await apiCall("/auth/login", "POST", { email, password });
                localStorage.setItem("authToken", data.token);
                localStorage.setItem("userData", JSON.stringify(data.user));
                window.location.href = "index.html";
            } catch (error) {
                showFormMessage(loginForm, error.message);
            }
        });
    }

    if (signupForm) {
        signupForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const username = document.getElementById("username").value.trim();
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;
            const firstName = document.getElementById("first-name").value.trim();
            const role = document.getElementById("role").value;
            const confirmPassword = document.getElementById("confirmpassword").value;

            if (password !== confirmPassword) {
                showFormMessage(signupForm, "Passwords do not match");
                return;
            }

            try {
                const data = await apiCall("/auth/signup", "POST", {
                    username,
                    email,
                    password,
                    firstName,
                    role,
                });
                localStorage.setItem("authToken", data.token);
                localStorage.setItem("userData", JSON.stringify(data.user));
                window.location.href = "index.html";
            } catch (error) {
                showFormMessage(signupForm, error.message);
            }
        });
    }
});
