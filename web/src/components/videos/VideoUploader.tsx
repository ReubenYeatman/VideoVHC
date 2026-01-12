import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, FileVideo, Check, Copy } from 'lucide-react'
import { useUpload } from '@/hooks/useUpload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn, formatBytes } from '@/lib/utils'

export function VideoUploader() {
  const { upload, uploading, progress, error } = useUpload()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const [autoCopied, setAutoCopied] = useState(false)

  // Auto-hide the copied notification after 6 seconds
  useEffect(() => {
    if (copiedUrl) {
      const timer = setTimeout(() => {
        setCopiedUrl(null)
        setAutoCopied(false)
      }, 6000)
      return () => clearTimeout(timer)
    }
  }, [copiedUrl])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setSelectedFile(file)
      // Auto-fill title from filename (without extension)
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
      setTitle(nameWithoutExt)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/mp4': ['.mp4'],
      'video/quicktime': ['.mov'],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
    disabled: uploading,
  })

  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) return

    const result = await upload(selectedFile, title.trim(), description.trim() || undefined)

    // On success, try to copy direct video URL to clipboard and show notification
    if (result && result.videoUrl) {
      let copied = false
      try {
        // Try modern clipboard API first
        await navigator.clipboard.writeText(result.videoUrl)
        copied = true
      } catch {
        // Fallback to execCommand for better compatibility
        try {
          const textArea = document.createElement('textarea')
          textArea.value = result.videoUrl
          textArea.style.position = 'fixed'
          textArea.style.left = '-9999px'
          document.body.appendChild(textArea)
          textArea.select()
          copied = document.execCommand('copy')
          document.body.removeChild(textArea)
        } catch {
          // Both methods failed
        }
      }
      setCopiedUrl(result.videoUrl)
      setAutoCopied(copied)
      setSelectedFile(null)
      setTitle('')
      setDescription('')
    } else if (result) {
      // Upload succeeded but no share URL - just clear form
      setSelectedFile(null)
      setTitle('')
      setDescription('')
    }
  }

  const clearSelection = () => {
    setSelectedFile(null)
    setTitle('')
    setDescription('')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Video</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Success notification */}
        {copiedUrl && (
          <div className="flex items-center gap-3 rounded-md bg-primary/10 p-3 text-sm">
            <Check className="h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="font-medium">
                {autoCopied ? 'Link copied to clipboard!' : 'Video uploaded!'}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{copiedUrl}</p>
            </div>
            {!autoCopied && (
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0"
                onClick={() => {
                  let copied = false
                  try {
                    navigator.clipboard.writeText(copiedUrl)
                    copied = true
                  } catch {
                    try {
                      const textArea = document.createElement('textarea')
                      textArea.value = copiedUrl
                      textArea.style.position = 'fixed'
                      textArea.style.left = '-9999px'
                      document.body.appendChild(textArea)
                      textArea.select()
                      copied = document.execCommand('copy')
                      document.body.removeChild(textArea)
                    } catch {
                      // Both methods failed
                    }
                  }
                  if (copied) setAutoCopied(true)
                }}
              >
                <Copy className="mr-1 h-3 w-3" />
                Copy
              </Button>
            )}
          </div>
        )}

        {!selectedFile ? (
          <div
            {...getRootProps()}
            className={cn(
              'cursor-pointer rounded-lg border-2 border-dashed border-border p-8 text-center transition-colors',
              isDragActive && 'border-primary bg-primary/5',
              uploading && 'cursor-not-allowed opacity-50'
            )}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">
              {isDragActive
                ? 'Drop the video here...'
                : 'Drag and drop a video, or click to select'}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              MP4 or MOV, max 50MB
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-4 rounded-lg border border-border p-4">
              <FileVideo className="h-10 w-10 text-primary" />
              <div className="flex-1 space-y-1">
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatBytes(selectedFile.size)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearSelection}
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Title *
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Video title"
                disabled={uploading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description (optional)
              </label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description"
                disabled={uploading}
              />
            </div>

            {progress && (
              <div className="space-y-2">
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  Uploading... {progress.percentage}%
                </p>
              </div>
            )}

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={!title.trim() || uploading}
              className="w-full"
            >
              {uploading ? 'Uploading...' : 'Upload Video'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
