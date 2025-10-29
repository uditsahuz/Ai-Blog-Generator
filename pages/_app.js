import { MDXProvider } from '@mdx-js/react'
import Layout from '../layouts/Layout'
import MDXComponents from '../components/MDXComponents'
import '../styles/globals.css'

export default function App({ Component, pageProps }) {
  return (
    <MDXProvider components={MDXComponents}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </MDXProvider>
  )
}
