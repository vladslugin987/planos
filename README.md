# Planos

A comprehensive productivity and finance management app with AI assistance. Plan your days, track tasks with checklists, manage finances, and take notes - all in one place.

**Live Demo: https://planos-blond.vercel.app**

## Features

- **Weekly Calendar** - Drag and drop events with minute precision
- **Task Management** - Create tasks with checklists, priorities, and due dates
- **Finance Tracker** - Track income and expenses by day, month, and year
- **Sticky Notes** - Draggable notes for quick thoughts
- **AI Assistant** - Smart scheduling with OpenAI integration
- **Year View** - See your events across the entire year
- **Multi-language** - Full support for English and Russian
- **Responsive Design** - Works on desktop and mobile
- **Data Sync** - Everything syncs between your devices

## Setup

```bash
npm install
```

Create `.env.local`:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="any-random-string-here"

# GitHub OAuth
GITHUB_CLIENT_ID="your-id"
GITHUB_CLIENT_SECRET="your-secret"

# Google OAuth (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

Get GitHub OAuth here: https://github.com/settings/developers

```bash
npx prisma generate
npx prisma migrate dev
npm run dev
```

## Deploy

Works on Vercel. Just push to GitHub and connect to Vercel.

## Author

Vladislav Slugin

## License

MIT
