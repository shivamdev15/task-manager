# ✅ Task Manager

A personal task manager with real user accounts — sign up, log in, and manage your own private list of tasks.

## What it does

- **Sign up** and **log in** with a username and password
- Passwords are **hashed with bcrypt** — never stored as plain text
- Each user has their **own private tasks** — no one can see or modify another user's data
- **Add, complete, and delete** tasks
- Stay logged in across page refreshes via sessions

## Tech stack

- **Backend:** Node.js + Express
- **Auth:** `express-session` for login sessions, `bcryptjs` for password hashing (pure JavaScript, no native compilation required)
- **Database:** SQLite (via Node's built-in `node:sqlite` module) — no external account or service needed
- **Frontend:** Vanilla HTML/CSS/JavaScript

## Running it locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the server:
   ```bash
   npm start
   ```
3. Open `http://localhost:3000`, sign up for an account, and start adding tasks.

The database file (`data.db`) is created automatically on first run.

## Why I built this

My first two projects covered AI API integration and CRUD with relational data. This one fills in the most common gap for junior developers: real authentication — hashing passwords correctly, managing login sessions, and making sure users can only ever access their own data (not just hiding it in the UI, but enforcing it on every backend route).

## Possible improvements

- "Remember me" / persistent login option
- Due dates and task priority levels
- Password reset via email
