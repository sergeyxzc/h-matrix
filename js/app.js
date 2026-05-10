/**
 * Основное приложение h-matrix
 * Инициализация и координация всех модулей
 */

const App = {
    initialized: false,
    currentView: 'column',  // 'column' (по умолчанию), 'matrix' или 'list'

    /**
     * Инициализация приложения
     */
    init() {
        if (this.initialized) return;

        console.log('h-matrix: инициализация...');

        // Инициализация модулей
        FontScaler.init();
        Matrix.init();
        ModalManager.init();

        // Обработчики кнопок Taskbar
        document.getElementById('btn-open').addEventListener('click', () => this.openFolder());
        document.getElementById('btn-refresh').addEventListener('click', () => this.refresh());
        
        // Обработчик dropdown переключения видов
        const viewDropdown = document.getElementById('btn-view-toggle');
        viewDropdown.addEventListener('click', (e) => {
            // Предотвращаем закрытие dropdown при клике на кнопку
            e.stopPropagation();
        });
        
        // Обработчики пунктов dropdown
        document.querySelectorAll('.dropdown-item[data-view]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const viewName = item.dataset.view;
                this.setView(viewName);
            });
        });

        // Обработчик кнопки добавления задачи в List View
        document.getElementById('list-add-task').addEventListener('click', () => this.addTask());

        // Горячие клавиши
        this.initHotkeys();

        // Блокировка интерфейса до открытия папки
        this.setEditingEnabled(false);

        // Устанавливаем вид по умолчанию (колонки)
        this.setView('column');

        this.initialized = true;
        console.log('h-matrix: готово к работе');
    },
    
    /**
     * Включить/выключить режим редактирования
     */
    setEditingEnabled(enabled) {
        const addButtons = document.querySelectorAll('.add-task-btn');

        addButtons.forEach(btn => {
            btn.disabled = !enabled;
            btn.style.opacity = enabled ? '1' : '0.5';
            btn.style.pointerEvents = enabled ? 'auto' : 'none';
        });

        // Блокировка кликов по карточкам задач - показываем/скрываем overlay во всех видах
        const matrixOverlay = document.getElementById('matrix-overlay');
        const listOverlay = document.getElementById('list-overlay');
        const columnOverlay = document.getElementById('column-overlay');
        
        const overlayDisplay = enabled ? 'none' : 'flex';
        if (matrixOverlay) matrixOverlay.style.display = overlayDisplay;
        if (listOverlay) listOverlay.style.display = overlayDisplay;
        if (columnOverlay) columnOverlay.style.display = overlayDisplay;

        // Включаем кнопку Refresh только если папка открыта
        const refreshBtn = document.getElementById('btn-refresh');
        if (refreshBtn) {
            refreshBtn.disabled = !enabled;
            refreshBtn.style.opacity = enabled ? '1' : '0.5';
            refreshBtn.style.pointerEvents = enabled ? 'auto' : 'none';
        }

        // Включаем кнопку переключения вида только если папка открыта
        const viewToggleBtn = document.getElementById('btn-view-toggle');
        if (viewToggleBtn) {
            viewToggleBtn.disabled = !enabled;
            viewToggleBtn.style.opacity = enabled ? '1' : '0.5';
            viewToggleBtn.style.pointerEvents = enabled ? 'auto' : 'none';
        }

        // Включаем кнопку добавления задачи в List View только если папка открыта
        const listAddTaskBtn = document.getElementById('list-add-task');
        if (listAddTaskBtn) {
            listAddTaskBtn.disabled = !enabled;
            listAddTaskBtn.style.opacity = enabled ? '1' : '0.5';
            listAddTaskBtn.style.pointerEvents = enabled ? 'auto' : 'none';
        }
    },
    
    /**
     * Инициализация горячих клавиш
     */
    initHotkeys() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+O - открыть папку
            if (e.ctrlKey && (e.key === 'o' || e.key === 'O' || e.key === 'щ')) {
                e.preventDefault();
                e.stopPropagation();
                this.openFolder();
                return false;
            }

            // Ctrl+R - обновить задачи
            if (e.ctrlKey && (e.key === 'r' || e.key === 'R' || e.key === 'к')) {
                e.preventDefault();
                e.stopPropagation();
                this.refresh();
                return false;
            }

            // Ctrl+S - сохранить вручную
            if (e.ctrlKey && (e.key === 's' || e.key === 'S' || e.key === 'ы')) {
                e.preventDefault();
                e.stopPropagation();
                this.saveManual();
                return false;
            }
        });
    },

    /**
     * Ручное сохранение (по Ctrl+S)
     */
    async saveManual() {
        if (!FileHandler.isFolderOpen()) {
            alert('Сначала откройте папку с задачами (Ctrl+O)');
            return;
        }

        try {
            await FileHandler.saveAllTasks(Matrix.tasks);
            this.showNotification('Задачи сохранены', 'success');
        } catch (error) {
            console.error('Ошибка при сохранении:', error);
            alert('Ошибка при сохранении: ' + error.message);
        }
    },
    
    /**
     * Открыть папку с задачами
     */
    async openFolder() {
        try {
            const handle = await FileHandler.openFolder();
            if (!handle) return;

            console.log('Открыта папка:', handle.name);

            // Чтение всех задач
            const tasks = await FileHandler.readAllTasks();
            console.log(`Загружено задач: ${tasks.length}`);

            // Отображение в матрице
            Matrix.setTasks(tasks);

            // Обновление UI
            this.updateFolderPath(handle);

            // Включение редактирования
            this.setEditingEnabled(true);

        } catch (error) {
            console.error('Ошибка при открытии папки:', error);
            alert('Ошибка при открытии папки: ' + error.message);
        }
    },

    /**
     * Обновить задачи из открытой папки (Refresh)
     */
    async refresh() {
        if (!FileHandler.isFolderOpen()) {
            console.log('Папка не открыта — refresh невозможен');
            return;
        }

        try {
            console.log('Обновление задач...');

            // Чтение всех задач
            const tasks = await FileHandler.readAllTasks();
            console.log(`Загружено задач: ${tasks.length}`);

            // Отображение в матрице
            Matrix.setTasks(tasks);

            this.showNotification('Задачи обновлены', 'success');
        } catch (error) {
            console.error('Ошибка при обновлении:', error);
            this.showNotification('Ошибка при обновлении: ' + error.message, 'error');
        }
    },

    /**
     * Переключить вид: колонки / матрица / список
     */
    setView(viewName) {
        const matrixContainer = document.getElementById('matrix');
        const listView = document.getElementById('list-view');
        const columnView = document.getElementById('column-view');
        const viewToggleBtn = document.getElementById('btn-view-toggle');
        const viewToggleIcon = viewToggleBtn.querySelector('i');

        // Скрываем все виды
        if (matrixContainer) matrixContainer.style.display = 'none';
        if (listView) listView.style.display = 'none';
        if (columnView) columnView.style.display = 'none';

        // Обновляем текст кнопки
        const viewLabels = {
            column: { icon: 'bi-columns-gap', text: 'Вид' },
            matrix: { icon: 'bi-grid-3x3-gap-fill', text: 'Вид' },
            list: { icon: 'bi-list-ul', text: 'Вид' }
        };

        const label = viewLabels[viewName] || viewLabels.column;
        viewToggleIcon.className = `bi ${label.icon}`;
        viewToggleBtn.innerHTML = `<i class="bi ${label.icon} me-1"></i>Вид`;

        // Показываем нужный вид и инициализируем Matrix
        switch (viewName) {
            case 'column':
                if (columnView) {
                    columnView.style.display = 'flex';
                    Matrix.setView('column');
                }
                break;
            case 'matrix':
                if (matrixContainer) {
                    matrixContainer.style.display = 'flex';
                    Matrix.setView('matrix');
                }
                break;
            case 'list':
                if (listView) {
                    listView.style.display = 'flex';
                    Matrix.setView('list');
                }
                break;
        }

        console.log('Переключен вид:', viewName);
    },

    /**
     * Открыть окно создания новой задачи (квадрант 1: важно + срочно)
     */
    addTask() {
        if (!FileHandler.isFolderOpen()) {
            alert('Сначала откройте папку с задачами (Ctrl+O)');
            return;
        }

        // Открываем модальное окно для квадранта 1 (важно + срочно)
        if (window.ModalManager) {
            window.ModalManager.openNew(1);
        }
    },

    /**
     * Обновить отображение пути к папке
     */
    updateFolderPath(handle) {
        const pathElement = document.getElementById('folder-path');
        if (pathElement) {
            pathElement.textContent = `/${handle.name}`;
        }
    },

    /**
     * Включить/выключить режим редактирования
     */
    showNotification(message, type = 'success') {
        const bgClass = type === 'success' ? 'bg-success' : 'bg-danger';
        
        const notification = document.createElement('div');
        notification.className = 'position-fixed bottom-0 end-0 p-3';
        notification.style.zIndex = '1100';
        notification.innerHTML = `
            <div class="toast show align-items-center text-white ${bgClass}" role="alert">
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

// Авто-инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
