import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { supabaseAdmin } from '../../lib/supabaseClient';
import matter from 'gray-matter';
import "dotenv/config";

// Fallback model list: Gemini 2.5 Pro first, then Flash
const MODEL_FALLBACKS = [
  "gemini-2.5-pro",
  "gemini-2.5-flash"
];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt } = req.body;
  if (!prompt || !prompt.trim()) return res.status(400).json({ error: 'Prompt is required' });

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

    // Parse frontmatter
    const { data: frontmatter, content } = matter(generatedContent);
    if (!frontmatter?.title || !frontmatter?.excerpt || !frontmatter?.publishedOn) {
      return res.status(500).json({ error: "Generated content missing required frontmatter." });
    }

    // Generate slug
    const slug = frontmatter.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if slug exists
    const { data: existingPost } = await supabaseAdmin
      .from('posts')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingPost) {
      return res.status(400).json({ error: 'A post with this title already exists. Try a different prompt.' });
    }

    // Insert post
    const { data: newPost, error } = await supabaseAdmin
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

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to save blog post.' });
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
