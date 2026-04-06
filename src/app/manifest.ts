import type { MetadataRoute } from 'next'
import { PWA_BACKGROUND_COLOR, PWA_THEME_COLOR } from '@/lib/pwa-config'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Fitness App',
    short_name: 'Fitness',
    description: 'Workout tracking with AI-powered training',
    start_url: '/',
    display: 'standalone',
    background_color: PWA_BACKGROUND_COLOR,
    theme_color: PWA_THEME_COLOR,
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
