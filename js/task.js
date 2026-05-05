/**
 * Класс Task для представления задачи в матрице Эйзенхауэра
 */
class Task {
    constructor({
        name,
        urgency,
        importance,
        priority,
        created,
        dueDate = null,
        body = '',
        sourceFile = null
    }) {
        this.name = name;
        this.urgency = urgency; // 'срочно' | 'не срочно'
        this.importance = importance; // 'важно' | 'не важно'
        this.priority = priority; // число, приоритет в квадранте
        this.created = created; // ISO строка даты
        this.dueDate = dueDate; // ISO строка даты или null
        this.body = body;
        this.sourceFile = sourceFile; // имя файла, из которого загружена задача
        this.modified = new Date().toISOString();
    }

    /**
     * Получить уникальный ID задачи
     */
    get id() {
        return `${this.sourceFile || 'new'}:${this.name}`;
    }

    /**
     * Определить квадрант задачи (1-4)
     * 1: Важно + Срочно
     * 2: Важно + Не срочно
     * 3: Не важно + Срочно
     * 4: Не важно + Не срочно
     */
    get quadrant() {
        if (this.importance === 'важно' && this.urgency === 'срочно') return 1;
        if (this.importance === 'важно' && this.urgency === 'не срочно') return 2;
        if (this.importance === 'не важно' && this.urgency === 'срочно') return 3;
        return 4;
    }

    /**
     * Отформатированная дата создания (локальное время)
     */
    get createdFormatted() {
        return this.formatDateLocal(this.created);
    }

    /**
     * Отформатированная дата изменения (локальное время)
     */
    get modifiedFormatted() {
        return this.formatDateLocal(this.modified);
    }

    /**
     * Отформатированный дедлайн (локальное время)
     */
    get dueDateFormatted() {
        return this.dueDate ? this.formatDateLocal(this.dueDate) : null;
    }

    /**
     * Форматирование даты в формате YYYY-MM-DD HH:MM:SS (UTC)
     * Хранение в UTC формате ISO 8601 (без смещения timezone)
     */
    formatDate(isoString) {
        if (!isoString) return '';
        const date = new Date(isoString);
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        const seconds = String(date.getUTCSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    /**
     * Форматирование даты в локальном формате YYYY-MM-DD HH:MM:SS
     * Отображение в системной локали пользователя
     */
    formatDateLocal(isoString) {
        if (!isoString) return '';
        const date = new Date(isoString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    /**
     * Проверка, просрочена ли задача
     */
    get isOverdue() {
        if (!this.dueDate) return false;
        return new Date(this.dueDate) < new Date();
    }

    /**
     * Получить статус дедлайна для цветовой дифференциации
     * @returns {string} 'overdue' | 'urgent' | 'normal'
     */
    get dueDateStatus() {
        if (!this.dueDate) return 'normal';

        const now = new Date();
        const due = new Date(this.dueDate);
        const diffMs = due - now;
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffMs <= 0) {
            return 'overdue'; // Время уже наступило или прошло
        } else if (diffHours <= 24) {
            return 'urgent'; // Осталось меньше 1 дня
        }
        return 'normal'; // Больше 1 дня
    }

    /**
     * Получить текст для tooltip с информацией о дедлайне
     * @returns {string} Например: "Просрочена на 2 дня 3 часа" или "Осталось 1 день 5 часов"
     */
    get dueDateTooltip() {
        if (!this.dueDate) return '';

        const now = new Date();
        const due = new Date(this.dueDate);
        const diffMs = due - now;
        const isOverdue = diffMs <= 0;
        const absDiffMs = Math.abs(diffMs);

        // Вычисляем разницу в днях и часах
        const diffDays = Math.floor(absDiffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((absDiffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const diffMinutes = Math.floor((absDiffMs % (1000 * 60 * 60)) / (1000 * 60));

        let timeParts = [];
        if (diffDays > 0) timeParts.push(`${diffDays} дн.`);
        if (diffHours > 0) timeParts.push(`${diffHours} ч.`);
        if (diffMinutes > 0 && diffDays === 0) timeParts.push(`${diffMinutes} мин.`);

        const timeStr = timeParts.join(' ') || 'менее 1 минуты';

        if (isOverdue) {
            return `Просрочена на ${timeStr}`;
        } else {
            return `Осталось ${timeStr}`;
        }
    }

    /**
     * Получить класс стиля для приоритета
     * P-1: бледно-красный, P-2—P-3: бледно-оранжевый, P-4+: бледно-синий
     * @returns {string} 'priority-high' | 'priority-medium' | 'priority-low'
     */
    get priorityClass() {
        if (this.priority === 1) return 'priority-high';
        if (this.priority >= 2 && this.priority <= 3) return 'priority-medium';
        return 'priority-low';
    }

    /**
     * Сериализация задачи в markdown формат
     */
    toMarkdown() {
        let md = `# ${this.name}\n`;
        md += `## Header\n`;
        md += `**срочность** - ${this.urgency}\n`;
        md += `**важность** - ${this.importance}\n`;
        md += `**priority** - ${this.priority}\n`;
        md += `**created** - ${this.formatDate(this.created)}\n`;
        if (this.dueDate) {
            md += `**due-date** - ${this.formatDate(this.dueDate)}\n`;
        }
        md += `\n## body\n\`\`\`markdown\n${this.body}\n\`\`\`\n`;
        return md;
    }

    /**
     * Статический метод для парсинга markdown в Task
     */
    static fromMarkdown(markdown, sourceFile = null) {
        const lines = markdown.split('\n');
        const task = {
            name: null,
            urgency: null,
            importance: null,
            priority: null,
            created: null,
            dueDate: null,
            body: '',
            sourceFile
        };

        let bodyStartIndex = -1;

        for (let i = 0; i < lines.length; i++) {
            const trimmed = lines[i].trim();

            // Пропускаем пустые строки в начале, до первого заголовка
            if (!trimmed && !task.name) continue;

            if (trimmed.startsWith('# ') && !task.name) {
                task.name = trimmed.substring(2).trim();
            } else if (trimmed.startsWith('**срочность**')) {
                const match = trimmed.match(/\*\*срочность\*\*\s*-\s*(.+)/i);
                if (match) task.urgency = match[1].trim();
            } else if (trimmed.startsWith('**важность**')) {
                const match = trimmed.match(/\*\*важность\*\*\s*-\s*(.+)/i);
                if (match) task.importance = match[1].trim();
            } else if (trimmed.startsWith('**priority**')) {
                const match = trimmed.match(/\*\*priority\*\*\s*-\s*(\d+)/i);
                if (match) task.priority = parseInt(match[1], 10);
            } else if (trimmed.startsWith('**created**')) {
                const match = trimmed.match(/\*\*created\*\*\s*-\s*(.+)/i);
                if (match) task.created = this.parseDate(match[1].trim());
            } else if (trimmed.startsWith('**due-date**')) {
                const match = trimmed.match(/\*\*due-date\*\*\s*-\s*(.+)/i);
                if (match) task.dueDate = this.parseDate(match[1].trim());
            } else if (trimmed.startsWith('## body')) {
                // Нашли заголовок body — читаем всё после него
                bodyStartIndex = i + 1;
                break; // Выходим, дальше только body
            }
        }

        // Извлекаем body — всё после ## body до конца файла
        if (bodyStartIndex >= 0) {
            let body = lines.slice(bodyStartIndex).join('\n');
            
            // Удаляем открывающий ```markdown или ```
            body = body.replace(/^\s*```markdown\s*\n/, '');
            body = body.replace(/^\s*```\s*\n/, '');
            
            // Находим последний ``` и обрезаем до него
            const lastBacktickIndex = body.lastIndexOf('```');
            if (lastBacktickIndex > 0) {
                body = body.substring(0, lastBacktickIndex);
            }
            
            // Удаляем ведущие и замыкающие пустые строки
            task.body = body.replace(/^\n+|\n+$/g, '');
        }

        // Валидация обязательных полей
        if (!task.name || !task.urgency || !task.importance || 
            task.priority === null || !task.created) {
            return null;
        }

        return new Task(task);
    }

    /**
     * Парсинг строки даты в ISO формат
     * Дата из файла интерпретируется как UTC (ISO 8601 без timezone)
     */
    static parseDate(dateStr) {
        if (!dateStr) return null;

        // Пробуем распарсить YYYY-MM-DD HH:MM:SS как UTC
        const match = dateStr.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
        if (match) {
            const [, year, month, day, hour, min, sec] = match;
            // Создаём дату в UTC
            const date = new Date(Date.UTC(year, month - 1, day, hour, min, sec));
            return date.toISOString();
        }

        // Пробуем стандартный парсинг
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            return date.toISOString();
        }

        return null;
    }

    /**
     * Текущая дата в ISO формате
     */
    static now() {
        return new Date().toISOString();
    }

    /**
     * Преобразовать имя задачи в имя файла
     * Пробелы → '-', существующие '-' → '--'
     * Пример: "My-Task Name" → "My--Task-Name.md"
     */
    static taskNameToFileName(name) {
        return name
            .replace(/-/g, '--')      // Сначала экранируем существующие '-'
            .replace(/\s+/g, '-')     // Затем пробелы → '-'
            .replace(/[/\\:*?"<>|]/g, ''); // Удаляем недопустимые символы в имени файла
    }

    /**
     * Преобразовать имя файла в имя задачи (обратное преобразование)
     * '--' → '-', '- ' → пробел
     * Пример: "My--Task-Name.md" → "My-Task Name"
     */
    static fileNameToTaskName(fileName) {
        // Удаляем расширение .md
        let name = fileName.replace(/\.md$/, '');
        // Обратное преобразование: сначала '--' → '-', затем '-' → пробел
        return name
            .replace(/--/g, '\x00')   // Временно заменяем '--' на спецсимвол
            .replace(/-/g, ' ')       // Пробелы восстанавливаем
            .replace(/\x00/g, '-');   // Возвращаем '-' обратно
    }

    /**
     * Получить имя файла для этой задачи
     */
    getFileName() {
        return Task.taskNameToFileName(this.name) + '.md';
    }
}

/**
 * Парсинг файла с задачами
 * Для формата 1 задача = 1 файл:
 * - Если в файле одна задача, имя берётся из имени файла (чтобы поддерживать переименование)
 * - Если в файле несколько задач, используется имя из заголовка
 */
function parseTasksFromFile(markdown, sourceFile = null) {
    // Для формата 1 задача = 1 файл — парсим весь файл как одну задачу
    const task = Task.fromMarkdown(markdown, sourceFile);
    
    if (task) {
        // Восстанавливаем имя из имени файла для поддержки переименования
        if (sourceFile) {
            const nameFromFileName = Task.fileNameToTaskName(sourceFile);
            task.name = nameFromFileName;
        }
        return [task];
    }
    
    return [];
}

// Экспортируем функцию в глобальную область видимости
window.parseTasksFromFile = parseTasksFromFile;

/**
 * Сериализация списка задач в markdown файл
 */
function serializeTasksToFile(tasks) {
    if (tasks.length === 0) return '';
    
    const sections = tasks.map(task => task.toMarkdown());
    return sections.join('\n\n---\n\n');
}
