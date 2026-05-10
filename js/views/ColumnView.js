/**
 * ColumnView — рендеринг задач по колонкам (квадрантам)
 * Наследует ViewRenderer
 */

class ColumnView extends ViewRenderer {
    constructor() {
        super();
        this.container = null;
        this.quadrantInfo = {
            1: { 
                name: 'Сделать сейчас', 
                icon: 'bi-exclamation-triangle-fill',
                subtitle: 'Важно + Срочно',
                colorClass: 'column-1'
            },
            2: { 
                name: 'Запланировать', 
                icon: 'bi-calendar-check-fill',
                subtitle: 'Важно + Не срочно',
                colorClass: 'column-2'
            },
            3: { 
                name: 'Делегировать', 
                icon: 'bi-people-fill',
                subtitle: 'Не важно + Срочно',
                colorClass: 'column-3'
            },
            4: { 
                name: 'Убрать', 
                icon: 'bi-trash-fill',
                subtitle: 'Не важно + Не срочно',
                colorClass: 'column-4'
            }
        };
    }

    /**
     * Инициализация — сохранение ссылки на DOM-контейнер
     */
    init() {
        this.container = document.getElementById('column-content');
    }

    /**
     * Отрендерить задачи по колонкам
     */
    render(tasks, container) {
        const targetContainer = container || this.container;
        if (!targetContainer) return;

        // Сохраняем текущую ширину колонок перед перерисовкой
        const columnWidths = this.saveColumnWidths(targetContainer);

        targetContainer.innerHTML = '';

        if (tasks.length === 0) {
            targetContainer.innerHTML = this.getEmptyState('Нет задач', 'bi-inbox');
            return;
        }

        // Группируем задачи по квадрантам
        const byQuadrant = this.groupByQuadrant(tasks);

        // Создаём контейнер колонок
        const columnsContainer = document.createElement('div');
        columnsContainer.className = 'columns-container';

        for (let q = 1; q <= 4; q++) {
            const column = this.createColumn(q, byQuadrant[q]);
            columnsContainer.appendChild(column);

            // Добавляем splitter после каждой колонки кроме последней
            if (q < 4) {
                const splitter = this.createSplitter(q);
                columnsContainer.appendChild(splitter);
            }
        }

        targetContainer.appendChild(columnsContainer);

        // Инициализируем splitters и восстанавливаем ширину колонок
        this.initSplitters(targetContainer, columnWidths);
    }

    /**
     * Сохранить текущую ширину колонок
     */
    saveColumnWidths(container) {
        const widths = [];
        const columnsContainer = container.querySelector('.columns-container');
        if (!columnsContainer) return widths;

        const columns = columnsContainer.querySelectorAll('.column');
        columns.forEach((col, index) => {
            widths[index] = col.style.flex;
        });

        return widths;
    }

    /**
     * Создать splitter между колонками
     */
    createSplitter(index) {
        const splitter = document.createElement('div');
        splitter.className = 'column-splitter';
        splitter.dataset.splitterIndex = index;
        return splitter;
    }

    /**
     * Инициализация splitters для изменения размеров колонок
     */
    initSplitters(container, savedWidths = []) {
        const splitters = container.querySelectorAll('.column-splitter');
        const columnsContainer = container.querySelector('.columns-container');
        const columns = Array.from(columnsContainer.querySelectorAll('.column'));

        // Восстанавливаем сохранённую ширину колонок или устанавливаем по умолчанию
        if (savedWidths.length > 0) {
            columns.forEach((col, index) => {
                if (savedWidths[index]) {
                    col.style.flex = savedWidths[index];
                } else {
                    col.style.flex = '1 1 0';
                }
            });
        } else {
            // Первая инициализация - все колонки равной ширины
            columns.forEach(col => {
                col.style.flex = '1 1 0';
            });
        }

        splitters.forEach((splitter, index) => {
            const leftColumn = columns[index];
            const rightColumn = columns[index + 1];

            if (!leftColumn || !rightColumn) return;

            let isDragging = false;
            let startX = 0;
            let startLeftWidth = 0;
            let startRightWidth = 0;

            splitter.addEventListener('mousedown', (e) => {
                isDragging = true;
                splitter.classList.add('dragging');
                document.body.style.cursor = 'col-resize';

                startX = e.clientX;
                // Сохраняем текущие ширины в пикселях
                startLeftWidth = leftColumn.getBoundingClientRect().width;
                startRightWidth = rightColumn.getBoundingClientRect().width;

                e.preventDefault();
            });

            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;

                const deltaX = e.clientX - startX;
                const newLeftWidth = startLeftWidth + deltaX;
                const newRightWidth = startRightWidth - deltaX;

                // Ограничиваем минимальную ширину (100px)
                const minWidth = 100;
                if (newLeftWidth >= minWidth && newRightWidth >= minWidth) {
                    // Устанавливаем ширину в пикселях, чтобы не ломать flex остальных колонок
                    leftColumn.style.flex = '0 0 ' + newLeftWidth + 'px';
                    rightColumn.style.flex = '0 0 ' + newRightWidth + 'px';
                }
            });

            document.addEventListener('mouseup', () => {
                if (isDragging) {
                    isDragging = false;
                    splitter.classList.remove('dragging');
                    document.body.style.cursor = '';
                }
            });
        });
    }

    /**
     * Создать колонку для квадранта
     */
    createColumn(quadrantNum, tasks) {
        const info = this.quadrantInfo[quadrantNum];
        const column = document.createElement('div');
        column.className = `column ${info.colorClass}`;

        // Заголовок колонки
        const header = document.createElement('div');
        header.className = 'column-header';
        header.innerHTML = `
            <div class="column-header-left">
                <div class="column-title">
                    <i class="bi ${info.icon}"></i>
                    <span>${quadrantNum}. ${info.name}</span>
                </div>
                <div class="column-subtitle">${info.subtitle}</div>
            </div>
            <div class="column-actions">
                <button class="btn btn-sm btn-light column-add-task" data-quadrant="${quadrantNum}" title="Новая задача">
                    <i class="bi bi-plus-lg"></i>
                </button>
                <span class="column-count">${tasks.length}</span>
            </div>
        `;

        // Контент колонки
        const content = document.createElement('div');
        content.className = 'column-content';

        if (tasks.length === 0) {
            content.innerHTML = `
                <div class="column-empty">
                    <i class="bi bi-inbox"></i>
                    <span>Нет задач</span>
                </div>
            `;
        } else {
            for (const task of tasks) {
                const card = this.createColumnTaskCard(task);
                content.appendChild(card);
            }
        }

        // Обработчик кнопки добавления задачи
        const addBtn = header.querySelector('.column-add-task');
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

        column.appendChild(header);
        column.appendChild(content);

        return column;
    }

    /**
     * Создать карточку задачи для колонки
     */
    createColumnTaskCard(task) {
        const div = document.createElement('div');
        div.className = 'column-task-card';
        div.dataset.taskId = task.id;

        const dueDateBadge = this.getDueDateBadge(task);
        const bodyHtml = this.renderMarkdown(task.body || '');

        div.innerHTML = `
            <div class="column-task-card-header">
                <span class="column-task-card-title">${this.escapeHtml(task.name)}</span>
                ${dueDateBadge}
            </div>
            <div class="column-task-card-body">${bodyHtml || '<em>Нет описания</em>'}</div>
            <div class="column-task-card-footer">
                <span class="column-task-card-created">${task.createdFormatted}</span>
                <span class="column-task-card-priority ${task.priorityClass}">P-${task.priority}</span>
            </div>
        `;

        div.addEventListener('click', () => this.onTaskClick(task));

        return div;
    }
}

// Экспортируем
window.ColumnView = ColumnView;
