/**
 * MatrixView — рендеринг задач в виде матрицы 2×2
 * Наследует ViewRenderer
 */

class MatrixView extends ViewRenderer {
    constructor() {
        super();
        this.quadrants = {
            1: null,
            2: null,
            3: null,
            4: null
        };
        this.quadrantConfig = {
            1: {
                emptyMessage: 'Нет срочных и важных задач',
                emptyIcon: 'bi-exclamation-triangle'
            },
            2: {
                emptyMessage: 'Нет запланированных важных задач',
                emptyIcon: 'bi-calendar-check'
            },
            3: {
                emptyMessage: 'Нет задач для делегирования',
                emptyIcon: 'bi-people'
            },
            4: {
                emptyMessage: 'Нет задач для удаления',
                emptyIcon: 'bi-trash'
            }
        };
    }

    /**
     * Инициализация — привязка к DOM-контейнерам
     */
    init() {
        this.quadrants[1] = document.getElementById('q1-content');
        this.quadrants[2] = document.getElementById('q2-content');
        this.quadrants[3] = document.getElementById('q3-content');
        this.quadrants[4] = document.getElementById('q4-content');
    }

    /**
     * Отрендерить все квадранты
     */
    render(tasks, container) {
        const byQuadrant = this.groupByQuadrant(tasks);

        for (let i = 1; i <= 4; i++) {
            this.renderQuadrant(i, byQuadrant[i]);
        }
    }

    /**
     * Отрендерить конкретный квадрант
     */
    renderQuadrant(quadrantNum, tasks) {
        const container = this.quadrants[quadrantNum];
        if (!container) return;

        // Обновляем счетчик задач
        const countElement = document.getElementById(`q${quadrantNum}-count`);
        if (countElement) {
            countElement.textContent = tasks.length;
        }

        container.innerHTML = '';

        if (tasks.length === 0) {
            const config = this.quadrantConfig[quadrantNum];
            container.innerHTML = this.getEmptyState(config.emptyMessage, config.emptyIcon);
            return;
        }

        for (const task of tasks) {
            const card = this.createTaskCard(task);
            container.appendChild(card);
        }
    }

    /**
     * Создать HTML карточки задачи для матрицы
     */
    createTaskCard(task) {
        const div = document.createElement('div');
        div.className = 'task-card';
        div.dataset.taskId = task.id;

        const dueDateBadge = this.getDueDateBadge(task);
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

        div.addEventListener('click', () => this.onTaskClick(task));

        return div;
    }
}

// Экспортируем
window.MatrixView = MatrixView;
