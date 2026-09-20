const authView = document.getElementById('authView');
const taskView = document.getElementById('taskView');
const userBar = document.getElementById('userBar');
const usernameDisplay = document.getElementById('usernameDisplay');
const authForm = document.getElementById('authForm');
const authError = document.getElementById('authError');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const loginTab = document.getElementById('loginTab');
const signupTab = document.getElementById('signupTab');
const newTaskForm = document.getElementById('newTaskForm');
const newTaskInput = document.getElementById('newTaskInput');
const taskList = document.getElementById('taskList');
const emptyTasks = document.getElementById('emptyTasks');

let mode = 'login'; // or 'signup'

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function switchTab(newMode) {
  mode = newMode;
  authError.textContent = '';
  loginTab.classList.toggle('active', mode === 'login');
  signupTab.classList.toggle('active', mode === 'signup');
  authSubmitBtn.textContent = mode === 'login' ? 'Log In' : 'Sign Up';
}

authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  authError.textContent = '';

  const username = document.getElementById('authUsername').value;
  const password = document.getElementById('authPassword').value;
  const endpoint = mode === 'login' ? '/api/login' : '/api/signup';

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Something went wrong.');

    enterApp(data.username);
  } catch (err) {
    authError.textContent = err.message;
  }
});

async function logout() {
  await fetch('/api/logout', { method: 'POST' });
  authView.classList.remove('hidden');
  taskView.classList.add('hidden');
  userBar.classList.add('hidden');
  authForm.reset();
}

function enterApp(username) {
  usernameDisplay.textContent = username;
  authView.classList.add('hidden');
  taskView.classList.remove('hidden');
  userBar.classList.remove('hidden');
  loadTasks();
}

async function checkSession() {
  const res = await fetch('/api/me');
  if (res.ok) {
    const data = await res.json();
    enterApp(data.username);
  }
}

async function loadTasks() {
  const res = await fetch('/api/tasks');
  const tasks = await res.json();

  if (tasks.length === 0) {
    taskList.innerHTML = '';
    emptyTasks.classList.remove('hidden');
    return;
  }
  emptyTasks.classList.add('hidden');

  taskList.innerHTML = tasks
    .map(
      (t) => `
    <li class="task-item ${t.completed ? 'completed' : ''}" id="task-${t.id}">
      <input type="checkbox" class="task-checkbox" ${t.completed ? 'checked' : ''} onchange="toggleTask(${t.id}, this.checked)" />
      <span class="task-title">${escapeHtml(t.title)}</span>
      <button class="delete-btn" onclick="deleteTask(${t.id})">Delete</button>
    </li>
  `
    )
    .join('');
}

newTaskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = newTaskInput.value;
  if (!title.trim()) return;

  await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });

  newTaskInput.value = '';
  loadTasks();
});

async function toggleTask(id, completed) {
  await fetch(`/api/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed }),
  });
  loadTasks();
}

async function deleteTask(id) {
  await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
  loadTasks();
}

// On page load, see if we already have a valid session.
checkSession();
