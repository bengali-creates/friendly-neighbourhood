"use client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Package, ShieldCheck, Search } from "lucide-react";

export default function InventoryPage() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-[var(--ink-primary)]">Things I Own — Recall Radar</h1>
        <p className="text-xs text-[var(--ink-secondary)] mt-0.5">Register physical electronics, appliances, and cars to auto-check against CPSC & NHTSA recall databases</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="w-4 h-4 text-[var(--watchful)]" /> Registered Items
            </CardTitle>
            <Badge variant="success">0 RECALLS</Badge>
          </div>
          <CardDescription>Items registered for real-time safety matching</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Input placeholder="Product Brand & Model (e.g. Anker PowerBank 537 / Tesla Model 3)" className="flex-1" />
            <Button variant="default" size="default">Register Item</Button>
          </div>

          <div className="border border-[var(--rim)] p-6 text-center bg-[var(--surface)]/40 rounded-[var(--radius-md)]">
            <ShieldCheck className="w-8 h-8 text-[var(--clear)] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[var(--ink-primary)]">All Registered Items Clear</p>
            <p className="text-xs text-[var(--ink-secondary)] mt-1">Cross-referencing CPSC & NHTSA federal databases</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
