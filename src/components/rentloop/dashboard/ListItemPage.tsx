'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  Upload,
  X,
  Loader2,
  ImageIcon,
  IndianRupee,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppStore } from '@/store';
import { api } from '@/lib/api';
import type { Product, Category, State } from '@/types';
import { toast } from 'sonner';

// ─── Zod Schema ────────────────────────────────────────────
const productSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  categoryId: z.string().min(1, 'Category is required'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  condition: z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'DAMAGED']),
  brand: z.string().max(100).optional().or(z.literal('')),
  model: z.string().max(100).optional().or(z.literal('')),
  purchaseYear: z.string().optional().or(z.literal('')),
  dailyPrice: z.string().min(1, 'Daily price is required'),
  weeklyPrice: z.string().optional().or(z.literal('')),
  securityDeposit: z.string().min(1, 'Security deposit is required'),
  minRentalDays: z.string().min(1, 'Min rental days is required'),
  maxRentalDays: z.string().min(1, 'Max rental days is required'),
  stateId: z.string().min(1, 'State is required'),
  cityId: z.string().min(1, 'City is required'),
  pickupAddress: z.string().min(5, 'Pickup address must be at least 5 characters').max(500),
  deliveryAvailable: z.boolean(),
  deliveryFee: z.string().optional().or(z.literal('')),
  rentalRules: z.string().max(2000).optional().or(z.literal('')),
  cancellationPolicy: z.string().max(2000).optional().or(z.literal('')),
  ownerNotes: z.string().max(2000).optional().or(z.literal('')),
});

type ProductFormData = z.infer<typeof productSchema>;

// ─── Condition Options ─────────────────────────────────────
const conditionOptions = [
  { value: 'NEW', label: 'New' },
  { value: 'LIKE_NEW', label: 'Like New' },
  { value: 'GOOD', label: 'Good' },
  { value: 'FAIR', label: 'Fair' },
  { value: 'DAMAGED', label: 'Damaged' },
];

// ─── Section Wrapper ───────────────────────────────────────
function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3 pt-4 px-5">
        <CardTitle className="text-base font-semibold text-slate-900">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">{children}</CardContent>
    </Card>
  );
}

// ─── Main Page ─────────────────────────────────────────────
export default function ListItemPage() {
  const navigate = useAppStore((s) => s.navigate);
  const viewData = useAppStore((s) => s.viewData);
  const queryClient = useQueryClient();

  const editingProduct = viewData?.product as Product | undefined;
  const isEditing = !!editingProduct;

  // Fetch categories & states
  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => { const d = await api.getCategories(); return d as unknown as Category[]; },
  });

  const { data: states = [], isLoading: loadingStates } = useQuery({
    queryKey: ['states'],
    queryFn: async () => { const d = await api.getStates(); return d as unknown as State[]; },
  });

  // Form
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: '',
      categoryId: '',
      description: '',
      condition: 'GOOD',
      brand: '',
      model: '',
      purchaseYear: '',
      dailyPrice: '',
      weeklyPrice: '',
      securityDeposit: '',
      minRentalDays: '1',
      maxRentalDays: '30',
      stateId: '',
      cityId: '',
      pickupAddress: '',
      deliveryAvailable: false,
      deliveryFee: '',
      rentalRules: '',
      cancellationPolicy: '',
      ownerNotes: '',
    },
  });

  const { register, handleSubmit, control, setValue, formState: { errors } } = form;
  const selectedStateId = useWatch({ control: form.control, name: 'stateId' });
  const deliveryAvailable = useWatch({ control: form.control, name: 'deliveryAvailable' });

  // Get cities for selected state
  const selectedState = states.find((s) => s.id === selectedStateId);
  const cities = selectedState?.cities ?? [];

  // Populate form when editing
  useEffect(() => {
    if (editingProduct) {
      setValue('title', editingProduct.title);
      setValue('categoryId', editingProduct.categoryId);
      setValue('description', editingProduct.description || '');
      setValue('condition', editingProduct.condition);
      setValue('brand', editingProduct.brand || '');
      setValue('model', editingProduct.model || '');
      setValue('purchaseYear', editingProduct.purchaseYear ? String(editingProduct.purchaseYear) : '');
      setValue('dailyPrice', String(editingProduct.dailyPrice));
      setValue('weeklyPrice', editingProduct.weeklyPrice ? String(editingProduct.weeklyPrice) : '');
      setValue('securityDeposit', String(editingProduct.securityDeposit));
      setValue('minRentalDays', String(editingProduct.minRentalDays));
      setValue('maxRentalDays', String(editingProduct.maxRentalDays));
      setValue('stateId', editingProduct.stateId || '');
      setValue('cityId', editingProduct.cityId || '');
      setValue('pickupAddress', editingProduct.pickupAddress || '');
      setValue('deliveryAvailable', editingProduct.deliveryAvailable);
      setValue('deliveryFee', String(editingProduct.deliveryFee));
      setValue('rentalRules', editingProduct.rentalRules || '');
      setValue('cancellationPolicy', editingProduct.cancellationPolicy || '');
      setValue('ownerNotes', editingProduct.ownerNotes || '');
    }
  }, [editingProduct, setValue]);

  // Reset city when state changes
  useEffect(() => {
    if (!isEditing || !editingProduct?.cityId) {
      setValue('cityId', '');
    }
  }, [selectedStateId]);

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const payload: Record<string, unknown> = {
        title: data.title,
        categoryId: data.categoryId,
        description: data.description,
        condition: data.condition,
        brand: data.brand || undefined,
        model: data.model || undefined,
        purchaseYear: data.purchaseYear ? parseInt(data.purchaseYear) : undefined,
        dailyPrice: parseFloat(data.dailyPrice),
        weeklyPrice: data.weeklyPrice ? parseFloat(data.weeklyPrice) : undefined,
        securityDeposit: parseFloat(data.securityDeposit),
        minRentalDays: parseInt(data.minRentalDays),
        maxRentalDays: parseInt(data.maxRentalDays),
        stateId: data.stateId,
        cityId: data.cityId,
        pickupAddress: data.pickupAddress,
        deliveryAvailable: data.deliveryAvailable,
        deliveryFee: data.deliveryFee ? parseFloat(data.deliveryFee) : 0,
        rentalRules: data.rentalRules || undefined,
        cancellationPolicy: data.cancellationPolicy || undefined,
        ownerNotes: data.ownerNotes || undefined,
      };
      if (isEditing) {
        return api.updateProduct(editingProduct.id, payload);
      }
      return api.createProduct(payload);
    },
    onSuccess: () => {
 toast.success(isEditing ? 'Listing updated successfully!' : 'Listing created successfully!');
      queryClient.invalidateQueries({ queryKey: ['my-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      navigate('my-listings');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onSubmit = (data: ProductFormData) => {
    submitMutation.mutate(data);
  };

  const isSubmitting = submitMutation.isPending;
  const isLoadingData = loadingCategories || loadingStates;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900" onClick={() => navigate('my-listings')}>
                <ArrowLeft className="h-4 w-4 mr-1" />Back
              </Button>
              <div className="h-6 w-px bg-slate-200" />
              <h1 className="text-lg font-bold text-slate-900">{isEditing ? 'Edit Listing' : 'List a New Item'}</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {isLoadingData ? (
          <div className="space-y-6">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
          </div>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
          >
            {/* Basic Information */}
            <FormSection title="Basic Information">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Title */}
                  <div className="md:col-span-2">
                    <Label htmlFor="title" className="text-sm font-medium text-slate-700">
                      Product Title <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="title"
                      placeholder="e.g., Canon EOS R5 Camera"
                      className="mt-1.5"
                      {...register('title')}
                    />
                    {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
                  </div>

                  {/* Category */}
                  <div>
                    <Label className="text-sm font-medium text-slate-700">
                      Category <span className="text-red-500">*</span>
                    </Label>
                    <Controller
                      name="categoryId"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="mt-1.5">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.categoryId && <p className="text-xs text-red-500 mt-1">{errors.categoryId.message}</p>}
                  </div>

                  {/* Condition */}
                  <div>
                    <Label className="text-sm font-medium text-slate-700">
                      Condition <span className="text-red-500">*</span>
                    </Label>
                    <Controller
                      name="condition"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="mt-1.5">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {conditionOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description" className="text-sm font-medium text-slate-700">
                    Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your item in detail..."
                    rows={4}
                    className="mt-1.5 resize-none"
                    {...register('description')}
                  />
                  {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Brand */}
                  <div>
                    <Label htmlFor="brand" className="text-sm font-medium text-slate-700">Brand</Label>
                    <Input id="brand" placeholder="e.g., Canon" className="mt-1.5" {...register('brand')} />
                  </div>

                  {/* Model */}
                  <div>
                    <Label htmlFor="model" className="text-sm font-medium text-slate-700">Model</Label>
                    <Input id="model" placeholder="e.g., EOS R5" className="mt-1.5" {...register('model')} />
                  </div>

                  {/* Purchase Year */}
                  <div>
                    <Label htmlFor="purchaseYear" className="text-sm font-medium text-slate-700">Purchase Year</Label>
                    <Input id="purchaseYear" placeholder="e.g., 2023" className="mt-1.5" {...register('purchaseYear')} />
                  </div>
                </div>
              </div>
            </FormSection>

            {/* Pricing */}
            <FormSection title="Pricing">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Daily Price */}
                <div>
                  <Label htmlFor="dailyPrice" className="text-sm font-medium text-slate-700">
                    Daily Price (₹) <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative mt-1.5">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input id="dailyPrice" placeholder="0" className="pl-9" {...register('dailyPrice')} />
                  </div>
                  {errors.dailyPrice && <p className="text-xs text-red-500 mt-1">{errors.dailyPrice.message}</p>}
                </div>

                {/* Weekly Price */}
                <div>
                  <Label htmlFor="weeklyPrice" className="text-sm font-medium text-slate-700">Weekly Price (₹)</Label>
                  <div className="relative mt-1.5">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input id="weeklyPrice" placeholder="Optional" className="pl-9" {...register('weeklyPrice')} />
                  </div>
                </div>

                {/* Security Deposit */}
                <div>
                  <Label htmlFor="securityDeposit" className="text-sm font-medium text-slate-700">
                    Security Deposit (₹) <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative mt-1.5">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input id="securityDeposit" placeholder="0" className="pl-9" {...register('securityDeposit')} />
                  </div>
                  {errors.securityDeposit && <p className="text-xs text-red-500 mt-1">{errors.securityDeposit.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Min Rental Days */}
                  <div>
                    <Label htmlFor="minRentalDays" className="text-sm font-medium text-slate-700">
                      Min Days <span className="text-red-500">*</span>
                    </Label>
                    <Input id="minRentalDays" type="number" min="1" className="mt-1.5" {...register('minRentalDays')} />
                    {errors.minRentalDays && <p className="text-xs text-red-500 mt-1">{errors.minRentalDays.message}</p>}
                  </div>

                  {/* Max Rental Days */}
                  <div>
                    <Label htmlFor="maxRentalDays" className="text-sm font-medium text-slate-700">
                      Max Days <span className="text-red-500">*</span>
                    </Label>
                    <Input id="maxRentalDays" type="number" min="1" className="mt-1.5" {...register('maxRentalDays')} />
                    {errors.maxRentalDays && <p className="text-xs text-red-500 mt-1">{errors.maxRentalDays.message}</p>}
                  </div>
                </div>
              </div>
            </FormSection>

            {/* Location */}
            <FormSection title="Location">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* State */}
                  <div>
                    <Label className="text-sm font-medium text-slate-700">
                      State <span className="text-red-500">*</span>
                    </Label>
                    <Controller
                      name="stateId"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={(v) => { field.onChange(v); setValue('cityId', ''); }}>
                          <SelectTrigger className="mt-1.5">
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                          <SelectContent>
                            {states.map((s) => (
                              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.stateId && <p className="text-xs text-red-500 mt-1">{errors.stateId.message}</p>}
                  </div>

                  {/* City */}
                  <div>
                    <Label className="text-sm font-medium text-slate-700">
                      City <span className="text-red-500">*</span>
                    </Label>
                    <Controller
                      name="cityId"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange} disabled={!selectedStateId}>
                          <SelectTrigger className="mt-1.5">
                            <SelectValue placeholder={selectedStateId ? 'Select city' : 'Select state first'} />
                          </SelectTrigger>
                          <SelectContent>
                            {cities.map((c) => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.cityId && <p className="text-xs text-red-500 mt-1">{errors.cityId.message}</p>}
                  </div>
                </div>

                {/* Pickup Address */}
                <div>
                  <Label htmlFor="pickupAddress" className="text-sm font-medium text-slate-700">
                    Pickup Address <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="pickupAddress"
                    placeholder="Full pickup address..."
                    rows={2}
                    className="mt-1.5 resize-none"
                    {...register('pickupAddress')}
                  />
                  {errors.pickupAddress && <p className="text-xs text-red-500 mt-1">{errors.pickupAddress.message}</p>}
                </div>

                {/* Delivery */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Controller
                    name="deliveryAvailable"
                    control={control}
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                  <Label className="text-sm font-medium text-slate-700 cursor-pointer" onClick={() => setValue('deliveryAvailable', !deliveryAvailable)}>
                    Delivery Available
                  </Label>
                  {deliveryAvailable && (
                    <div className="relative ml-auto">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Delivery fee"
                        className="w-32 pl-9 h-9"
                        {...register('deliveryFee')}
                      />
                    </div>
                  )}
                </div>
              </div>
            </FormSection>

            {/* Images */}
            <FormSection title="Images">
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors cursor-pointer">
                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                  <Upload className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-700">Click to upload images</p>
                <p className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP up to 5MB each (max 5 images)</p>
                <Button type="button" variant="outline" size="sm" className="mt-3 text-xs" disabled>
                  <ImageIcon className="h-4 w-4 mr-1.5" />
                  Choose Files
                </Button>
                <p className="text-[11px] text-slate-400 mt-2">Image upload available in production environment</p>
              </div>
            </FormSection>

            {/* Policies */}
            <FormSection title="Policies & Rules">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="rentalRules" className="text-sm font-medium text-slate-700">Rental Rules</Label>
                  <Textarea
                    id="rentalRules"
                    placeholder="e.g., No smoking near the item, handle with care..."
                    rows={3}
                    className="mt-1.5 resize-none"
                    {...register('rentalRules')}
                  />
                </div>
                <div>
                  <Label htmlFor="cancellationPolicy" className="text-sm font-medium text-slate-700">Cancellation Policy</Label>
                  <Textarea
                    id="cancellationPolicy"
                    placeholder="e.g., Free cancellation 24 hours before start date..."
                    rows={3}
                    className="mt-1.5 resize-none"
                    {...register('cancellationPolicy')}
                  />
                </div>
                <div>
                  <Label htmlFor="ownerNotes" className="text-sm font-medium text-slate-700">Owner Notes</Label>
                  <Textarea
                    id="ownerNotes"
                    placeholder="Any additional notes for renters..."
                    rows={3}
                    className="mt-1.5 resize-none"
                    {...register('ownerNotes')}
                  />
                </div>
              </div>
            </FormSection>

            {/* Submit */}
            <div className="flex items-center justify-between pb-8">
              <Button
                type="button"
                variant="outline"
                className="text-slate-600"
                onClick={() => navigate('my-listings')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[160px]"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />{isEditing ? 'Updating...' : 'Creating...'}</>
                ) : (
                  <>{isEditing ? 'Update Listing' : 'Create Listing'}</>
                )}
              </Button>
            </div>
          </motion.form>
        )}
      </div>
    </div>
  );
}
