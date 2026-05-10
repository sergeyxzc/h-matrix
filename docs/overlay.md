# Startup Overlay

**Версия:** v0.2.5 | **Файлы:** `css/overlay.css` (280 строк), `js/overlay.js` (208 строк)

## Что это

Анимированный стартовый экран до открытия папки:
- 5 вращающихся колец (воронка, 60 сек/оборот)
- Мерцающие иконки тайм-менеджмента (макс 3, 1-3 сек интервал)
- Логотип в центре — клик → `App.openFolder()`
- Кнопка "Начать работу" — скрыть overlay

## Компоненты

| Компонент | Класс | Описание |
|-----------|-------|----------|
| Воронка | `.temporal-funnel` | 5 колец, градиент розовый→фиолетовый→циан, вращение 60 сек |
| Иконки | `.floating-icon` | 10 типов (часы, календарь, задачи), 4-12 сек жизнь, 16 зон |
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

**В css/overlay.css:**
- `.temporal-funnel` — размер 780px, animation 60s
- `.logo-icon` — градиент #d81b60 → #8e24aa → #0097a7
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
