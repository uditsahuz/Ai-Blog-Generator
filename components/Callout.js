import styles from '../styles/Callout.module.css'

export default function Callout({ title, children }) {
  return (
    <div className={styles.callout}>
      {title && <div className={styles.title}>{title}</div>}
      <div className={styles.body}>{children}</div>
    </div>
  )
}


