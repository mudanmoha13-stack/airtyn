"use client";

import React from 'react';
import { ArrowUpRight, LucideIcon } from 'lucide-react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type Stat = {
  label: string;
  value: string;
  delta: string;
};

type Module = {
  title: string;
  description: string;
  status: string;
};

export function BusinessPageFrame({
  eyebrow,
  title,
  description,
  icon: Icon,
  stats,
  modules,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  stats: Stat[];
  modules: Module[];
}) {
  return (
    <Shell>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Badge className="w-fit rounded-full border-primary/20 bg-primary/10 px-3 py-1 text-primary hover:bg-primary/10">
              {eyebrow}
            </Badge>
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-lg shadow-primary/10">
                <Icon className="h-7 w-7" />
              </div>
              <div>
                <h1 className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-4xl font-bold text-transparent">
                  {title}
                </h1>
                <p className="mt-2 max-w-2xl text-muted-foreground">
                  {description}
                </p>
              </div>
            </div>
          </div>
          <Button className="gradient-pink-blue h-11 rounded-xl px-4 text-white shadow-lg shadow-primary/20">
            Launch workflow
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="glass-card border-white/5">
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">{stat.label}</div>
                <div className="mt-3 text-3xl font-bold">{stat.value}</div>
                <div className="mt-2 text-xs text-primary">{stat.delta}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {modules.map((module) => (
            <Card key={module.title} className="glass-card border-white/5">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                  <Badge variant="outline" className="border-white/10 text-muted-foreground">
                    {module.status}
                  </Badge>
                </div>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </Shell>
  );
}
