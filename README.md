[![Lint](https://github.com/andrewtrautman/block-on-block/actions/workflows/lint.yml/badge.svg)](https://github.com/andrewtrautman/block-on-block/actions/workflows/lint.yml)

# Block on Block - Modern File Storage & Sharing

A robust Google Drive-like application with real-time collaboration features, file versioning, user permissions, and public sharing.

## Features

- **File Management**: Upload, download, rename, move, and delete files
- **Folder Organization**: Create nested folder structures to organize your content
- **Trash & Recovery**: Soft delete with restoration capability
- **User Access Control**: Share files/folders with specific permissions (view, edit, own)
- **Real-time Collaboration**: Socket.io integration for live updates when changes occur
- **File Versioning**: Track file changes with complete version history
- **File Details**: View metadata, activity logs, and manage versions
- **Public Sharing**: Generate shareable links for files and folders

## Technology Stack

- **Frontend**: Next.js 13 (App Router), React, Tailwind CSS
- **Backend**: Express.js, Socket.io
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with httpOnly cookies
- **File Storage**: Local filesystem (production would use cloud storage)

## Project Structure

- `/server` - Express.js backend API
- `/web` - Next.js frontend application
- `/prisma` - Database schema and migrations

## Setup Instructions

### Prerequisites

- Node.js 16+
- PostgreSQL database
- Redis (optional, for session storage)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/block-on-block.git
   cd block-on-block
   ```

2. Install dependencies for both backend and frontend:
   ```
   # Server dependencies
   cd server
   npm install

   # Web dependencies
   cd ../web
   npm install
   ```

3. Set up environment variables:
   - Create `.env` file in the `/server` directory with:
     ```
     DATABASE_URL="postgresql://username:password@localhost:5432/blockondrive"
     JWT_SECRET="your-jwt-secret"
     FRONTEND_URL="http://localhost:3000"
     ```
   - Create `.env.local` file in the `/web` directory with:
     ```
     NEXT_PUBLIC_API_URL="http://localhost:5000"
     ```

4. Run database migrations:
   ```
   cd server
   npx prisma migrate dev
   ```

5. Start the development servers:
   ```
   # Start backend (from server directory)
   npm run dev

   # Start frontend (from web directory)
   npm run dev
   ```

6. Open your browser to `http://localhost:3000`

## Public Sharing

The application now supports public sharing of files and folders:

1. **Generate Share Links**: Create shareable links for files or folders
2. **Public Access**: Anyone with the link can access shared content without logging in
3. **Download**: Files can be downloaded directly from share links
4. **Preview**: Images and PDFs have built-in preview functionality
5. **Disable Sharing**: Remove public access with a single click

## Documentation

For detailed documentation on API endpoints, websocket events, and more, see the `/docs` directory.

## License

MIT 