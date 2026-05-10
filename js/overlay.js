/**
 * Overlay Manager - управляет стартовым overlay-экраном
 * 
 * Функционал:
 * - Показывает overlay при загрузке приложения
 * - Анимированное скрытие после загрузки или по клику на кнопку
 * - Управление прогресс-баром загрузки
 * - Генерация падающих иконок-дел
 */

class OverlayManager {
    constructor() {
        this.overlay = document.getElementById('startup-overlay');
        this.startButton = this.overlay?.querySelector('#btn-start-overlay');
        this.logoContainer = this.overlay?.querySelector('#logo-container');
        this.floatingContainer = this.overlay?.querySelector('#floating-icons');
        this.funnel = this.overlay?.querySelector('.temporal-funnel');
        this.isLoaded = false;
        this.floatInterval = null;
        this.activeIcons = [];
        this.maxIcons = 3;
        this.currentRingText = null;
        this.ringTextTimeout = null;

        if (this.startButton) {
            this.startButton.addEventListener('click', () => this.hide());
        }
        
        if (this.logoContainer) {
            this.logoContainer.addEventListener('click', async () => {
                console.log('Клик по логотипу - открываем папку');
                console.log('App доступен:', !!window.App);
                console.log('openFolder доступен:', typeof window.App?.openFolder);
                
                if (window.App && typeof window.App.openFolder === 'function') {
                    try {
                        await window.App.openFolder();
                    } catch (error) {
                        console.error('Ошибка при открытии папки:', error);
                    }
                } else {
                    console.error('App или openFolder недоступны');
                }
            });
        }
        
        // Запуск генерации мерцающих иконок
        this.startFloatingIcons();
        
        // Показываем кнопку сразу
        setTimeout(() => {
            this.isLoaded = true;
            if (this.startButton) {
                this.startButton.classList.add('visible');
            }
        }, 500);
    }

    /**
     * Запускает генерацию мерцающих иконок
     */
    startFloatingIcons() {
        if (!this.floatingContainer) return;

        const icons = [
            'bi-clock',
            'bi-calendar-event',
            'bi-check2-square',
            'bi-list-task',
            'bi-hourglass-split',
            'bi-alarm',
            'bi-calendar-check',
            'bi-stopwatch',
            'bi-timer',
            'bi-calendar-week'
        ];

        // Создаём первую иконку сразу
        this.createFloatingIcon(icons);

        // Планируем следующую иконку со случайной задержкой
        this.scheduleNextIcon(icons);

        // Запускаем генерацию текста на кольцах
        this.startRingText();
    }

    /**
     * Планирует создание следующей иконки
     */
    scheduleNextIcon(icons) {
        if (this.activeIcons.length >= this.maxIcons) {
            // Ждём пока освободится место
            setTimeout(() => this.scheduleNextIcon(icons), 500);
            return;
        }
        
        // Случайная задержка от 1 до 3 секунд
        const delay = 1000 + Math.random() * 2000;
        
        this.floatInterval = setTimeout(() => {
            this.createFloatingIcon(icons);
            this.scheduleNextIcon(icons);
        }, delay);
    }

    /**
     * Создаёт одну мерцающую иконку
     */
    createFloatingIcon(icons) {
        const icon = document.createElement('i');
        const randomIcon = icons[Math.floor(Math.random() * icons.length)];
        
        icon.className = `bi ${randomIcon} floating-icon`;
        
        // Более интересное распределение по экрану
        // Делим экран на зоны и выбираем случайную зону
        const zoneWidth = window.innerWidth / 4;
        const zoneHeight = window.innerHeight / 4;
        const zoneX = Math.floor(Math.random() * 4);
        const zoneY = Math.floor(Math.random() * 4);
        
        // Случайная позиция внутри зоны с отступами от краёв
        const padding = 40;
        const randomX = zoneX * zoneWidth + padding + Math.random() * (zoneWidth - padding * 2);
        const randomY = zoneY * zoneHeight + padding + Math.random() * (zoneHeight - padding * 2);
        
        icon.style.left = `${randomX}px`;
        icon.style.top = `${randomY}px`;
        
        // Случайный размер
        const size = 1.5 + Math.random() * 1;
        icon.style.fontSize = `${size}rem`;
        
        // Более широкая дельта длительности мерцания (4-12 секунд)
        const duration = 4 + Math.random() * 8;
        icon.style.animationDuration = `${duration}s`;
        
        this.floatingContainer.appendChild(icon);
        this.activeIcons.push(icon);
        
        // Удаляем иконку после завершения анимации
        setTimeout(() => {
            icon.remove();
            this.activeIcons = this.activeIcons.filter(i => i !== icon);
        }, duration * 1000);
    }

    /**
     * Останавливает генерацию иконок
     */
    stopFloatingIcons() {
        if (this.floatInterval) {
            clearTimeout(this.floatInterval);
            this.floatInterval = null;
        }
        if (this.ringTextTimeout) {
            clearTimeout(this.ringTextTimeout);
            this.ringTextTimeout = null;
        }
        
        // Очищаем все иконки
        if (this.floatingContainer) {
            this.floatingContainer.innerHTML = '';
            this.activeIcons = [];
        }
        // Удаляем текст с колец
        if (this.currentRingText) {
            this.currentRingText.remove();
            this.currentRingText = null;
        }
    }

    /**
     * Запускает генерацию текста на кольцах
     */
    startRingText() {
        if (!this.funnel) return;
        this.scheduleRingText();
    }

    /**
     * Планирует создание текста на кольце
     */
    scheduleRingText() {
        if (this.currentRingText) {
            this.ringTextTimeout = setTimeout(() => this.scheduleRingText(), 500);
            return;
        }

        // Случайная задержка от 2 до 5 секунд
        const delay = 2000 + Math.random() * 3000;

        this.ringTextTimeout = setTimeout(() => {
            this.createRingText();
            this.scheduleRingText();
        }, delay);
    }

    /**
     * Создаёт текст на случайном кольце
     */
    createRingText() {
        // Выбираем случайное кольцо (1-5)
        const ringIndex = Math.floor(Math.random() * 5) + 1;
        const ring = this.funnel?.querySelector(`.ring-${ringIndex}`);
        if (!ring) {
            console.warn('Кольцо не найдено:', ringIndex);
            return;
        }

        console.log('Создаём текст на кольце', ringIndex);

        const text = document.createElement('span');
        text.className = 'ring-text';
        text.textContent = 'h-matrix';

        // Радиусы между кольцами в % от воронки
        // Кольца: 50%, 40%, 30%, 20%, 10% → промежутки: 45%, 35%, 25%, 15%, 5%
        const gapRadii = { 1: 45, 2: 35, 3: 25, 4: 15, 5: 5 };
        const radiusPercent = gapRadii[ringIndex];

        // Случайная позиция (угол 0-360)
        const angle = Math.random() * 360;
        const angleRad = (angle * Math.PI) / 180;

        // Позиция на окружности в процентах
        const x = Math.cos(angleRad) * radiusPercent;
        const y = Math.sin(angleRad) * radiusPercent;

        // Позиционируем в процентах (50% = центр воронки)
        text.style.left = `${50 + x}%`;
        text.style.top = `${50 + y}%`;

        // Поворот текста по касательной
        text.style.transform = `translate(-50%, -50%) rotate(${angle + 90}deg)`;

        // Случайная длительность (14-26 секунд, в среднем ~20 сек)
        const duration = 14 + Math.random() * 12;
        text.style.animationDuration = `${duration}s`;

        console.log('Текст:', { ring: ringIndex, radius: radiusPercent, angle: angle.toFixed(1), duration: duration.toFixed(1) });

        this.funnel.appendChild(text);
        this.currentRingText = text;

        // Удаляем текст после завершения анимации
        setTimeout(() => {
            if (text.parentNode) {
                text.remove();
            }
            this.currentRingText = null;
        }, duration * 1000);
    }

    /**
     * Скрывает overlay с анимацией
     */
    hide() {
        if (!this.overlay || this.overlay.classList.contains('hidden')) return;
        
        this.stopFloatingIcons();
        this.overlay.classList.add('hidden');
        
        // Полностью удаляем overlay из DOM после завершения анимации
        setTimeout(() => {
            if (this.overlay) {
                this.overlay.style.display = 'none';
            }
        }, 800);
    }

    /**
     * Мгновенно скрывает overlay (без анимации)
     */
    hideImmediately() {
        if (!this.overlay) return;
        
        this.stopFloatingIcons();
        this.overlay.style.display = 'none';
    }

    /**
     * Показывает overlay (для отладки)
     */
    show() {
        if (!this.overlay) return;
        
        this.overlay.classList.remove('hidden');
        this.overlay.style.display = 'flex';
        
        // Сбрасываем состояние
        if (this.startButton) {
            this.startButton.classList.remove('visible');
        }
        
        this.isLoaded = false;
        this.floatInterval = null;
        this.startFloatingIcons();
    }
}

// Экспортируем singleton
window.overlayManager = new OverlayManager();
