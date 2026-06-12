"use client";

import { useState } from "react";

import { Sidebar } from "@/components/layout/sidebar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type MobileNavProps = {
  trigger: React.ReactElement;
};

export function MobileNav({ trigger }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={trigger} />
      <SheetContent
        side="left"
        className="w-[85vw] max-w-xs border-r-2 border-foreground p-0 brutal-shadow"
        showCloseButton
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation</SheetTitle>
          <SheetDescription>Shelfi dashboard navigation</SheetDescription>
        </SheetHeader>
        <Sidebar onNavigate={() => setOpen(false)} className="w-full border-r-0" />
      </SheetContent>
    </Sheet>
  );
}
