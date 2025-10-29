import Link from 'next/link'
import styles from '../styles/PostItem.module.css'

export default function PostItem({ post }) {
  return (
    <article className={styles.postItem}>
      <h2 className={styles.title}>
        <Link href={`/posts/${post.slug}`}>
          {post.title}
        </Link>
      </h2>
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
    </article>
  )
}
