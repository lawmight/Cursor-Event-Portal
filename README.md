# Cursor Popup Portal

Event management portal for Cursor community meetups.

## Features

- **Registration & Check-in**: QR code registration and staff check-in tools
- **Event Experience**: Agenda, resources, and announcements
- **Q&A System**: Real-time questions with upvoting and moderation
- **Survey System**: Post-event feedback collection
- **Admin Dashboard**: Overview and management tools

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Email**: Resend

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (see `.env.example`):
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
RESEND_API_KEY=your_resend_api_key
```

3. Run database migrations:
   - Apply the SQL schema from `supabase/schema.sql` to your Supabase project

4. Run the development server:
```bash
npm run dev
```

## Deployment

This project is configured for deployment on Render. See `render.yaml` for configuration.

## Database Schema

See `supabase/schema.sql` for the complete database schema.

