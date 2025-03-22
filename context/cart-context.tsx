"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Database } from "@/lib/database.types"

type Product = Database["public"]["Tables"]["products"]["Row"] & {
  categories?: Database["public"]["Tables"]["categories"]["Row"] | null
}

interface CartItem {
  product: Product
  quantity: number
  selectedSize?: string | null
  selectedColor?: { name: string; hex: string } | null
}

interface CartContextType {
  items: CartItem[]
  addItem: (
    product: Product,
    quantity: number,
    selectedSize?: string | null,
    selectedColor?: { name: string; hex: string } | null,
  ) => void
  updateQuantity: (productId: string, quantity: number) => void
  removeItem: (productId: string) => void
  clearCart: () => void
  itemCount: number
  subtotal: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  // Load cart from localStorage on client side
  useEffect(() => {
    const storedCart = localStorage.getItem("cart")
    if (storedCart) {
      try {
        setItems(JSON.parse(storedCart))
      } catch (error) {
        console.error("Failed to parse cart from localStorage:", error)
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem("cart", JSON.stringify(items))
    }
  }, [items])

  const addItem = (
    product: Product,
    quantity: number,
    selectedSize?: string | null,
    selectedColor?: { name: string; hex: string } | null,
  ) => {
    setItems((prevItems) => {
      // Check if the same product with the same options already exists in the cart
      const existingItemIndex = prevItems.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.selectedSize === selectedSize &&
          item.selectedColor?.name === selectedColor?.name,
      )

      if (existingItemIndex !== -1) {
        // If the item exists with the same options, update its quantity
        return prevItems.map((item, index) =>
          index === existingItemIndex ? { ...item, quantity: item.quantity + quantity } : item,
        )
      }

      // Otherwise, add a new item
      return [...prevItems, { product, quantity, selectedSize, selectedColor }]
    })
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return

    setItems((prevItems) => prevItems.map((item) => (item.product.id === productId ? { ...item, quantity } : item)))
  }

  const removeItem = (productId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.product.id !== productId))

    // If cart is empty after removing item, clear localStorage
    if (items.length === 1) {
      localStorage.removeItem("cart")
    }
  }

  const clearCart = () => {
    setItems([])
    localStorage.removeItem("cart")
  }

  const itemCount = items.reduce((count, item) => count + item.quantity, 0)

  const subtotal = items.reduce(
    (total, item) => total + (item.product.sale_price || item.product.price) * item.quantity,
    0,
  )

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        itemCount,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}

