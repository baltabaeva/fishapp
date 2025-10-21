# Ежедневник рыбака

Мобильное веб‑приложение (React + Vite + TypeScript) для учёта ежедневных продаж рыбы и расходов. Всё на одной странице: добавляйте/редактируйте продажи и расходы, смотрите итоги и 15% заработка, сохраняйте день в Google Sheets через Google Apps Script.

## Возможности
- **Продажи**: список с позицией (кг, цена/кг, сумма), добавление/правка/удаление
- **Расходы**: список с категорией и суммой, добавление/удаление
- **Сводка**: итого кг, продажи, расходы, прибыль, 15% заработка — пересчитывается мгновенно
- **Сохранение** в Google Sheets (одна строка на дату, JSON для продаж и расходов)

## Запуск
1. Установите зависимости:
   ```bash
   npm install
   ```
2. Создайте `.env` в корне и укажите Web App URL Apps Script:
   ```env
   VITE_GAS_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
   ```
3. Запуск:
   ```bash
   npm run dev
   ```

## Структура
- `src/App.tsx` — одна страница: дата, продажи, расходы, сводка
- `src/components/SaleList.tsx` — список продаж (добавить/редактировать/удалить)
- `src/components/ExpenseList.tsx` — список расходов (добавить/удалить)
- `src/components/Summary.tsx` — итоговые расчёты и кнопка «Сохранить день»
- `src/components/Toast.tsx` — тост уведомления
- `src/context/AppContext.tsx` — состояние (дата, продажи, расходы), загрузка/сохранение
- `src/api/saveToGoogle.ts` — `saveDay()` отправка в GAS
- `src/api/getFromGoogle.ts` — `getDay(date)` загрузка из GAS

## Модель данных (в таблице)
Одна строка на день:

```
Date | Sales(JSON) | Expenses(JSON) | TotalKg | TotalSales | TotalExpenses | Profit | Earnings15
```

Пример `Sales(JSON)`:
```json
[
  {"kg":20,"price":1500,"total":30000},
  {"kg":15,"price":1200,"total":18000}
]
```

## Настройка Google Sheets и Apps Script
1. Создайте таблицу и лист (например, `Лист1`) с колонками как выше.
2. Extensions → Apps Script: создайте скрипт и вставьте код ниже.
3. Укажите `SPREADSHEET_ID` и `SHEET_NAME`.
4. Deploy → New deployment → Type: Web app → Execute as: Me → Who has access: Anyone → Deploy. Скопируйте URL.
5. Поместите URL в `.env` как `VITE_GAS_URL`.

### Пример Google Apps Script (загрузка дня/всей истории и сохранение)
```js
const SPREADSHEET_ID = 'YOUR_SHEET_ID';
const SHEET_NAME = 'Лист1';

function findRowByDate_(sh, dateStr) {
  const values = sh.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === dateStr) return i + 1; // 1-based row index
  }
  return -1;
}

function doGet(e) {
  const date = e.parameter.date;
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh = ss.getSheetByName(SHEET_NAME);

  if (date) {
    const rowIndex = findRowByDate_(sh, date);
    if (rowIndex === -1) {
      return ContentService.createTextOutput(JSON.stringify({ record: null }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    const row = sh.getRange(rowIndex, 1, 1, 8).getValues()[0];
    const record = {
      date: row[0],
      sales: row[1] ? JSON.parse(row[1]) : [],
      expenses: row[2] ? JSON.parse(row[2]) : [],
      totalKg: Number(row[3]) || 0,
      totalSales: Number(row[4]) || 0,
      totalExpenses: Number(row[5]) || 0,
      profit: Number(row[6]) || 0,
      earnings15: Number(row[7]) || 0,
    };
    return ContentService.createTextOutput(JSON.stringify({ record }))
      .setMimeType(ContentService.MimeType.JSON);
  } else {
    const values = sh.getDataRange().getValues();
    const rows = values.slice(1); // skip header
    const records = rows.map(row => ({
      date: row[0],
      sales: row[1] ? JSON.parse(row[1]) : [],
      expenses: row[2] ? JSON.parse(row[2]) : [],
      totalKg: Number(row[3]) || 0,
      totalSales: Number(row[4]) || 0,
      totalExpenses: Number(row[5]) || 0,
      profit: Number(row[6]) || 0,
      earnings15: Number(row[7]) || 0,
    }));
    return ContentService.createTextOutput(JSON.stringify({ records }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  if (body.action === 'saveDay' && body.record) {
    const r = body.record;
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(SHEET_NAME);

    const rowIndex = findRowByDate_(sh, r.date);
    const rowValues = [
      r.date,
      JSON.stringify(r.sales || []),
      JSON.stringify(r.expenses || []),
      Number(r.totalKg) || 0,
      Number(r.totalSales) || 0,
      Number(r.totalExpenses) || 0,
      Number(r.profit) || 0,
      Number(r.earnings15) || 0,
    ];

    if (rowIndex === -1) {
      sh.appendRow(rowValues);
    } else {
      sh.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({ ok: false }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## Дизайн
- Светлая тема, фон `#F9FAFB`, тёмный текст `#1E293B`
- Синие кнопки `#BFDBFE`, мягкие тени, скругления `rounded-2xl`
- Одна колонка, max‑width 480px, большие зоны ввода и кнопки

## PWA
- Минимальный манифест и `sw.js` для кэширования оболочки приложения

## Примечания
- Для отображения валют используются локали `ru-RU` и суффикс `₸`.
