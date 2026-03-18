import { useState } from 'react'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { BookOpen, Sparkles, Brain, BarChart3, ChevronRight, ChevronLeft, GraduationCap } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/lib/utils'

interface TutorialDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TutorialDialog({ open, onOpenChange }: TutorialDialogProps) {
  const [step, setStep] = useState(0)
  const { t } = useTranslation()

  const steps = [
    {
      icon: GraduationCap,
      iconColor: 'text-primary',
      iconBg: 'bg-primary/10',
      title: t.tutorial.welcome,
      description: t.tutorial.welcomeDesc,
    },
    {
      icon: BookOpen,
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-500/10',
      title: t.tutorial.step1Title,
      description: t.tutorial.step1Desc,
    },
    {
      icon: Sparkles,
      iconColor: 'text-purple-500',
      iconBg: 'bg-purple-500/10',
      title: t.tutorial.step2Title,
      description: t.tutorial.step2Desc,
    },
    {
      icon: Brain,
      iconColor: 'text-green-500',
      iconBg: 'bg-green-500/10',
      title: t.tutorial.step3Title,
      description: t.tutorial.step3Desc,
    },
    {
      icon: BarChart3,
      iconColor: 'text-orange-500',
      iconBg: 'bg-orange-500/10',
      title: t.tutorial.step4Title,
      description: t.tutorial.step4Desc,
    },
  ]

  const current = steps[step]
  const isLast = step === steps.length - 1
  const Icon = current.icon

  const handleClose = () => {
    setStep(0)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Gradient header */}
        <div className="relative bg-gradient-to-br from-primary/10 via-purple-500/10 to-fuchsia-500/10 px-6 pt-8 pb-6 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.15),transparent_70%)]" />
          <div className={cn(
            'relative mx-auto mb-4 inline-flex rounded-2xl p-4',
            current.iconBg
          )}>
            <Icon className={cn('h-10 w-10', current.iconColor)} />
          </div>
          <h2 className="relative text-xl font-bold">{current.title}</h2>
        </div>

        {/* Body */}
        <div className="px-6 pb-2">
          <p className="text-sm text-muted-foreground text-center leading-relaxed min-h-[60px]">
            {current.description}
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 py-3">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={cn(
                'h-2 rounded-full transition-all',
                i === step ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
              )}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 pb-6">
          <Button variant="ghost" size="sm" onClick={handleClose} className="text-muted-foreground">
            {t.tutorial.skip}
          </Button>

          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" size="sm" onClick={() => setStep(s => s - 1)}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                {t.tutorial.prev}
              </Button>
            )}
            {isLast ? (
              <Button size="sm" onClick={handleClose}>
                {t.tutorial.getStarted}
              </Button>
            ) : (
              <Button size="sm" onClick={() => setStep(s => s + 1)}>
                {t.tutorial.next}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>

        {/* Step counter */}
        <div className="text-center pb-4">
          <span className="text-xs text-muted-foreground">{step + 1} {t.tutorial.stepOf} {steps.length}</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
