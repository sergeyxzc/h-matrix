# Startup Overlay

**Версия:** v0.2.7 | **Файлы:** `css/overlay.css` (309 строк), `js/overlay.js` (305 строк)

## Что это

Анимированный стартовый экран до открытия папки:
- 5 вращающихся колец (воронка, 90 сек/оборот)
- Мерцающие иконки тайм-менеджмента (макс 3, 1-3 сек интервал)
- Надпись "h-matrix" между кольцами (14-26 сек, вращается с воронкой)
- Логотип в центре — клик → `App.openFolder()`
- Кнопка "Начать работу" — скрыть overlay

## Компоненты

| Компонент | Класс | Описание |
|-----------|-------|----------|
| Воронка | `.temporal-funnel` | 5 колец, градиент розовый→фиолетовый→циан, вращение 90 сек |
| Иконки | `.floating-icon` | 10 типов (часы, календарь, задачи), 4-12 сек жизнь, 16 зон |
| Текст между кольцами | `.ring-text` | "h-matrix" между кольцами, 14-26 сек, вращается с воронкой |
| Логотип | `.logo-icon` | 3×3 квадрата, градиент, hover scale(1.1) |
| Кнопка | `.btn-start` | Появляется через 0.5 сек, градиент, плавное скрытие 0.8 сек |

## OverlayManager API

```javascript
window.overlayManager  // singleton
  .hide()              // плавное скрытие (0.8 сек)
  .hideImmediately()   // мгновенно
  .show()              // показать (отладка)
```

## Настройки

**В js/overlay.js:**
- `this.maxIcons = 3` — макс. иконок одновременно
- `scheduleNextIcon()` — задержка 1000-3000 мс
- `createFloatingIcon()` — длительность 4000-12000 мс
- `scheduleRingText()` — задержка 2000-5000 мс для текста
- `createRingText()` — текст между кольцами (радиус 5-45%), 14000-26000 мс

**В css/overlay.css:**
- `.temporal-funnel` — размер 780px, animation 90s (медленнее текста)
- `.logo-icon` — градиент #d81b60 → #8e24aa → #0097a7
- `.ring-text` — цвет rgba(255,255,255,0.3), font 1rem, animation 14-26s
- `.btn-start` — появление через 0.5 сек (setTimeout в app.js)

## Интеграция

**Подключение в index.html:**
```html
<link rel="stylesheet" href="css/overlay.css">
<script src="js/overlay.js"></script>
```

**Скрытие при открытии папки (app.js):**
```javascript
async openFolder() {
    await FileHandler.openFolder();
    window.overlayManager?.hide();
}
```

## Расширение

**Добавить иконку** в `overlay.js`:
```javascript
const icons = ['bi-clock', 'bi-calendar-event', 'bi-new-icon'];
```

**Изменить цвет** в `overlay.css`:
```css
.logo-icon {
    background: linear-gradient(135deg, #новый1 0%, #новый2 100%);
}
```

---

**Примечание:** Все параметры анимаций (скорость, размеры, цвета) указаны непосредственно в CSS/JS файлах — сверяйтесь с кодом для точных значений.
