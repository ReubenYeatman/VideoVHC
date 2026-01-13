import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function generateThumbnail(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true

    // 5-second timeout to prevent hanging
    const timeout = setTimeout(() => {
      URL.revokeObjectURL(video.src)
      resolve(null)
    }, 5000)

    video.onloadedmetadata = () => {
      // Seek to 1 second or 10% of duration for short videos
      video.currentTime = Math.min(1, video.duration * 0.1)
    }

    video.onseeked = () => {
      clearTimeout(timeout)
      const canvas = document.createElement('canvas')
      // Higher resolution for retina displays
      canvas.width = 640
      canvas.height = 360
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        URL.revokeObjectURL(video.src)
        resolve(null)
        return
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(video.src)

      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.8)
    }

    video.onerror = () => {
      clearTimeout(timeout)
      URL.revokeObjectURL(video.src)
      resolve(null)
    }

    video.src = URL.createObjectURL(file)
  })
}
