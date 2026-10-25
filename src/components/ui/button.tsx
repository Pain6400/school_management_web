import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-xl border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-[transform,background-color,border-color,box-shadow,opacity] duration-150 ease-out outline-none select-none cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-950 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-neutral-950 text-white shadow-[0_1px_2px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.16)] hover:bg-neutral-800 hover:shadow-sm active:shadow-none dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200",
        outline:
          "border-neutral-200 bg-white text-neutral-800 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-neutral-50 hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800",
        secondary:
          "bg-lime-400 text-neutral-950 shadow-[0_1px_2px_rgba(0,0,0,0.06)] hover:bg-lime-500 font-bold",
        subtle:
          "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 hover:text-neutral-900 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700",
        ghost:
          "hover:bg-neutral-100 text-neutral-600 hover:text-neutral-950 dark:hover:bg-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100",
        destructive:
          "bg-red-50 text-red-600 border border-red-200/80 hover:bg-red-100/90 active:bg-red-100 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/60",
        link: "text-neutral-950 underline-offset-4 hover:underline active:scale-100 p-0 h-auto font-medium",
      },
      size: {
        default: "h-9 gap-2 px-3.5",
        xs: "h-6.5 gap-1 rounded-lg px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-lg px-3 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 gap-2.5 rounded-xl px-5 text-base",
        icon: "size-9 rounded-xl",
        "icon-xs": "size-6.5 rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-lg [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
