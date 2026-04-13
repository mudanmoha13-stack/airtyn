"use client";

import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { useAppState } from '@/lib/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, Trash2, LayoutTemplate, Rocket } from 'lucide-react';

export default function TemplatesPage() {
  const { templates, createProjectFromTemplate, addTemplate, deleteTemplate, canManageProjects } = useAppState();

  // Use-template dialog state
  const [useTemplateId, setUseTemplateId] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [useDialogOpen, setUseDialogOpen] = useState(false);

  // Create custom template dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [tplName, setTplName] = useState('');
  const [tplDesc, setTplDesc] = useState('');
  const [tplIcon, setTplIcon] = useState('📋');
  const [tplColor, setTplColor] = useState('#6366f1');

  const selectedTemplate = templates.find((t) => t.id === useTemplateId);

  const handleUseTemplate = () => {
    if (!useTemplateId || !newProjectName.trim()) return;
    createProjectFromTemplate(useTemplateId, newProjectName.trim(), newProjectDesc.trim());
    setUseDialogOpen(false);
    setNewProjectName('');
    setNewProjectDesc('');
    setUseTemplateId(null);
  };

  const handleCreateTemplate = () => {
    if (!tplName.trim()) return;
    addTemplate({
      name: tplName.trim(),
      description: tplDesc.trim(),
      icon: tplIcon,
      color: tplColor,
      defaultTasks: [],
    });
    setTplName('');
    setTplDesc('');
    setTplIcon('📋');
    setTplColor('#6366f1');
    setCreateOpen(false);
  };

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Project Templates</h1>
            <p className="text-muted-foreground">Start projects faster with pre-built task structures.</p>
          </div>
          {canManageProjects && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Template
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Custom Template</DialogTitle>
                  <DialogDescription>Define a reusable template for your team's workflows.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-3">
                    <div className="space-y-2">
                      <Label>Icon</Label>
                      <Input value={tplIcon} onChange={(e) => setTplIcon(e.target.value)} placeholder="📋" maxLength={2} />
                    </div>
                    <div className="col-span-3 space-y-2">
                      <Label>Template Name</Label>
                      <Input value={tplName} onChange={(e) => setTplName(e.target.value)} placeholder="e.g. Feature Development" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={tplDesc} onChange={(e) => setTplDesc(e.target.value)} placeholder="Describe when to use this template" rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label>Color</Label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={tplColor} onChange={(e) => setTplColor(e.target.value)} className="h-9 w-12 rounded border cursor-pointer" />
                      <span className="text-sm text-muted-foreground">{tplColor}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Tasks can be added after creating the template (coming soon).</p>
                  <Button className="w-full" onClick={handleCreateTemplate} disabled={!tplName.trim()}>
                    Create Template
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Use-template dialog */}
        <Dialog open={useDialogOpen} onOpenChange={setUseDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Project from &ldquo;{selectedTemplate?.name}&rdquo;</DialogTitle>
              <DialogDescription>
                This will create a new project with {selectedTemplate?.defaultTasks.length ?? 0} pre-built tasks.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Project Name</Label>
                <Input
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. Q2 Product Launch"
                />
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Textarea
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="Brief project description"
                  rows={2}
                />
              </div>
              {selectedTemplate && selectedTemplate.defaultTasks.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Tasks that will be created</p>
                  <div className="max-h-40 overflow-auto space-y-1">
                    {selectedTemplate.defaultTasks.map((t, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="text-xs">{t.priority}</Badge>
                        <span className="truncate">{t.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setUseDialogOpen(false)}>Cancel</Button>
                <Button className="flex-1" onClick={handleUseTemplate} disabled={!newProjectName.trim()}>
                  <Rocket className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Templates grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="glass-card hover-glow transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm"
                      style={{ backgroundColor: template.color + '22', border: `1px solid ${template.color}44` }}
                    >
                      {template.icon}
                    </div>
                    <div>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      {template.isDefault && (
                        <Badge variant="secondary" className="text-xs mt-0.5">Built-in</Badge>
                      )}
                    </div>
                  </div>
                  {!template.isDefault && canManageProjects && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Template?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the &ldquo;{template.name}&rdquo; template. Existing projects created from it are unaffected.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteTemplate(template.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
                <CardDescription className="text-sm mt-2">{template.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1 max-h-36 overflow-auto">
                  {template.defaultTasks.slice(0, 5).map((task, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: template.color }}
                      />
                      <span className="truncate">{task.title}</span>
                      <Badge variant="outline" className="text-xs shrink-0">{task.priority}</Badge>
                    </div>
                  ))}
                  {template.defaultTasks.length > 5 && (
                    <p className="text-xs text-muted-foreground pl-3.5">+{template.defaultTasks.length - 5} more tasks</p>
                  )}
                  {template.defaultTasks.length === 0 && (
                    <p className="text-xs text-muted-foreground">No default tasks defined.</p>
                  )}
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-xs text-muted-foreground">
                    {template.defaultTasks.length} task{template.defaultTasks.length !== 1 ? 's' : ''}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => {
                      setUseTemplateId(template.id);
                      setNewProjectName(template.name + ' Project');
                      setUseDialogOpen(true);
                    }}
                  >
                    <LayoutTemplate className="h-3.5 w-3.5 mr-1.5" />
                    Use Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Shell>
  );
}
