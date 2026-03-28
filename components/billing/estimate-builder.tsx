"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EstimateItemRow, EstimateItemData } from "./estimate-item-row";
import { Plus, Loader2, Send, Save } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Project {
  id: string;
  title: string;
  clientId: string;
  client: {
    email: string;
  };
}

interface EstimateBuilderProps {
  projects: Project[];
  onSuccess?: () => void;
}

export function EstimateBuilder({ projects, onSuccess }: EstimateBuilderProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [validDays, setValidDays] = useState("30");
  const [items, setItems] = useState<EstimateItemData[]>([
    { description: "", quantity: 1, unitPrice: 0, amount: 0 },
  ]);

  const selectedProject = projects.find((p) => p.id === projectId);

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  const handleItemChange = (
    index: number,
    field: keyof EstimateItemData,
    value: string | number
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleAddItem = () => {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0, amount: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleSave = async (send: boolean = false) => {
    if (!projectId || !title || items.length === 0) return;

    const validItems = items.filter((item) => item.description && item.amount > 0);
    if (validItems.length === 0) return;

    setIsSaving(true);
    if (send) setIsSending(true);

    try {
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + parseInt(validDays));

      const response = await fetch("/api/estimates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          title,
          description: description || null,
          validUntil: validUntil.toISOString(),
          items: validItems,
          sendToClient: send,
        }),
      });

      if (response.ok) {
        router.refresh();
        onSuccess?.();
      }
    } catch (error) {
      console.error("Failed to create estimate:", error);
    } finally {
      setIsSaving(false);
      setIsSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Estimate</CardTitle>
        <CardDescription>
          Build a detailed estimate for your client
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Project</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Valid For</Label>
            <Select value={validDays} onValueChange={setValidDays}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="60">60 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedProject && (
          <div className="text-sm text-muted-foreground">
            Client: {selectedProject.client.email}
          </div>
        )}

        <div className="space-y-2">
          <Label>Estimate Title</Label>
          <Input
            placeholder="e.g., Website Development - Phase 1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Description (optional)</Label>
          <Textarea
            placeholder="Additional details about this estimate..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[80px]"
          />
        </div>

        {/* Line Items */}
        <div className="space-y-3">
          <Label>Line Items</Label>
          <div className="rounded-lg border p-4 space-y-3">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground border-b pb-2">
              <div className="col-span-5">Description</div>
              <div className="col-span-2 text-right">Qty</div>
              <div className="col-span-2 text-right">Unit Price</div>
              <div className="col-span-2 text-right">Amount</div>
              <div className="col-span-1"></div>
            </div>

            {/* Items */}
            {items.map((item, index) => (
              <EstimateItemRow
                key={index}
                item={item}
                index={index}
                onChange={handleItemChange}
                onRemove={handleRemoveItem}
              />
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddItem}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Line Item
            </Button>
          </div>
        </div>

        {/* Total */}
        <div className="flex justify-end">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Total Amount</div>
            <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={isSaving || !projectId || !title}
          >
            {isSaving && !isSending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save as Draft
          </Button>
          <Button
            onClick={() => handleSave(true)}
            disabled={isSending || !projectId || !title}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Save & Send to Client
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
