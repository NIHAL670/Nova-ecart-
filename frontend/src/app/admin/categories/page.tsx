'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, FolderTree, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  adminCreateCategory,
  adminDeleteCategory,
  adminFetchCategoriesAll,
  adminUpdateCategory,
} from '@/services/admin.service';
import { getErrorMessage } from '@/lib/api';
import { queryKeys } from '@/constants';
import type { Category } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const ADMIN_CATEGORIES_KEY = ['admin', 'categories'] as const;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function categoryId(cat: string | Category | undefined): string {
  if (!cat) return '';
  return typeof cat === 'object' ? cat._id : cat;
}

interface CategoryDialogProps {
  category?: Category | null;
  categories: Category[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function CategoryDialog({ category, categories, open, onOpenChange }: CategoryDialogProps) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(category);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [slug, setSlug] = useState('');
  const [image, setImage] = useState('');
  const [parent, setParent] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setDescription(category.description ?? '');
      setSlug(category.slug);
      setImage(category.image ?? '');
      setParent(categoryId(category.parent));
      setIsActive(category.isActive);
    } else {
      setName('');
      setDescription('');
      setSlug('');
      setImage('');
      setParent('');
      setIsActive(true);
    }
  }, [category, open]);

  const mutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      category ? adminUpdateCategory(category._id, payload) : adminCreateCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_CATEGORIES_KEY });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
      toast.success(isEdit ? 'Category updated' : 'Category created');
      onOpenChange(false);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error('Category name is required');
      return;
    }
    const payload: Record<string, unknown> = {
      name: trimmedName,
      slug: slug.trim() || slugify(trimmedName),
      isActive,
    };
    if (description.trim()) payload.description = description.trim();
    if (image.trim()) payload.image = image.trim();
    if (parent) payload.parent = parent;
    mutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit category' : 'New category'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the category details below.' : 'Create a new category for your catalog.'}
          </DialogDescription>
        </DialogHeader>
        <form id="category-form" onSubmit={handleSubmit} className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="cat-name">Name</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!isEdit) setSlug(slugify(e.target.value));
              }}
              placeholder="Audio"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cat-slug">Slug</Label>
              <Input id="cat-slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="audio" />
            </div>
            <div className="space-y-1.5">
              <Label>Parent</Label>
              <Select value={parent || undefined} onValueChange={setParent}>
                <SelectTrigger>
                  <SelectValue placeholder="None (top level)" />
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter((c) => !isEdit || c._id !== category?._id)
                    .map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-desc">Description</Label>
            <Textarea
              id="cat-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description…"
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-image">Image URL</Label>
            <Input
              id="cat-image"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://…"
            />
          </div>
          <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-4">
            <div>
              <p className="text-sm font-medium">Active</p>
              <p className="text-xs text-muted-foreground">Show this category in the storefront</p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="category-form" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? 'Save changes' : 'Create category'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ADMIN_CATEGORIES_KEY,
    queryFn: () => adminFetchCategoriesAll(),
  });

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const del = useMutation({
    mutationFn: (id: string) => adminDeleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_CATEGORIES_KEY });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
      toast.success('Category deleted');
      setDeleting(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const all = categories ?? [];
  const parents = all.filter((c) => !c.parent || !all.some((p) => p._id === categoryId(c.parent)));
  const childrenOf = (parentId: string) => all.filter((c) => categoryId(c.parent) === parentId);

  const deletingHasChildren = deleting ? childrenOf(deleting._id).length > 0 : false;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Categories</CardTitle>
            <CardDescription>Organise your catalog into a parent/child tree</CardDescription>
          </div>
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> New category
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : parents.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              No categories yet — create your first one.
            </p>
          ) : (
            <ul className="space-y-2">
              {parents.map((parent) => {
                const children = childrenOf(parent._id);
                const isOpen = expanded.has(parent._id);
                return (
                  <li key={parent._id} className="overflow-hidden rounded-xl border">
                    <div className="flex items-center justify-between gap-3 bg-muted/30 px-4 py-3">
                      <button
                        type="button"
                        onClick={() => children.length > 0 && toggle(parent._id)}
                        className="flex min-w-0 items-center gap-2 text-left"
                      >
                        {children.length > 0 ? (
                          isOpen ? (
                            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                          )
                        ) : (
                          <span className="w-4 shrink-0" />
                        )}
                        <FolderTree className="h-4 w-4 shrink-0 text-primary" />
                        <span className="truncate text-sm font-medium">{parent.name}</span>
                        {typeof parent.productCount === 'number' && (
                          <span className="text-xs text-muted-foreground">{parent.productCount}</span>
                        )}
                        <Badge variant={parent.isActive ? 'success' : 'secondary'} className="ml-1">
                          {parent.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </button>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Edit ${parent.name}`}
                          onClick={() => {
                            setEditing(parent);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Delete ${parent.name}`}
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleting(parent)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {isOpen && children.length > 0 && (
                      <ul className="border-t bg-card px-4 py-2">
                        {children.map((child) => (
                          <li key={child._id} className="flex items-center justify-between gap-3 py-2">
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="w-4 shrink-0" />
                              <FolderTree className="h-4 w-4 shrink-0 text-muted-foreground" />
                              <span className="truncate text-sm">{child.name}</span>
                              <Badge variant={child.isActive ? 'success' : 'secondary'} className="ml-1">
                                {child.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Edit ${child.name}`}
                                onClick={() => {
                                  setEditing(child);
                                  setFormOpen(true);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Delete ${child.name}`}
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDeleting(child)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <CategoryDialog category={editing} categories={all} open={formOpen} onOpenChange={setFormOpen} />

      <AlertDialog open={Boolean(deleting)} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingHasChildren ? (
                <>
                  &ldquo;{deleting?.name}&rdquo; still has child categories. Remove or reassign them before
                  deleting this category.
                </>
              ) : (
                <>
                  &ldquo;{deleting?.name}&rdquo; will be permanently removed. This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={del.isPending || deletingHasChildren}
              onClick={(e) => {
                e.preventDefault();
                if (deleting) del.mutate(deleting._id);
              }}
            >
              {del.isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}