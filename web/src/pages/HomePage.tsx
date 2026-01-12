import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import { Upload, Link as LinkIcon, Play } from 'lucide-react'

export function HomePage() {
  const { user } = useAuth()

  return (
    <Layout>
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            ClipVault
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Upload your videos and get embeddable links that work seamlessly in VHC.
            No expiring URLs, no broken embeds.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            {user ? (
              <Link to="/dashboard">
                <Button size="lg">Go to Dashboard</Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button size="lg">Get Started</Button>
              </Link>
            )}
          </div>
        </div>

        <div className="mt-20 grid gap-8 sm:grid-cols-3">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Upload</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Drag and drop your videos. We support MP4 and MOV formats up to 50MB.
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <LinkIcon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Share</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Get a permanent link that never expires. Perfect for VHC embeds.
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Play className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Play</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Your videos play directly in VHC without any additional setup.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
