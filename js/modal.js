/**
 * Модуль управления модальным окном создания/редактирования задач
 */

const ModalManager = {
    modal: null,
    form: null,
    currentTask: null,
    currentQuadrant: null,
    
    // Элементы формы
    elements: {},
    
    /**
     * Инициализация модального окна
     */
    init() {
        this.modal = new bootstrap.Modal(document.getElementById('taskModal'));
        this.form = document.getElementById('task-form');
        
        // Кэшируем элементы формы
        this.elements = {
            id: document.getElementById('task-id'),
            name: document.getElementById('task-name'),
            urgency: document.getElementById('task-urgency'),
            importance: document.getElementById('task-importance'),
            priority: document.getElementById('task-priority'),
            dueDate: document.getElementById('task-due-date'),
            body: document.getElementById('task-body'),
            modalLabel: document.getElementById('taskModalLabel'),
            btnSave: document.getElementById('btn-save-task'),
            btnDelete: document.getElementById('btn-delete-task')
        };
        
        // Обработчики кнопок
        this.elements.btnSave.addEventListener('click', () => this.save());
        this.elements.btnDelete.addEventListener('click', () => this.delete());

        // Очистка ошибки при вводе имени
        this.elements.name.addEventListener('input', () => this.clearValidationError());
        
        // Обработчики кнопок add-task в квадрантах
        document.querySelectorAll('.add-task-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const quadrant = parseInt(btn.dataset.quadrant, 10);
                this.openNew(quadrant);
            });
        });
    },
    
    /**
     * Открыть окно для создания новой задачи
     */
    openNew(quadrant) {
        // Проверка: папка должна быть открыта
        if (!FileHandler.isFolderOpen()) {
            alert('Сначала откройте папку с задачами (Ctrl+O). Редактирование невозможно.');
            return;
        }
        
        this.currentTask = null;
        this.currentQuadrant = quadrant;

        // Сброс формы
        this.form.reset();
        this.elements.id.value = '';

        // Предзаполнение квадранта
        const quadrantSettings = this.getQuadrantSettings(quadrant);
        this.elements.urgency.value = quadrantSettings.urgency;
        this.elements.importance.value = quadrantSettings.importance;

        // UI настройки
        this.elements.modalLabel.textContent = 'Новая задача';
        this.elements.btnDelete.style.display = 'none';

        this.modal.show();

        // Фокус на поле имени
        setTimeout(() => this.elements.name.focus(), 100);
    },

    /**
     * Открыть окно для редактирования задачи
     */
    openEdit(task) {
        // Проверка: папка должна быть открыта
        if (!FileHandler.isFolderOpen()) {
            alert('Сначала откройте папку с задачами (Ctrl+O). Редактирование невозможно.');
            return;
        }
        
        this.currentTask = task;
        this.currentQuadrant = task.quadrant;

        // Заполнение формы
        this.elements.id.value = task.id;
        this.elements.name.value = task.name;
        this.elements.urgency.value = task.urgency;
        this.elements.importance.value = task.importance;
        this.elements.priority.value = task.priority;
        this.elements.dueDate.value = this.formatDateForInput(task.dueDate);
        this.elements.body.value = task.body;

        // UI настройки
        this.elements.modalLabel.textContent = `Редактирование: ${task.name}`;
        this.elements.btnDelete.style.display = '';

        this.modal.show();
    },

    /**
     * Форматировать дату для input datetime-local (YYYY-MM-DDTHH:mm)
     */
    formatDateForInput(isoString) {
        if (!isoString) return '';
        const date = new Date(isoString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    },
    
    /**
     * Сохранить задачу
     */
    async save() {
        // Валидация
        if (!this.validate()) {
            return;
        }

        const formData = this.getFormData();

        let task;
        if (this.currentTask) {
            // Обновление существующей
            task = new Task({
                name: formData.name,
                urgency: formData.urgency,
                importance: formData.importance,
                priority: formData.priority,
                created: this.currentTask.created,
                dueDate: formData.dueDate,
                body: formData.body,
                sourceFile: this.currentTask.sourceFile // Сохраняем для обратной совместимости
            });
            task.modified = Task.now();
        } else {
            // Создание новой (файл будет создан с именем на основе имени задачи)
            task = new Task({
                name: formData.name,
                urgency: formData.urgency,
                importance: formData.importance,
                priority: formData.priority,
                created: Task.now(),
                dueDate: formData.dueDate,
                body: formData.body,
                sourceFile: null
            });
        }

        // Добавляем в матрицу
        if (window.Matrix) {
            window.Matrix.addTask(task);
        }

        // Автосохранение в файл
        try {
            await FileHandler.saveAllTasks(window.Matrix.tasks);
        } catch (error) {
            console.error('Ошибка автосохранения:', error);
            alert('Ошибка при сохранении в файл: ' + error.message);
        }

        // Закрываем модалку
        this.modal.hide();

        // Ждём закрытия модального окна (Bootstrap animation)
        setTimeout(() => {
            // Уведомление
            this.showNotification(this.currentTask ? 'Задача обновлена и сохранена' : 'Задача создана и сохранена');
        }, 300);
    },
    
    /**
     * Удалить задачу
     */
    async delete() {
        if (!this.currentTask) return;

        if (confirm(`Вы уверены, что хотите удалить задачу "${this.currentTask.name}"?`)) {
            // Получаем имя файла перед удалением из матрицы
            const fileName = this.currentTask.getFileName();

            if (window.Matrix) {
                window.Matrix.removeTask(this.currentTask.id);
            }

            // Удаляем файл задачи
            try {
                await FileHandler.deleteFile(fileName);
                console.log(`Файл ${fileName} удален из файловой системы`);
            } catch (error) {
                console.error('Ошибка при удалении файла:', error);
                alert('Ошибка при удалении файла: ' + error.message);
            }

            // Автосохранение остальных задач
            try {
                await FileHandler.saveAllTasks(window.Matrix.tasks);
            } catch (error) {
                console.error('Ошибка автосохранения:', error);
                alert('Ошибка при сохранении в файл: ' + error.message);
            }

            this.modal.hide();
            this.showNotification('Задача удалена');
        }
    },
    
    /**
     * Валидация формы
     */
    validate() {
        const name = this.elements.name.value.trim();
        const priority = parseInt(this.elements.priority.value, 10);

        if (!name) {
            this.showValidationError('Введите название задачи');
            this.elements.name.focus();
            return false;
        }

        // Проверка уникальности имени
        if (!this.isTaskNameUnique(name)) {
            this.showValidationError('Задача с таким именем уже существует');
            this.elements.name.focus();
            return false;
        }

        if (isNaN(priority) || priority < 1) {
            this.showValidationError('Приоритет должен быть числом больше 0');
            this.elements.priority.focus();
            return false;
        }

        // Валидация даты дедлайна
        const dueDate = this.elements.dueDate.value.trim();
        if (dueDate) {
            const dateValue = new Date(dueDate);
            if (isNaN(dateValue.getTime())) {
                this.showValidationError('Неверная дата дедлайна');
                this.elements.dueDate.focus();
                return false;
            }
        }

        // Очистка ошибки
        this.clearValidationError();
        return true;
    },

    /**
     * Проверка уникальности имени задачи
     */
    isTaskNameUnique(newName) {
        if (!window.Matrix || !window.Matrix.tasks) return true;

        // При редактировании разрешаем то же имя для текущей задачи
        const currentTaskName = this.currentTask ? this.currentTask.name : null;

        for (const task of window.Matrix.tasks) {
            if (task.name === newName && task.name !== currentTaskName) {
                return false;
            }
        }
        return true;
    },

    /**
     * Показать ошибку валидации
     */
    showValidationError(message) {
        this.clearValidationError();

        const errorDiv = document.createElement('div');
        errorDiv.className = 'text-danger mt-2';
        errorDiv.id = 'task-name-error';
        errorDiv.style.fontSize = '13px';
        errorDiv.textContent = message;

        const nameGroup = this.elements.name.closest('.mb-3');
        if (nameGroup) {
            nameGroup.appendChild(errorDiv);
        }

        // Подсветка поля
        this.elements.name.classList.add('is-invalid');
    },

    /**
     * Очистить ошибку валидации
     */
    clearValidationError() {
        const existingError = document.getElementById('task-name-error');
        if (existingError) {
            existingError.remove();
        }
        this.elements.name.classList.remove('is-invalid');
    },
    
    /**
     * Получить данные из формы
     */
    getFormData() {
        const dueDateValue = this.elements.dueDate.value.trim();
        
        // datetime-local возвращает YYYY-MM-DDTHH:mm, конвертируем в ISO
        let dueDate = null;
        if (dueDateValue) {
            dueDate = new Date(dueDateValue).toISOString();
        }

        return {
            name: this.elements.name.value.trim(),
            urgency: this.elements.urgency.value,
            importance: this.elements.importance.value,
            priority: parseInt(this.elements.priority.value, 10),
            dueDate: dueDate,
            body: this.elements.body.value.trim()
        };
    },
    
    /**
     * Получить настройки квадранта
     */
    getQuadrantSettings(quadrant) {
        const settings = {
            1: { urgency: 'срочно', importance: 'важно' },
            2: { urgency: 'не срочно', importance: 'важно' },
            3: { urgency: 'срочно', importance: 'не важно' },
            4: { urgency: 'не срочно', importance: 'не важно' }
        };
        return settings[quadrant] || settings[1];
    },
    
    /**
     * Показать уведомление
     */
    showNotification(message) {
        // Создаем временный элемент уведомления
        const notification = document.createElement('div');
        notification.className = 'position-fixed bottom-0 end-0 p-3';
        notification.style.zIndex = '1100';
        notification.innerHTML = `
            <div class="toast show align-items-center text-white bg-success" role="alert">
                <div class="d-flex">
                    <div class="toast-body">${message}</div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
};

// Экспортируем
window.ModalManager = ModalManager;
