/**
 * Модуль работы с файловой системой через File System Access API
 */

const FileHandler = {
    // Текущая открытая директория
    directoryHandle: null,

    /**
     * Открыть папку с задачами через диалог выбора
     */
    async openFolder() {
        try {
            // Проверяем поддержку File System Access API
            if (!('showDirectoryPicker' in window)) {
                alert('Ваш браузер не поддерживает File System Access API. Пожалуйста, используйте Chrome, Edge или другой современный браузер.');
                return null;
            }

            // Открываем диалог выбора папки
            this.directoryHandle = await window.showDirectoryPicker({
                mode: 'readwrite',
                startIn: 'documents'
            });

            return this.directoryHandle;
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Ошибка при открытии папки:', error);
                alert('Ошибка при открытии папки: ' + error.message);
            }
            return null;
        }
    },
    
    /**
     * Прочитать все задачи из открытой папки
     * Логика: 1 задача = 1 файл. Файлы с несколькими задачами игнорируются.
     */
    async readAllTasks() {
        if (!this.directoryHandle) {
            throw new Error('Папка не открыта');
        }

        const allTasks = [];

        try {
            // Рекурсивно обходим все файлы в папке
            for await (const entry of this.directoryHandle.values()) {
                if (entry.kind === 'file' && entry.name.endsWith('.md')) {
                    const file = await entry.getFile();
                    const content = await file.text();
                    const tasks = parseTasksFromFile(content, entry.name);

                    // Игнорируем файлы с несколькими задачами или без задач
                    if (tasks.length === 1) {
                        allTasks.push(tasks[0]);
                        console.log(`Загружена задача из ${entry.name}`);
                    } else if (tasks.length > 1) {
                        console.warn(`Файл ${entry.name} содержит ${tasks.length} задач — пропущен (требуется 1 задача на файл)`);
                    } else {
                        console.warn(`Файл ${entry.name} не содержит задач — пропущен`);
                    }
                }
            }

            return allTasks;
        } catch (error) {
            console.error('Ошибка при чтении задач:', error);
            throw error;
        }
    },
    
    /**
     * Сохранить все задачи обратно в файлы
     * Логика: 1 задача = 1 файл (имя файла = имя задачи с заменой пробелов на '-')
     */
    async saveAllTasks(tasks) {
        if (!this.directoryHandle) {
            throw new Error('Папка не открыта');
        }

        try {
            // Сохраняем каждую задачу в отдельный файл
            for (const task of tasks) {
                const fileName = task.getFileName();
                console.log(`Сохранение задачи "${task.name}" в файл ${fileName}`);
                await this.saveFile(fileName, [task]);
            }

            return true;
        } catch (error) {
            console.error('Ошибка при сохранении задач:', error);
            throw error;
        }
    },
    
    /**
     * Сохранить задачу в файл
     * Имя файла генерируется из имени задачи
     */
    async saveFile(fileName, tasks) {
        try {
            // Получаем или создаем файл
            const fileHandle = await this.directoryHandle.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();

            // Сериализуем задачу в markdown (всегда одна задача)
            const content = tasks[0].toMarkdown();

            console.log(`Запись в файл ${fileName}:`);
            console.log(content.substring(0, 500) + (content.length > 500 ? '...' : ''));

            // Записываем содержимое
            await writable.write(content);
            await writable.close();

            console.log(`Файл ${fileName} сохранен`);
        } catch (error) {
            console.error(`Ошибка при сохранении файла ${fileName}:`, error);
            throw error;
        }
    },

    /**
     * Удалить файл задачи из папки
     */
    async deleteFile(fileName) {
        if (!this.directoryHandle) {
            throw new Error('Папка не открыта');
        }

        try {
            // Получаем handle файла и удаляем его
            const fileHandle = await this.directoryHandle.getFileHandle(fileName);
            await this.directoryHandle.removeEntry(fileHandle.name);
            console.log(`Файл ${fileName} удален`);
        } catch (error) {
            console.error(`Ошибка при удалении файла ${fileName}:`, error);
            throw error;
        }
    },

    /**
     * Проверить, открыта ли папка
     */
    isFolderOpen() {
        return this.directoryHandle !== null;
    },

    /**
     * Получить имя открытой папки
     */
    getFolderName() {
        return this.directoryHandle ? this.directoryHandle.name : null;
    }
};

// Экспортируем для использования в других модулях
window.FileHandler = FileHandler;
