import http from "node:http";
import url from "node:url";
import Database from "better-sqlite3";
import path from "node:path";

// Database setup
const dbPath = path.join(process.cwd(), "users.db");
let db: Database.Database;

// Initialize database
const initDatabase = () => {
  db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      isAdmin INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  // Indexes for better performance
  db.exec(`CREATE INDEX IF NOT EXISTS idx_users_name ON users(name)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_users_isAdmin ON users(isAdmin)`);
};

type User = {
  id: number;
  name: string;
  age: number;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
};

export const createMyServer = (): http.Server => {
  // Initialize database when server is created
  initDatabase();

  const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url || "", true);
    res.setHeader("Content-Type", "application/json");

    // GET /users
    if (req.method === "GET" && parsedUrl.pathname === "/users") {
      const stmt = db.prepare("SELECT * FROM users");
      const users = stmt.all();
      res.writeHead(200);
      res.end(JSON.stringify(users));
      return;
    }

    // POST /users
    if (req.method === "POST" && parsedUrl.pathname === "/users") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        try {
          const data = JSON.parse(body);
          if (!data.name || typeof data.age !== "number") {
            res.writeHead(400);
            res.end(JSON.stringify({ message: "Name and age are required" }));
            return;
          }

          const now = new Date().toISOString();
          const stmt = db.prepare(
            "INSERT INTO users (name, age, isAdmin, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)"
          );
          const result = stmt.run(
            data.name,
            data.age,
            data.isAdmin ? 1 : 0,
            now,
            now
          );

          const newUser: User = {
            id: result.lastInsertRowid as number,
            name: data.name,
            age: data.age,
            isAdmin: !!data.isAdmin,
            createdAt: now,
            updatedAt: now,
          };

          res.writeHead(201);
          res.end(JSON.stringify(newUser));
        } catch (err) {
          res.writeHead(400);
          res.end(JSON.stringify({ message: "Invalid request body" }));
        }
      });
      return;
    }

    // 404 fallback
    res.writeHead(404);
    res.end(JSON.stringify({ message: "Not found" }));
  });

  return server;
};

export const resetMyServerData = () => {
  try {
    if (db) {
      db.prepare("DELETE FROM users").run();
      db.prepare("DELETE FROM sqlite_sequence WHERE name = 'users'").run();
      console.log("Database reset completed");
    }
  } catch (error) {
    console.error("Error resetting database:", error);
  }
};

// Clean up database connection on process exit
process.on("exit", () => {
  if (db) {
    db.close();
  }
});

process.on("SIGINT", () => {
  if (db) {
    db.close();
  }
  process.exit(0);
});

process.on("SIGTERM", () => {
  if (db) {
    db.close();
  }
  process.exit(0);
});
