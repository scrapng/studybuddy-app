import { useState } from 'react'
import { Plus, Trash2, Pencil, Target, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { GoalForm } from './GoalForm'
import { useStudySets } from '@/hooks/useStudySets'
import { useTranslation } from '@/hooks/useTranslation'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import type { Goal, GoalStatus } from '@/types'

interface GoalListProps {
  setId: string
  goals: Goal[]
}

export function GoalList({ setId, goals }: GoalListProps) {
  const { updateGoal, deleteGoal } = useStudySets()
  const { t } = useTranslation()
  const [formOpen, setFormOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const STATUS_CONFIG: Record<GoalStatus, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
    'not-started': { label: t.goalForm.notStarted, variant: 'outline' },
    'in-progress': { label: t.goalForm.inProgress, variant: 'default' },
    'completed': { label: t.goalForm.completed, variant: 'secondary' },
  }

  const toggleStatus = (goal: Goal) => {
    const nextStatus: Record<GoalStatus, GoalStatus> = {
      'not-started': 'in-progress',
      'in-progress': 'completed',
      'completed': 'not-started',
    }
    updateGoal(setId, { ...goal, status: nextStatus[goal.status] })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{goals.length} {t.goalList.nGoals}</p>
        <Button size="sm" onClick={() => { setEditingGoal(null); setFormOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          {t.goalList.addGoal}
        </Button>
      </div>

      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title={t.goalList.noGoals}
          description={t.goalList.noGoalsDesc}
          actionLabel={t.goalList.addGoal}
          onAction={() => setFormOpen(true)}
        />
      ) : (
        <div className="space-y-3">
          {goals.map(goal => {
            const config = STATUS_CONFIG[goal.status]
            return (
              <Card key={goal.id} className="group">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => toggleStatus(goal)}
                        >
                          <CheckCircle2 className={`h-5 w-5 ${goal.status === 'completed' ? 'text-green-500' : 'text-muted-foreground'}`} />
                        </Button>
                        <p className={`text-sm font-medium flex-1 ${goal.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                          {goal.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 ml-8">
                        <Badge variant={config.variant} className="text-[10px]">{config.label}</Badge>
                        {goal.deadline && (
                          <span className="text-xs text-muted-foreground">{t.common.due} {formatDate(goal.deadline)}</span>
                        )}
                      </div>
                      <div className="ml-8 mt-2 space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{t.common.target}: {goal.targetProficiency}%</span>
                        </div>
                        <Progress value={goal.status === 'completed' ? 100 : goal.status === 'in-progress' ? 50 : 0} className="h-1.5" />
                      </div>
                    </div>
                    <div className="flex shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => { setEditingGoal(goal); setFormOpen(true) }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => setDeleteId(goal.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <GoalForm
        open={formOpen}
        onOpenChange={setFormOpen}
        setId={setId}
        goal={editingGoal}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title={t.goalList.deleteTitle}
        description={t.goalList.deleteDesc}
        confirmLabel={t.common.delete}
        onConfirm={() => {
          if (deleteId) {
            deleteGoal(setId, deleteId)
            toast.success(t.goalList.goalDeleted)
          }
        }}
      />
    </div>
  )
}
