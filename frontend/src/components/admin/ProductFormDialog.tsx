'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminCreateProduct, adminFetchCategoriesAll, adminUpdateProduct } from '@/services/admin.service';
import { getErrorMessage } from '@/lib/api';
import { queryKeys } from '@/constants';
import type { Category, Product } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface ProductFormDialogProps {
  product?: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ProductStatus = Product['status'];

function categoryId(cat: string | Category | undefined): string {
  if (!cat) return '';
  return typeof cat === 'object' ? cat._id : cat;
}

/** Create/edit product dialog. Submits a FormData payload via the admin services. */
export function ProductFormDialog({ product, open, onOpenChange }: ProductFormDialogProps) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(product);

  const { data: categories } = useQuery<Category[]>({
    queryKey: queryKeys.categories,
    queryFn: () => adminFetchCategoriesAll(),
    staleTime: 5 * 60_000,
  });

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [stock, setStock] = useState('');
  const [sku, setSku] = useState('');
  const [brand, setBrand] = useState('');
  const [tags, setTags] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProductStatus>('active');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [onSale, setOnSale] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setCategory(categoryId(product.category));
      setPrice(String(product.price));
      setCompareAtPrice(product.compareAtPrice != null ? String(product.compareAtPrice) : '');
      setStock(String(product.stock));
      setSku(product.sku ?? '');
      setBrand(product.brand ?? '');
      setTags(product.tags?.join(', ') ?? '');
      setDescription(product.description ?? '');
      setStatus(product.status);
      setIsFeatured(product.isFeatured);
      setIsBestSeller(product.isBestSeller);
      setIsNewArrival(product.isNewArrival);
      setOnSale(product.onSale);
    } else {
      setName('');
      setCategory('');
      setPrice('');
      setCompareAtPrice('');
      setStock('0');
      setSku('');
      setBrand('');
      setTags('');
      setDescription('');
      setStatus('active');
      setIsFeatured(false);
      setIsBestSeller(false);
      setIsNewArrival(false);
      setOnSale(false);
    }
    setFiles([]);
  }, [product, open]);

  const mutation = useMutation({
    mutationFn: (formData: FormData) =>
      product ? adminUpdateProduct(product._id, formData) : adminCreateProduct(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.lowStock });
      toast.success(isEdit ? 'Product updated' : 'Product created');
      onOpenChange(false);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (price === '' || Number.isNaN(Number(price))) {
      toast.error('Enter a valid price');
      return;
    }

    const fd = new FormData();
    fd.set('name', name.trim());
    if (category) fd.set('category', category);
    fd.set('price', String(Number(price)));
    fd.set('compareAtPrice', compareAtPrice ? String(Number(compareAtPrice)) : '');
    fd.set('stock', String(Math.max(0, Math.round(Number(stock) || 0))));
    if (sku.trim()) fd.set('sku', sku.trim());
    if (brand.trim()) fd.set('brand', brand.trim());
    if (tags.trim()) fd.set('tags', tags.trim());
    fd.set('description', description.trim());
    fd.set('status', status);
    fd.set('isFeatured', String(isFeatured));
    fd.set('isBestSeller', String(isBestSeller));
    fd.set('isNewArrival', String(isNewArrival));
    fd.set('onSale', String(onSale));
    files.forEach((f) => fd.append('images', f));

    mutation.mutate(fd);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit product' : 'New product'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the product details below.' : 'Fill in the details to publish a new product.'}
          </DialogDescription>
        </DialogHeader>
        <form id="product-form" onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="pf-name">Name</Label>
            <Input
              id="pf-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Wireless headphones"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={category || undefined} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((c) => (
                  <SelectItem key={c._id} value={c._id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ProductStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pf-price">Price</Label>
            <Input
              id="pf-price"
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="99.00"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-compare">Compare-at price</Label>
            <Input
              id="pf-compare"
              type="number"
              step="0.01"
              value={compareAtPrice}
              onChange={(e) => setCompareAtPrice(e.target.value)}
              placeholder="129.00"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-stock">Stock</Label>
            <Input
              id="pf-stock"
              type="number"
              min={0}
              value={stock}
              onChange={(e) => setStock(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-sku">SKU</Label>
            <Input
              id="pf-sku"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="NC-1001"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-brand">Brand</Label>
            <Input
              id="pf-brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Nova Audio"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-tags">Tags</Label>
            <Input
              id="pf-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="wireless, headphones, audio"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="pf-desc">Description</Label>
            <Textarea
              id="pf-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short product description…"
              rows={3}
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="pf-image">Images</Label>
            <Input
              id="pf-image"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            />
            <p className="text-xs text-muted-foreground">
              {files.length > 0
                ? `${files.length} file${files.length === 1 ? '' : 's'} selected`
                : product && product.images.length > 0
                  ? `${product.images.length} existing image${product.images.length === 1 ? '' : 's'} — upload to replace or add`
                  : 'Upload product images (PNG/JPG/WebP)'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-xl border bg-muted/30 p-4 sm:col-span-2">
            <ToggleRow label="Featured" checked={isFeatured} onChange={setIsFeatured} />
            <ToggleRow label="Best seller" checked={isBestSeller} onChange={setIsBestSeller} />
            <ToggleRow label="New arrival" checked={isNewArrival} onChange={setIsNewArrival} />
            <ToggleRow label="On sale" checked={onSale} onChange={setOnSale} />
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="product-form" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? 'Save changes' : 'Create product'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <span className="text-sm font-medium">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}