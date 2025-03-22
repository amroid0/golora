"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { X, Upload, ArrowLeft, Trash2 } from "lucide-react"
import Link from "next/link"
import { uploadProductImages } from "@/lib/supabase/storage-helpers"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { SupabaseImage } from "@/components/supabase-image"

interface EditProductPageProps {
  params: {
    id: string
  }
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const { id } = params
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isCheckingSlug, setIsCheckingSlug] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slugError, setSlugError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [sizes, setSizes] = useState<string[]>([])
  const [newSize, setNewSize] = useState("")
  const [colors, setColors] = useState<{ name: string; hex: string }[]>([])
  const [newColorName, setNewColorName] = useState("")
  const [newColorHex, setNewColorHex] = useState("#000000")
  const [originalSlug, setOriginalSlug] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    price: "",
    sale_price: "",
    category_id: "",
    inventory_count: "0",
    is_featured: false,
    is_active: true,
  })

  // Fetch product and categories on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch product details
        const { data: product, error: productError } = await supabase.from("products").select("*").eq("id", id).single()

        if (productError) {
          if (productError.code === "PGRST116") {
            // Product not found
            setNotFound(true)
          } else {
            throw productError
          }
        }

        if (!product) {
          setNotFound(true)
          return
        }

        // Set original slug for comparison
        setOriginalSlug(product.slug)

        // Set form data
        setFormData({
          name: product.name,
          slug: product.slug,
          description: product.description || "",
          price: product.price.toString(),
          sale_price: product.sale_price ? product.sale_price.toString() : "",
          category_id: product.category_id || "",
          inventory_count: product.inventory_count.toString(),
          is_featured: product.is_featured,
          is_active: product.is_active,
        })

        // Set existing images
        if (product.images && product.images.length > 0) {
          setExistingImages(product.images)
        }

        // Set sizes and colors
        if (product.sizes && product.sizes.length > 0) {
          setSizes(product.sizes)
        }

        if (product.colors && product.colors.length > 0) {
          setColors(product.colors)
        }

        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("categories")
          .select("*")
          .order("name", { ascending: true })

        if (categoriesError) throw categoriesError
        setCategories(categoriesData || [])
      } catch (err: any) {
        setError(err.message || "Failed to load product")
        toast({
          variant: "destructive",
          title: "Error",
          description: err.message || "Failed to load product",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [id, supabase, toast])

  // If product not found, redirect to not-found page
  useEffect(() => {
    if (notFound) {
      router.push("/admin/products/not-found")
    }
  }, [notFound, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Auto-generate slug from name if slug is empty or was auto-generated
    if (
      name === "name" &&
      (formData.slug === "" ||
        formData.slug ===
          formData.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, ""))
    ) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")

      setFormData((prev) => ({ ...prev, slug }))
    }
  }

  // Check if slug is unique (but ignore the current product's slug)
  const checkSlugUniqueness = async (slug: string) => {
    if (!slug || slug === originalSlug) {
      setSlugError(null)
      return
    }

    setIsCheckingSlug(true)
    setSlugError(null)

    try {
      const { data, error } = await supabase
        .from("products")
        .select("slug")
        .eq("slug", slug)
        .neq("id", id)
        .maybeSingle()

      if (error) throw error

      if (data) {
        setSlugError("This slug is already in use. Please choose a different one.")
      }
    } catch (error: any) {
      console.error("Error checking slug:", error)
    } finally {
      setIsCheckingSlug(false)
    }
  }

  // Debounced slug check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.slug && formData.slug !== originalSlug) {
        checkSlugUniqueness(formData.slug)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [formData.slug, originalSlug])

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")

    setFormData((prev) => ({ ...prev, slug: value }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setImageFiles((prev) => [...prev, ...newFiles])

      // Create preview URLs
      const newUrls = newFiles.map((file) => URL.createObjectURL(file))
      setImageUrls((prev) => [...prev, ...newUrls])
    }
  }

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index))

    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(imageUrls[index])
    setImageUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadImages = async () => {
    if (imageFiles.length === 0) return []

    try {
      setUploadProgress(0)
      const uploadedUrls = await uploadProductImages(imageFiles)
      setUploadProgress(100)
      return uploadedUrls
    } catch (error) {
      console.error("Error uploading images:", error)
      setError("Failed to upload images. Please check your permissions and try again.")
      return []
    }
  }

  const makeSlugUnique = async (baseSlug: string) => {
    // If slug hasn't changed, no need to check
    if (baseSlug === originalSlug) {
      return baseSlug
    }

    let uniqueSlug = baseSlug
    let counter = 1
    let isUnique = false

    while (!isUnique) {
      const { data } = await supabase.from("products").select("slug").eq("slug", uniqueSlug).neq("id", id).maybeSingle()

      if (!data) {
        isUnique = true
      } else {
        uniqueSlug = `${baseSlug}-${counter}`
        counter++
      }
    }

    return uniqueSlug
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check for slug error
    if (slugError) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: slugError,
      })
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      // Make sure slug is unique (if it changed)
      const uniqueSlug = await makeSlugUnique(formData.slug)

      // Upload new images
      const uploadedImageUrls = await uploadImages()

      // Combine existing and new images
      const allImages = [...existingImages, ...uploadedImageUrls]

      // Convert string values to appropriate types
      const productData = {
        name: formData.name,
        slug: uniqueSlug,
        description: formData.description || null,
        price: Number.parseFloat(formData.price),
        sale_price: formData.sale_price ? Number.parseFloat(formData.sale_price) : null,
        inventory_count: Number.parseInt(formData.inventory_count),
        category_id: formData.category_id || null,
        is_featured: formData.is_featured,
        is_active: formData.is_active,
        images: allImages,
        sizes: sizes.length > 0 ? sizes : null,
        colors: colors.length > 0 ? colors : null,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase.from("products").update(productData).eq("id", id)

      if (error) {
        throw error
      }

      toast({
        title: "Product updated",
        description: "The product has been updated successfully.",
      })

      router.push("/admin/products")
      router.refresh()
    } catch (error: any) {
      setError(error.message || "Failed to update product")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)

    try {
      const { error } = await supabase.from("products").delete().eq("id", id)

      if (error) {
        throw error
      }

      toast({
        title: "Product deleted",
        description: "The product has been deleted successfully.",
      })

      router.push("/admin/products")
      router.refresh()
    } catch (error: any) {
      setError(error.message || "Failed to delete product")
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  const addSize = () => {
    if (newSize.trim() && !sizes.includes(newSize.trim())) {
      setSizes([...sizes, newSize.trim()])
      setNewSize("")
    }
  }

  const removeSize = (sizeToRemove: string) => {
    const updatedSizes = sizes.filter((size) => size !== sizeToRemove)
    setSizes(updatedSizes)
  }

  const addColor = () => {
    if (newColorName.trim() && newColorHex) {
      const newColor = { name: newColorName.trim(), hex: newColorHex }
      const colorExists = colors.some((color) => color.name === newColorName.trim())

      if (!colorExists) {
        setColors([...colors, newColor])
        setNewColorName("")
        setNewColorHex("#000000")
      }
    }
  }

  const removeColor = (colorName: string) => {
    const updatedColors = colors.filter((color) => color.name !== colorName)
    setColors(updatedColors)
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Edit Product</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <p>Loading product details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Link href="/admin/products">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Edit Product</h1>
        </div>
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Product
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Are you sure you want to delete this product?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete the product and remove it from our servers.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
              <CardDescription>Edit the basic information for this product</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleSlugChange}
                  required
                  className={slugError ? "border-red-500" : ""}
                />
                {isCheckingSlug && <p className="text-sm text-muted-foreground">Checking slug availability...</p>}
                {slugError && <p className="text-sm text-red-500">{slugError}</p>}
                <p className="text-xs text-muted-foreground">
                  The slug is used in the URL. It must be unique and contain only lowercase letters, numbers, and
                  hyphens.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category_id">Category</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => handleSelectChange("category_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Uncategorized</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pricing & Inventory</CardTitle>
              <CardDescription>Edit the pricing and inventory details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sale_price">Sale Price ($)</Label>
                <Input
                  id="sale_price"
                  name="sale_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.sale_price}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inventory_count">Inventory Count</Label>
                <Input
                  id="inventory_count"
                  name="inventory_count"
                  type="number"
                  min="0"
                  value={formData.inventory_count}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="flex items-center space-x-2 pt-4">
                <Switch
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => handleSwitchChange("is_featured", checked)}
                />
                <Label htmlFor="is_featured">Featured Product</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleSwitchChange("is_active", checked)}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Product Options</CardTitle>
              <CardDescription>Edit available sizes and colors for this product</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Sizes Section */}
              <div className="space-y-2">
                <Label htmlFor="sizes">Available Sizes</Label>
                <div className="flex gap-2">
                  <Input
                    id="newSize"
                    value={newSize}
                    onChange={(e) => setNewSize(e.target.value)}
                    placeholder="e.g., S, M, L, XL"
                    className="flex-1"
                  />
                  <Button type="button" onClick={addSize} variant="secondary">
                    Add Size
                  </Button>
                </div>

                {sizes.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {sizes.map((size) => (
                      <div key={size} className="flex items-center bg-muted rounded-md px-2 py-1">
                        <span className="mr-1">{size}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => removeSize(size)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Colors Section */}
              <div className="space-y-2">
                <Label htmlFor="colors">Available Colors</Label>
                <div className="flex gap-2">
                  <Input
                    id="newColorName"
                    value={newColorName}
                    onChange={(e) => setNewColorName(e.target.value)}
                    placeholder="Color name (e.g., Red, Blue)"
                    className="flex-1"
                  />
                  <Input
                    id="newColorHex"
                    type="color"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    className="w-16"
                  />
                  <Button type="button" onClick={addColor} variant="secondary">
                    Add Color
                  </Button>
                </div>

                {colors.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {colors.map((color) => (
                      <div key={color.name} className="flex items-center bg-muted rounded-md px-2 py-1">
                        <div className="h-4 w-4 rounded-full mr-2" style={{ backgroundColor: color.hex }} />
                        <span className="mr-1">{color.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => removeColor(color.name)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Product Images</CardTitle>
              <CardDescription>Manage images for this product</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing Images */}
              {existingImages.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Current Images</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {existingImages.map((url, index) => (
                      <div key={`existing-${index}`} className="relative group">
                        <div className="aspect-square rounded-md overflow-hidden border">
                          <SupabaseImage
                            src={url || "/placeholder.svg"}
                            alt={`Product image ${index + 1}`}
                            width={200}
                            height={200}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeExistingImage(index)}
                          className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload New Images */}
              <div>
                <h3 className="text-sm font-medium mb-2">Add New Images</h3>
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="image-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                      <p className="mb-2 text-sm text-muted-foreground">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">PNG, JPG or WEBP (MAX. 5MB each)</p>
                    </div>
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                </div>

                {imageUrls.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    {imageUrls.map((url, index) => (
                      <div key={`new-${index}`} className="relative group">
                        <div className="aspect-square rounded-md overflow-hidden border">
                          <SupabaseImage
                            src={url || "/placeholder.svg"}
                            alt={`New product image ${index + 1}`}
                            width={200}
                            height={200}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="w-full bg-muted rounded-full h-2.5 mt-2">
                    <div className="bg-primary h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => router.push("/admin/products")}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving || isCheckingSlug || !!slugError}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  )
}

