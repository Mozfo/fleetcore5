/**
 * QuoteItemsEditor - Line items editor for quotes
 *
 * Features:
 * - Add/edit/remove line items inline
 * - Item types: plan, addon, service, custom
 * - Recurrence: one_time, recurring
 * - Line discount per item
 * - Sortable (drag & drop ready - simplified without dnd-kit)
 */

"use client";

import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Trash2,
  GripVertical,
  Package,
  Wrench,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select-native";
import { cn } from "@/lib/utils";

export interface QuoteLineItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  item_type: "plan" | "addon" | "service" | "custom";
  recurrence: "one_time" | "recurring";
  line_discount_percent?: number;
  total_price: number;
}

interface QuoteItemsEditorProps {
  items: QuoteLineItem[];
  currency: string;
  onChange: (items: QuoteLineItem[]) => void;
}

const ITEM_TYPES = [
  { value: "plan", label: "Plan", icon: Package },
  { value: "addon", label: "Add-on", icon: Plus },
  { value: "service", label: "Service", icon: Wrench },
  { value: "custom", label: "Custom", icon: FileText },
] as const;

const RECURRENCE_TYPES = [
  { value: "recurring", label: "Recurring" },
  { value: "one_time", label: "One-time" },
] as const;

function calculateItemTotal(item: Omit<QuoteLineItem, "total_price">): number {
  const subtotal = item.quantity * item.unit_price;
  if (item.line_discount_percent && item.line_discount_percent > 0) {
    return subtotal * (1 - item.line_discount_percent / 100);
  }
  return subtotal;
}

export function QuoteItemsEditor({
  items,
  currency,
  onChange,
}: QuoteItemsEditorProps) {
  const { t } = useTranslation("crm");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Add new item
  const handleAddItem = useCallback(() => {
    const newItem: QuoteLineItem = {
      description: "",
      quantity: 1,
      unit_price: 0,
      item_type: "service",
      recurrence: "recurring",
      total_price: 0,
    };
    onChange([...items, newItem]);
    setEditingIndex(items.length);
  }, [items, onChange]);

  // Update item
  const handleUpdateItem = useCallback(
    (index: number, updates: Partial<Omit<QuoteLineItem, "total_price">>) => {
      const updatedItems = items.map((item, i) => {
        if (i === index) {
          const updated = { ...item, ...updates };
          return {
            ...updated,
            total_price: calculateItemTotal(updated),
          };
        }
        return item;
      });
      onChange(updatedItems);
    },
    [items, onChange]
  );

  // Remove item
  const handleRemoveItem = useCallback(
    (index: number) => {
      const updatedItems = items.filter((_, i) => i !== index);
      onChange(updatedItems);
      if (editingIndex === index) {
        setEditingIndex(null);
      }
    },
    [items, onChange, editingIndex]
  );

  // Move item up/down (simple reordering)
  const handleMoveItem = useCallback(
    (index: number, direction: "up" | "down") => {
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= items.length) return;

      const updatedItems = [...items];
      [updatedItems[index], updatedItems[newIndex]] = [
        updatedItems[newIndex],
        updatedItems[index],
      ];
      onChange(updatedItems);
    },
    [items, onChange]
  );

  const getItemTypeIcon = (type: QuoteLineItem["item_type"]) => {
    const itemType = ITEM_TYPES.find((t) => t.value === type);
    return itemType?.icon || Package;
  };

  return (
    <div className="space-y-4">
      {/* Items list */}
      {items.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-200 p-6 text-center dark:border-gray-800">
          <Package className="mx-auto h-10 w-10 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {t("quotes.items.empty", "No line items yet")}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 gap-2"
            onClick={handleAddItem}
          >
            <Plus className="h-4 w-4" />
            {t("quotes.items.add_first", "Add First Item")}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => {
            const Icon = getItemTypeIcon(item.item_type);
            const isEditing = editingIndex === index;

            return (
              <div
                key={item.id || index}
                className={cn(
                  "rounded-lg border border-gray-200 p-4 transition-colors dark:border-gray-800",
                  isEditing && "ring-2 ring-blue-500"
                )}
              >
                {isEditing ? (
                  // Editing mode
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* Description */}
                      <div className="sm:col-span-2">
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {t("quotes.items.description", "Description")}
                        </label>
                        <Input
                          value={item.description}
                          onChange={(e) =>
                            handleUpdateItem(index, {
                              description: e.target.value,
                            })
                          }
                          placeholder={t(
                            "quotes.items.description_placeholder",
                            "Item description..."
                          )}
                          className="mt-1"
                          autoFocus
                        />
                      </div>

                      {/* Item Type */}
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {t("quotes.items.type", "Type")}
                        </label>
                        <Select
                          value={item.item_type}
                          onChange={(e) =>
                            handleUpdateItem(index, {
                              item_type: e.target
                                .value as QuoteLineItem["item_type"],
                            })
                          }
                          className="mt-1"
                        >
                          {ITEM_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                              {t(`quotes.items.type_${type.value}`, type.label)}
                            </option>
                          ))}
                        </Select>
                      </div>

                      {/* Recurrence */}
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {t("quotes.items.recurrence", "Recurrence")}
                        </label>
                        <Select
                          value={item.recurrence}
                          onChange={(e) =>
                            handleUpdateItem(index, {
                              recurrence: e.target
                                .value as QuoteLineItem["recurrence"],
                            })
                          }
                          className="mt-1"
                        >
                          {RECURRENCE_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                              {t(
                                `quotes.items.recurrence_${type.value}`,
                                type.label
                              )}
                            </option>
                          ))}
                        </Select>
                      </div>

                      {/* Quantity */}
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {t("quotes.items.quantity", "Quantity")}
                        </label>
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateItem(index, {
                              quantity: parseInt(e.target.value) || 1,
                            })
                          }
                          className="mt-1"
                        />
                      </div>

                      {/* Unit Price */}
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {t("quotes.items.unit_price", "Unit Price")}
                        </label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) =>
                            handleUpdateItem(index, {
                              unit_price: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="mt-1"
                        />
                      </div>

                      {/* Line Discount */}
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {t("quotes.items.line_discount", "Line Discount (%)")}
                        </label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step="0.01"
                          value={item.line_discount_percent || ""}
                          onChange={(e) =>
                            handleUpdateItem(index, {
                              line_discount_percent: e.target.value
                                ? parseFloat(e.target.value)
                                : undefined,
                            })
                          }
                          placeholder="0"
                          className="mt-1"
                        />
                      </div>

                      {/* Total */}
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {t("quotes.items.total", "Total")}
                        </label>
                        <p className="mt-2 text-lg font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(item.total_price)}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        {t("common.delete", "Delete")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setEditingIndex(null)}
                      >
                        {t("common.done", "Done")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Display mode
                  <div
                    className="flex cursor-pointer items-center gap-4"
                    onClick={() => setEditingIndex(index)}
                  >
                    {/* Drag handle */}
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveItem(index, "up");
                        }}
                        disabled={index === 0}
                      >
                        <GripVertical className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Icon */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                      <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-gray-900 dark:text-white">
                        {item.description ||
                          t("quotes.items.untitled", "Untitled item")}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>
                          {item.quantity} × {formatCurrency(item.unit_price)}
                        </span>
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 dark:bg-gray-800">
                          {t(
                            `quotes.items.type_${item.item_type}`,
                            item.item_type
                          )}
                        </span>
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5",
                            item.recurrence === "recurring"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                          )}
                        >
                          {t(
                            `quotes.items.recurrence_${item.recurrence}`,
                            item.recurrence
                          )}
                        </span>
                        {item.line_discount_percent &&
                          item.line_discount_percent > 0 && (
                            <span className="text-red-600 dark:text-red-400">
                              -{item.line_discount_percent}%
                            </span>
                          )}
                      </div>
                    </div>

                    {/* Total */}
                    <p className="shrink-0 font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(item.total_price)}
                    </p>

                    {/* Remove button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-gray-400 hover:text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveItem(index);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add item button */}
      {items.length > 0 && (
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2"
          onClick={handleAddItem}
        >
          <Plus className="h-4 w-4" />
          {t("quotes.items.add", "Add Line Item")}
        </Button>
      )}
    </div>
  );
}
