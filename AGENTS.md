# h-matrix — Спецификация для AI-агентов

## Быстрый контекст

**Стек:** Vanilla JS + Bootstrap 5 (CDN)  
**Статус:** ✅ Завершён (v0.1.1)  
**Файлы:** `1 задача = 1 .md файл`

## Документация

- **README.md** — пользовательская документация, цветовая схема, ограничения платформы, поведение приложения
- **plan.md** — план разработки, статус этапов, история реализации

## Архитектура

```
h-matrix/
├── index.html
├── css/styles.css
├── js/
│   ├── app.js          # Инициализация, hotkeys, координация
│   ├── matrix.js       # Фасад: управление задачами, делегирование видам
│   ├── task.js         # Класс Task, парсинг/сериализация
│   ├── file-handler.js # File System Access API
│   ├── modal.js        # Модальное окно (создание/редактирование)
│   └── views/
│       ├── ViewRenderer.js  # Базовый класс для видов (общие утилиты)
│       ├── MatrixView.js    # Рендеринг 4 квадрантов
│       └── ListView.js      # Рендеринг списка с группировкой
├── tasks/              # Пользователь выбирает папку
├── plan.md
├── README.md           # Документация пользователя
└── AGENTS.md           # Этот файл
```

## Ключевые точки расширения

### Task (js/task.js)
```javascript
class Task {
    // Геттеры: id, quadrant (1-4), createdFormatted, dueDateFormatted
    // dueDateStatus: 'overdue' | 'urgent' | 'normal'
    // priorityClass: 'priority-high' | 'priority-medium' | 'priority-low'
    // toMarkdown() → string
    // static fromMarkdown(markdown, sourceFile) → Task
    // static taskNameToFileName(name) → string (пробелы→'-', '-'→'--')
    // static fileNameToTaskName(fileName) → string (обратное)
}
```

### Matrix (js/matrix.js)
```javascript
const Matrix = {
    tasks: [],
    currentView: null,
    views: { matrix: MatrixView, list: ListView },
    
    setTasks(tasks),
    addTask(task),
    removeTask(taskId),
    setView(viewName),      // 'matrix' или 'list'
    render(),               // Делегирует текущему виду
    initSplitters()         // Перетаскиваемые границы (только матрица)
};
```

### Views (js/views/*.js)
```javascript
// ViewRenderer — базовый класс
class ViewRenderer {
    renderMarkdown(text)    // Парсинг markdown
    escapeHtml(text)        // Экранирование
    getDueDateBadge(task)   // Цвет дедлайна
    sortTasks(tasks)        // Сортировка: priority asc, created asc
    groupByQuadrant(tasks)  // Группировка + сортировка по квадрантам
    render(tasks, container) // Абстрактный метод
}

// MatrixView — рендеринг 4 квадрантов
class MatrixView extends ViewRenderer {
    init()                  // Привязка к DOM-контейнерам
    render(tasks)           // Рендеринг по квадрантам
    createTaskCard(task)    // Карточка для матрицы
}

// ListView — группировка в expandable блоки
class ListView extends ViewRenderer {
    render(tasks, container) // Рендеринг списка
    createQuadrantBox(q, tasks) // Блок квадранта
    createListTaskItem(task)    // Элемент списка
}
```

### FileHandler (js/file-handler.js)
```javascript
const FileHandler = {
    directoryHandle: null,
    async openFolder(),      // showDirectoryPicker()
    async readAllTasks(),    // Чтение .md файлов, игнорирование файлов с ≠1 задачей
    async saveAllTasks(tasks), // 1 задача = 1 файл
    async deleteFile(fileName),
    isFolderOpen()
};
```

### ModalManager (js/modal.js)
```javascript
const ModalManager = {
    openNew(quadrant),       // 1-4
    openEdit(task),
    async save(),            // Автосохранение после создания/изменения
    async delete(),          // Удаление файла + автосохранение остальных
    validate()               // Уникальность имени, priority ≥ 1
};
```

### App (js/app.js)
```javascript
const App = {
    currentView: 'matrix',   // 'matrix' | 'list'
    init(),
    setEditingEnabled(enabled),
    async openFolder(),
    async refresh(),
    toggleView(),            // Переключение matrix ↔ list
    initHotkeys()            // Ctrl+O, Ctrl+R, Ctrl+S
};
```
