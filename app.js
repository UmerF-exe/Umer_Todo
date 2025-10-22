
// (function() {
//     document.addEventListener('contextmenu', function(e) {
//         e.preventDefault();
//         return false;
//     });
    
//     document.addEventListener('keydown', function(e) {
//         if (e.key === 'F12' || 
//             (e.ctrlKey && e.shiftKey && e.key === 'I') ||
//             (e.ctrlKey && e.shiftKey && e.key === 'J') ||
//             (e.ctrlKey && e.key === 'U')) {
//             e.preventDefault();
//             return false;
//         }
//     });
// })();

const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');
const countMeta = document.getElementById('countMeta');
const statTotal = document.getElementById('statTotal');
const statActive = document.getElementById('statActive');
const statComplete = document.getElementById('statComplete');
const searchInput = document.getElementById('searchInput');
const filterSelect = document.getElementById('filterSelect');
const sortSelect = document.getElementById('sortSelect');
const clearCompleted = document.getElementById('clearCompleted');
const addSample = document.getElementById('addSample');
const dateNow = document.getElementById('dateNow');
const exportBtn = document.getElementById('exportBtn');
const focusSearchBtn = document.getElementById('focusSearch');
const quickFilters = document.querySelectorAll('.quick-filter');
const themeToggle = document.getElementById('themeToggle');
const signOut = document.getElementById('signOut');

const STORAGE_KEY = 'todos_app_data';
let todos = [];

function initializeApp() {
  loadTodos();
  render();
}

function loadTodos() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    todos = stored ? JSON.parse(stored) : [];

    todos = todos.map(todo => ({
      id: todo.id || generateId(),
      text: todo.text || '',
      completed: !!todo.completed,
      created: todo.created || Date.now(),
      order: typeof todo.order === 'number' ? todo.order : (todo.created || Date.now())
    }));
  } catch (err) {
    console.error('Error loading todos:', err);
    todos = [];
  }
}

function saveTodos() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch (err) {
    console.error('Error saving todos:', err);
    alert('Could not save tasks. Check console.');
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getMaxOrder() {
  if (!todos.length) return 0;
  return todos.reduce((m, t) => Math.max(m, Number(t.order || 0)), 0);
}

function addTask(text) {
  if (!text) return;

  const newOrder = getMaxOrder() + 1;
  const newTask = {
    id: generateId(),
    text,
    completed: false,
    created: Date.now(),
    order: newOrder
  };

  todos.push(newTask);
  saveTodos();
  render();
}

function removeTask(id) {
  todos = todos.filter(t => t.id !== id);
  saveTodos();
  render();
}

function toggleTask(id) {
  const todo = todos.find(t => t.id === id);
  if (todo) {
    todo.completed = !todo.completed;
    saveTodos();
    render();
  }
}

function editTask(id, newText) {
  const todo = todos.find(t => t.id === id);
  if (todo) {
    todo.text = newText;
    saveTodos();
    render();
  }
}

function clearCompletedTasks() {
  todos = todos.filter(t => !t.completed);
  saveTodos();
  render();
}

function formatTime(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleString();
}

function applyFilters(list) {
  const q = searchInput.value.trim().toLowerCase();
  let out = list.filter(t => (t.text || '').toLowerCase().includes(q));
  const f = filterSelect.value;
  if (f === 'active') out = out.filter(t => !t.completed);
  if (f === 'completed') out = out.filter(t => t.completed);
  const s = sortSelect.value;
  if (s === 'oldest') out.sort((a, b) => (a.order || a.created) - (b.order || b.created));
  if (s === 'alpha') out.sort((a, b) => (a.text || '').localeCompare(b.text || ''));
  if (s === 'newest') out.sort((a, b) => (b.order || b.created) - (a.order || a.created));
  return out;
}

function handleDrop(fromId, toId) {
  const fromIndex = todos.findIndex(t => t.id === fromId);
  const toIndex = todos.findIndex(t => t.id === toId);
  if (fromIndex === -1 || toIndex === -1) return;

  const [moved] = todos.splice(fromIndex, 1);
  todos.splice(toIndex, 0, moved);

  const n = todos.length;
  todos.forEach((t, idx) => {
    const newOrder = n - idx;
    t.order = newOrder;
  });

  saveTodos();
  render();
}

function render() {
  const list = applyFilters([...todos]);
  todoList.innerHTML = '';

  if (list.length === 0) {
    todoList.innerHTML = '<div class="empty">No tasks — add your first task.</div>';
  }

  list.forEach(t => {
    const item = document.createElement('div');
    item.className = 'item';
    item.draggable = true;

    const left = document.createElement('div');
    left.className = 'left';

    const checkbox = document.createElement('div');
    checkbox.className = 'checkbox';
    checkbox.innerHTML = t.completed ? '<i class="fa-solid fa-check"></i>' : '';
    checkbox.onclick = () => toggleTask(t.id);

    const txt = document.createElement('div');
    const title = document.createElement('div');
    title.className = 'text' + (t.completed ? ' completed' : '');
    title.textContent = t.text;

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = formatTime(t.created);

    txt.appendChild(title);
    txt.appendChild(meta);
    left.appendChild(checkbox);
    left.appendChild(txt);

    const actions = document.createElement('div');
    actions.className = 'actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'icon-btn success';
    editBtn.innerHTML = '<i class="fa-regular fa-pen-to-square"></i>';
    editBtn.onclick = () => {
      const newText = prompt('Edit task', t.text);
      if (newText !== null) {
        const trimmed = newText.trim();
        if (trimmed.length === 0) {
          if (confirm('Save empty text? This will delete the task. Delete instead?')) {
            removeTask(t.id);
          }
          return;
        }
        editTask(t.id, trimmed);
      }
    };

    const delBtn = document.createElement('button');
    delBtn.className = 'icon-btn danger';
    delBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
    delBtn.onclick = () => {
      if (confirm('Delete this task?')) removeTask(t.id);
    };

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);
    item.appendChild(left);
    item.appendChild(actions);
    item.dataset.id = t.id;

    item.ondragstart = (e) => {
      e.dataTransfer.setData('text/plain', t.id);
      e.dataTransfer.effectAllowed = 'move';
    };

    item.ondragover = (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    };

    item.ondrop = (e) => {
      e.preventDefault();
      const fromId = e.dataTransfer.getData('text/plain');
      const toId = t.id;
      if (fromId && toId && fromId !== toId) handleDrop(fromId, toId);
    };

    todoList.appendChild(item);
  });

  const total = todos.length;
  const complete = todos.filter(t => t.completed).length;
  const active = total - complete;

  statTotal.textContent = total;
  statActive.textContent = active;
  statComplete.textContent = complete;

  countMeta.textContent = `${list.length} visible • ${total} total`;
  dateNow.textContent = new Date().toLocaleDateString();
}

// Event Listeners
addBtn.addEventListener('click', () => {
  const v = todoInput.value.trim();
  if (!v) return;
  addTask(v);
  todoInput.value = '';
  todoInput.focus();
});

todoInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    addBtn.click();
  }
});

searchInput.addEventListener('input', render);
filterSelect.addEventListener('change', render);
sortSelect.addEventListener('change', render);

clearCompleted.addEventListener('click', () => {
  if (confirm('Clear all completed tasks?')) clearCompletedTasks();
});

addSample.addEventListener('click', () => {
  addTask('Read a chapter of a book');
  addTask('Finish project report');
  addTask('Buy groceries');
});

focusSearchBtn.addEventListener('click', () => searchInput.focus());

quickFilters.forEach(btn => btn.addEventListener('click', (e) => {
  filterSelect.value = btn.dataset.filter;
  render();
}));

exportBtn.addEventListener('click', () => {
  const dataStr = JSON.stringify(todos.map(t => ({
    id: t.id,
    text: t.text,
    completed: t.completed,
    created: t.created,
    order: t.order
  })), null, 2);

  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'todos.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const icon = themeToggle.querySelector('i');
  icon.classList.toggle('fa-moon');
  icon.classList.toggle('fa-sun');

  localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
});

signOut.addEventListener('click', () => {
  if (confirm('Clear all local data and refresh?')) {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('theme');
    location.reload();
  }
});

if (localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark');
  const icon = themeToggle.querySelector('i');
  icon.classList.remove('fa-moon');
  icon.classList.add('fa-sun');
}

const feedbackBtn = document.getElementById('feedbackBtn');
const YOUR_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdOkiqJWezYQD6VEzFJ1IOobkOjFduvuENX4n-rQKVY-YBXvw/viewform?usp=dialog';

// Open Google Form in new tab with optimized dimensions
function openFeedbackForm() {
  // Calculate optimal window size
  const width = Math.min(1000, window.screen.width - 40);
  const height = Math.min(700, window.screen.height - 100);
  const left = (window.screen.width - width) / 2;
  const top = (window.screen.height - height) / 2;
  
  const windowFeatures = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,toolbar=no,menubar=no,location=no,status=no`;
  
  // Open in popup window
  window.open(YOUR_FORM_URL, 'TASKLY Feedback', windowFeatures);
  
  // Optional: Show a quick confirmation message
  showQuickMessage('Feedback form opened in new window');
}

// Show quick confirmation message
function showQuickMessage(message) {
  const messageDiv = document.createElement('div');
  messageDiv.textContent = message;
  messageDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--success);
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    z-index: 10000;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideInRight 0.3s ease-out;
  `;
  
  document.body.appendChild(messageDiv);
  
  setTimeout(() => {
    messageDiv.remove();
  }, 3000);
}

// Add CSS for animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;
document.head.appendChild(style);

// Event Listener
feedbackBtn.addEventListener('click', openFeedbackForm);

initializeApp();