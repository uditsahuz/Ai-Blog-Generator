import styles from '../styles/Post.module.css'

export default function AIAttribution({ authorName = 'Udit Sahu', socials = [] }) {
  return (
    <div className={styles.aiAttribution}>
      <p className={styles.aiAttributionText}>
      Powered by AI | Curated by <strong>{authorName}</strong>
      </p>
      {Array.isArray(socials) && socials.length > 0 && (
        <ul className={styles.aiAttributionLinks}>
          {socials.map((link) => (
            <li key={link.href}>
              <a href={link.href} target="_blank" rel="noreferrer noopener">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}


