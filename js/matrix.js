/**
 * Модуль управления матрицей Эйзенхауэра
 * Фасад для управления задачами и делегирования рендеринга видам
 */

const Matrix = {
    // Все задачи
    tasks: [],

    // Текущий вид
    currentView: null,

    // Доступные виды
    views: {
        matrix: null,
        list: null
    },

    /**
     * Инициализация матрицы и видов
     */
    init() {
        // Инициализация видов
        this.views.matrix = new MatrixView();
        this.views.matrix.init();

        this.views.list = new ListView();

        // Установка вида по умолчанию
        this.currentView = this.views.matrix;

        // Инициализация splitter'ов (только для матрицы)
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
        const existingIndex = this.tasks.findIndex(t => t.id === task.id);

        if (existingIndex >= 0) {
            this.tasks[existingIndex] = task;
        } else {
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
     * Переключить вид
     * @param {string} viewName - 'matrix' или 'list'
     */
    setView(viewName) {
        if (!this.views[viewName]) {
            console.error(`Вид "${viewName}" не найден`);
            return;
        }

        this.currentView = this.views[viewName];
        this.render();
    },

    /**
     * Получить текущий вид
     */
    getView() {
        return this.currentView;
    },

    /**
     * Отрендерить задачи в текущем виде
     */
    render() {
        if (!this.currentView) return;

        // Определяем контейнер в зависимости от вида
        const container = this.currentView instanceof MatrixView
            ? null // MatrixView использует свои внутренние контейнеры
            : document.getElementById('list-content');

        this.currentView.render(this.tasks, container);
    },

    /**
     * Отрендерить markdown в HTML (делегирование текущему виду)
     */
    renderMarkdown(text) {
        return this.currentView.renderMarkdown(text);
    },

    /**
     * Инициализация splitter'ов для изменения размеров квадрантов
     * Работает только в режиме матрицы
     */
    initSplitters() {
        this.initHorizontalSplitter('splitter-h-middle', 'row-top', 'row-bottom');
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
    }
};

// Экспортируем
window.Matrix = Matrix;
