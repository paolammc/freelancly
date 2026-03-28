"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Zap, CheckCircle, Printer } from "lucide-react";

interface ReceiptProps {
  receipt: {
    receiptNumber: string;
    issuedAt: string;
  };
  payment: {
    amount: number;
    method: string | null;
    paidAt: string | null;
  };
  estimate: {
    title: string;
    items: {
      description: string;
      quantity: number;
      unitPrice: number;
      amount: number;
    }[];
  };
  freelancer: {
    name: string;
    email: string;
    title?: string;
  };
  client: {
    email: string;
  };
  project: {
    title: string;
  };
}

export function ReceiptGenerator({
  receipt,
  payment,
  estimate,
  freelancer,
  client,
  project,
}: ReceiptProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end print:hidden">
        <Button onClick={handlePrint} variant="outline">
          <Printer className="h-4 w-4 mr-2" />
          Print Receipt
        </Button>
      </div>

      <Card className="print:shadow-none print:border-0">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Freelancly</h2>
                <p className="text-sm text-muted-foreground">{freelancer.name}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-green-600 font-medium">
                <CheckCircle className="h-5 w-5" />
                PAID
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Receipt #{receipt.receiptNumber}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center py-4 bg-green-50 rounded-lg">
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(Number(payment.amount))}
            </p>
            <p className="text-sm text-green-600/80">Payment Received</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium mb-1">
                From
              </p>
              <p className="font-medium">{freelancer.name}</p>
              {freelancer.title && (
                <p className="text-sm text-muted-foreground">{freelancer.title}</p>
              )}
              <p className="text-sm text-muted-foreground">{freelancer.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium mb-1">
                To
              </p>
              <p className="font-medium">{client.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium mb-1">
                Payment Date
              </p>
              <p>
                {payment.paidAt
                  ? formatDate(new Date(payment.paidAt))
                  : formatDate(new Date(receipt.issuedAt))}
              </p>
            </div>
            {payment.method && (
              <div>
                <p className="text-xs text-muted-foreground uppercase font-medium mb-1">
                  Payment Method
                </p>
                <p className="capitalize">{payment.method}</p>
              </div>
            )}
          </div>

          <div>
            <p className="text-xs text-muted-foreground uppercase font-medium mb-1">
              Project
            </p>
            <p>{project.title}</p>
          </div>

          <Separator />

          <div>
            <h3 className="font-medium mb-3">{estimate.title}</h3>
            <div className="space-y-2">
              {estimate.items.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between text-sm py-1"
                >
                  <span>
                    {item.description}{" "}
                    <span className="text-muted-foreground">
                      x{item.quantity}
                    </span>
                  </span>
                  <span>{formatCurrency(Number(item.amount))}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="flex justify-between text-lg font-bold">
            <span>Total Paid</span>
            <span className="text-green-600">
              {formatCurrency(Number(payment.amount))}
            </span>
          </div>

          <div className="text-center text-sm text-muted-foreground pt-4">
            <p>Thank you for your payment!</p>
            <p>Receipt issued on {formatDate(new Date(receipt.issuedAt))}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
