import { Link } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { VideoList } from '@/components/videos/VideoList'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'

export function AllVideosPage() {
  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
        <div className="mb-8">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="mb-4">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">All Videos</h1>
          <p className="mt-2 text-muted-foreground">
            Videos are automatically deleted after 30 days
          </p>
        </div>

        <VideoList emptyMessage="No videos uploaded yet" />
      </div>
    </Layout>
  )
}
