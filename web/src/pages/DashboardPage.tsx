import { Link } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { VideoUploader } from '@/components/videos/VideoUploader'
import { VideoList } from '@/components/videos/VideoList'
import { Button } from '@/components/ui/button'
import { ChevronRight } from 'lucide-react'

export function DashboardPage() {
  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your videos and share links
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <VideoUploader />
          </div>
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Last 7 Days</h2>
              <Link to="/videos">
                <Button variant="ghost" size="sm">
                  View All
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <VideoList daysFilter={7} emptyMessage="No videos in the last 7 days" />
          </div>
        </div>
      </div>
    </Layout>
  )
}
