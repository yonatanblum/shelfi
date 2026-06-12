"use client";

import { Toaster } from "@/components/ui/sonner";

type RootClientProvidersProps = {
  children: React.ReactNode;
};

export function RootClientProviders({ children }: RootClientProvidersProps) {
  return (
    <>
      {children}
      <Toaster richColors closeButton position="top-right" />
    </>
  );
}
