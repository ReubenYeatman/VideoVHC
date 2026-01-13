import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAdminStats } from '@/hooks/useAdmin'
import { Users, Video, Share2, Eye } from 'lucide-react'

export function AdminPage() {
  const { data: stats, isLoading, error } = useAdminStats()

  if (isLoading) {
    return (
      <Layout>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
            Error loading admin stats: {error.message}
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
        <h1 className="text-3xl font-bold">Admin</h1>
        <p className="mt-2 text-muted-foreground">Platform statistics and user management</p>

        {/* Stats Cards */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_users ?? 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_videos ?? 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Shares</CardTitle>
              <Share2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_shares ?? 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_views ?? 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold">Users</h2>
          <div className="mt-4 overflow-hidden rounded-lg border border-border">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Display Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Signed Up</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Videos</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Views</th>
                  <th className="px-4 py-3 text-center text-sm font-medium">Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stats?.users.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-sm">{user.email}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {user.display_name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">{user.video_count}</td>
                    <td className="px-4 py-3 text-right text-sm">{user.total_views}</td>
                    <td className="px-4 py-3 text-center text-sm">
                      {user.is_admin ? (
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                          Admin
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
                {(!stats?.users || stats.users.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  )
}
