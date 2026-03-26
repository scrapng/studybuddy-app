import { useState, useEffect } from 'react'
import { Plus, Users, Copy, LogOut, Trash2, BookOpen } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  getMyGroups,
  createStudyGroup,
  joinGroupByCode,
  getGroupMembers,
  getGroupSharedContent,
  leaveGroup,
  deleteGroup,
} from '@/lib/social-service'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { getRelativeTime } from '@/lib/utils'
import type { StudyGroup, GroupMember, SharedContent } from '@/types/social'

export function GroupsPage() {
  const { user } = useAuth()
  const [groups, setGroups] = useState<StudyGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [sharedContent, setSharedContent] = useState<SharedContent[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDesc, setNewGroupDesc] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    loadGroups()
  }, [user?.id])

  async function loadGroups() {
    if (!user) return
    setLoading(true)
    const g = await getMyGroups(user.id)
    setGroups(g)
    setLoading(false)
  }

  async function selectGroup(group: StudyGroup) {
    setSelectedGroup(group)
    const [m, sc] = await Promise.all([
      getGroupMembers(group.id),
      getGroupSharedContent(group.id),
    ])
    setMembers(m)
    setSharedContent(sc)
  }

  async function handleCreate() {
    if (!user || !newGroupName.trim()) return
    setActionLoading(true)
    const group = await createStudyGroup(user.id, newGroupName.trim(), newGroupDesc.trim() || undefined)
    if (group) {
      setGroups(prev => [...prev, group])
      setCreateOpen(false)
      setNewGroupName('')
      setNewGroupDesc('')
      toast.success('Study group created!')
    } else {
      toast.error('Failed to create group.')
    }
    setActionLoading(false)
  }

  async function handleJoin() {
    if (!user || !joinCode.trim()) return
    setActionLoading(true)
    const result = await joinGroupByCode(user.id, joinCode.trim())
    if (result.success && result.group) {
      setGroups(prev => [...prev, result.group!])
      setJoinOpen(false)
      setJoinCode('')
      toast.success(`Joined "${result.group.name}"!`)
    } else {
      if (result.error === 'group_not_found') toast.error('No group found with that code.')
      else if (result.error === 'already_member') toast.error("You're already in this group.")
      else toast.error('Failed to join group.')
    }
    setActionLoading(false)
  }

  async function handleLeave(group: StudyGroup) {
    if (!user) return
    await leaveGroup(group.id, user.id)
    setGroups(prev => prev.filter(g => g.id !== group.id))
    if (selectedGroup?.id === group.id) setSelectedGroup(null)
    toast.success('Left the group')
  }

  async function handleDelete(group: StudyGroup) {
    await deleteGroup(group.id)
    setGroups(prev => prev.filter(g => g.id !== group.id))
    if (selectedGroup?.id === group.id) setSelectedGroup(null)
    toast.success('Group deleted')
  }

  const contentTypeIcon = (type: string) => {
    if (type === 'note') return '📝'
    if (type === 'flashcard_set') return '🃏'
    return '❓'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-in fade-in duration-500">
        <div>
          <h1 className="text-2xl font-bold">Study Groups</h1>
          <p className="text-muted-foreground text-sm">Learn together with friends</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setJoinOpen(true)} className="gap-2">
            <Users className="h-4 w-4" />
            Join Group
          </Button>
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Group
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Groups list */}
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
            ))
          ) : groups.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-3">
                <Users className="h-10 w-10 text-muted-foreground/50" />
                <div>
                  <p className="font-medium">No groups yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Create a group or join one with an invite code</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            groups.map(group => (
              <Card
                key={group.id}
                className={`cursor-pointer card-hover-lift transition-all ${selectedGroup?.id === group.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => selectGroup(group)}
              >
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{group.name}</h3>
                      {group.description && (
                        <p className="text-sm text-muted-foreground truncate mt-0.5">{group.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs font-mono">{group.invite_code}</Badge>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5"
                          onClick={e => {
                            e.stopPropagation()
                            navigator.clipboard.writeText(group.invite_code)
                            toast.success('Invite code copied!')
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {group.owner_id === user?.id ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={e => { e.stopPropagation(); handleDelete(group) }}
                          title="Delete group"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={e => { e.stopPropagation(); handleLeave(group) }}
                          title="Leave group"
                        >
                          <LogOut className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Group detail */}
        <div>
          {selectedGroup ? (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Members ({members.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {members.map(member => (
                    <div key={member.user_id} className="flex items-center gap-2">
                      <div
                        className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ backgroundColor: member.profile?.avatar_color ?? '#6366f1' }}
                      >
                        {(member.profile?.display_name?.[0] || member.profile?.friend_code[0] || '?').toUpperCase()}
                      </div>
                      <span className="text-sm flex-1 truncate">
                        {member.profile?.display_name || member.profile?.friend_code || 'Unknown'}
                      </span>
                      {member.role === 'owner' && (
                        <Badge variant="secondary" className="text-xs">Owner</Badge>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Shared Content ({sharedContent.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {sharedContent.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No content shared yet</p>
                  ) : (
                    <div className="space-y-2">
                      {sharedContent.map(item => (
                        <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                          <span className="text-lg">{contentTypeIcon(item.content_type)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.sender?.display_name || item.sender?.friend_code} · {getRelativeTime(item.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-2">
                <Users className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Select a group to see details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create group dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Create Study Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Group Name</Label>
              <Input
                placeholder="e.g. Math Study Group"
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description (optional)</Label>
              <Input
                placeholder="What are you studying?"
                value={newGroupDesc}
                onChange={e => setNewGroupDesc(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newGroupName.trim() || actionLoading}>
              Create Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Join group dialog */}
      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Join Study Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">Enter the 8-character invite code to join a group.</p>
            <div className="space-y-1.5">
              <Label>Invite Code</Label>
              <Input
                placeholder="e.g. AB12CD34"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                className="font-mono tracking-widest text-center text-lg"
                maxLength={8}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setJoinOpen(false)}>Cancel</Button>
            <Button onClick={handleJoin} disabled={joinCode.trim().length !== 8 || actionLoading}>
              Join Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
