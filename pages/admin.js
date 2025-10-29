import { useState } from 'react'
import styles from '../styles/Admin.module.css'

export default function Admin() {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!prompt.trim()) return

    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/generate-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Blog post generated successfully!')
        setPrompt('')
      } else {
        setMessage(`Error: ${data.error}`)
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>AI Blog Generator</h1>
        <p className={styles.subtitle}>
          Enter a prompt to generate a new blog post using AI
        </p>
      </header>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="prompt" className={styles.label}>
            Blog Post Prompt
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Write a blog post about React Server Components"
            className={styles.textarea}
            rows={6}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className={styles.button}
        >
          {loading ? 'Generating...' : 'Generate Post'}
        </button>
      </form>

      {message && (
        <div className={`${styles.message} ${message.includes('Error') ? styles.error : styles.success}`}>
          {message}
        </div>
      )}
    </div>
  )
}
