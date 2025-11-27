import * as React from "react";
import { cn } from "../../lib/utils";

export interface SubtitleProps extends React.HTMLAttributes<HTMLParagraphElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'muted';
  size?: 'sm' | 'md' | 'lg';
}

const Subtitle = React.forwardRef<HTMLParagraphElement, SubtitleProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    return (
      <p
        className={cn(
          "leading-relaxed",
          variant === 'default' && "text-gray-600",
          variant === 'primary' && "text-primary/80",
          variant === 'secondary' && "text-secondary/80",
          variant === 'muted' && "text-gray-500",
          size === 'sm' && "text-sm",
          size === 'md' && "text-base md:text-lg",
          size === 'lg' && "text-lg md:text-xl",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </p>
    );
  }
);

Subtitle.displayName = "Subtitle";

export { Subtitle };