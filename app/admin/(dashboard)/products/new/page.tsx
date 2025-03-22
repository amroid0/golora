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
import { X, Upload } from "lucide-react"
import Image from "next/image"
// Import the new storage helper
import { uploadProductImages } from "@/lib/supabase/storage-helpers"

export default function NewProductPage() {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingSlug, setIsCheckingSlug] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slugError, setSlugError] = useState<string | null>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)

  const [sizes, setSizes] = useState<string[]>([])
  const [newSize, setNewSize] = useState("")
  const [colors, setColors] = useState<{ name: string; hex: string }[]>([])
  const [newColorName, setNewColorName] = useState("")
  const [newColorHex, setNewColorHex] = useState("#000000")

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
    images: [] as string[],
    sizes: [] as string[],
    colors: [] as { name: string; hex: string }[],
  })

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name", { ascending: true })

      if (error) {
        console.error("Error fetching categories:", error)
        return
      }

      setCategories(data || [])
    }

    fetchCategories()
  }, [supabase])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Auto-generate slug from name if name field is being changed and slug is empty
    if (name === "name" && !formData.slug) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")

      setFormData((prev) => ({ ...prev, slug }))
    }
  }

  // Check if slug is unique
  const checkSlugUniqueness = async (slug: string) => {
    if (!slug) return

    setIsCheckingSlug(true)
    setSlugError(null)

    try {
      const { data, error } = await supabase.from("products").select("slug").eq("slug", slug).maybeSingle()

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
      if (formData.slug) {
        checkSlugUniqueness(formData.slug)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [formData.slug])

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

  // Replace the existing uploadImages function with this:
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

  const addSize = () => {
    if (newSize.trim() && !sizes.includes(newSize.trim())) {
      setSizes([...sizes, newSize.trim()])
      setFormData((prev) => ({
        ...prev,
        sizes: [...sizes, newSize.trim()],
      }))
      setNewSize("")
    }
  }

  const removeSize = (sizeToRemove: string) => {
    const updatedSizes = sizes.filter((size) => size !== sizeToRemove)
    setSizes(updatedSizes)
    setFormData((prev) => ({
      ...prev,
      sizes: updatedSizes,
    }))
  }

  const addColor = () => {
    if (newColorName.trim() && newColorHex) {
      const newColor = { name: newColorName.trim(), hex: newColorHex }
      const colorExists = colors.some((color) => color.name === newColorName.trim())

      if (!colorExists) {
        setColors([...colors, newColor])
        setFormData((prev) => ({
          ...prev,
          colors: [...colors, newColor],
        }))
        setNewColorName("")
        setNewColorHex("#000000")
      }
    }
  }

  const removeColor = (colorName: string) => {
    const updatedColors = colors.filter((color) => color.name !== colorName)
    setColors(updatedColors)
    setFormData((prev) => ({
      ...prev,
      colors: updatedColors,
    }))
  }

  const makeSlugUnique = async (baseSlug: string) => {
    let uniqueSlug = baseSlug
    let counter = 1
    let isUnique = false

    while (!isUnique) {
      const { data } = await supabase.from("products").select("slug").eq("slug", uniqueSlug).maybeSingle()

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

    setIsLoading(true)
    setError(null)

    try {
      // Make sure slug is unique
      const uniqueSlug = await makeSlugUnique(formData.slug)

      // Upload images first
      const uploadedImageUrls = await uploadImages()

      // Convert string values to appropriate types
      const productData = {
        ...formData,
        slug: uniqueSlug,
        price: Number.parseFloat(formData.price),
        sale_price: formData.sale_price ? Number.parseFloat(formData.sale_price) : null,
        inventory_count: Number.parseInt(formData.inventory_count),
        category_id: formData.category_id || null,
        images: uploadedImageUrls,
        sizes: sizes.length > 0 ? sizes : null,
        colors: colors.length > 0 ? colors : null,
      }

      const { error } = await supabase.from("products").insert([productData])

      if (error) {
        throw error
      }

      toast({
        title: "Product created",
        description: "The product has been created successfully.",
      })

      router.push("/admin/products")
      router.refresh()
    } catch (error: any) {
      setError(error.message || "Failed to create product")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Add New Product</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
              <CardDescription>Enter the basic information for this product</CardDescription>
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
              <CardDescription>Set the pricing and inventory details</CardDescription>
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
              <CardDescription>Add available sizes and colors for this product</CardDescription>
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
              <CardDescription>Upload images for this product (you can select multiple files)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
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
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-md overflow-hidden border">
                          <Image
                            src={url || "/placeholder.svg"}
                            alt={`Product image ${index + 1}`}
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
              <Button type="submit" disabled={isLoading || isCheckingSlug || !!slugError}>
                {isLoading ? "Creating..." : "Create Product"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  )
}

