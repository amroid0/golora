"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusCircle, X } from "lucide-react"

interface SizeColorCardProps {
  sizes: string[]
  colors: { name: string; hex: string }[]
  onAddSize: (size: string) => void
  onRemoveSize: (size: string) => void
  onAddColor: (name: string, hex: string) => void
  onRemoveColor: (name: string) => void
}

export function SizeColorCard({
  sizes,
  colors,
  onAddSize,
  onRemoveSize,
  onAddColor,
  onRemoveColor,
}: SizeColorCardProps) {
  const [newSize, setNewSize] = useState("")
  const [newColorName, setNewColorName] = useState("")
  const [newColorHex, setNewColorHex] = useState("#000000")

  const handleAddSize = () => {
    if (newSize) {
      onAddSize(newSize)
      setNewSize("")
    }
  }

  const handleAddColor = () => {
    if (newColorName && newColorHex) {
      onAddColor(newColorName, newColorHex)
      setNewColorName("")
      setNewColorHex("#000000")
    }
  }

  // Default sizes if none are provided
  const availableSizes = sizes.length > 0 ? sizes : []
  const defaultSizes = ["M", "L", "XL", "2XL"]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sizes & Colors</CardTitle>
        <CardDescription>Manage available sizes and colors for this product</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sizes Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Available Sizes</h3>

          <div className="flex flex-wrap gap-2">
            {availableSizes.map((size) => (
              <Badge key={size} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                {size}
                <button
                  type="button"
                  onClick={() => onRemoveSize(size)}
                  className="ml-1 rounded-full hover:bg-muted p-0.5"
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove {size}</span>
                </button>
              </Badge>
            ))}

            {availableSizes.length === 0 && <p className="text-sm text-muted-foreground">No sizes added yet.</p>}
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="new-size" className="sr-only">
                Add Size
              </Label>
              <Input
                id="new-size"
                value={newSize}
                onChange={(e) => setNewSize(e.target.value)}
                placeholder="Enter size (e.g., M, L, XL)"
                list="default-sizes"
              />
              <datalist id="default-sizes">
                {defaultSizes.map((size) => (
                  <option key={size} value={size} />
                ))}
              </datalist>
            </div>
            <Button type="button" onClick={handleAddSize} size="sm">
              <PlusCircle className="h-4 w-4 mr-1" />
              Add Size
            </Button>
          </div>
        </div>

        {/* Colors Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Available Colors</h3>

          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <Badge key={color.name} variant="outline" className="flex items-center gap-1 px-3 py-1 border">
                <span className="inline-block w-3 h-3 rounded-full mr-1" style={{ backgroundColor: color.hex }} />
                {color.name}
                <button
                  type="button"
                  onClick={() => onRemoveColor(color.name)}
                  className="ml-1 rounded-full hover:bg-muted p-0.5"
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove {color.name}</span>
                </button>
              </Badge>
            ))}

            {colors.length === 0 && <p className="text-sm text-muted-foreground">No colors added yet.</p>}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <Label htmlFor="new-color-name" className="sr-only">
                Color Name
              </Label>
              <Input
                id="new-color-name"
                value={newColorName}
                onChange={(e) => setNewColorName(e.target.value)}
                placeholder="Color name (e.g., Red, Blue)"
              />
            </div>
            <div>
              <Label htmlFor="new-color-hex" className="sr-only">
                Color Hex
              </Label>
              <Input
                id="new-color-hex"
                type="color"
                value={newColorHex}
                onChange={(e) => setNewColorHex(e.target.value)}
              />
            </div>
            <Button type="button" onClick={handleAddColor} className="col-span-3" size="sm">
              <PlusCircle className="h-4 w-4 mr-1" />
              Add Color
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

