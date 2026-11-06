-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'USER', -- 'GUEST', 'USER', 'ADMIN'
    download_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Books Table
CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    download_url TEXT NOT NULL,
    is_legal_open_access INTEGER DEFAULT 1
);

-- Initial Admin Account (Password: admin123)
INSERT OR IGNORE INTO users (id, username, email, password_hash, role)
VALUES (1, 'admin', 'admin@library.com', 'scrypt:32768:8:1$uH3y4Z8...$admin_hashed', 'ADMIN');