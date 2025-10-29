# Setup Guide

This guide will help you resolve the Supabase connection error and get your AI blog generator running.

## Step 1: Create Environment File

1. Copy the example environment file:
   ```bash
   cp env.example .env.local
   ```

2. Open `.env.local` and fill in your credentials:

## Step 2: Get Supabase Credentials

### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - Name: `ai-blog-generator`
   - Database Password: (choose a strong password)
   - Region: (choose closest to you)
6. Click "Create new project"

### Get Your Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values to your `.env.local` file:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_KEY`

## Step 3: Create Database Table

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Paste and run this SQL:

```sql
-- Create the posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT,
  meta JSONB
);

-- Enable Row Level Security
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Public posts are viewable by everyone" ON posts
  FOR SELECT USING (true);

-- Create policy for insert access (for admin)
CREATE POLICY "Users can insert posts" ON posts
  FOR INSERT WITH CHECK (true);
```

## Step 4: Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key to your `.env.local` file as `GEMINI_API_KEY`

**Note**: The application uses the `gemini-1.5-flash` model, which is the latest and most efficient model from Google.

## Step 5: Restart Development Server

1. Stop your current dev server (Ctrl+C)
2. Start it again:
   ```bash
   npm run dev
   ```

## Step 6: Test the Application

1. Visit `http://localhost:3000` - you should see the home page without errors
2. Visit `http://localhost:3000/admin` - you should see the admin interface
3. Try generating a blog post with a simple prompt like "Write about React"

## Troubleshooting

### Common Issues:

1. **"Could not find the" error**: Usually means the `posts` table doesn't exist
2. **Environment variables not found**: Make sure `.env.local` is in the project root
3. **Permission denied**: Check that your Supabase policies are set up correctly
4. **API key invalid**: Verify your Gemini API key is correct
5. **"models/gemini-pro is not found"**: This means you're using an outdated model name. The app now uses `gemini-1.5-flash`
6. **"404 Not Found" for Gemini**: Check that your API key is valid and has access to Gemini models

### Debug Steps:

1. Check your `.env.local` file exists and has all required variables
2. Verify your Supabase table exists in the dashboard
3. Check the browser console for detailed error messages
4. Restart your development server after making changes

## Your `.env.local` should look like this:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-role-key-here
GEMINI_API_KEY=your-gemini-api-key-here
```

Once everything is set up, you should be able to generate blog posts using AI and view them on your blog!
