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
        <h1 className="font-['Bangers'] text-3xl tracking-wide text-[var(--fg)]">THINGS I OWN — RECALL RADAR</h1>
        <p className="text-xs text-[var(--subtext)] font-sans">Register physical electronics, appliances, and cars to auto-check against CPSC & NHTSA recall databases</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-[var(--sv-yellow)]" /> Registered Items
            </CardTitle>
            <Badge variant="warning">0 RECALLS</Badge>
          </div>
          <CardDescription>Items registered for real-time safety matching</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Input placeholder="Product Brand & Model (e.g. Anker PowerBank 537 / Tesla Model 3)" className="flex-1" />
            <Button variant="yellow" size="default">Register Item</Button>
          </div>

          <div className="border-2 border-[var(--card-border)] p-4 text-center bg-[var(--input-bg)] shadow-[3px_3px_0_var(--shadow-color)] rounded">
            <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="font-['Archivo_Black'] text-sm text-[var(--card-text)] uppercase">All Registered Items Clear</p>
            <p className="text-xs text-[var(--subtext)] mt-1">Cross-referencing CPSC & NHTSA federal databases</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
