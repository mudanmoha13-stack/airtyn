"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  Button,
  Input,
  Label,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Separator,
  ScrollArea,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui";
import {
  ChefHat,
  UtensilsCrossed,
  ShoppingBag,
  Bike,
  QrCode,
  SplitSquareVertical,
  Merge,
  CreditCard,
  Banknote,
  Smartphone,
  Users,
  Plus,
  Minus,
  X,
  Check,
  Printer,
  Receipt,
  Clock,
  Star,
  Flame,
  Leaf,
  Zap,
  Coffee,
  Wine,
  ChevronRight,
  ArrowLeft,
  RotateCcw,
  Settings,
  LogOut,
  Calculator,
  Hash,
} from "lucide-react";

// Types
interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  emoji: string;
  tags: string[];
  modifiers?: Modifier[];
  image?: string;
}

interface Modifier {
  id: string;
  name: string;
  options: ModifierOption[];
}

interface ModifierOption {
  name: string;
  price: number;
}

interface OrderItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  selectedModifiers: Record<string, string>;
  notes: string;
}

interface OrderTicket {
  id: string;
  items: OrderItem[];
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  tableNumber?: string;
  pax: number;
  discount: number;
  discountType: "percentage" | "fixed";
  discountReason?: string;
  specialInstructions: string;
  createdAt: Date;
}

interface ShiftData {
  isOpen: boolean;
  openedAt?: Date;
  closedAt?: Date;
  openingFloat: number;
  closingCash?: number;
  orderCount: number;
  totalRevenue: number;
  revenueByMethod: Record<string, number>;
  tips: number;
  voids: number;
}

interface PaymentRecord {
  method: "cash" | "card" | "wallet" | "split";
  amount: number;
  reference?: string;
  timestamp: Date;
}

// Mock Data
const MENU_ITEMS: MenuItem[] = [
  {
    id: "1",
    name: "Nyama Choma Plate",
    price: 850,
    category: "Mains",
    emoji: "🔥",
    tags: ["popular", "grilled"],
    modifiers: [
      {
        id: "m1",
        name: "Size",
        options: [
          { name: "Regular (200g)", price: 0 },
          { name: "Large (350g)", price: 150 },
          { name: "Extra Large (500g)", price: 300 },
        ],
      },
      {
        id: "m2",
        name: "Sides",
        options: [
          { name: "Ugali", price: 0 },
          { name: "Fries", price: 50 },
          { name: "Rice", price: 50 },
          { name: "Mixed", price: 100 },
        ],
      },
    ],
  },
  {
    id: "2",
    name: "Grilled Fish",
    price: 950,
    category: "Mains",
    emoji: "🐟",
    tags: ["grilled", "healthy"],
    modifiers: [
      {
        id: "m3",
        name: "Preparation",
        options: [
          { name: "Whole", price: 0 },
          { name: "Fillet", price: 0 },
        ],
      },
    ],
  },
  {
    id: "3",
    name: "Chicken Fried Rice",
    price: 650,
    category: "Mains",
    emoji: "🍚",
    tags: ["popular"],
  },
  {
    id: "4",
    name: "Spaghetti Carbonara",
    price: 780,
    category: "Pasta",
    emoji: "🍝",
    tags: ["vegetarian"],
  },
  {
    id: "5",
    name: "Penne Arrabbiata",
    price: 720,
    category: "Pasta",
    emoji: "🌶️",
    tags: ["spicy", "vegan"],
  },
  {
    id: "6",
    name: "Caesar Salad",
    price: 520,
    category: "Sides",
    emoji: "🥗",
    tags: ["vegetarian", "healthy"],
  },
  {
    id: "7",
    name: "French Fries",
    price: 280,
    category: "Sides",
    emoji: "🍟",
    tags: ["popular"],
  },
  {
    id: "8",
    name: "Chapati",
    price: 80,
    category: "Sides",
    emoji: "🥖",
    tags: [],
  },
  {
    id: "9",
    name: "Ugali",
    price: 150,
    category: "Sides",
    emoji: "🌽",
    tags: [],
  },
  {
    id: "10",
    name: "Chocolate Cake",
    price: 380,
    category: "Desserts",
    emoji: "🍰",
    tags: ["sweet"],
  },
  {
    id: "11",
    name: "Fruit Sorbet",
    price: 320,
    category: "Desserts",
    emoji: "🧊",
    tags: ["healthy"],
  },
  {
    id: "12",
    name: "Espresso",
    price: 180,
    category: "Drinks",
    emoji: "☕",
    tags: [],
  },
  {
    id: "13",
    name: "Cappuccino",
    price: 250,
    category: "Drinks",
    emoji: "☕",
    tags: [],
  },
  {
    id: "14",
    name: "Fresh Orange Juice",
    price: 220,
    category: "Drinks",
    emoji: "🧃",
    tags: ["healthy"],
  },
  {
    id: "15",
    name: "Iced Tea",
    price: 150,
    category: "Drinks",
    emoji: "🧋",
    tags: [],
  },
  {
    id: "16",
    name: "Red Wine (Glass)",
    price: 450,
    category: "Drinks",
    emoji: "🍷",
    tags: [],
  },
  {
    id: "17",
    name: "Tusker",
    price: 300,
    category: "Drinks",
    emoji: "🍺",
    tags: [],
  },
  {
    id: "18",
    name: "Mango Smoothie",
    price: 280,
    category: "Drinks",
    emoji: "🥤",
    tags: ["vegetarian"],
  },
  {
    id: "19",
    name: "Beef Burger",
    price: 550,
    category: "Mains",
    emoji: "🍔",
    tags: ["popular"],
    modifiers: [
      {
        id: "m4",
        name: "Patties",
        options: [
          { name: "Single", price: 0 },
          { name: "Double", price: 200 },
        ],
      },
    ],
  },
  {
    id: "20",
    name: "Grilled Chicken Wings",
    price: 620,
    category: "Mains",
    emoji: "🍗",
    tags: ["popular"],
  },
  {
    id: "21",
    name: "Samosa",
    price: 100,
    category: "Sides",
    emoji: "🥟",
    tags: [],
  },
  {
    id: "22",
    name: "Pilau",
    price: 450,
    category: "Mains",
    emoji: "🍲",
    tags: [],
  },
  {
    id: "23",
    name: "Tiramisu",
    price: 420,
    category: "Desserts",
    emoji: "🍮",
    tags: ["sweet"],
  },
  {
    id: "24",
    name: "Special Combo (Nyama + Drinks)",
    price: 1200,
    category: "Specials",
    emoji: "⭐",
    tags: ["popular", "value"],
  },
];

const TABLES = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12", "T13", "T14", "T15"];

const CATEGORIES = ["All", "Mains", "Pasta", "Sides", "Desserts", "Drinks", "Specials"];

export default function RestaurantPOS() {
  // State
  const [mode, setMode] = useState<"counter" | "dine-in" | "takeaway" | "delivery" | "qr" | "split" | "merge">("counter");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [orderTicket, setOrderTicket] = useState<OrderTicket>({
    id: `ORD-${Date.now()}`,
    items: [],
    pax: 1,
    discount: 0,
    discountType: "percentage",
    specialInstructions: "",
    createdAt: new Date(),
  });
  const [showModifierSheet, setShowModifierSheet] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string>>({});
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "wallet" | "split">("cash");
  const [cashTendered, setCashTendered] = useState("");
  const [cardLastFour, setCardLastFour] = useState("");
  const [walletPhone, setWalletPhone] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [paymentRecord, setPaymentRecord] = useState<PaymentRecord | null>(null);
  const [shiftData, setShiftData] = useState<ShiftData>({
    isOpen: false,
    orderCount: 0,
    totalRevenue: 0,
    revenueByMethod: {},
    tips: 0,
    voids: 0,
  });
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [openingFloat, setOpeningFloat] = useState("");
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [showQrCode, setShowQrCode] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitType, setSplitType] = useState<"equal" | "items">("equal");
  const [splitCount, setSplitCount] = useState("2");
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeTableOne, setMergeTableOne] = useState("");
  const [mergeTableTwo, setMergeTableTwo] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");

  // Calculated values
  const filteredItems = useMemo(
    () =>
      selectedCategory === "All"
        ? MENU_ITEMS
        : MENU_ITEMS.filter((item) => item.category === selectedCategory),
    [selectedCategory]
  );

  const subtotal = useMemo(() => {
    return orderTicket.items.reduce((sum, item) => {
      let itemPrice = item.menuItem.price * item.quantity;
      if (item.selectedModifiers) {
        Object.entries(item.selectedModifiers).forEach(([modId, optionName]) => {
          const mod = item.menuItem.modifiers?.find((m) => m.id === modId);
          const option = mod?.options.find((o) => o.name === optionName);
          if (option) itemPrice += option.price * item.quantity;
        });
      }
      return sum + itemPrice;
    }, 0);
  }, [orderTicket.items]);

  const discountAmount_calc = useMemo(() => {
    if (discountType === "percentage") {
      return Math.round((subtotal * orderTicket.discount) / 100);
    }
    return orderTicket.discount;
  }, [subtotal, orderTicket.discount, discountType]);

  const taxAmount = useMemo(() => {
    return Math.round((subtotal - discountAmount_calc) * 0.16);
  }, [subtotal, discountAmount_calc]);

  const total = useMemo(() => {
    return subtotal - discountAmount_calc + taxAmount;
  }, [subtotal, discountAmount_calc, taxAmount]);

  // Handlers
  const handleSelectCategory = useCallback((cat: string) => {
    setSelectedCategory(cat);
  }, []);

  const handleAddItem = useCallback((item: MenuItem) => {
    if (item.modifiers && item.modifiers.length > 0) {
      setSelectedMenuItem(item);
      setSelectedModifiers({});
      setShowModifierSheet(true);
    } else {
      const newItem: OrderItem = {
        id: `${item.id}-${Date.now()}`,
        menuItem: item,
        quantity: 1,
        selectedModifiers: {},
        notes: "",
      };
      setOrderTicket((prev) => ({
        ...prev,
        items: [...prev.items, newItem],
      }));
    }
  }, []);

  const handleConfirmModifiers = useCallback(() => {
    if (!selectedMenuItem) return;
    const newItem: OrderItem = {
      id: `${selectedMenuItem.id}-${Date.now()}`,
      menuItem: selectedMenuItem,
      quantity: 1,
      selectedModifiers,
      notes: "",
    };
    setOrderTicket((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
    setShowModifierSheet(false);
    setSelectedMenuItem(null);
    setSelectedModifiers({});
  }, [selectedMenuItem, selectedModifiers]);

  const handleUpdateQuantity = useCallback((id: string, delta: number) => {
    setOrderTicket((prev) => ({
      ...prev,
      items: prev.items
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
        )
        .filter((item) => item.quantity > 0),
    }));
  }, []);

  const handleRemoveItem = useCallback((id: string) => {
    setOrderTicket((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  }, []);

  const handleApplyDiscount = useCallback(() => {
    const amount = parseFloat(discountAmount) || 0;
    setOrderTicket((prev) => ({
      ...prev,
      discount: amount,
      discountType,
    }));
    setDiscountAmount("");
  }, [discountAmount, discountType]);

  const handleProcessPayment = useCallback(() => {
    let record: PaymentRecord = {
      method: paymentMethod,
      amount: total,
      timestamp: new Date(),
    };

    if (paymentMethod === "cash") {
      record.reference = `Cash: ${cashTendered} tendered`;
    } else if (paymentMethod === "card") {
      record.reference = `Card ending in ${cardLastFour}`;
    } else if (paymentMethod === "wallet") {
      record.reference = `Wallet: ${walletPhone}`;
    }

    setPaymentRecord(record);
    setShiftData((prev) => ({
      ...prev,
      orderCount: prev.orderCount + 1,
      totalRevenue: prev.totalRevenue + total,
      revenueByMethod: {
        ...prev.revenueByMethod,
        [paymentMethod]: (prev.revenueByMethod[paymentMethod] || 0) + total,
      },
    }));
    setShowPaymentModal(false);
    setShowReceipt(true);
  }, [paymentMethod, cashTendered, cardLastFour, walletPhone, total]);

  const handlePrintReceipt = useCallback(() => {
    window.print();
  }, []);

  const handleOpenShift = useCallback(() => {
    const float = parseFloat(openingFloat) || 0;
    setShiftData((prev) => ({
      ...prev,
      isOpen: true,
      openedAt: new Date(),
      openingFloat: float,
    }));
    setOpeningFloat("");
    setShowShiftModal(false);
  }, [openingFloat]);

  const handleCloseShift = useCallback(() => {
    setShiftData((prev) => ({
      ...prev,
      isOpen: false,
      closedAt: new Date(),
    }));
    setShowShiftModal(false);
  }, []);

  const handleClearOrder = useCallback(() => {
    setOrderTicket({
      id: `ORD-${Date.now()}`,
      items: [],
      pax: 1,
      discount: 0,
      discountType: "percentage",
      specialInstructions: "",
      createdAt: new Date(),
    });
    setSelectedTable(null);
    setCustomerName("");
    setCustomerPhone("");
  }, []);

  const handleUpdatePax = useCallback((delta: number) => {
    setOrderTicket((prev) => ({
      ...prev,
      pax: Math.max(1, prev.pax + delta),
    }));
  }, []);

  const handleSetMode = useCallback((newMode: typeof mode) => {
    setMode(newMode);
    handleClearOrder();
  }, [handleClearOrder]);

  const getModeIcon = (m: typeof mode) => {
    switch (m) {
      case "counter":
        return <UtensilsCrossed className="w-4 h-4" />;
      case "dine-in":
        return <ChefHat className="w-4 h-4" />;
      case "takeaway":
        return <ShoppingBag className="w-4 h-4" />;
      case "delivery":
        return <Bike className="w-4 h-4" />;
      case "qr":
        return <QrCode className="w-4 h-4" />;
      case "split":
        return <SplitSquareVertical className="w-4 h-4" />;
      case "merge":
        return <Merge className="w-4 h-4" />;
    }
  };

  const getModeLabel = (m: typeof mode) => {
    switch (m) {
      case "counter":
        return "Counter";
      case "dine-in":
        return "Dine-In";
      case "takeaway":
        return "Takeaway";
      case "delivery":
        return "Delivery";
      case "qr":
        return "QR Order";
      case "split":
        return "Split Bill";
      case "merge":
        return "Merge Tables";
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-card/80 to-card/60 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">Restaurant POS</h1>
          </div>

          {/* Mode Selector */}
          <div className="flex gap-2">
            {(["counter", "dine-in", "takeaway", "delivery", "qr", "split", "merge"] as const).map(
              (m) => (
                <Button
                  key={m}
                  size="sm"
                  variant={mode === m ? "default" : "ghost"}
                  onClick={() => handleSetMode(m)}
                  className="gap-2"
                >
                  {getModeIcon(m)}
                  <span className="hidden sm:inline text-xs">{getModeLabel(m)}</span>
                </Button>
              )
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Shift Status */}
          <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium">
              {shiftData.isOpen ? "Shift Open" : "Shift Closed"}
            </span>
          </div>

          {/* Shift Modal Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowShiftModal(true)}
            className="gap-2"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Shift</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 gap-4 p-4 overflow-hidden">
        {/* Left Sidebar - Category Navigation */}
        <div className="w-32 bg-card/40 backdrop-blur rounded-2xl border border-white/10 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 p-2">
            <div className="space-y-1">
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat}
                  size="sm"
                  variant={selectedCategory === cat ? "default" : "ghost"}
                  onClick={() => handleSelectCategory(cat)}
                  className="w-full justify-start text-xs font-medium"
                >
                  {cat}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Center - Menu Grid */}
        <div className="flex-1 bg-card/40 backdrop-blur rounded-2xl border border-white/10 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-white/10">
            <h2 className="text-lg font-semibold">{selectedCategory}</h2>
            <p className="text-xs text-muted-foreground">{filteredItems.length} items</p>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 grid grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleAddItem(item)}
                  className="group relative p-4 rounded-2xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 hover:border-primary/50 hover:scale-[1.02] transition-all duration-200 text-left"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-3xl">{item.emoji}</span>
                    {item.tags.includes("popular") && (
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    )}
                  </div>
                  <h3 className="font-semibold text-sm line-clamp-2">{item.name}</h3>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                    <span className="text-xs font-medium text-primary">KES {item.price}</span>
                    {item.tags.length > 0 && (
                      <div className="flex gap-1">
                        {item.tags.slice(0, 1).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs py-0 h-5">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Right Sidebar - Order Ticket */}
        <div className="w-80 bg-card/40 backdrop-blur rounded-2xl border border-white/10 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-white/10 bg-gradient-to-r from-primary/10 to-transparent">
            <h2 className="font-semibold flex items-center gap-2">
              <Hash className="w-4 h-4" />
              Order {orderTicket.id.split("-")[1]?.slice(-4)}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(orderTicket.createdAt).toLocaleTimeString()}
            </p>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-3 space-y-3">
              {/* Pax Counter */}
              <div className="bg-white/5 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Covers</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleUpdatePax(-1)}
                    className="h-6 w-6 p-0"
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="w-6 text-center font-medium text-sm">{orderTicket.pax}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleUpdatePax(1)}
                    className="h-6 w-6 p-0"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Table/Customer Info */}
              {mode === "dine-in" && (
                <div className="bg-white/5 rounded-lg p-3">
                  <Label className="text-xs mb-2 block">Table</Label>
                  <select
                    value={selectedTable || ""}
                    onChange={(e) => {
                      setSelectedTable(e.target.value);
                      setOrderTicket((prev) => ({
                        ...prev,
                        tableNumber: e.target.value,
                      }));
                    }}
                    className="w-full rounded-lg bg-white/10 border border-white/20 px-2 py-2 text-sm text-foreground"
                  >
                    <option value="">Select table</option>
                    {TABLES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(mode === "takeaway" || mode === "delivery") && (
                <div className="space-y-2 bg-white/5 rounded-lg p-3">
                  <div>
                    <Label className="text-xs mb-1 block">Customer Name</Label>
                    <Input
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        setOrderTicket((prev) => ({
                          ...prev,
                          customerName: e.target.value,
                        }));
                      }}
                      placeholder="Name"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Phone</Label>
                    <Input
                      value={customerPhone}
                      onChange={(e) => {
                        setCustomerPhone(e.target.value);
                        setOrderTicket((prev) => ({
                          ...prev,
                          customerPhone: e.target.value,
                        }));
                      }}
                      placeholder="Phone"
                      className="h-8 text-xs"
                    />
                  </div>
                  {mode === "takeaway" && (
                    <div>
                      <Label className="text-xs mb-1 block">Pickup Time</Label>
                      <Input
                        type="time"
                        value={pickupTime}
                        onChange={(e) => setPickupTime(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  )}
                  {mode === "delivery" && (
                    <div>
                      <Label className="text-xs mb-1 block">Delivery Address</Label>
                      <Input
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Address"
                        className="h-8 text-xs"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Order Items */}
              {orderTicket.items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No items added</p>
                </div>
              ) : (
                orderTicket.items.map((item) => (
                  <div key={item.id} className="bg-white/5 rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.menuItem.name}</p>
                        {Object.keys(item.selectedModifiers).length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {Object.entries(item.selectedModifiers)
                              .map(([_, opt]) => opt)
                              .join(", ")}
                          </p>
                        )}
                        {item.notes && (
                          <p className="text-xs text-amber-400/80 mt-1 italic">
                            Note: {item.notes}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveItem(item.id)}
                        className="h-6 w-6 p-0 flex-shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUpdateQuantity(item.id, -1)}
                          className="h-5 w-5 p-0"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <Badge variant="secondary" className="w-6 text-center h-5 text-xs">
                          {item.quantity}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUpdateQuantity(item.id, 1)}
                          className="h-5 w-5 p-0"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <span className="text-sm font-semibold text-primary">
                        KES{" "}
                        {Math.round(
                          (item.menuItem.price +
                            Object.entries(item.selectedModifiers).reduce(
                              (sum, [modId, optionName]) => {
                                const mod = item.menuItem.modifiers?.find(
                                  (m) => m.id === modId
                                );
                                const option = mod?.options.find(
                                  (o) => o.name === optionName
                                );
                                return sum + (option?.price || 0);
                              },
                              0
                            )) *
                            item.quantity
                        )}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Order Summary */}
          <div className="border-t border-white/10 p-4 bg-card/60 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>KES {subtotal}</span>
            </div>
            {discountAmount_calc > 0 && (
              <div className="flex justify-between text-sm text-green-400">
                <span>Discount</span>
                <span>-KES {discountAmount_calc}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax (16%)</span>
              <span>KES {taxAmount}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">KES {total}</span>
            </div>

            {/* Discount Input */}
            {!discountAmount_calc && (
              <div className="space-y-2 pt-2">
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    placeholder="Discount amount"
                    className="h-8 text-xs flex-1"
                  />
                  <select
                    value={discountType}
                    onChange={(e) =>
                      setDiscountType(e.target.value as "percentage" | "fixed")
                    }
                    className="h-8 rounded-lg bg-white/10 border border-white/20 px-2 text-xs text-foreground"
                  >
                    <option value="percentage">%</option>
                    <option value="fixed">Fixed</option>
                  </select>
                  <Button
                    size="sm"
                    onClick={handleApplyDiscount}
                    className="h-8 px-2 text-xs"
                  >
                    Apply
                  </Button>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleClearOrder}
                className="flex-1 text-xs h-8"
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                onClick={() => setShowPaymentModal(true)}
                disabled={orderTicket.items.length === 0}
                className="flex-1 text-xs h-8"
              >
                Pay
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modifier Sheet */}
      <Sheet open={showModifierSheet} onOpenChange={setShowModifierSheet}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <span className="text-3xl">{selectedMenuItem?.emoji}</span>
              {selectedMenuItem?.name}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4 max-h-96 overflow-y-auto">
            {selectedMenuItem?.modifiers?.map((mod) => (
              <div key={mod.id} className="space-y-2">
                <Label className="text-base font-semibold">{mod.name}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {mod.options.map((option) => (
                    <Button
                      key={option.name}
                      variant={selectedModifiers[mod.id] === option.name ? "default" : "outline"}
                      onClick={() =>
                        setSelectedModifiers((prev) => ({
                          ...prev,
                          [mod.id]: option.name,
                        }))
                      }
                      className="justify-start h-auto py-3 flex-col items-start"
                    >
                      <span className="font-medium text-sm">{option.name}</span>
                      {option.price > 0 && (
                        <span className="text-xs text-muted-foreground">+KES {option.price}</span>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowModifierSheet(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmModifiers} className="flex-1">
              Add to Order
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>Payment - KES {total}</DialogTitle>
          </DialogHeader>

          <Tabs
            value={paymentMethod}
            onValueChange={(v) => setPaymentMethod(v as typeof paymentMethod)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="cash" className="gap-2">
                <Banknote className="w-4 h-4" />
                <span className="hidden sm:inline">Cash</span>
              </TabsTrigger>
              <TabsTrigger value="card" className="gap-2">
                <CreditCard className="w-4 h-4" />
                <span className="hidden sm:inline">Card</span>
              </TabsTrigger>
              <TabsTrigger value="wallet" className="gap-2">
                <Smartphone className="w-4 h-4" />
                <span className="hidden sm:inline">Wallet</span>
              </TabsTrigger>
              <TabsTrigger value="split" className="gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Split</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="cash" className="space-y-4 mt-4">
              <div>
                <Label>Amount Tendered</Label>
                <Input
                  type="number"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  placeholder="Enter amount"
                  className="mt-2"
                />
              </div>
              {cashTendered && parseFloat(cashTendered) > 0 && (
                <div className="bg-primary/10 rounded-lg p-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Total Amount</span>
                    <span>KES {total}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg text-primary">
                    <span>Change</span>
                    <span>
                      KES{" "}
                      {Math.max(
                        0,
                        Math.round(parseFloat(cashTendered) - total)
                      )}
                    </span>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="card" className="space-y-4 mt-4">
              <div>
                <Label>Card Last 4 Digits</Label>
                <Input
                  type="text"
                  value={cardLastFour}
                  onChange={(e) => setCardLastFour(e.target.value.slice(0, 4))}
                  placeholder="1234"
                  maxLength={4}
                  className="mt-2"
                />
              </div>
              <div className="bg-blue-500/10 rounded-lg p-4 text-sm">
                Amount to charge: <span className="font-bold">KES {total}</span>
              </div>
            </TabsContent>

            <TabsContent value="wallet" className="space-y-4 mt-4">
              <div>
                <Label>Phone Number / Wallet ID</Label>
                <Input
                  type="text"
                  value={walletPhone}
                  onChange={(e) => setWalletPhone(e.target.value)}
                  placeholder="0712345678"
                  className="mt-2"
                />
              </div>
              <div className="bg-green-500/10 rounded-lg p-4 text-sm">
                Amount to send: <span className="font-bold">KES {total}</span>
              </div>
            </TabsContent>

            <TabsContent value="split" className="space-y-4 mt-4">
              <div>
                <Label>Split Type</Label>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant={splitType === "equal" ? "default" : "outline"}
                    onClick={() => setSplitType("equal")}
                    className="flex-1"
                  >
                    Equal Split
                  </Button>
                  <Button
                    variant={splitType === "items" ? "default" : "outline"}
                    onClick={() => setSplitType("items")}
                    className="flex-1"
                  >
                    By Items
                  </Button>
                </div>
              </div>
              {splitType === "equal" && (
                <div>
                  <Label>Number of Splits</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      type="number"
                      value={splitCount}
                      onChange={(e) => setSplitCount(e.target.value)}
                      min="2"
                      className="flex-1"
                    />
                    <div className="bg-primary/10 rounded-lg px-4 py-2 flex items-center">
                      <span className="font-bold">KES {Math.round(total / parseInt(splitCount || "1"))}</span>
                    </div>
                  </div>
                </div>
              )}
              {splitType === "items" && (
                <div className="bg-amber-500/10 rounded-lg p-4 text-sm">
                  <p className="font-medium mb-2">Items in order:</p>
                  <ul className="space-y-1 text-xs">
                    {orderTicket.items.map((item) => (
                      <li key={item.id} className="flex justify-between">
                        <span>{item.menuItem.name}</span>
                        <span>KES {Math.round((item.menuItem.price * item.quantity) / parseInt(splitCount || "1"))}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowPaymentModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button onClick={handleProcessPayment} className="flex-1">
              <Check className="w-4 h-4 mr-2" />
              Confirm Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Modal */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md rounded-2xl font-mono text-sm">
          <DialogHeader>
            <DialogTitle>Order Receipt</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-4 text-xs">
            <div className="text-center border-b border-dashed border-white/30 pb-3">
              <p className="font-bold text-base">RESTAURANT POS</p>
              <p className="text-muted-foreground mt-1">Order {orderTicket.id}</p>
              <p className="text-muted-foreground">
                {new Date(orderTicket.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="border-b border-dashed border-white/30 pb-3 space-y-1">
              {orderTicket.items.map((item) => (
                <div key={item.id}>
                  <div className="flex justify-between">
                    <span>{item.menuItem.name}</span>
                    <span>x{item.quantity}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>
                      KES{" "}
                      {Math.round(
                        (item.menuItem.price +
                          Object.entries(item.selectedModifiers).reduce(
                            (sum, [modId, optionName]) => {
                              const mod = item.menuItem.modifiers?.find(
                                (m) => m.id === modId
                              );
                              const option = mod?.options.find(
                                (o) => o.name === optionName
                              );
                              return sum + (option?.price || 0);
                            },
                            0
                          )) *
                          item.quantity
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-1 border-b border-dashed border-white/30 pb-3">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>KES {subtotal}</span>
              </div>
              {discountAmount_calc > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>Discount</span>
                  <span>-KES {discountAmount_calc}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tax (16%)</span>
                <span>KES {taxAmount}</span>
              </div>
            </div>

            <div className="flex justify-between font-bold text-base pt-2">
              <span>TOTAL</span>
              <span>KES {total}</span>
            </div>

            {paymentRecord && (
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-muted-foreground mb-1">Payment Method</p>
                <p className="font-semibold text-foreground">{paymentRecord.method.toUpperCase()}</p>
                {paymentRecord.reference && (
                  <p className="text-muted-foreground text-xs mt-1">{paymentRecord.reference}</p>
                )}
              </div>
            )}

            <div className="text-center text-muted-foreground pt-2">
              <p>Thank you for your order!</p>
              <p className="mt-1">Please visit again</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintReceipt}
              className="flex-1 gap-2"
            >
              <Printer className="w-4 h-4" />
              Print
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setShowReceipt(false);
                handleClearOrder();
              }}
              className="flex-1"
            >
              New Order
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Shift Modal */}
      <Dialog open={showShiftModal} onOpenChange={setShowShiftModal}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>Shift Management</DialogTitle>
          </DialogHeader>

          {!shiftData.isOpen ? (
            <div className="space-y-4">
              <div>
                <Label>Opening Float (Cash)</Label>
                <Input
                  type="number"
                  value={openingFloat}
                  onChange={(e) => setOpeningFloat(e.target.value)}
                  placeholder="Enter opening float amount"
                  className="mt-2"
                />
              </div>
              <Button onClick={handleOpenShift} className="w-full">
                Open Shift
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-500/10 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Shift Active
                </h3>
                <p className="text-sm text-muted-foreground">
                  Started: {shiftData.openedAt?.toLocaleTimeString()}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-card/60 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Orders</p>
                  <p className="text-2xl font-bold text-primary">{shiftData.orderCount}</p>
                </div>
                <div className="bg-card/60 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-400">
                    KES {shiftData.totalRevenue}
                  </p>
                </div>
                <div className="bg-card/60 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Tips</p>
                  <p className="text-2xl font-bold">KES {shiftData.tips}</p>
                </div>
                <div className="bg-card/60 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Voids</p>
                  <p className="text-2xl font-bold text-red-400">{shiftData.voids}</p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <p className="text-sm font-semibold">Revenue by Method</p>
                <div className="space-y-1 text-sm">
                  {Object.entries(shiftData.revenueByMethod).map(([method, amount]) => (
                    <div key={method} className="flex justify-between">
                      <span className="text-muted-foreground capitalize">{method}</span>
                      <span className="font-medium">KES {amount}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={handleCloseShift} variant="destructive" className="w-full">
                Close Shift
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
