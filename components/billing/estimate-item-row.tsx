"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export interface EstimateItemData {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface EstimateItemRowProps {
  item: EstimateItemData;
  index: number;
  onChange: (index: number, field: keyof EstimateItemData, value: string | number) => void;
  onRemove: (index: number) => void;
  readOnly?: boolean;
}

export function EstimateItemRow({
  item,
  index,
  onChange,
  onRemove,
  readOnly = false,
}: EstimateItemRowProps) {
  const handleQuantityChange = (value: string) => {
    const qty = parseFloat(value) || 0;
    onChange(index, "quantity", qty);
    onChange(index, "amount", qty * item.unitPrice);
  };

  const handleUnitPriceChange = (value: string) => {
    const price = parseFloat(value) || 0;
    onChange(index, "unitPrice", price);
    onChange(index, "amount", item.quantity * price);
  };

  if (readOnly) {
    return (
      <div className="grid grid-cols-12 gap-2 items-center py-2 border-b last:border-0">
        <div className="col-span-5 text-sm">{item.description}</div>
        <div className="col-span-2 text-sm text-right">{item.quantity}</div>
        <div className="col-span-2 text-sm text-right">
          ${item.unitPrice.toFixed(2)}
        </div>
        <div className="col-span-3 text-sm text-right font-medium">
          ${item.amount.toFixed(2)}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-2 items-center">
      <div className="col-span-5">
        <Input
          placeholder="Item description"
          value={item.description}
          onChange={(e) => onChange(index, "description", e.target.value)}
          className="text-sm"
        />
      </div>
      <div className="col-span-2">
        <Input
          type="number"
          min="0"
          step="0.5"
          placeholder="Qty"
          value={item.quantity || ""}
          onChange={(e) => handleQuantityChange(e.target.value)}
          className="text-sm text-right"
        />
      </div>
      <div className="col-span-2">
        <Input
          type="number"
          min="0"
          step="0.01"
          placeholder="Price"
          value={item.unitPrice || ""}
          onChange={(e) => handleUnitPriceChange(e.target.value)}
          className="text-sm text-right"
        />
      </div>
      <div className="col-span-2 text-right font-medium text-sm">
        ${item.amount.toFixed(2)}
      </div>
      <div className="col-span-1 flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onRemove(index)}
        >
          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
        </Button>
      </div>
    </div>
  );
}
