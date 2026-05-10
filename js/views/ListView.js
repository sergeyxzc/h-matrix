/**
 * ListView — рендеринг задач в виде сгруппированного списка
 * Наследует ViewRenderer
 */

class ListView extends ViewRenderer {
    constructor() {
        super();
        this.quadrantInfo = {
            1: { name: 'Сделать сейчас', icon: 'bi-exclamation-triangle-fill' },
            2: { name: 'Запланировать', icon: 'bi-calendar-check-fill' },
            3: { name: 'Делегировать', icon: 'bi-people-fill' },
            4: { name: 'Убрать', icon: 'bi-trash-fill' }
        };
    }

    /**
     * Отрендерить список задач с группировкой по квадрантам
     */
    render(tasks, container) {
        if (!container) return;

        container.innerHTML = '';

        if (tasks.length === 0) {
            container.innerHTML = this.getEmptyState('Нет задач', 'bi-inbox');
            return;
        }

        // Группируем задачи по квадрантам (с сортировкой внутри)
        const byQuadrant = this.groupByQuadrant(tasks);

        // Рендерим каждый квадрант
        for (let q = 1; q <= 4; q++) {
            const quadrantTasks = byQuadrant[q];
            if (quadrantTasks.length === 0) continue;

            const box = this.createQuadrantBox(q, quadrantTasks);
            container.appendChild(box);
        }
    }

    /**
     * Создать expandable блок для квадранта
     */
    createQuadrantBox(quadrantNum, tasks) {
        const box = document.createElement('div');
        box.className = `quadrant-box quadrant-box-${quadrantNum}`;

        const info = this.quadrantInfo[quadrantNum];
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
    }

    /**
     * Создать элемент списка для задачи
     */
    createListTaskItem(task) {
        const div = document.createElement('div');
        div.className = 'list-task-item';
        div.dataset.taskId = task.id;

        const dueDateBadge = this.getDueDateBadge(task);
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

        div.addEventListener('click', () => this.onTaskClick(task));

        return div;
    }
}

// Экспортируем
window.ListView = ListView;
