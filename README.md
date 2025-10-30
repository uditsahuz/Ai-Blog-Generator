# AI-Powered Blog Generator

A full-stack Next.js application that generates blog posts using Google Gemini AI and stores them in Supabase.

## Features

- 🤖 **AI-Powered Content Generation**: Uses Google Gemini API to generate complete blog posts
- 📝 **MDX Support**: Renders MDX content with syntax highlighting and custom components
- 🗄️ **Supabase Integration**: Stores and retrieves blog posts from Supabase database
- 🎨 **Responsive Design**: Modern, clean UI with dark mode support
- ⚡ **Static Generation**: Fast loading with Next.js static site generation

## Tech Stack

- **Framework**: Next.js (Pages Router)
- **Database**: Supabase
- **AI**: Google Gemini API
- **MDX Rendering**: next-mdx-remote
- **Styling**: CSS Modules
- **Syntax Highlighting**: rehype-highlight

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy the example environment file and fill in your credentials:

```bash
cp env.example .env.local
```

Fill in the following variables in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_KEY`: Your Supabase service role key
- `GEMINI_API_KEY`: Your Google Gemini API key

### 3. Supabase Database Setup

Create the following table in your Supabase database:

```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT,
  meta JSONB
);
```

Enable Row Level Security (RLS) and create policies:

```sql
-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Policy for public read access
CREATE POLICY "Public posts are viewable by everyone" ON posts
  FOR SELECT USING (true);

-- Policy for authenticated write access (optional)
CREATE POLICY "Users can insert posts" ON posts
  FOR INSERT WITH CHECK (true);
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Usage

### Admin Panel

1. Navigate to `/admin` to access the blog generation interface
2. Enter a prompt describing the blog post you want to generate
3. Click "Generate Post" to create a new blog post using AI
4. The generated post will be automatically saved to your Supabase database

### Public Blog

1. Visit the home page to see all generated blog posts
2. Click on any post to read the full content
3. Posts are rendered with proper MDX formatting and syntax highlighting

## Project Structure

```
├── components/
│   ├── Header.js              # Navigation header
│   ├── MDXComponents.js       # Custom MDX components
│   └── PostItem.js            # Blog post preview component
├── layouts/
│   └── Layout.js              # Main layout wrapper
├── lib/
│   ├── supabaseClient.js      # Supabase client configuration
│   └── gemini.js              # Gemini AI client
├── pages/
│   ├── api/
│   │   └── generate-post.js   # API route for post generation
│   ├── admin.js               # Admin interface
│   ├── index.js               # Home page
│   ├── posts/
│   │   └── [slug].js          # Dynamic post pages
│   ├── _app.js                # App wrapper with MDX provider
│   └── _document.js           # Document with syntax highlighting
├── styles/                    # CSS modules for styling
└── next.config.mjs            # Next.js configuration
```

## API Endpoints

### POST /api/generate-post

Generates a new blog post using AI and saves it to the database.

**Request Body:**
```json
{
  "prompt": "Write a blog post about React Server Components"
}
```

**Response:**
```json
{
  "success": true,
  "post": { /* post object */ },
  "message": "Blog post generated and saved successfully!"
}
```

## Customization

### Styling

The application uses CSS Modules for styling. You can customize the appearance by modifying the CSS files in the `styles/` directory.

### MDX Components

Custom MDX components are defined in `components/MDXComponents.js`. You can add new components or modify existing ones to customize how MDX content is rendered.

### AI Prompts

The AI prompt template can be modified in `pages/api/generate-post.js` to change how blog posts are generated.

## Supabase Security & RLS (Production Best Practices)

- **Row Level Security (RLS) must be enabled on all tables.** This prevents unauthorized direct access.
- **Use the anon key only in browser-side/client-side code.**
- **Use the service (admin) key ONLY server-side, e.g., inside API routes.** Never expose your service key to the browser/client!
- All data writes (insert, update, delete) are performed by API routes using the service key (via `supabaseAdmin`). All public reads (blog viewing, home page, posts, etc.) use the anon key.
- Double check your `.env.local` and deployment dashboard (e.g. Vercel) so that env variables are never accidentally exposed.
- If adding new Supabase tables for advanced features, create appropriate RLS policies and ensure they are enabled by default.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your environment variables in the Vercel dashboard
4. Deploy!

### Other Platforms

The application can be deployed to any platform that supports Next.js, such as:
- Netlify
- AWS Amplify
- Railway
- DigitalOcean App Platform

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for your own blog or as a starting point for your applications.

## Testing

To run all tests: `npm test`

All new features or bug fixes should be accompanied by either a unit or integration test. See the `__tests__` folder for examples. Recommended libraries: Jest, React Testing Library, and Playwright (for E2E/browser testing).
