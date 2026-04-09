import Link from 'next/link';
import { Shell } from '@/components/layout/Shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BUSINESS_MODULE_SUMMARIES } from '@/lib/business-os';

const HOME_MODULES = BUSINESS_MODULE_SUMMARIES
  .filter((module) => module.key !== 'crm')
  .map((module) => (
    module.key === 'sales'
      ? {
          ...module,
          title: 'Sales & CRM',
          summary: 'Manage leads, contacts, accounts, deals, activities, forecasting, and POS operations from one commercial workspace.',
        }
      : module
  ));

export default function BusinessHomePage() {
  return (
    <Shell>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
        <div>
          <h1 className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-3xl font-bold text-transparent">
            Business
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Select a module to get started.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {HOME_MODULES.map((module) => (
            <Link key={module.key} href={module.route} className="group block focus:outline-none">
              <Card className="glass-card h-full border-white/5 transition-all duration-150 group-hover:border-primary/20 group-hover:bg-white/[0.05]">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                    <module.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="pt-2 text-lg">{module.title}</CardTitle>
                  <CardDescription>{module.summary}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="w-full border-white/10 bg-background/30 group-hover:border-primary/30 group-hover:text-primary">
                    <span>Open module</span>
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </Shell>
  );
}
