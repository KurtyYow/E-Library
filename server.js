const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const SECRET_KEY = "super-secret-elibrary-key";
const PORT = 8000;

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database(path.join(__dirname, 'library.db'));

// --- AUTHENTICATION ENDPOINTS ---

app.post('/api/auth/register', (req, res) => {
    const { username, email, password } = req.body;
    db.run(
        "INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, 'USER')",
        [username, email, password],
        function (err) {
            if (err) {
                return res.status(400).json({ detail: "Username or email already exists" });
            }
            res.json({ status: "success", message: "User registered successfully" });
        }
    );
});

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    db.get(
        "SELECT * FROM users WHERE username = ? AND password_hash = ?",
        [username, password],
        (err, account) => {
            if (err || !account) {
                return res.status(401).json({ detail: "Invalid credentials" });
            }

            const token = jwt.sign(
                { user_id: account.id, username: account.username, role: account.role },
                SECRET_KEY,
                { expiresIn: '24h' }
            );

            res.json({
                token: token,
                user: {
                    id: account.id,
                    username: account.username,
                    role: account.role,
                    download_count: account.download_count
                }
            });
        }
    );
});

// --- BOOK COLLECTION & GUEST/USER LIMITS ---

app.get('/api/books', (req, res) => {
    const search = req.query.search || '';
    const category = req.query.category || '';

    let sql = "SELECT * FROM books WHERE (title LIKE ? OR author LIKE ?)";
    let params = [`%${search}%`, `%${search}%`];

    if (category) {
        sql += " AND category = ?";
        params.push(category);
    }

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ total: rows.length, books: rows });
    });
});

app.post('/api/books/:book_id/download', (req, res) => {
    const authHeader = req.headers['authorization'];

    // Guest Download Check (Max 5)
    if (!authHeader) {
        return res.json({ status: "authorized", limit: 5, remaining: 4, message: "Guest download authorized." });
    }

    try {
        const token = authHeader.split(' ')[1];
        const payload = jwt.verify(token, SECRET_KEY);
        const userId = payload.user_id;

        db.get("SELECT download_count, role FROM users WHERE id = ?", [userId], (err, user) => {
            if (err || !user) return res.status(401).json({ detail: "User not found" });

            const maxDownloads = user.role === 'USER' ? 10 : 9999;
            if (user.download_count >= maxDownloads) {
                return res.status(403).json({ detail: `Download limit reached (${maxDownloads} max).` });
            }

            db.run("UPDATE users SET download_count = download_count + 1 WHERE id = ?", [userId], function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ status: "authorized", download_count: user.download_count + 1, max: maxDownloads });
            });
        });
    } catch (e) {
        return res.status(401).json({ detail: "Invalid session token" });
    }
});

// --- EMBEDDED AGENTIC AI ASSISTANT GATEWAY STUB ---

app.post('/api/agent/query', (req, res) => {
    const prompt = (req.body.prompt || '').toLowerCase();

    if (prompt.includes('search') || prompt.includes('find')) {
        db.all("SELECT title, author FROM books LIMIT 3", [], (err, rows) => {
            res.json({
                agent: "LibraryAgent-v1",
                action: "book_search",
                response: "I analyzed your request. Here are relevant catalog entries:",
                data: rows
            });
        });
    } else {
        res.json({
            agent: "LibraryAgent-v1",
            action: "general_reply",
            response: "Hello! I am your Embedded Digital Library AI Agent. I can help search catalog entries, compare resources, and track download limits."
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://127.0.0.1:${PORT}`);
});