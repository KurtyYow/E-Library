const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'library.db');
const schemaPath = path.join(__dirname, 'database', 'schema.sql');

const db = new sqlite3.Database(dbPath);

const schemaSql = fs.readFileSync(schemaPath, 'utf8');

db.serialize(() => {
    // Execute schema
    db.exec(schemaSql, (err) => {
        if (err) {
            console.error("Error executing schema:", err.message);
            return;
        }
        
        db.get("SELECT COUNT(*) as count FROM books", (err, row) => {
            if (err) return console.error(err.message);
            
            if (row.count >= 200) {
                console.log("Database already contains 200+ books.");
                db.close();
                return;
            }

            const categories = ["Computer Science", "Information Technology", "Mathematics", "Fiction", "History", "Physics"];
            const stmt = db.prepare(`
                INSERT INTO books (title, author, category, description, download_url, is_legal_open_access)
                VALUES (?, ?, ?, ?, ?, 1)
            `);

            for (let i = 1; i <= 200; i++) {
                const cat = categories[i % categories.length];
                const authorChar = String.fromCharCode(65 + (i % 26));
                stmt.run(
                    `Open Access Volume ${i}: Foundations of ${cat}`,
                    `Author ${authorChar}. Smith`,
                    cat,
                    `Comprehensive open library study material for volume ${i}.`,
                    `https://open.library.reference/download/pdf/book_${i}.pdf`
                );
            }

            stmt.finalize(() => {
                console.log("Successfully seeded database with 200 unique books!");
                db.close();
            });
        });
    });
});