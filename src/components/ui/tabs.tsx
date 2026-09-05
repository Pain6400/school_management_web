"use client";

import * as React from "react";
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex flex-col gap-6 w-full",
        orientation === "vertical" && "flex-row",
        className
      )}
      {...props}
    />
  );
}

const tabsListVariants = cva(
  "inline-flex h-12 items-center justify-start rounded-2xl bg-neutral-100 p-1 text-neutral-500 border border-neutral-200/80 shadow-2xs gap-1 overflow-x-auto max-w-full",
  {
    variants: {
      variant: {
        default: "bg-neutral-100",
        line: "gap-2 bg-transparent border-b border-neutral-200 rounded-none p-0 h-auto",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function TabsList({
  className,
  variant = "default",
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer select-none",
        "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/50",
        "data-[active]:bg-white data-[active]:text-neutral-950 data-[active]:shadow-xs",
        "data-[selected]:bg-white data-[selected]:text-neutral-950 data-[selected]:shadow-xs",
        "aria-selected:bg-white aria-selected:text-neutral-950 aria-selected:shadow-xs",
        className
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("w-full outline-none focus-visible:outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
