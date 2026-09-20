// server.js
// Backend for the Task Manager with real user accounts.
// Passwords are hashed with bcrypt (never stored as plain text), and each
// user can only ever see or modify their own tasks — enforced on every route.

const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      httpOnly: true,
    },
  })
);

// Blocks access unless the request has a valid logged-in session.
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'You must be logged in.' });
  }
  next();
}

// ---------- AUTH ----------

app.post('/api/signup', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !username.trim() || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  const cleanUsername = username.trim().toLowerCase();

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(cleanUsername);
  if (existing) {
    return res.status(409).json({ error: 'That username is already taken.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const result = db
    .prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)')
    .run(cleanUsername, passwordHash);

  req.session.userId = Number(result.lastInsertRowid);
  req.session.username = cleanUsername;

  res.status(201).json({ id: result.lastInsertRowid, username: cleanUsername });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const cleanUsername = username.trim().toLowerCase();
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(cleanUsername);

  // Same error for "no such user" and "wrong password" — don't reveal which one.
  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  req.session.userId = user.id;
  req.session.username = user.username;

  res.json({ id: user.id, username: user.username });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

app.get('/api/me', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not logged in.' });
  }
  res.json({ id: req.session.userId, username: req.session.username });
});

// ---------- TASKS (all require login) ----------

app.get('/api/tasks', requireAuth, (req, res) => {
  const tasks = db
    .prepare('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC')
    .all(req.session.userId);
  res.json(tasks);
});

app.post('/api/tasks', requireAuth, (req, res) => {
  const { title } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Task title is required.' });
  }

  const result = db
    .prepare('INSERT INTO tasks (user_id, title) VALUES (?, ?)')
    .run(req.session.userId, title.trim());

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(task);
});

// Toggle completed, or edit the title — and ONLY if it belongs to this user.
app.put('/api/tasks/:id', requireAuth, (req, res) => {
  const task = db
    .prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.session.userId);

  if (!task) {
    return res.status(404).json({ error: 'Task not found.' });
  }

  const title = req.body.title !== undefined ? req.body.title.trim() : task.title;
  const completed = req.body.completed !== undefined ? (req.body.completed ? 1 : 0) : task.completed;

  if (!title) {
    return res.status(400).json({ error: 'Task title cannot be empty.' });
  }

  db.prepare('UPDATE tasks SET title = ?, completed = ? WHERE id = ?').run(title, completed, req.params.id);

  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  res.json(updated);
});

app.delete('/api/tasks/:id', requireAuth, (req, res) => {
  const task = db
    .prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.session.userId);

  if (!task) {
    return res.status(404).json({ error: 'Task not found.' });
  }

  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Task Manager running on http://localhost:${PORT}`);
});
