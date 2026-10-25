import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-9.5 w-full min-w-0 rounded-xl border border-neutral-200/90 bg-white px-3 py-1.5 text-sm text-neutral-900 placeholder:text-neutral-400 shadow-2xs transition-[border-color,box-shadow,background-color] duration-150 ease-out outline-none hover:border-neutral-300 focus-visible:border-neutral-950 focus-visible:ring-3 focus-visible:ring-neutral-950/10 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-100 dark:hover:border-neutral-700 dark:focus-visible:border-white dark:focus-visible:ring-white/10",
        className
      )}
      {...props}
    />
  )
}

export { Input }
