# Fantasy Cricket Draft System

A full-featured fantasy cricket draft application with real-time updates, customizable rules, and an intuitive admin interface.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Run database migrations
npx prisma db push

# Seed the database
npx prisma db seed

# Start development server
npm run dev
```

Visit **http://localhost:3000/admin** to get started!

## 📋 Features

- **Snake & Linear Draft Orders** - Flexible draft configurations
- **Real-time Turn Detection** - Know exactly whose turn it is
- **Automatic Validation** - Enforces team caps, role requirements, and early-round rules
- **Admin Dashboard** - Manage players, participants, and draft settings
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Color-coded Teams** - Easy visual identification of IPL teams

## 📖 Documentation

- **[Complete Guide](./README_DRAFT_SYSTEM.md)** - Full system documentation
- **[Database Setup](./SETUP_DATABASE.md)** - Database configuration guide

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Styling**: Tailwind CSS
- **Real-time**: Pusher (optional)

## 📁 Project Structure

```
cricket/
├── src/
│   ├── app/              # Next.js pages and API routes
│   ├── components/       # React components
│   ├── lib/              # Business logic and utilities
│   └── types/            # TypeScript type definitions
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Database seeding
└── public/               # Static assets
```

## 🎯 Usage

### 1. Add Participants
Navigate to **Admin → Participants** and add at least 2 participants.

### 2. Configure Draft Rules
Go to **Admin → Configuration** to customize:
- Roster size
- Team caps
- Role requirements
- Early-round rules

### 3. Start Draft
Click **Monitor Draft → Start Draft**, select participants and draft order.

### 4. Make Picks
Use the participant switcher to test different users making picks.

## 🔧 Configuration

Edit `.env` file:

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a pull request.

---

**Status**: Production Ready  
**Version**: 1.0.0
