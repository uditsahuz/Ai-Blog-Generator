import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { supabaseAdmin, isSupabaseAdminAvailable } from '../../lib/supabaseClient';
import matter from 'gray-matter';
import {unified} from 'unified'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import rehypeParse from 'rehype-parse'
import rehypeSanitize from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
// TEMP: naive in-memory store for rate limiting, PROD: use upstash/redis, etc
const ipRateLimit = {}
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 3;

// Fallback model list: Gemini 2.5 Pro first, then Flash
const MODEL_FALLBACKS = [
  "gemini-2.5-pro",
  "gemini-2.5-flash"
];

export default async function handler(req, res) {
  // --- RATE LIMITING ----
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const now = Date.now()
  ipRateLimit[ip] = (ipRateLimit[ip] || []).filter(ts => now - ts < RATE_LIMIT_WINDOW)
  if (ipRateLimit[ip].length >= RATE_LIMIT_MAX) {
    return res.status(429).json({ error: 'Too many requests. Try again later.' })
  }
  ipRateLimit[ip].push(now)
  // --- END RATE LIMITING ---

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { prompt } = req.body;
  // PROMPT VALIDATION
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) return res.status(400).json({ error: 'A prompt string is required.' });
  // (Remove all profanity checks here)

  try {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey || typeof geminiApiKey !== 'string') {
      return res.status(500).json({ error: 'Gemini API key not configured. Check .env.local' });
    }

    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];

    const enhancedPrompt = `You are a helpful blog post writer. Generate a complete blog post in MDX format based on the following topic: "${prompt}". 
Include YAML frontmatter with:
- title: A compelling title
- excerpt: 1-2 sentence summary
- publishedOn: "${formattedDate}"
Format response exactly like:

---
title: "Your Blog Post Title"
excerpt: "Brief description"
publishedOn: "${formattedDate}"
---

# Blog Content Here
`;

    let generatedContent = null;
    let lastError = null;

    // Try models in order until one works
    for (const modelName of MODEL_FALLBACKS) {
      try {
        const model = new ChatGoogleGenerativeAI({
          apiKey: geminiApiKey,
          model: modelName,
          temperature: 0.7,
        });

        const response = await model.invoke(enhancedPrompt);

        if (Array.isArray(response?.content)) {
          generatedContent = response.content.map(c => c.text || "").join("\n");
        } else if (typeof response?.content === "string") {
          generatedContent = response.content;
        }

        if (generatedContent) break; // success
      } catch (err) {
        lastError = err;
      }
    }

    if (!generatedContent) {
      console.error("Failed to generate content:", lastError);
      return res.status(500).json({ error: "AI generation failed. Please try again later." });
    }

    // --- SANITIZE AI RESPONSE ---
    // Only allow headings, paragraphs, lists, simple inline elements, no html/script/iframe/image/unknown jsx.
    let { data: frontmatter, content } = matter(generatedContent);
    if (!frontmatter?.title || !frontmatter?.excerpt || !frontmatter?.publishedOn) {
      return res.status(500).json({ error: "Generated content missing required frontmatter." });
    }
    // Clean title
    frontmatter.title = String(frontmatter.title).replace(/\s+/g, ' ').trim().substring(0, 120)
    // Sanitize MDX content (markdown -> HTML -> sanitized -> markdown)
    let sanitized = null;
    try {
      // Parse mdx to HTML, then sanitize, then back to markdown (or render only whitelisted tags later)
      const file = await unified()
        .use(remarkParse)
        .use(remarkStringify)
        .use(rehypeParse, {fragment: true})
        .use(rehypeSanitize, {
          tagNames: [
            'h1','h2','h3','h4','p','ul','ol','li','strong','em','code','pre','blockquote','a','hr','span','div','br'
          ],
          // Could further restrict, add attributes controls
          // E.g. forbid style, onclick, etc.
        })
        .use(rehypeStringify)
        .process(content)
      sanitized = String(file)
    } catch (err) {
      console.error('Sanitization failed', err)
      sanitized = '[Content removed by sanitizer, contact admin]'
    }
    content = sanitized
    // --- END SANITIZATION ---

    // Check if admin client is available
    if (!isSupabaseAdminAvailable()) {
      const serviceKey = process.env.SUPABASE_SERVICE_KEY
      let errorMsg = 'Supabase service key is not configured.'
      
      if (!serviceKey) {
        errorMsg = 'SUPABASE_SERVICE_KEY is missing from .env.local. Please add it and restart your dev server.'
      } else {
        errorMsg = 'SUPABASE_SERVICE_KEY configuration issue. Please verify: 1) You copied the service_role key (not anon), 2) Keys match your project URL, 3) No extra spaces/quotes, 4) Restart dev server after adding.'
      }
      
      return res.status(500).json({ 
        error: errorMsg,
        hint: 'Get your service_role key from Supabase Dashboard → Settings → API (NOT the anon key)'
      });
    }

    // --- SLUG SAFETY: fallback slug on duplicate ---
    let slug = frontmatter.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .substring(0, 64)
    if (!slug) slug = `post-${Date.now()}`
    // --- END SLUG SAFETY ---

    // Check if slug exists
    let existingPost = null;
    try {
      const { data, error } = await supabaseAdmin
        .from('posts')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" which is fine
        console.error('Error checking existing post:', error);
        return res.status(500).json({ error: 'Failed to check for existing posts.' });
      }
      existingPost = data;
    } catch (error) {
      console.error('Error querying Supabase:', error);
      
      let errorMsg = 'Invalid API key or Supabase configuration.'
      if (error.message?.includes('Invalid API key') || error.message?.includes('JWT')) {
        errorMsg = 'Invalid SUPABASE_SERVICE_KEY. Verify: 1) You copied the service_role key (not anon), 2) Keys match your project URL, 3) No extra spaces/quotes, 4) Restart dev server after changes.'
      }
      
      return res.status(500).json({ 
        error: errorMsg,
        hint: 'The service_role key is different from the anon key. Find it in Supabase Dashboard → Settings → API → service_role'
      });
    }

    if (existingPost) {
      return res.status(400).json({ error: 'A post with this title already exists. Try a different prompt.' });
    }

    // Insert post
    const { data: newPost, error: insertError } = await supabaseAdmin
      .from('posts')
      .insert({
        title: frontmatter.title,
        slug,
        excerpt: frontmatter.excerpt,
        content,
        meta: frontmatter,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Supabase error:', insertError);
      let errorMsg = 'Failed to save blog post.'
      
      if (insertError.message?.includes('API key') || insertError.message?.includes('JWT') || insertError.code === 'PGRST301') {
        errorMsg = 'Invalid SUPABASE_SERVICE_KEY. The key you provided does not match your Supabase project. Please: 1) Get the correct service_role key from your project dashboard, 2) Ensure it matches NEXT_PUBLIC_SUPABASE_URL, 3) Restart dev server.'
      } else if (insertError.code === '23505') {
        errorMsg = 'A post with this slug already exists. Try a different prompt.'
      }
      
      return res.status(500).json({ 
        error: errorMsg,
        details: insertError.message
      });
    }

    return res.status(200).json({
      success: true,
      post: newPost,
      message: 'Blog post generated and saved successfully!'
    });

  } catch (error) {
    console.error('Error generating blog post:', error);
    return res.status(500).json({ error: `Unexpected error: ${error.message}` });
  }
}
