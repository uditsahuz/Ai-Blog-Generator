import { supabase } from '../lib/supabaseClient'
import PostItem from '../components/PostItem'
import styles from '../styles/Home.module.css'

export default function Home({ posts, error }) {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>AI-Generated Blog</h1>
        <p className={styles.subtitle}>
          Discover amazing content created by artificial intelligence
        </p>
      </header>
      
      {error && (
        <div className={styles.error}>
          <h3>⚠️ Setup Required</h3>
          <p>{error}</p>
          <div className={styles.setupSteps}>
            <h4>To fix this issue:</h4>
            <ol>
              <li>Create a <code>.env.local</code> file in your project root</li>
              <li>Add your Supabase credentials (see <code>env.example</code>)</li>
              <li>Create the <code>posts</code> table in your Supabase database</li>
              <li>Restart your development server</li>
            </ol>
          </div>
        </div>
      )}
      
      <section className={styles.posts}>
        {posts.length === 0 && !error ? (
          <div className={styles.empty}>
            <p>No blog posts yet. Check back soon!</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostItem key={post.id} post={post} />
          ))
        )}
      </section>
    </div>
  )
}

export async function getStaticProps() {
  try {
    // Check if Supabase is properly configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Supabase environment variables are not configured')
      return {
        props: {
          posts: [],
          error: 'Supabase not configured. Please check your environment variables.'
        }
      }
    }

    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching posts:', error)
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      return {
        props: {
          posts: [],
          error: `Database error: ${error.message}`
        }
      }
    }

    return {
      props: {
        posts: posts || []
      },
      revalidate: 60 // Revalidate every 60 seconds
    }
  } catch (error) {
    console.error('Error in getStaticProps:', error)
    return {
      props: {
        posts: [],
        error: `Connection error: ${error.message}`
      }
    }
  }
}
