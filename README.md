# Planos

Планировщик с AI-чатом и заметками. Сделал для себя, может кому-то пригодится.

## Что умеет

- Календарь на неделю где можно перетаскивать события
- AI помощник (нужен OpenAI ключ)
- Стикеры-заметки
- Авторизация через GitHub или Google
- Все синхронизируется между устройствами

## Установка

```bash
npm install
```

Создай `.env.local`:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="сюда-любую-случайную-строку"

# GitHub OAuth
GITHUB_CLIENT_ID="твой-id"
GITHUB_CLIENT_SECRET="твой-секрет"

# Google OAuth (опционально)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

GitHub OAuth получить тут: https://github.com/settings/developers

```bash
npm run dev
```

## Деплой

Работает на Vercel. Просто залей на GitHub и подключи к Vercel.

## Автор

Vladislav Slugin

## Лицензия

MIT
