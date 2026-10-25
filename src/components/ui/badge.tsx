import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5.5 w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full border px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap tabular-nums transition-[background-color,border-color,color] duration-150 ease-out select-none [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "bg-neutral-900 text-white border-neutral-800 shadow-2xs dark:bg-white dark:text-neutral-950 dark:border-neutral-100",
        secondary:
          "bg-lime-50 text-lime-900 border-lime-300/80 dark:bg-lime-950/40 dark:text-lime-300 dark:border-lime-800/60",
        outline:
          "bg-white text-neutral-700 border-neutral-200/90 shadow-2xs dark:bg-neutral-900 dark:text-neutral-300 dark:border-neutral-800",
        destructive:
          "bg-red-50 text-red-700 border-red-200/80 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/60",
        warning:
          "bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60",
        neutral:
          "bg-neutral-100 text-neutral-700 border-neutral-200/80 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700",
        ghost:
          "border-transparent text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:text-neutral-300",
        link: "border-transparent text-neutral-950 underline-offset-4 hover:underline p-0",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
