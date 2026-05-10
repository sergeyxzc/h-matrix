/**
 * FontScaler - модуль масштабирования шрифтов
 * Сохраняет масштаб в localStorage, применяет через CSS-переменную
 */

const FontScaler = {
    STORAGE_KEY: 'h-matrix-font-scale',
    MIN_SCALE: 0.8,
    MAX_SCALE: 1.5,
    STEP: 0.1,
    DEFAULT_SCALE: 1.0,

    /**
     * Инициализация модуля
     */
    init() {
        // Загрузка сохранённого масштаба
        const savedScale = this.loadScale();
        this.applyScale(savedScale);

        // Обработчики кнопок dropdown
        this.initDropdownHandlers();

        console.log(`FontScaler: инициализирован, масштаб ${savedScale}`);
    },

    /**
     * Загрузка масштаба из localStorage
     */
    loadScale() {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved) {
            const scale = parseFloat(saved);
            if (!isNaN(scale) && scale >= this.MIN_SCALE && scale <= this.MAX_SCALE) {
                return scale;
            }
        }
        return this.DEFAULT_SCALE;
    },

    /**
     * Сохранение масштаба в localStorage
     */
    saveScale(scale) {
        localStorage.setItem(this.STORAGE_KEY, scale.toString());
    },

    /**
     * Применение масштаба через CSS-переменную
     */
    applyScale(scale) {
        document.documentElement.style.setProperty('--font-scale', scale.toString());
        this.updateButtonLabel(scale);
    },

    /**
     * Обновление метки на кнопке
     */
    updateButtonLabel(scale) {
        const label = document.getElementById('font-scale-value');
        if (label) {
            label.textContent = Math.round(scale * 100) + '%';
        }
    },

    /**
     * Установка конкретного масштаба
     */
    setScale(scale) {
        // Ограничение диапазона
        scale = Math.max(this.MIN_SCALE, Math.min(this.MAX_SCALE, scale));
        // Округление до шага
        scale = Math.round(scale * 10) / 10;

        this.applyScale(scale);
        this.saveScale(scale);
        console.log(`FontScaler: установлен масштаб ${scale}`);
    },

    /**
     * Увеличить масштаб на шаг
     */
    increase() {
        const current = this.loadScale();
        this.setScale(current + this.STEP);
    },

    /**
     * Уменьшить масштаб на шаг
     */
    decrease() {
        const current = this.loadScale();
        this.setScale(current - this.STEP);
    },

    /**
     * Инициализация обработчиков dropdown
     */
    initDropdownHandlers() {
        document.querySelectorAll('.dropdown-item[data-scale]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const scale = parseFloat(item.dataset.scale);
                if (!isNaN(scale)) {
                    this.setScale(scale);
                }
            });
        });
    }
};

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FontScaler;
}
