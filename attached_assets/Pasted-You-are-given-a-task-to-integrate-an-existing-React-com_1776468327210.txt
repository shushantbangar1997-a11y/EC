You are given a task to integrate an existing React component in the codebase

The codebase should support:
- shadcn project structure  
- Tailwind CSS
- Typescript

If it doesn't, provide instructions on how to setup project via shadcn CLI, install Tailwind or Typescript.

Determine the default path for components and styles. 
If default path for components is not /components/ui, provide instructions on why it's important to create this folder
Copy-paste this component to /components/ui folder:
```tsx
slide-button.tsx
"use client"

import React, {
  forwardRef,
  useCallback,
  useMemo,
  useRef,
  useState,
  type JSX,
} from "react"
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type PanInfo,
} from "framer-motion"
import { Check, Loader2, SendHorizontal, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button, ButtonProps } from "@/components/ui/button"

const DRAG_CONSTRAINTS = { left: 0, right: 155 }
const DRAG_THRESHOLD = 0.9

const BUTTON_STATES = {
  initial: { width: "12rem" },
  completed: { width: "8rem" },
}

const ANIMATION_CONFIG = {
  spring: {
    type: "spring",
    stiffness: 400,
    damping: 40,
    mass: 0.8,
  },
}

type StatusIconProps = {
  status: string
}

const StatusIcon: React.FC<StatusIconProps> = ({ status }) => {
  const iconMap: Record<StatusIconProps["status"], JSX.Element> = useMemo(
    () => ({
      loading: <Loader2 className="animate-spin" size={20} />,
      success: <Check size={20} />,
      error: <X size={20} />,
    }),
    []
  )

  if (!iconMap[status]) return null

  return (
    <motion.div
      key={crypto.randomUUID()}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
    >
      {iconMap[status]}
    </motion.div>
  )
}

const useButtonStatus = (resolveTo: "success" | "error") => {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle")

  const handleSubmit = useCallback(() => {
    setStatus("loading")
    setTimeout(() => {
      setStatus(resolveTo)
    }, 2000)
  }, [resolveTo])

  return { status, handleSubmit }
}

const SlideButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => {
    const [isDragging, setIsDragging] = useState(false)
    const [completed, setCompleted] = useState(false)
    const dragHandleRef = useRef<HTMLDivElement | null>(null)
    const { status, handleSubmit } = useButtonStatus("success")

    const dragX = useMotionValue(0)
    const springX = useSpring(dragX, ANIMATION_CONFIG.spring)
    const dragProgress = useTransform(
      springX,
      [0, DRAG_CONSTRAINTS.right],
      [0, 1]
    )

    const handleDragStart = useCallback(() => {
      if (completed) return
      setIsDragging(true)
    }, [completed])

    const handleDragEnd = () => {
      if (completed) return
      setIsDragging(false)

      const progress = dragProgress.get()
      if (progress >= DRAG_THRESHOLD) {
        setCompleted(true)
        handleSubmit()
      } else {
        dragX.set(0)
      }
    }

    const handleDrag = (
      _event: MouseEvent | TouchEvent | PointerEvent,
      info: PanInfo
    ) => {
      if (completed) return
      const newX = Math.max(0, Math.min(info.offset.x, DRAG_CONSTRAINTS.right))
      dragX.set(newX)
    }

    const adjustedWidth = useTransform(springX, (x) => x + 10)

    return (
      <motion.div
        animate={completed ? BUTTON_STATES.completed : BUTTON_STATES.initial}
        transition={ANIMATION_CONFIG.spring}
        className="shadow-button-inset dark:shadow-button-inset-dark relative flex h-9 items-center justify-center rounded-full bg-gray-100"
      >
        {!completed && (
          <motion.div
            style={{
              width: adjustedWidth,
            }}
            className="absolute inset-y-0 left-0 z-0 rounded-full bg-accent"
          />
        )}
        <AnimatePresence key={crypto.randomUUID()}>
          {!completed && (
            <motion.div
              ref={dragHandleRef}
              drag="x"
              dragConstraints={DRAG_CONSTRAINTS}
              dragElastic={0.05}
              dragMomentum={false}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDrag={handleDrag}
              style={{ x: springX }}
              className="absolute -left-4 z-10 flex cursor-grab items-center justify-start active:cursor-grabbing"
            >
              <Button
                ref={ref}
                disabled={status === "loading"}
                {...props}
                size="icon"
                className={cn(
                  "shadow-button rounded-full drop-shadow-xl",
                  isDragging && "scale-105 transition-transform",
                  className
                )}
              >
                <SendHorizontal className="size-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence key={crypto.randomUUID()}>
          {completed && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Button
                ref={ref}
                disabled={status === "loading"}
                {...props}
                className={cn(
                  "size-full rounded-full transition-all duration-300",
                  className
                )}
              >
                <AnimatePresence key={crypto.randomUUID()} mode="wait">
                  <StatusIcon status={status} />
                </AnimatePresence>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }
)

SlideButton.displayName = "SlideButton"


demo.tsx
"use client"

import React, {
  forwardRef,
  useCallback,
  useMemo,
  useRef,
  useState,
  type JSX,
} from "react"
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type PanInfo,
} from "framer-motion"
import { Check, Loader2, SendHorizontal, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button, ButtonProps } from "@/components/ui/button"

const DRAG_CONSTRAINTS = { left: 0, right: 155 }
const DRAG_THRESHOLD = 0.9

const BUTTON_STATES = {
  initial: { width: "12rem" },
  completed: { width: "8rem" },
}

const ANIMATION_CONFIG = {
  spring: {
    type: "spring",
    stiffness: 400,
    damping: 40,
    mass: 0.8,
  },
}

type StatusIconProps = {
  status: string
}

const StatusIcon: React.FC<StatusIconProps> = ({ status }) => {
  const iconMap: Record<StatusIconProps["status"], JSX.Element> = useMemo(
    () => ({
      loading: <Loader2 className="animate-spin" size={20} />,
      success: <Check size={20} />,
      error: <X size={20} />,
    }),
    []
  )

  if (!iconMap[status]) return null

  return (
    <motion.div
      key={crypto.randomUUID()}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
    >
      {iconMap[status]}
    </motion.div>
  )
}

const useButtonStatus = (resolveTo: "success" | "error") => {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle")

  const handleSubmit = useCallback(() => {
    setStatus("loading")
    setTimeout(() => {
      setStatus(resolveTo)
    }, 2000)
  }, [resolveTo])

  return { status, handleSubmit }
}

const SlideButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => {
    const [isDragging, setIsDragging] = useState(false)
    const [completed, setCompleted] = useState(false)
    const dragHandleRef = useRef<HTMLDivElement | null>(null)
    const { status, handleSubmit } = useButtonStatus("success")

    const dragX = useMotionValue(0)
    const springX = useSpring(dragX, ANIMATION_CONFIG.spring)
    const dragProgress = useTransform(
      springX,
      [0, DRAG_CONSTRAINTS.right],
      [0, 1]
    )

    const handleDragStart = useCallback(() => {
      if (completed) return
      setIsDragging(true)
    }, [completed])

    const handleDragEnd = () => {
      if (completed) return
      setIsDragging(false)

      const progress = dragProgress.get()
      if (progress >= DRAG_THRESHOLD) {
        setCompleted(true)
        handleSubmit()
      } else {
        dragX.set(0)
      }
    }

    const handleDrag = (
      _event: MouseEvent | TouchEvent | PointerEvent,
      info: PanInfo
    ) => {
      if (completed) return
      const newX = Math.max(0, Math.min(info.offset.x, DRAG_CONSTRAINTS.right))
      dragX.set(newX)
    }

    const adjustedWidth = useTransform(springX, (x) => x + 10)

    return (
      <motion.div
        animate={completed ? BUTTON_STATES.completed : BUTTON_STATES.initial}
        transition={ANIMATION_CONFIG.spring}
        className="shadow-button-inset dark:shadow-button-inset-dark relative flex h-9 items-center justify-center rounded-full bg-gray-100"
      >
        {!completed && (
          <motion.div
            style={{
              width: adjustedWidth,
            }}
            className="absolute inset-y-0 left-0 z-0 rounded-full bg-accent"
          />
        )}
        <AnimatePresence key={crypto.randomUUID()}>
          {!completed && (
            <motion.div
              ref={dragHandleRef}
              drag="x"
              dragConstraints={DRAG_CONSTRAINTS}
              dragElastic={0.05}
              dragMomentum={false}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDrag={handleDrag}
              style={{ x: springX }}
              className="absolute -left-4 z-10 flex cursor-grab items-center justify-start active:cursor-grabbing"
            >
              <Button
                ref={ref}
                disabled={status === "loading"}
                {...props}
                size="icon"
                className={cn(
                  "shadow-button rounded-full drop-shadow-xl",
                  isDragging && "scale-105 transition-transform",
                  className
                )}
              >
                <SendHorizontal className="size-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence key={crypto.randomUUID()}>
          {completed && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Button
                ref={ref}
                disabled={status === "loading"}
                {...props}
                className={cn(
                  "size-full rounded-full transition-all duration-300",
                  className
                )}
              >
                <AnimatePresence key={crypto.randomUUID()} mode="wait">
                  <StatusIcon status={status} />
                </AnimatePresence>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }
)

SlideButton.displayName = "SlideButton"

const SlideButtonDemo = () => {
  return (
    <div className="flex justify-center p-4">
      <SlideButton />
    </div>
  )
}

export default SlideButtonDemo
```

Copy-paste these files for dependencies:
```tsx
shadcn/button
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }

```

Install NPM dependencies:
```bash
lucide-react, framer-motion, @radix-ui/react-slot, class-variance-authority
```

Implementation Guidelines
 1. Analyze the component structure and identify all required dependencies
 2. Review the component's argumens and state
 3. Identify any required context providers or hooks and install them
 4. Questions to Ask
 - What data/props will be passed to this component?
 - Are there any specific state management requirements?
 - Are there any required assets (images, icons, etc.)?
 - What is the expected responsive behavior?
 - What is the best place to use this component in the app?

Steps to integrate
 0. Copy paste all the code above in the correct directories
 1. Install external dependencies
 2. Fill image assets with Unsplash stock images you know exist
 3. Use lucide-react icons for svgs or logos if component requires them
