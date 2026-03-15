# Backend страницы объекта (Object Detail / ObjectSheet) — план реализации и интеграции

## 1. Анализ фронта: экран объекта

### 1.1. Где открывается

- **Страница**: главная карта (`/`, `Index.tsx`).
- **Действие**: клик по карточке в нижней карусели → `setSelectedObject(obj)` → рендерится `ObjectSheet` с этим же объектом.
- **Источник данных**: объект приходит из списка карты (`useMapObjects` → `GET /api/map/objects`). Отдельного запроса по `id` при открытии шторки **нет**.

### 1.2. Компонент ObjectSheet — что показывает

| Блок | Данные | Откуда |
|------|--------|--------|
| Hero | `object.image`, `object.name`, `object.address`, `object.status` | InfraObject |
| 4 карточки | `object.established`, `object.capitalRepair`, `object.water`, `object.internet` | InfraObject |
| Collapsible summary | `object.summary` | InfraObject |
| «So'nggi muammo» | `object.observations` — элемент с макс. `priority` | InfraObject.observations |
| Таб **Umumiy** | `object.categories` → для каждой: `cat.title`, `cat.promises` (список) | InfraObject.categories |
| Таб **Xabarlar** | `object.observations` (фильтр по `category`, сортировка по `priority`) | InfraObject.observations |
| Кнопка «Muammo haqida xabar berish» | открывает `ReportProblemSheet` | — |

### 1.3. Вложенные компоненты и контракты

- **PromiseItem** (в Umumiy): принимает `InfraPromise`: `id`, `title`, `confirmed`, `reported`, `status`. Кнопка «Tekshirish» → `onInspect(promise)` → открывается **CameraInspection**.
- **ObservationCard** (в Xabarlar): принимает `Observation`: `id`, `category`, `text`, `time`, `photos[]`, `priority`.
- **ReportProblemSheet**: форма (категория из фиксированного списка, комментарий, фото-placeholder). Сейчас только toast, **нет вызова API**.
- **CameraInspection**: верификация обещания (фото с камеры, вердикт works/broken, комментарий). Сейчас только toast, **нет вызова API**.

### 1.4. Типы (frontend)

```ts
// src/data/infrastructure.ts
interface InfraPromise {
  id: string;
  title: string;
  confirmed: number;
  reported: number;
  status: string;  // текст, напр. "Tasdiqlangan", "Aralash fikrlar"
}
interface Category {
  title: string;
  promises: InfraPromise[];
}
interface Observation {
  id: string;
  category: string;
  text: string;
  time: string;      // человеко-читаемое, напр. "2 soat oldin"
  photos: string[]; // URL или data URL
  priority: number;
}
interface InfraObject {
  // ... поля карты ...
  categories: Category[];
  observations: Observation[];
}
```

### 1.5. Текущее состояние интеграции

- Список карты: `GET /api/map/objects` → объекты с `categories: []`, `observations: []`.
- При открытии ObjectSheet передаётся **тот же объект из списка** → табы Umumiy и Xabarlar пустые.
- Нет запроса вида `GET /api/map/objects/:id` при открытии шторки.
- Нет вызовов API из ReportProblemSheet и CameraInspection.

---

## 2. Цель бэкенда для страницы объекта

1. Отдавать по объекту **полные** данные: `categories` (с `promises`) и `observations`.
2. (Позже) Принимать отправку жалобы (Observation) и верификации (Verification) и сохранять в JSON.

Ограничение: без БД, только JSON-файлы, без лишней сложности.

---

## 3. Сущности и хранилище

### 3.1. Сущности

| Сущность | Описание | Связь |
|----------|----------|--------|
| **Object** | Уже есть (map-objects / enriched-objects). | — |
| **Category** | Группа обещаний по объекту (например «Sanitariya», «Jihozlar»). | Привязана к объекту (objectId). |
| **ProgramItem (InfraPromise)** | Одно обещание/пункт программы: название, счётчики подтверждений/жалоб, текстовый статус. | Входит в Category по объекту. |
| **Observation** | Сообщение о проблеме от гражданина: категория, текст, время, фото, приоритет. | Привязано к объекту (objectId). |
| **Verification** | Факт проверки ProgramItem: вердикт (confirmed/issue), фото, комментарий. | Привязан к objectId и programItemId. |

Не смешивать: **Verification** = проверка официального пункта; **Observation** = новая жалоба, не из плана.

### 3.2. Предлагаемое хранилище (JSON)

- **`backend/data/object-details.json`** (или два файла — по желанию):
  - Ключ — `objectId` (id объекта из map-objects).
  - Значение — расширение объекта для экрана детали:
    - `categories: Category[]` (каждая с `promises: InfraPromise[]`);
    - `observations: Observation[]`.

  Альтернатива: отдельно `program-items.json` (массив с полем `objectId`) и `observations.json` (массив с полем `objectId`). Тогда агрегация «по объекту» делается при отдаче API.

- Для MVP достаточно **одного файла** `object-details.json`:

```json
{
  "1": {
    "categories": [
      { "title": "Sanitariya", "promises": [ { "id": "p1", "title": "...", "confirmed": 45, "reported": 38, "status": "Aralash fikrlar" } ] }
    ],
    "observations": [
      { "id": "o1", "category": "Sanitariya", "text": "...", "time": "2 soat oldin", "photos": [], "priority": 3 }
    ]
  },
  "2": { "categories": [...], "observations": [...] }
}
```

- Для **Verification** (позже): либо поле в program-item (`confirmed`/`reported` обновляются при POST verification), либо отдельный `verifications.json` и пересчёт счётчиков при чтении.

---

## 4. API для страницы объекта

### 4.1. Получение полного объекта (деталь)

**Вариант A — один endpoint для детали**

- **GET /api/map/objects/:id/detail** (или **GET /api/objects/:id**)  
  Ответ: один объект в формате **InfraObject** (как на фронте), т.е. все поля карты + **categories** + **observations**.
  - Если для `id` нет записи в `object-details.json` — вернуть объект из map-objects с `categories: []`, `observations: []`.

**Вариант B — текущий GET /api/map/objects/:id отдаёт полный объект**

- Оставить **GET /api/map/objects/:id** как единственный способ получить объект по id.
- В бэкенде при отдаче объекта по id подмешивать данные из `object-details.json` (categories, observations).
- Список **GET /api/map/objects** по желанию можно оставить «лёгким» (без categories/observations) для скорости, либо тоже подмешивать — тогда открытие шторки без доп. запроса.

Рекомендация для быстрой интеграции: **Вариант B** — GET /api/map/objects/:id возвращает полный объект (с categories и observations из object-details). Список GET /api/map/objects можно пока оставить как есть (с пустыми массивами) и на фронте при открытии ObjectSheet делать **доп. запрос GET /api/map/objects/:id** и подставлять результат в `selectedObject`. Так не нужно таскать тяжёлые данные в списке.

### 4.2. Отправка данных (следующий этап)

- **POST /api/objects/:id/observations** — создание Observation (форма «Muammo haqida xabar berish»).  
  Тело: `category`, `text`, опционально `photo` (base64 или URL после загрузки).
- **POST /api/objects/:id/verifications** (или **/program-items/:id/verifications**) — создание Verification (форма CameraInspection).  
  Тело: `programItemId`, `verdict: 'works' | 'broken'`, `comment?`, `photo`.

Эти эндпоинты можно реализовать после того, как деталь объекта будет отображаться с бэкенда.

---

## 5. План реализации (по шагам)

### Шаг 1: Хранилище и чтение деталей

1. Создать **`backend/data/object-details.json`** с структурой `{ [objectId]: { categories, observations } }`.
2. Для текущих 10 объектов заполнить демо-данными (хотя бы по 1–2 категории с promises и 0–2 observations), чтобы UI не был пустым.
3. В **mapService** (или в новом **objectDetailService**): при запросе объекта по id загружать базовый объект из map-objects и мержить с `object-details[id]` (categories, observations). Если деталей нет — отдавать пустые массивы.

### Шаг 2: Endpoint

4. Убедиться, что **GET /api/map/objects/:id** возвращает полный объект (с подставленными categories и observations из object-details). Контроллер уже есть; достаточно изменить сервис/репозиторий для отдачи «полного» объекта.

### Шаг 3: Интеграция на фронте

5. На главной при открытии шторки объекта: не полагаться только на объект из списка. Либо:
   - **Вариант 1**: При клике по карточке вызывать **GET /api/map/objects/:id**, по ответу вызывать `setSelectedObject(fullObject)`.
   - **Вариант 2**: Всегда в списке отдавать с бэкенда объекты уже с categories/observations (тяжелее список). Тогда дополнительный запрос не нужен.

Рекомендация: **Вариант 1** — при открытии ObjectSheet запрашивать **GET /api/map/objects/:id** и показывать полученный объект (с списками). До ответа можно показывать скелетон или тот же объект из списка с пустыми списками.

6. Добавить на фронте вызов API (например `fetchObjectById(id)` в `mapApi.ts`) и в `Index.tsx` при `handleCardClick` или при рендере ObjectSheet — запрос по id и обновление `selectedObject` полным объектом.

### Шаг 4 (позже): POST Observation и Verification

7. Реализовать **POST /api/objects/:id/observations**: добавление записи в `observations` в object-details (или в observations.json), генерация `id`, `time` (или `createdAt`), `priority` по умолчанию.
8. В **ReportProblemSheet** после валидации вызывать этот endpoint и при успехе закрывать шторку и обновлять объект (или refetch по id).
9. Реализовать **POST verification**: обновление счётчиков в program-item и при необходимости запись в verifications.json; при успехе в CameraInspection закрывать и обновлять данные.

---

## 6. Формат данных в object-details.json (пример)

```json
{
  "1": {
    "categories": [
      {
        "title": "Tibbiy xizmat",
        "promises": [
          {
            "id": "p-1-1",
            "title": "Konsultatsiya vaqtida qabul",
            "confirmed": 12,
            "reported": 2,
            "status": "Tasdiqlangan"
          }
        ]
      }
    ],
    "observations": [
      {
        "id": "obs-1-1",
        "category": "Navbat / Xizmat sifati",
        "text": "Navbat uzoq kutilmoqda.",
        "time": "3 soat oldin",
        "photos": [],
        "priority": 2
      }
    ]
  }
}
```

Поле **time**: для бэкенда удобно хранить `createdAt` (ISO), а при отдаче фронту добавлять человеко-читаемое `time` (или генерировать на фронте из `createdAt`). Для MVP можно хранить только `time` строкой.

---

## 7. Краткий чеклист перед разработкой

- [ ] Создать `backend/data/object-details.json` с ключами по objectId (1–10).
- [ ] Реализовать чтение и мерж в сервисе (object detail = map object + object-details[id]).
- [ ] GET /api/map/objects/:id возвращает полный объект (categories, observations).
- [ ] Фронт: при открытии ObjectSheet вызывать GET /api/map/objects/:id и обновлять selectedObject.
- [ ] (Позже) POST observation, POST verification; подключить формы ReportProblemSheet и CameraInspection.

После этого страница объекта будет полностью питаться с бэкенда (списки Umumiy и Xabarlar), а формы отправки можно подключать по одному.
