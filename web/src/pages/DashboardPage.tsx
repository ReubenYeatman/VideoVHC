import { Layout } from '@/components/layout/Layout'
import { VideoUploader } from '@/components/videos/VideoUploader'
import { VideoList } from '@/components/videos/VideoList'

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
            <h2 className="mb-4 text-xl font-semibold">Your Videos</h2>
            <VideoList />
          </div>
        </div>
      </div>
    </Layout>
  )
}
