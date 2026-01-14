# Deployment Guide

## Prerequisites

1. **GitHub Repository**: Create a new repository on GitHub
2. **Supabase Project**: You've reached the free project limit. Either:
   - Apply the SQL schema to an existing project, OR
   - Pause/delete an inactive project and create a new one
3. **Render Account**: Already connected

## Step 1: Push to GitHub

1. Create a new repository on GitHub (e.g., `cursor-popup-portal`)

2. Add the remote and push:
```bash
cd portal
git remote add origin https://github.com/YOUR_USERNAME/cursor-popup-portal.git
git branch -M main
git push -u origin main
```

## Step 2: Set Up Supabase

### Option A: Use Existing Project

1. Go to your Supabase dashboard
2. Select an existing project (or create a new one after pausing/deleting an inactive one)
3. Go to SQL Editor
4. Copy and paste the contents of `supabase/schema.sql`
5. Run the SQL

### Option B: Apply via MCP (if you have a project ID)

If you have a Supabase project ID, you can apply the migration using:
```bash
# The SQL is in portal/supabase/schema.sql
```

## Step 3: Get Supabase Credentials

1. Go to your Supabase project settings
2. Navigate to API settings
3. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

## Step 4: Deploy to Render

The project is already configured with `render.yaml`. To deploy:

1. Go to Render Dashboard
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Render will auto-detect the `render.yaml` configuration
5. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY` (optional, for email features)
   - `NODE_ENV=production`

6. Deploy!

## Environment Variables Summary

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_key (optional)
NODE_ENV=production
```

## Post-Deployment

1. Verify the deployment is live
2. Test registration flow
3. Create an admin user in Supabase:
   ```sql
   INSERT INTO users (name, email, role) 
   VALUES ('Admin', 'admin@example.com', 'admin');
   ```
