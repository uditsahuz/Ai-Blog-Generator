import Header from '../components/Header'
import styles from '../styles/Layout.module.css'

export default function Layout({ children }) {
  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.main}>
        {children}
      </main>
      <footer className={styles.footer}>
        Powered by AI | Curated by <strong>Udit Sahu</strong>
      </footer>
    </div>
  )
}
