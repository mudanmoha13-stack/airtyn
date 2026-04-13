"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, X } from 'lucide-react';
import { summarizeProjectActivity } from '@/ai/flows/project-summary-ai';
import { useAppState } from '@/lib/store';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const ProjectSummary = () => {
  const { projects, tasks } = useAppState();
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSummarize = async () => {
    setIsLoading(true);
    try {
      // Create some mock content based on current state
      const projectSummaryText = projects.map(p => `Project: ${p.name} (Progress: ${p.progress}%, Status: ${p.status})`).join('\n');
      const taskSummaryText = tasks.map(t => `Task: ${t.title} [${t.status}]`).join('\n');
      const content = `Active Projects:\n${projectSummaryText}\n\nTasks:\n${taskSummaryText}`;
      
      const result = await summarizeProjectActivity({
        contentToSummarize: content,
        summaryLength: 'medium',
        focus: 'project progress and upcoming deadlines'
      });
      
      setSummary(result.summary);
    } catch (error) {
      console.error('Failed to generate summary:', error);
      setSummary('Failed to generate an AI summary at this time.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="border-primary/30 hover:border-primary text-primary-foreground font-medium transition-all hover-glow"
          onClick={() => {
            setIsOpen(true);
            if (!summary) handleSummarize();
          }}
        >
          <Sparkles className="w-4 h-4 mr-2 text-primary" />
          AI Summary
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-card sm:max-w-[500px] border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Insight
          </DialogTitle>
          <DialogDescription>
            Smart summary of your organization&apos;s activity.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground animate-pulse">Analyzing workspace activity...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-background/50 border border-white/5 leading-relaxed text-sm text-foreground/90 whitespace-pre-wrap">
                {summary}
              </div>
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={handleSummarize} disabled={isLoading}>
                  {isLoading ? 'Regenerating...' : 'Regenerate'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};