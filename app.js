const API_BASE = "http://127.0.0.1:8000/api";
let authToken = localStorage.getItem("token") || null;
let currentCategory = "";

document.addEventListener("DOMContentLoaded", () => {
    fetchBooks();
    checkExistingSession();
});

// --- CATALOG & BOOKS FETCHING ---
async function fetchBooks() {
    const query = document.getElementById("searchInput").value;
    const url = `${API_BASE}/books?search=${encodeURIComponent(query)}&category=${encodeURIComponent(currentCategory)}`;
    
    try {
        const res = await fetch(url);
        const data = await res.json();
        
        document.getElementById("bookCount").innerText = `${data.total} Books Available`;
        
        const catalog = document.getElementById("bookCatalog");
        catalog.innerHTML = data.books.map(book => `
            <div class="book-card">
                <div>
                    <span class="card-category">${book.category}</span>
                    <h4>${book.title}</h4>
                    <p class="card-author">By ${book.author}</p>
                </div>
                <button class="btn-download" onclick="downloadBook(${book.id})">Get Access</button>
            </div>
        `).join('');
    } catch (err) {
        document.getElementById("bookCount").innerText = "Server Offline";
    }
}

// --- AUTHENTICATION & DATABASE FUNCTIONS ---

function toggleAuthModal() {
    document.getElementById("authModal").classList.toggle("hidden");
}

async function register() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) {
        alert("Please enter both username and password.");
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email: `${username}@library.com`, password })
        });
        const data = await res.json();

        if (res.ok) {
            alert("Registration successful! You can now click 'Sign In'.");
        } else {
            alert(`Registration Failed: ${data.detail || 'Username already exists.'}`);
        }
    } catch (e) {
        alert("Backend server connection failed. Make sure 'npm start' is running in VS Code terminal!");
    }
}

async function login() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) {
        alert("Please enter both username and password.");
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();

        if (res.ok) {
            authToken = data.token;
            localStorage.setItem("token", authToken);
            localStorage.setItem("username", data.user.username);
            
            updateUserUI(data.user.username, data.user.download_count);
            toggleAuthModal();
            alert(`Welcome back, ${data.user.username}! You now have Registered User access (10 max downloads).`);
        } else {
            alert(`Login Failed: ${data.detail || 'Invalid username or password.'}`);
        }
    } catch (e) {
        alert("Backend server connection failed. Make sure 'npm start' is running in VS Code terminal!");
    }
}

function checkExistingSession() {
    const savedUser = localStorage.getItem("username");
    if (authToken && savedUser) {
        updateUserUI(savedUser, 0);
    }
}

function updateUserUI(username, downloadCount = 0) {
    const pill = document.getElementById("userStatusPill");
    if (pill) {
        pill.innerHTML = `<span class="dot user-dot"></span><span>User: <strong>${username}</strong> (${downloadCount}/10 Downloads)</span>`;
    }
    
    const loginBtn = document.getElementById("loginBtn");
    if (loginBtn) {
        loginBtn.innerText = "Sign Out";
        loginBtn.onclick = logout;
    }
}

function logout() {
    authToken = null;
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    location.reload();
}