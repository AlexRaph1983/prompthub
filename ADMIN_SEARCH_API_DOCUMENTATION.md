# 🔍 API документация для поиска в админ-панели

## 📋 Обзор

Система поиска в админ-панели с улучшенной логикой отправки событий, клиентской фильтрацией и подсказками.

## 🎯 Основные принципы

### **1. Логика отправки событий:**
- ✅ **Только по Enter или blur** - события отправляются только при завершении ввода
- ✅ **Debounce 600ms** - подсказки обновляются с задержкой, но не логируются
- ✅ **Флаг finished=true** - при отправке всегда передается флаг завершения

### **2. Клиентская фильтрация:**
- ✅ **Удаление emoji** - все emoji символы удаляются
- ✅ **Сжатие повторяющихся символов** - максимум 2 одинаковых символа подряд
- ✅ **Минимум 2 буквы** - запросы с меньшим количеством букв отклоняются
- ✅ **Стоп-слова** - блокировка запросов из стоп-листа

## 🔧 API Endpoints

### **POST /api/search-tracking**

Отправка поискового запроса с валидацией.

#### **Request Body:**
```json
{
  "query": "string",           // Поисковый запрос
  "resultsCount": "number", // Количество результатов
  "clickedResult": "string",   // ID кликнутого результата (опционально)
  "sessionId": "string",       // ID сессии
  "finished": "boolean"        // Флаг завершения (обязательно true)
}
```

#### **Response (Success):**
```json
{
  "success": true,
  "processed": "string",       // Обработанный запрос
  "hash": "string",           // Хэш для дедупликации
  "metrics": {                 // Метрики валидации
    "length": "number",
    "percentLetters": "number",
    "maxConsecutiveChars": "number",
    "hasOnlyNumbers": "boolean",
    "hasOnlySpecialChars": "boolean"
  }
}
```

#### **Response (Error):**
```json
{
  "error": "string",           // Описание ошибки
  "reason": "string",          // Код причины отклонения
  "metrics": {                 // Метрики валидации
    "length": "number",
    "percentLetters": "number",
    "maxConsecutiveChars": "number",
    "hasOnlyNumbers": "boolean",
    "hasOnlySpecialChars": "boolean"
  }
}
```

### **GET /api/admin/search-metrics**

Получение метрик валидации поиска.

#### **Query Parameters:**
- `includeStats` (boolean) - включить детальную статистику

#### **Response:**
```json
{
  "success": true,
  "data": {
    "metrics": {
      "countSaved": "number",      // Количество сохраненных запросов
      "countRejected": "number",   // Количество отклоненных запросов
      "totalQueries": "number",    // Общее количество запросов
      "acceptanceRate": "number",  // Процент принятых запросов
      "rejectionRate": "number",   // Процент отклоненных запросов
      "lastUpdated": "string"      // Время последнего обновления
    },
    "rejectionReasons": {          // Причины отклонения
      "TOO_SHORT": "number",
      "INSUFFICIENT_LETTERS": "number",
      "STOP_WORD": "number"
    },
    "rejectionStats": [            // Детальная статистика (если includeStats=true)
      {
        "reason": "string",
        "count": "number",
        "percentage": "number",
        "description": "string"
      }
    ]
  }
}
```

## 🧩 Компоненты

### **useAdminSearch Hook**

Хук для управления поиском в админ-панели.

#### **Параметры:**
```typescript
interface AdminSearchOptions {
  debounceMs?: number                    // Debounce в миллисекундах (по умолчанию 600)
  onSearch?: (query: string, finished: boolean) => void    // Колбэк для поиска
  onSuggestions?: (query: string) => void                 // Колбэк для подсказок
}
```

#### **Возвращаемые значения:**
```typescript
{
  searchValue: string,                   // Текущее значение поиска
  setSearchValue: (value: string) => void, // Установка значения
  isSearching: boolean,                  // Флаг поиска
  handleKeyDown: (e: KeyboardEvent) => void, // Обработчик нажатий клавиш
  handleBlur: () => void,                // Обработчик потери фокуса
  clearSearch: () => void,              // Очистка поиска
  cleanup: () => void                   // Очистка ресурсов
}
```

### **AdminPromptManagement Component**

Компонент управления промптами с улучшенным поиском.

#### **Особенности:**
- ✅ Интеграция с `useAdminSearch` хуком
- ✅ Подсказки на основе существующих данных
- ✅ Индикатор загрузки поиска
- ✅ Кнопка очистки поиска
- ✅ Клиентская фильтрация запросов

## 🔍 Клиентская фильтрация

### **Функции фильтрации:**

#### **stripEmojis(text: string): string**
Удаляет все emoji символы из текста.

#### **collapseRepeatedChars(text: string): string**
Сжимает повторяющиеся символы до максимум 2 подряд.

#### **countLetters(text: string): number**
Подсчитывает количество букв в тексте.

#### **isStopWord(text: string): boolean**
Проверяет, является ли текст стоп-словом.

#### **hasMinLetters(text: string, minLetters: number): boolean**
Проверяет минимальное количество букв.

#### **filterSearchQuery(query: string): FilterResult**
Основная функция фильтрации запроса.

### **Стоп-слова:**
```typescript
const STOP_WORDS = [
  'spam', 'test', 'тест', 'фон', 'функ', 'провер', 'проверка', 'проверяю',
  'а', 'б', 'в', 'г', 'д', 'е', 'ё', 'ж', 'з', 'и', 'й', 'к', 'л', 'м', 'н', 'о', 'п', 'р', 'с', 'т', 'у', 'ф', 'х', 'ц', 'ч', 'ш', 'щ', 'ъ', 'ы', 'ь', 'э', 'ю', 'я',
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'
]
```

## 🧪 Тестирование

### **Unit тесты:**
```bash
npm test -- --testPathPattern="useAdminSearch|search-filtering"
```

### **Тестовые сценарии:**
- ✅ Валидация поисковых запросов
- ✅ Клиентская фильтрация
- ✅ Debounce логика
- ✅ Отправка событий только по Enter/blur
- ✅ Обработка стоп-слов
- ✅ Подсказки

## 📊 Метрики и мониторинг

### **Отслеживаемые метрики:**
- `countSaved` - количество сохраненных запросов
- `countRejected` - количество отклоненных запросов
- `acceptanceRate` - процент принятых запросов
- `rejectionRate` - процент отклоненных запросов

### **Причины отклонения:**
- `EMPTY_QUERY` - пустой запрос
- `STOP_WORD` - запрос в стоп-листе
- `INSUFFICIENT_LETTERS` - недостаточно букв
- `EMPTY_AFTER_FILTERING` - пустой после фильтрации

## 🚀 Использование

### **Базовое использование:**
```typescript
const {
  searchValue,
  setSearchValue,
  isSearching,
  handleKeyDown,
  handleBlur,
  clearSearch
} = useAdminSearch({
  onSearch: (query, finished) => {
    if (finished) {
      // Выполнить поиск
      performSearch(query)
    }
  },
  onSuggestions: (query) => {
    // Обновить подсказки
    updateSuggestions(query)
  }
})
```

### **Интеграция в компонент:**
```tsx
<input
  type="text"
  value={searchValue}
  onChange={(e) => setSearchValue(e.target.value)}
  onKeyDown={handleKeyDown}
  onBlur={handleBlur}
  placeholder="Поиск..."
/>
```

## 🔧 Настройка

### **Debounce время:**
```typescript
const { ... } = useAdminSearch({
  debounceMs: 600 // Настройка debounce
})
```

### **Кастомные колбэки:**
```typescript
const { ... } = useAdminSearch({
  onSearch: (query, finished) => {
    // Кастомная логика поиска
  },
  onSuggestions: (query) => {
    // Кастомная логика подсказок
  }
})
```
