# My Productive Space - Frontend

A Next.js application for managing coworking space bookings, packages, and payments.

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v20 or higher)
- **npm** or **yarn**
- **PostgreSQL** database (for Prisma)

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory and add the following environment variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"

# Backend API
NEXT_PUBLIC_BACKEND_BASE_URL="https://your-backend-api.com/api"

# Other configurations (if needed)
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

### 4. Database Setup

Run Prisma migrations to set up your database:

```bash
npm run migrate
```

This command will:
- Generate Prisma Client
- Run database migrations

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Available Scripts

### Development
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build the application for production
- `npm start` - Start the production server

### Code Quality
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking

### Database
- `npm run migrate` - Run Prisma migrations and generate client
- `npm run prisma:format` - Format Prisma schema

## Project Structure

```
frontend/
├── src/
│   ├── app/              # Next.js app directory (pages & routing)
│   ├── components/       # Reusable React components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions and services
│   ├── db/              # Database schema and Prisma client
│   └── middleware.ts    # Next.js middleware
├── public/              # Static assets
├── package.json         # Project dependencies
└── README.md           # This file
```

## Key Features

- 🏢 **Workspace Booking** - Book coworking spaces for members, students, and tutors
- 📦 **Package Management** - Purchase and manage workspace packages
- 💳 **Payment Integration** - Support for PayNow and credit card payments
- 👤 **User Authentication** - Secure login with Supabase
- 📊 **Admin Dashboard** - Manage bookings, packages, and users
- 🎫 **Pass System** - Redeem passes for bookings

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Supabase
- **State Management**: React Hooks
- **Form Handling**: React Hook Form + Zod

## Troubleshooting

### Port Already in Use

If port 3000 is already in use:

```bash
# Kill the process using port 3000
npx kill-port 3000

# Or run on a different port
npm run dev -- -p 3001
```

### Database Connection Issues

- Verify your `DATABASE_URL` is correct in `.env.local`
- Ensure PostgreSQL is running
- Run migrations again: `npm run migrate`

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

## Support

For issues or questions, please contact the development team or create an issue in the repository.

