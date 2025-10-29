import { MDXProvider } from '@mdx-js/react'
import styles from '../styles/Markdown.module.css'

const components = {
  h1: ({ children, ...props }) => (
    <h1 className={styles.h1} {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className={styles.h2} {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className={styles.h3} {...props}>
      {children}
    </h3>
  ),
  p: ({ children, ...props }) => (
    <p className={styles.p} {...props}>
      {children}
    </p>
  ),
  a: ({ children, ...props }) => (
    <a className={styles.a} {...props}>
      {children}
    </a>
  ),
  ul: ({ children, ...props }) => (
    <ul className={styles.ul} {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className={styles.ol} {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className={styles.li} {...props}>
      {children}
    </li>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote className={styles.blockquote} {...props}>
      {children}
    </blockquote>
  ),
  code: ({ children, ...props }) => (
    <code className={styles.code} {...props}>
      {children}
    </code>
  ),
  pre: ({ children, ...props }) => (
    <pre className={styles.pre} {...props}>
      {children}
    </pre>
  ),
  hr: ({ ...props }) => <hr className={styles.hr} {...props} />,
}

export default components
