import { useState } from 'react'
import { Copy, Check, Link, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useCreateShare, useToggleShare } from '@/hooks/useVideos'
import { getVideoPublicUrl } from '@/lib/supabase'
import type { VideoWithShares, Share } from '@/lib/types'

interface ShareDialogProps {
  video: VideoWithShares
  onClose: () => void
}

export function ShareDialog({ video, onClose }: ShareDialogProps) {
  const createShare = useCreateShare()
  const toggleShare = useToggleShare()
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  const activeShares = video.shares.filter((s) => s.is_active)
  const directUrl = getVideoPublicUrl(video.storage_path)

  const handleCreateShare = async () => {
    await createShare.mutateAsync(video.id)
  }

  const handleToggleShare = async (share: Share) => {
    await toggleShare.mutateAsync({
      shareId: share.id,
      isActive: !share.is_active,
    })
  }

  const copyToClipboard = async (url: string) => {
    await navigator.clipboard.writeText(url)
    setCopiedUrl(url)
    setTimeout(() => setCopiedUrl(null), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Share "{video.title}"</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Direct Storage URL - for VHC embedding */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Direct Video URL (for VHC)
            </label>
            <p className="text-xs text-muted-foreground">
              Use this URL to embed in VHC. This link never expires.
            </p>
            <div className="flex gap-2">
              <Input value={directUrl} readOnly className="text-xs" />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(directUrl)}
              >
                {copiedUrl === directUrl ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Share Links */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Share Links</label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateShare}
                disabled={createShare.isPending}
              >
                <Link className="mr-2 h-4 w-4" />
                {createShare.isPending ? 'Creating...' : 'Create Link'}
              </Button>
            </div>

            {video.shares.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No share links created yet.
              </p>
            ) : (
              <div className="space-y-2">
                {video.shares.map((share) => {
                  const playerUrl = `${window.location.origin}/v/${share.share_code}`
                  return (
                    <div
                      key={share.id}
                      className={`rounded-lg border p-3 ${
                        share.is_active ? 'border-border' : 'border-muted bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <code className="text-sm">{share.share_code}</code>
                            {!share.is_active && (
                              <span className="rounded bg-muted-foreground/20 px-2 py-0.5 text-xs">
                                Inactive
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {share.view_count} views
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(playerUrl)}
                            title="Copy player URL"
                          >
                            {copiedUrl === playerUrl ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.open(playerUrl, '_blank')}
                            title="Open player"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={share.is_active ? 'destructive' : 'default'}
                            size="sm"
                            onClick={() => handleToggleShare(share)}
                            disabled={toggleShare.isPending}
                          >
                            {share.is_active ? 'Revoke' : 'Activate'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
