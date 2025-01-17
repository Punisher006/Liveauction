// Base URL for API requests
const API_BASE_URL = "http://localhost:5000";

// Check if the user is authenticated
function checkAuthentication() {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("Authentication required. Please log in.");
        window.location.href = "login.html";
    }
}

// Verify if the user exists in the system
async function checkUserExists(email) {
    try {
        const response = await fetch(`${API_BASE_URL}/check-user`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email }),
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Failed to verify user.");
        }

        return result.exists; // true if user exists, false otherwise
    } catch (error) {
        console.error("Error checking user existence:", error);
        alert("Unable to verify account. Please try again later.");
        return false;
    }
}

// Log out the user
function logout() {
    localStorage.removeItem("token");
    alert("You have been logged out.");
    window.location.href = "login.html";
}

// Event listener for logout functionality
document.addEventListener("DOMContentLoaded", () => {
    const logoutButton = document.getElementById("logoutButton");
    if (logoutButton) {
        logoutButton.addEventListener("click", logout);
    }

    // Check authentication on pages requiring login
    const protectedPages = ["bidding.html"];
    const currentPage = window.location.pathname.split("/").pop();

    if (protectedPages.includes(currentPage)) {
        checkAuthentication();
    }
});

// Form submission for login
document.getElementById("login-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // Check if the user exists
    const userExists = await checkUserExists(email);

    if (!userExists) {
        alert("Account not found. Please register first.");
        window.location.href = "createAccount.html";
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Login failed.");
        }

        localStorage.setItem("token", result.token);
        alert("Login successful!");
        window.location.href = "bidding.html";
    } catch (error) {
        console.error("Login error:", error);
        alert("Login failed. Please check your credentials.");
    }
});

// Form submission for account creation
document.getElementById("create-account-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Registration failed.");
        }

        alert("Account created successfully! Please log in.");
        window.location.href = "login.html";
    } catch (error) {
        console.error("Registration error:", error);
        alert("Registration failed. Please try again.");
    }
});
