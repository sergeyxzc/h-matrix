/**
 * Модуль управления матрицей Эйзенхауэра
 * Распределение задач по квадрантам, сортировка, рендеринг
 */

const Matrix = {
    // Все задачи
    tasks: [],
    
    // Контейнеры квадрантов
    quadrants: {
        1: null,
        2: null,
        3: null,
        4: null
    },
    
    /**
     * Инициализация матрицы
     */
    init() {
        this.quadrants[1] = document.getElementById('q1-content');
        this.quadrants[2] = document.getElementById('q2-content');
        this.quadrants[3] = document.getElementById('q3-content');
        this.quadrants[4] = document.getElementById('q4-content');
        
        // Инициализация splitter'ов
        this.initSplitters();
    },
    
    /**
     * Установить задачи и обновить отображение
     */
    setTasks(tasks) {
        this.tasks = tasks || [];
        this.render();
    },
    
    /**
     * Добавить задачу
     */
    addTask(task) {
        // Проверяем, есть ли уже задача с таким ID
        const existingIndex = this.tasks.findIndex(t => t.id === task.id);

        if (existingIndex >= 0) {
            // Обновляем существующую
            this.tasks[existingIndex] = task;
        } else {
            // Добавляем новую
            this.tasks.push(task);
        }

        this.render();
    },

    /**
     * Удалить задачу
     */
    removeTask(taskId) {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.render();
    },
    
    /**
     * Получить задачу по ID
     */
    getTask(taskId) {
        return this.tasks.find(t => t.id === taskId);
    },
    
    /**
     * Распределить задачи по квадрантам
     */
    getTasksByQuadrant() {
        return {
            1: [],
            2: [],
            3: [],
            4: []
        };
    },
    
    /**
     * Отсортировать задачи внутри квадранта
     * Сортировка: по приоритету (возрастание - P-1 самый важный), затем по created (возрастание)
     */
    sortTasks(tasks) {
        return [...tasks].sort((a, b) => {
            // Сначала по приоритету (меньше = важнее, P-1 сверху)
            if (a.priority !== b.priority) {
                return a.priority - b.priority;
            }
            // Затем по дате создания (старые сверху)
            return new Date(a.created) - new Date(b.created);
        });
    },
    
    /**
     * Отрендерить все квадранты
     */
    render() {
        // Проверяем текущий режим (матрица или список)
        const listView = document.getElementById('list-view');
        const isListView = listView && listView.style.display !== 'none';

        if (isListView) {
            // В режиме списка
            this.renderListView();
        } else {
            // В режиме матрицы
            // Распределяем задачи по квадрантам
            const byQuadrant = this.getTasksByQuadrant();

            for (const task of this.tasks) {
                const quadrant = task.quadrant;
                if (!byQuadrant[quadrant]) {
                    byQuadrant[quadrant] = [];
                }
                byQuadrant[quadrant].push(task);
            }

            // Рендерим каждый квадрант
            for (let i = 1; i <= 4; i++) {
                const sorted = this.sortTasks(byQuadrant[i] || []);
                this.renderQuadrant(i, sorted);
            }
        }
    },
    
    /**
     * Отрендерить конкретный квадрант
     */
    renderQuadrant(quadrantNum, tasks) {
        const container = this.quadrants[quadrantNum];
        if (!container) return;
        
        container.innerHTML = '';
        
        if (tasks.length === 0) {
            container.innerHTML = this.getEmptyState(quadrantNum);
            return;
        }
        
        for (const task of tasks) {
            const card = this.createTaskCard(task);
            container.appendChild(card);
        }
    },
    
    /**
     * Отрендерить markdown в HTML
     * Поддерживает: заголовки, жирный/курсивный текст, ссылки, списки
     */
    renderMarkdown(text) {
        if (!text) return '';

        let html = text;

        // Сначала обрабатываем заголовки (пока есть \n)
        html = html.replace(/^### (.+)$/gm, '<h6>$1</h6>');
        html = html.replace(/^## (.+)$/gm, '<h5>$1</h5>');
        html = html.replace(/^# (.+)$/gm, '<h4>$1</h4>');

        // Inline код `code` (до обработки жирного/курсива)
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Жирный **text**
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

        // Курсив *text*
        html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

        // Ссылки [text](url)
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

        // Ненумерованные списки - item (до замены \n на <br>)
        html = html.replace(/^\s*-\s+(.+)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)(\n?)/g, '<ul>$1</ul>');
        html = html.replace(/<\/ul><ul>/g, ''); // Объединяем соседние ul

        // Нумерованные списки 1. item (до замены \n на <br>)
        html = html.replace(/^\s*\d+\.\s+(.+)$/gm, '<oli>$1</oli>');
        html = html.replace(/(<oli>.*<\/oli>)(\n?)/g, (match) => {
            return '<ol>' + match.replace(/<\/?oli>/g, (tag) => tag.replace('oli', 'li')) + '</ol>';
        });
        html = html.replace(/<\/ol><ol>/g, ''); // Объединяем соседние ol

        // Разрывы строк (одиночный \n) — в конце, после обработки списков
        html = html.replace(/\n/g, '<br>');

        return html;
    },

    /**
     * Создать HTML карточки задачи
     */
    createTaskCard(task) {
        const div = document.createElement('div');
        div.className = 'task-card';
        div.dataset.taskId = task.id;

        // Due date badge с цветовой дифференциацией
        const dueDateBadge = this.getDueDateBadge(task);

        // Тело задачи с markdown — рендерим полностью без обрезки
        const bodyHtml = this.renderMarkdown(task.body || '');

        div.innerHTML = `
            <div class="task-card-header">
                <span class="task-card-title">${this.escapeHtml(task.name)}</span>
                ${dueDateBadge}
            </div>
            <div class="task-card-body">${bodyHtml || '<em>Нет описания</em>'}</div>
            <div class="task-card-footer">
                <span class="task-card-created">${task.createdFormatted}</span>
                <span class="task-card-priority ${task.priorityClass}">P-${task.priority}</span>
            </div>
        `;

        // Обработчик клика
        div.addEventListener('click', () => {
            this.onTaskClick(task);
        });

        return div;
    },

    /**
     * Получить HTML для due-date badge с цветовой дифференциацией
     */
    getDueDateBadge(task) {
        if (!task.dueDate) return '';

        const status = task.dueDateStatus;
        let badgeClass = 'task-card-due ';

        if (status === 'overdue') {
            badgeClass += 'task-card-due-overdue';
        } else if (status === 'urgent') {
            badgeClass += 'task-card-due-urgent';
        } else {
            badgeClass += 'task-card-due-normal';
        }

        const tooltip = task.dueDateTooltip;
        return `<span class="${badgeClass}" title="${tooltip}">${task.dueDateFormatted}</span>`;
    },
    
    /**
     * Обработчик клика по задаче
     */
    onTaskClick(task) {
        if (window.ModalManager) {
            window.ModalManager.openEdit(task);
        }
    },
    
    /**
     * HTML для пустого состояния
     */
    getEmptyState(quadrantNum) {
        const messages = {
            1: 'Нет срочных и важных задач',
            2: 'Нет запланированных важных задач',
            3: 'Нет задач для делегирования',
            4: 'Нет задач для удаления'
        };
        
        const icons = {
            1: 'bi-exclamation-triangle',
            2: 'bi-calendar-check',
            3: 'bi-people',
            4: 'bi-trash'
        };
        
        return `
            <div class="empty-state">
                <i class="bi ${icons[quadrantNum]}"></i>
                ${messages[quadrantNum]}
            </div>
        `;
    },
    
    /**
     * Экранирование HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    /**
     * Инициализация splitter'ов для изменения размеров квадрантов
     */
    initSplitters() {
        // Горизонтальный splitter между верхним и нижним рядом
        this.initHorizontalSplitter('splitter-h-middle', 'row-top', 'row-bottom');
        
        // Вертикальные splitter'ы
        this.initVerticalSplitter('splitter-v-top', 'quadrant-1', 'quadrant-2');
        this.initVerticalSplitter('splitter-v-bottom', 'quadrant-3', 'quadrant-4');
    },
    
    /**
     * Инициализация горизонтального splitter'а
     */
    initHorizontalSplitter(splitterId, topId, bottomId) {
        const splitter = document.getElementById(splitterId);
        const topRow = document.getElementById(topId);
        const bottomRow = document.getElementById(bottomId);
        
        if (!splitter || !topRow || !bottomRow) return;
        
        let isDragging = false;
        
        splitter.addEventListener('mousedown', (e) => {
            isDragging = true;
            splitter.classList.add('dragging');
            document.body.style.cursor = 'row-resize';
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const container = document.getElementById('matrix');
            const rect = container.getBoundingClientRect();
            const percentage = ((e.clientY - rect.top) / rect.height) * 100;
            
            // Ограничиваем размеры
            if (percentage > 20 && percentage < 80) {
                topRow.style.flex = `${percentage}`;
                bottomRow.style.flex = `${100 - percentage}`;
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                splitter.classList.remove('dragging');
                document.body.style.cursor = '';
            }
        });
    },
    
    /**
     * Инициализация вертикального splitter'а
     */
    initVerticalSplitter(splitterId, leftClass, rightClass) {
        const splitter = document.getElementById(splitterId);
        const parent = splitter.parentElement;
        
        if (!splitter || !parent) return;
        
        const leftQuadrant = parent.querySelector(`.${leftClass}`);
        const rightQuadrant = parent.querySelector(`.${rightClass}`);
        
        let isDragging = false;
        
        splitter.addEventListener('mousedown', (e) => {
            isDragging = true;
            splitter.classList.add('dragging');
            document.body.style.cursor = 'col-resize';
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const rect = parent.getBoundingClientRect();
            const percentage = ((e.clientX - rect.left) / rect.width) * 100;
            
            // Ограничиваем размеры
            if (percentage > 20 && percentage < 80) {
                leftQuadrant.style.flex = `${percentage}`;
                rightQuadrant.style.flex = `${100 - percentage}`;
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                splitter.classList.remove('dragging');
                document.body.style.cursor = '';
            }
        });
    },

    /**
     * Отрендерить список задач (для режима списка)
     * Задачи группируются по квадрантам в expandable блоки
     */
    renderListView() {
        const container = document.getElementById('list-content');
        if (!container) return;

        container.innerHTML = '';

        if (this.tasks.length === 0) {
            container.innerHTML = `
                <div class="list-empty">
                    <i class="bi bi-inbox"></i>
                    Нет задач
                </div>
            `;
            return;
        }

        // Группируем задачи по квадрантам
        const byQuadrant = { 1: [], 2: [], 3: [], 4: [] };
        for (const task of this.tasks) {
            byQuadrant[task.quadrant].push(task);
        }

        // Сортируем задачи внутри каждого квадранта по приоритету
        for (let q = 1; q <= 4; q++) {
            byQuadrant[q].sort((a, b) => a.priority - b.priority);
        }

        // Названия и иконки квадрантов
        const quadrantInfo = {
            1: { name: 'Сделать сейчас', icon: 'bi-exclamation-triangle-fill' },
            2: { name: 'Запланировать', icon: 'bi-calendar-check-fill' },
            3: { name: 'Делегировать', icon: 'bi-people-fill' },
            4: { name: 'Убрать', icon: 'bi-trash-fill' }
        };

        // Рендерим каждый квадрант
        for (let q = 1; q <= 4; q++) {
            const tasks = byQuadrant[q];
            if (tasks.length === 0) continue;

            const box = this.createQuadrantBox(q, tasks, quadrantInfo[q]);
            container.appendChild(box);
        }
    },

    /**
     * Создать expandable блок для квадранта
     */
    createQuadrantBox(quadrantNum, tasks, info) {
        const box = document.createElement('div');
        box.className = `quadrant-box quadrant-box-${quadrantNum}`;

        const header = document.createElement('div');
        header.className = 'quadrant-box-header';
        header.innerHTML = `
            <span class="quadrant-title">
                <i class="bi ${info.icon}"></i>
                ${quadrantNum}. ${info.name}
            </span>
            <div style="display: flex; align-items: center; gap: 8px;">
                <button class="btn btn-sm btn-light quadrant-box-add-task" data-quadrant="${quadrantNum}" title="Новая задача">
                    <i class="bi bi-plus-lg"></i>
                </button>
                <span class="quadrant-box-count">
                    <i class="bi bi-chevron-down"></i> ${tasks.length}
                </span>
            </div>
        `;

        const content = document.createElement('div');
        content.className = 'quadrant-box-content';

        for (const task of tasks) {
            const item = this.createListTaskItem(task);
            content.appendChild(item);
        }

        // Обработчик сворачивания/разворачивания
        header.addEventListener('click', (e) => {
            // Игнорируем клики по кнопке добавления
            if (e.target.closest('.quadrant-box-add-task')) return;
            
            header.classList.toggle('collapsed');
            content.classList.toggle('collapsed');
        });

        // Обработчик кнопки добавления задачи
        const addBtn = header.querySelector('.quadrant-box-add-task');
        addBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (window.FileHandler && window.FileHandler.isFolderOpen()) {
                if (window.ModalManager) {
                    window.ModalManager.openNew(quadrantNum);
                }
            } else {
                alert('Сначала откройте папку с задачами (Ctrl+O)');
            }
        });

        box.appendChild(header);
        box.appendChild(content);

        return box;
    },

    /**
     * Создать элемент списка для задачи
     */
    createListTaskItem(task) {
        const div = document.createElement('div');
        div.className = 'list-task-item';
        div.dataset.taskId = task.id;

        // Due date badge
        const dueDateBadge = this.getDueDateBadge(task);

        // Тело задачи с markdown — рендерим полностью без обрезки
        const bodyHtml = this.renderMarkdown(task.body || '');

        div.innerHTML = `
            <div class="list-task-header">
                <span class="list-task-title">${this.escapeHtml(task.name)}</span>
                ${dueDateBadge}
            </div>
            <div class="list-task-body">${bodyHtml || '<em>Нет описания</em>'}</div>
            <div class="list-task-footer">
                <span class="list-task-created">${task.createdFormatted}</span>
                <span class="list-task-priority ${task.priorityClass}">P-${task.priority}</span>
            </div>
        `;

        // Обработчик клика
        div.addEventListener('click', () => {
            this.onTaskClick(task);
        });

        return div;
    }
};

// Экспортируем
window.Matrix = Matrix;
