import { Toaster } from 'react-hot-toast'
import 'react-loading-skeleton/dist/skeleton.css'
import '../styles/globals.css'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#2d3748',
            color: '#fff',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '0.95rem',
          },
        }}
      />
    </>
  )
}
