
class TaskManager {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentEditId = null;
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.renderTasks();
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTask();
        });

        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchTasks(e.target.value);
        });
    }

    loadTasks() {
        const stored = localStorage.getItem('taskyTasks');
        return stored ? JSON.parse(stored) : [];
    }

    saveTasks() {
        localStorage.setItem('taskyTasks', JSON.stringify(this.tasks));
    }

    createTask(data) {
        const task = {
            id: Date.now().toString(),
            title: data.title,
            description: data.description,
            subject: data.subject,
            dueDate: data.dueDate,
            priority: data.priority,
            status: data.status,
            createdAt: new Date().toISOString()
        };
        this.tasks.push(task);
        this.saveTasks();
        this.renderTasks();
    }

    updateTask(id, data) {
        const index = this.tasks.findIndex(t => t.id === id);
        if (index !== -1) {
            this.tasks[index] = { ...this.tasks[index], ...data };
            this.saveTasks();
            this.renderTasks();
        }
    }

    deleteTask(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.saveTasks();
            this.renderTasks();
        }
    }

    getTaskStatus(task) {
        const today = new Date();
        const dueDate = new Date(task.dueDate);

        if (task.status === 'completed') return 'completed';
        if (dueDate < today) return 'over-due';
        return 'in-progress';
    }

    renderTasks() {
        const inProgress = document.getElementById('inProgressColumn');
        const completed = document.getElementById('completedColumn');
        const overDue = document.getElementById('overDueColumn');

        inProgress.innerHTML = '';
        completed.innerHTML = '';
        overDue.innerHTML = '';

        let filteredTasks = this.tasks;
        if (this.currentFilter !== 'all') {
            filteredTasks = this.tasks.filter(t => t.priority === this.currentFilter);
        }

        const tasksByStatus = {
            'in-progress': [],
            'completed': [],
            'over-due': []
        };

        filteredTasks.forEach(task => {
            const status = this.getTaskStatus(task);
            tasksByStatus[status].push(task);
        });

        tasksByStatus['in-progress'].forEach(task => {
            inProgress.appendChild(this.createTaskCard(task));
        });

        tasksByStatus['completed'].forEach(task => {
            completed.appendChild(this.createTaskCard(task));
        });

        tasksByStatus['over-due'].forEach(task => {
            overDue.appendChild(this.createTaskCard(task));
        });


        document.getElementById('inProgressCount').textContent = tasksByStatus['in-progress'].length;
        document.getElementById('completedCount').textContent = tasksByStatus['completed'].length;
        document.getElementById('overDueCount').textContent = tasksByStatus['over-due'].length;


        if (tasksByStatus['in-progress'].length === 0) {
            inProgress.innerHTML = '<div class="empty-state">No tasks in progress</div>';
        }
        if (tasksByStatus['completed'].length === 0) {
            completed.innerHTML = '<div class="empty-state">No completed tasks</div>';
        }
        if (tasksByStatus['over-due'].length === 0) {
            overDue.innerHTML = '<div class="empty-state">No overdue tasks</div>';
        }
    }

    createTaskCard(task) {
        const card = document.createElement('div');
        card.className = 'task-card';

        const priorityClass = `badge-${task.priority}`;
        const priorityText = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);

        const shortDesc = task.description.length > 100
            ? task.description.substring(0, 100) + '...'
            : task.description;

        card.innerHTML = `
                    <div class="task-header">
                        <div class="task-badges">
                            <span class="badge ${priorityClass}">${priorityText}</span>
                            <span class="badge badge-subject">${task.subject}</span>
                        </div>
                        <div class="task-actions">
                            <button class="btn-icon" onclick="taskManager.editTask('${task.id}')" title="Edit">✏️</button>
                            <button class="btn-icon" onclick="taskManager.deleteTask('${task.id}')" title="Delete">🗑️</button>
                        </div>
                    </div>
                    <h3 class="task-title">${task.title}</h3>
                    <div class="task-description" id="desc-${task.id}">${shortDesc}</div>
                    ${task.description.length > 100 ? `<span class="see-more" onclick="taskManager.toggleDescription('${task.id}')">See more</span>` : ''}
                    <div class="task-footer">
                        <div class="task-date">📅 ${this.formatDate(task.dueDate)}</div>
                    </div>
                `;

        return card;
    }

    toggleDescription(id) {
        const desc = document.getElementById(`desc-${id}`);
        const task = this.tasks.find(t => t.id === id);
        if (desc.classList.contains('expanded')) {
            desc.classList.remove('expanded');
            desc.textContent = task.description.substring(0, 100) + '...';
        } else {
            desc.classList.add('expanded');
            desc.textContent = task.description;
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    saveTask() {
        const data = {
            title: document.getElementById('taskTitle').value,
            description: document.getElementById('taskDescription').value,
            subject: document.getElementById('taskSubject').value,
            dueDate: document.getElementById('taskDate').value,
            priority: document.getElementById('taskPriority').value,
            status: document.getElementById('taskStatus').value
        };

        if (this.currentEditId) {
            this.updateTask(this.currentEditId, data);
            this.currentEditId = null;
        } else {
            this.createTask(data);
        }

        closeModal();
    }

    editTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            this.currentEditId = id;
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskDescription').value = task.description;
            document.getElementById('taskSubject').value = task.subject;
            document.getElementById('taskDate').value = task.dueDate;
            document.getElementById('taskPriority').value = task.priority;
            document.getElementById('taskStatus').value = task.status;
            document.getElementById('modalTitle').textContent = 'Edit Task';
            openModal();
        }
    }

    searchTasks(query) {
        const allCards = document.querySelectorAll('.task-card');
        allCards.forEach(card => {
            const text = card.textContent.toLowerCase();
            if (text.includes(query.toLowerCase())) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    filterByPriority(priority) {
        this.currentFilter = priority;
        this.renderTasks();
    }

    sortByDate() {
        this.tasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        this.renderTasks();
    }
}

const taskManager = new TaskManager();

function openModal() {
    document.getElementById('taskModal').classList.add('active');
    document.getElementById('taskForm').reset();
    document.getElementById('modalTitle').textContent = 'Add New Task';
    taskManager.currentEditId = null;
}

function closeModal() {
    document.getElementById('taskModal').classList.remove('active');
}

function filterByPriority(priority) {
    taskManager.filterByPriority(priority);
}

function sortByDate() {
    taskManager.sortByDate();
}

document.getElementById('taskModal').addEventListener('click', (e) => {
    if (e.target.id === 'taskModal') {
        closeModal();
    }
});