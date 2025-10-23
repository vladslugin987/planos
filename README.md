# Planos

A planner with AI chat and notes. Made it for myself, maybe someone will find it useful.

## Features

- Weekly calendar with drag & drop events
- AI assistant (needs OpenAI key)
- Sticky notes
- Auth via GitHub or Google
- Everything syncs between devices

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
npm run dev
```

## Deploy

Works on Vercel. Just push to GitHub and connect to Vercel.

## Author

Vladislav Slugin

## License

MIT
