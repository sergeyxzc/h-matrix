/**
 * Базовый класс для всех видов (View)
 * Содержит общие утилиты для рендеринга задач
 */

class ViewRenderer {
    /**
     * Отрендерить markdown в HTML
     * Поддерживает: заголовки, жирный/курсивный текст, ссылки, списки
     */
    renderMarkdown(text) {
        if (!text) return '';

        let html = text;

        // Заголовки
        html = html.replace(/^### (.+)$/gm, '<h6>$1</h6>');
        html = html.replace(/^## (.+)$/gm, '<h5>$1</h5>');
        html = html.replace(/^# (.+)$/gm, '<h4>$1</h4>');

        // Inline код
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Жирный и курсив
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

        // Ссылки
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

        // Списки
        html = html.replace(/^\s*-\s+(.+)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)(\n?)/g, '<ul>$1</ul>');
        html = html.replace(/<\/ul><ul>/g, '');

        html = html.replace(/^\s*\d+\.\s+(.+)$/gm, '<oli>$1</oli>');
        html = html.replace(/(<oli>.*<\/oli>)(\n?)/g, (match) => {
            return '<ol>' + match.replace(/<\/?oli>/g, (tag) => tag.replace('oli', 'li')) + '</ol>';
        });
        html = html.replace(/<\/ol><ol>/g, '');

        // Разрывы строк
        html = html.replace(/\n/g, '<br>');

        return html;
    }

    /**
     * Экранирование HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

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
    }

    /**
     * Получить HTML для пустого состояния
     */
    getEmptyState(message, iconClass) {
        return `
            <div class="empty-state">
                <i class="bi ${iconClass}"></i>
                ${message}
            </div>
        `;
    }

    /**
     * Отсортировать задачи: по приоритету (asc), затем по created (asc)
     */
    sortTasks(tasks) {
        return [...tasks].sort((a, b) => {
            if (a.priority !== b.priority) {
                return a.priority - b.priority;
            }
            return new Date(a.created) - new Date(b.created);
        });
    }

    /**
     * Обработчик клика по задаче
     */
    onTaskClick(task) {
        if (window.ModalManager) {
            window.ModalManager.openEdit(task);
        }
    }

    /**
     * Группировка задач по квадрантам с сортировкой
     * @returns {Object} { 1: [...tasks], 2: [...], 3: [...], 4: [...] }
     */
    groupByQuadrant(tasks, sort = true) {
        const byQuadrant = { 1: [], 2: [], 3: [], 4: [] };
        for (const task of tasks) {
            const q = task.quadrant;
            if (!byQuadrant[q]) {
                byQuadrant[q] = [];
            }
            byQuadrant[q].push(task);
        }
        if (sort) {
            for (let q = 1; q <= 4; q++) {
                byQuadrant[q] = this.sortTasks(byQuadrant[q]);
            }
        }
        return byQuadrant;
    }

    /**
     * Создать карточку задачи (базовая реализация)
     * Переопределяется в подклассах
     */
    createTaskElement(task, onClick) {
        throw new Error('Метод createTaskElement должен быть переопределён в подклассе');
    }

    /**
     * Отрендерить задачи в контейнере
     * Переопределяется в подклассах
     */
    render(tasks, container) {
        throw new Error('Метод render должен быть переопределён в подклассе');
    }
}

// Экспортируем
window.ViewRenderer = ViewRenderer;
