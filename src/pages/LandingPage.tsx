import { Link } from 'react-router-dom'
import { BookOpen, Brain, Camera, Sparkles, BarChart3, Shield, ArrowRight, Zap, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AppLogo } from '@/components/shared/AppLogo'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { LanguageToggle } from '@/components/layout/LanguageToggle'
import { useTranslation } from '@/hooks/useTranslation'
import { SkyBackground } from '@/components/shared/SkyBackground'

export function LandingPage() {
  const { t } = useTranslation()

  const features = [
    { icon: BookOpen, title: t.landing.feat1Title, desc: t.landing.feat1Desc, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { icon: Camera, title: t.landing.feat2Title, desc: t.landing.feat2Desc, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { icon: Brain, title: t.landing.feat3Title, desc: t.landing.feat3Desc, color: 'text-green-500', bg: 'bg-green-500/10' },
    { icon: Sparkles, title: t.landing.feat4Title, desc: t.landing.feat4Desc, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { icon: BarChart3, title: t.landing.feat5Title, desc: t.landing.feat5Desc, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { icon: Shield, title: t.landing.feat6Title, desc: t.landing.feat6Desc, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  ]

  const stats = [
    { value: 'AI', label: t.landing.statPowered },
    { value: '6+', label: t.landing.statTools },
    { value: '100%', label: t.landing.statFree },
  ]

  return (
    <div className="min-h-screen overflow-hidden">
      <SkyBackground />
      {/* Nav */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-md bg-background/80 border-b">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <AppLogo className="h-6 w-6" />
            <span className="font-bold text-lg">{t.app.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageToggle />
            <Link to="/login">
              <Button variant="ghost" size="sm">{t.auth.signIn}</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm">{t.auth.signUp}</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
        </div>
        <div className="relative max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium animate-fade-in-up">
            <Zap className="h-3.5 w-3.5" />
            {t.landing.tagline}
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            {t.landing.heroTitle1}{' '}
            <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              {t.landing.heroTitle2}
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {t.landing.heroDesc}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Link to="/signup">
              <Button size="lg" className="gap-2 text-base px-8">
                {t.landing.getStartedFree}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="text-base px-8">
                {t.landing.signIn}
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 sm:gap-16 pt-8 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            {stats.map(s => (
              <div key={s.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">{t.landing.featuresTitle}</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t.landing.featuresDesc}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-grid">
            {features.map(f => (
              <div
                key={f.title}
                className="glass-card rounded-xl p-6 space-y-4 card-hover-lift group"
              >
                <div className={`inline-flex rounded-xl p-3 ${f.bg} group-hover:scale-110 transition-transform`}>
                  <f.icon className={`h-6 w-6 ${f.color}`} />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 border-t">
        <div className="max-w-4xl mx-auto text-center space-y-16">
          <div className="space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">{t.landing.howTitle}</h2>
            <p className="text-muted-foreground text-lg">{t.landing.howDesc}</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '1', icon: BookOpen, title: t.landing.step1Title, desc: t.landing.step1Desc },
              { step: '2', icon: Sparkles, title: t.landing.step2Title, desc: t.landing.step2Desc },
              { step: '3', icon: Target, title: t.landing.step3Title, desc: t.landing.step3Desc },
            ].map(item => (
              <div key={item.step} className="space-y-4 animate-fade-in-up">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 border-t">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-3xl sm:text-4xl font-bold">{t.landing.ctaTitle}</h2>
          <p className="text-muted-foreground text-lg">{t.landing.ctaDesc}</p>
          <Link to="/signup">
            <Button size="lg" className="gap-2 text-base px-8">
              {t.landing.ctaButton}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <AppLogo className="h-4 w-4" />
            <span>{t.app.name}</span>
          </div>
          <p>&copy; {new Date().getFullYear()} {t.app.name}. {t.landing.footerRights}</p>
        </div>
      </footer>
    </div>
  )
}
