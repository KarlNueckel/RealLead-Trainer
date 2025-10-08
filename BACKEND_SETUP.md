# 🚀 Backend Setup Guide - RealLead Trainer

This guide will help you set up the backend server with database support for storing conversations and script files.

## 📋 Prerequisites

- Node.js v18+
- PostgreSQL database (NeonDB recommended for cloud, or local PostgreSQL)
- npm or yarn

## 🗄️ Database Setup

### Option 1: NeonDB (Recommended for Production)

1. **Create a NeonDB account** at https://neon.tech
2. **Create a new project** and database
3. **Copy your connection string** (it looks like: `postgresql://user:password@ep-xyz.neon.tech/dbname?sslmode=require`)

### Option 2: Local PostgreSQL

1. Install PostgreSQL locally
2. Create a new database:
   ```bash
   createdb reallead_trainer
   ```
3. Your connection string will be: `postgresql://user:password@localhost:5432/reallead_trainer`

## ⚙️ Environment Configuration

1. **Add your DATABASE_URL to `.env.local`:**

```env
# Existing keys
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o-realtime-preview-2024-10-01
DEEPGRAM_API_KEY=your-key-here
ELEVENLABS_API_KEY=your-key-here

# Add this for database
DATABASE_URL=postgresql://user:password@your-db.neon.tech/dbname?sslmode=require
```

Replace with your actual database connection string.

## 🔨 Run Database Migrations

Once your `.env.local` has the `DATABASE_URL`, run:

```bash
cd server
npx prisma migrate dev --name init
```

This will:
- Create the database tables (`Conversation` and `Script`)
- Generate the Prisma Client

## 🚀 Start the Server

From the project root:

```bash
npm run dev
```

This starts both:
- **Backend** (Express) on http://localhost:3001
- **Frontend** (Vite) on http://localhost:5173

Or run them separately:

```bash
# Backend only
npm run server

# Frontend only
npm run client
```

## 📡 API Endpoints

### 🎙️ Realtime API
- `GET /api/realtime-session` - Generate OpenAI Realtime session token

### 🗣️ Conversations
- `POST /api/conversations` - Save a conversation transcript
- `GET /api/conversations` - Get recent conversations (limit: 10)
- `GET /api/conversations/:id` - Get a specific conversation
- `DELETE /api/conversations/:id` - Delete a conversation

### 📄 Scripts
- `POST /api/scripts/upload` - Upload a script file
- `GET /api/scripts` - Get all scripts
- `DELETE /api/scripts/:id` - Delete a script

### 📊 Analytics
- `GET /api/stats` - Get user statistics (total conversations, scripts, avg duration)

## 📝 Example API Calls

### Save a Conversation

```javascript
const response = await fetch('http://localhost:3001/api/conversations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    transcript: [
      { speaker: 'user', message: 'Hello!', timestamp: 0 },
      { speaker: 'ai', message: 'Hi there!', timestamp: 2 }
    ],
    duration: 120, // seconds
    scenario: 'cold-call',
    difficulty: 'medium',
    userId: 'user123' // optional
  })
});

const data = await response.json();
console.log('Saved:', data);
```

### Get Recent Conversations

```javascript
const response = await fetch('http://localhost:3001/api/conversations?limit=5');
const conversations = await response.json();
console.log('Recent conversations:', conversations);
```

### Upload a Script

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('title', 'My Sales Script');
formData.append('description', 'Cold call opening script');

const response = await fetch('http://localhost:3001/api/scripts/upload', {
  method: 'POST',
  body: formData
});

const data = await response.json();
console.log('Uploaded:', data);
```

## 🗂️ Database Schema

### Conversation Table
- `id` - Unique identifier
- `userId` - Optional user ID (for future auth)
- `transcript` - JSON string of conversation
- `duration` - Call duration in seconds
- `scenario` - e.g., "cold-call", "follow-up", "demo"
- `difficulty` - e.g., "easy", "medium", "hard"
- `createdAt` - Timestamp
- `updatedAt` - Timestamp

### Script Table
- `id` - Unique identifier
- `userId` - Optional user ID
- `title` - Script title
- `description` - Script description
- `fileUrl` - URL to uploaded file
- `fileName` - Original file name
- `fileSize` - File size in bytes
- `uploadedAt` - Timestamp
- `updatedAt` - Timestamp

## 🔧 Prisma Commands

### View Database in Prisma Studio
```bash
cd server
npx prisma studio
```

Opens a GUI at http://localhost:5555 to view/edit database records.

### Create a New Migration
```bash
cd server
npx prisma migrate dev --name description_of_changes
```

### Reset Database (⚠️ Deletes all data)
```bash
cd server
npx prisma migrate reset
```

## 🔐 Future: User Authentication

The schema is ready for user accounts. To add authentication:

1. Uncomment the `User` model in `server/prisma/schema.prisma`
2. Add a user authentication library (e.g., Passport.js, NextAuth)
3. Create user registration/login endpoints
4. Link conversations and scripts to authenticated users

## 🐛 Troubleshooting

### "Environment variable not found: DATABASE_URL"
- Make sure `.env.local` has `DATABASE_URL` set
- Ensure `dotenv` is loading the file correctly

### "Can't reach database server"
- Check your database is running (if local)
- Verify the connection string is correct
- For NeonDB, ensure your IP is whitelisted (usually automatic)

### Prisma Client errors
- Run `npx prisma generate` to regenerate the client
- Delete `node_modules/@prisma/client` and run `npm install`

### File upload errors
- Check that `server/uploads/` directory exists
- Verify file size limits (default: 10MB)
- Check file type restrictions (txt, pdf, doc, docx, md)

## 📚 Resources

- [Prisma Docs](https://www.prisma.io/docs)
- [NeonDB Docs](https://neon.tech/docs)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Multer (File Upload)](https://github.com/expressjs/multer)

