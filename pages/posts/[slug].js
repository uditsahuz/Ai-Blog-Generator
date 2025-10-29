import { MDXRemote } from 'next-mdx-remote'
import { serialize } from 'next-mdx-remote/serialize'
import rehypeHighlight from 'rehype-highlight'
import { supabase } from '../../lib/supabaseClient'
import styles from '../../styles/Post.module.css'
import AIAttribution from '../../components/AIAttribution'

export default function Post({ post, source }) {
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
        <MDXRemote {...source} />
      </div>

      <AIAttribution />
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
        notFound: true
      }
    }

    // Serialize the MDX content
    const mdxSource = await serialize(post.content, {
      mdxOptions: {
        rehypePlugins: [rehypeHighlight]
      }
    })

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
      notFound: true
    }
  }
}
