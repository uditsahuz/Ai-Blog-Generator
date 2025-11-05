import { MDXRemote } from 'next-mdx-remote'
import { serialize } from 'next-mdx-remote/serialize'
import rehypeHighlight from 'rehype-highlight'
import rehypeSanitize from 'rehype-sanitize'
import { supabase } from '../../lib/supabaseClient'
import styles from '../../styles/Post.module.css'
import MDXComponents from '../../components/MDXComponents'
import Callout from '../../components/Callout'
import Card from '../../components/Card'

export default function Post({ post, source, error }) {
  if (error) {
    return (
      <div style={{
        background: 'rgba(250,204,33,0.09)',
        border: '1px solid #fde047',
        color: '#fde047',
        padding: '2rem',
        borderRadius: '0.75rem',
        textAlign: 'center',
        margin:'2rem auto',
        maxWidth:'700px',
        fontSize:'1.2rem'
      }}>
        <h2 style={{color:'#facc15',marginBottom:'1rem'}}>⚠️ Post not available</h2>
        <p>{error}</p>
        <p><a href="/" style={{color:'#4338ca',textDecoration:'underline',fontWeight:600}}>Return to Home</a></p>
      </div>
    )
  }
  return (
    <article className={styles.post}>
      <header className={styles.header}>
        <h1 className={styles.title}>{post.title}</h1>
        {post.excerpt && (
          <p className={styles.excerpt}>{post.excerpt}</p>
        )}
        <div className={styles.meta}>
          <time dateTime={post.meta?.publishedOn}>
            {new Date(post.meta?.publishedOn).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </time>
        </div>
      </header>
      
      <div className={styles.content}>
        <MDXRemote {...source} components={{ ...MDXComponents, Callout, Card }} />
      </div>

      {/* Attribution banner removed; footer now shows this site-wide */}
    </article>
  )
}

export async function getStaticPaths() {
  try {
    const { data: posts, error } = await supabase
      .from('posts')
      .select('slug')

    if (error) {
      console.error('Error fetching slugs:', error)
      return {
        paths: [],
        fallback: 'blocking'
      }
    }

    const paths = posts.map((post) => ({
      params: { slug: post.slug }
    }))

    return {
      paths,
      fallback: 'blocking'
    }
  } catch (error) {
    console.error('Error in getStaticPaths:', error)
    return {
      paths: [],
      fallback: 'blocking'
    }
  }
}

export async function getStaticProps({ params }) {
  try {
    const { data: post, error } = await supabase
      .from('posts')
      .select('*')
      .eq('slug', params.slug)
      .single()

    if (error || !post) {
      return {
        props: {
          error: 'This post could not be found or loaded. It may have been deleted or moved.'
        }
      }
    }
    // Serialize the MDX content
    let mdxSource = null;
    try {
      mdxSource = await serialize(post.content, {
        mdxOptions: {
          rehypePlugins: [rehypeHighlight, [rehypeSanitize, {
            tagNames: [
              'h1','h2','h3','h4','p','ul','ol','li','strong','em','code','pre','blockquote','a','hr','span','div','br'
            ]
          }]]
        }
      })
    } catch(e){
      return {
        props: {
          error: 'Failed to render this post due to invalid or corrupted content.'
        }
      }
    }
    return {
      props: {
        post,
        source: mdxSource
      },
      revalidate: 60
    }
  } catch (error) {
    console.error('Error in getStaticProps:', error)
    return {
      props: {
        error: 'There was a fatal error loading this post.'
      }
    }
  }
}
