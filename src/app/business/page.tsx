import Link from 'next/link';
import { ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { Shell } from '@/components/layout/Shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BUSINESS_EXECUTIVE_SUMMARY,
  BUSINESS_IMPLEMENTATION_STEPS,
  BUSINESS_MODULE_SUMMARIES,
  BUSINESS_PLATFORM_PILLARS,
} from '@/lib/business-os';

export default function BusinessHomePage() {
  return (
    <Shell>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Badge className="w-fit rounded-full border-primary/20 bg-primary/10 px-3 py-1 text-primary hover:bg-primary/10">
              Executive Summary
            </Badge>
            <div>
              <h1 className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-4xl font-bold text-transparent">
                {BUSINESS_EXECUTIVE_SUMMARY.title}
              </h1>
              <p className="mt-3 max-w-3xl text-muted-foreground">
                {BUSINESS_EXECUTIVE_SUMMARY.description}
              </p>
            </div>
          </div>
          <Button asChild className="gradient-amber h-11 rounded-xl px-4 text-black font-semibold shadow-lg shadow-amber-500/20">
            <Link href="/business/crm">
              Open first module
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {BUSINESS_EXECUTIVE_SUMMARY.stats.map((stat) => (
            <Card key={stat.label} className="glass-card border-white/5">
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">{stat.label}</div>
                <div className="mt-3 text-3xl font-bold">{stat.value}</div>
                <div className="mt-2 text-xs text-primary">{stat.delta}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="glass-card border-white/5">
            <CardHeader>
              <CardTitle>Platform pillars</CardTitle>
              <CardDescription>What is already shared across both products.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {BUSINESS_PLATFORM_PILLARS.map((pillar) => (
                <div key={pillar} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  <span>{pillar}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="glass-card border-white/5">
            <CardHeader>
              <CardTitle>Implementation path</CardTitle>
              <CardDescription>How BOS expands on the current platform in steps.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {BUSINESS_IMPLEMENTATION_STEPS.map((step, index) => (
                <div key={step} className="flex gap-3 text-sm text-muted-foreground">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-xs font-medium text-primary">
                    {index + 1}
                  </div>
                  <span>{step}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {BUSINESS_MODULE_SUMMARIES.map((module) => (
            <Card key={module.key} className="glass-card border-white/5 transition-all duration-150 hover:border-primary/20 hover:bg-white/[0.05]">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                  <module.icon className="h-6 w-6" />
                </div>
                <CardTitle className="pt-2 text-lg">{module.title}</CardTitle>
                <CardDescription>{module.summary}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full border-white/10 bg-background/30">
                  <Link href={module.route}>Open module</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Shell>
  );
}
