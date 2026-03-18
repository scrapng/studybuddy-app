import { Link } from 'react-router-dom'
import { FileQuestion } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'

export function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="rounded-full bg-muted p-6 mb-6">
        <FileQuestion className="h-12 w-12 text-muted-foreground" />
      </div>
      <h1 className="text-3xl font-bold mb-2">{t.notFound.title}</h1>
      <p className="text-muted-foreground mb-6">{t.notFound.description}</p>
      <Link to="/" className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-4 h-8 text-sm font-medium hover:bg-primary/80 transition-colors">
        {t.notFound.backToDashboard}
      </Link>
    </div>
  )
}
