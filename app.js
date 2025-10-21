
(function() {
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && e.key === 'I') ||
            (e.ctrlKey && e.shiftKey && e.key === 'J') ||
            (e.ctrlKey && e.key === 'U')) {
            e.preventDefault();
            return false;
        }
    });
})();

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
const feedbackModal = document.getElementById('feedbackModal');
const closeFeedback = document.getElementById('closeFeedback');
const cancelFeedback = document.getElementById('cancelFeedback');
const feedbackForm = document.getElementById('feedbackForm');
const submitFeedback = document.getElementById('submitFeedback');

const YOUR_EMAIL = '23cs028@students.muet.edu.pk';

function openFeedbackModal() {
  feedbackModal.style.display = 'block';
  document.body.style.overflow = 'hidden';
  
  setTimeout(() => {
    feedbackModal.scrollTop = 0;
    const modalContent = feedbackModal.querySelector('.modal-content');
    if (modalContent) {
      modalContent.scrollTop = 0;
    }
  }, 100);
}

function closeFeedbackModal() {
  feedbackModal.style.display = 'none';
  document.body.style.overflow = 'auto';
  feedbackForm.reset();
}

function showMessage(message, type = 'success') {
  const existingMessage = feedbackForm.querySelector('.success-message, .error-message');
  if (existingMessage) {
    existingMessage.remove();
  }

  const messageDiv = document.createElement('div');
  messageDiv.className = type === 'success' ? 'success-message' : 'error-message';
  messageDiv.textContent = message;
  
  feedbackForm.insertBefore(messageDiv, feedbackForm.firstChild);
  
  setTimeout(() => {
    messageDiv.remove();
  }, 5000);
}

function sendFeedback(formData) {
  const { name, email, type, message, rating } = formData;
  
  const subject = `TASKLY Feedback: ${type} (Rating: ${rating}/5)`;
  const body = `
Name: ${name}
Email: ${email}
Type: ${type}
Rating: ${rating}/5

Message:
${message}

---
Sent from TASKLY Todo App
  `.trim();
  
  const mailtoLink = `mailto:${YOUR_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailtoLink;
  return true;
}


feedbackBtn.addEventListener('click', openFeedbackModal);
closeFeedback.addEventListener('click', closeFeedbackModal);
cancelFeedback.addEventListener('click', closeFeedbackModal);

feedbackModal.addEventListener('click', (e) => {
  if (e.target === feedbackModal) {
    closeFeedbackModal();
  }
});

feedbackForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const formData = {
    name: document.getElementById('feedbackName').value.trim(),
    email: document.getElementById('feedbackEmail').value.trim(),
    type: document.getElementById('feedbackType').value,
    message: document.getElementById('feedbackMessage').value.trim(),
    rating: document.querySelector('input[name="rating"]:checked')?.value || 'Not rated'
  };
  
  if (!formData.name || !formData.email || !formData.type || !formData.message) {
    showMessage('Please fill in all required fields.', 'error');
    return;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(formData.email)) {
    showMessage('Please enter a valid email address.', 'error');
    return;
  }
  
  // Show loading state
  const originalText = submitFeedback.innerHTML;
  submitFeedback.innerHTML = '<i class="fa-solid fa-spinner"></i> Sending...';
  submitFeedback.disabled = true;
  
  try {
    sendFeedback(formData);
    showMessage('Thank you for your feedback! Your email client will open shortly.');
    
    setTimeout(() => {
      closeFeedbackModal();
    }, 3000);
    
  } catch (error) {
    console.error('Feedback error:', error);
    showMessage('Error sending feedback. Please try again later.', 'error');
  } finally {

    setTimeout(() => {
      submitFeedback.innerHTML = originalText;
      submitFeedback.disabled = false;
    }, 2000);
  }
});

initializeApp();