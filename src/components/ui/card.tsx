import * as React from "react"

import { cn } from "../../lib/utils"
import { useTheme } from "../../contexts/ThemeContext"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  let isHighContrast = false;
  try {
    const theme = useTheme();
    isHighContrast = theme.isHighContrast;
  } catch {
    // useTheme is not available, use default value
  }
  
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm dashboard-card",
        isHighContrast && "hc-card",
        className
      )}
      {...props}
    />
  );
})
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("dashboard-card-header", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => {
  let isHighContrast = false;
  try {
    const theme = useTheme();
    isHighContrast = theme.isHighContrast;
  } catch {
    // useTheme is not available, use default value
  }
  
  return (
    <h3
      ref={ref}
      className={cn(
        "dashboard-card-title dashboard-heading",
        isHighContrast && "text-black",
        className
      )}
      {...props}
    />
  );
})
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  let isHighContrast = false;
  try {
    const theme = useTheme();
    isHighContrast = theme.isHighContrast;
  } catch {
    // useTheme is not available, use default value
  }
  
  return (
    <p
      ref={ref}
      className={cn(
        "text-sm text-muted-foreground dashboard-subheading",
        isHighContrast && "text-black opacity-70",
        className
      )}
      {...props}
    />
  );
})
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("dashboard-card-content", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }