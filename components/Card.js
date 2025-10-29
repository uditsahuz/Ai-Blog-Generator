import styles from '../styles/Card.module.css'

export default function Card({ title, children, ...props }) {
  return (
    <div className={styles.card} {...props}>
      {title && <div className={styles.title}>{title}</div>}
      <div className={styles.body}>{children}</div>
    </div>
  )
}
