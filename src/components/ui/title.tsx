import * as React from "react";
import { cn } from "../../lib/utils";

export interface TitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  variant?: 'default' | 'primary' | 'secondary' | 'muted';
}

const Title = React.forwardRef<HTMLHeadingElement, TitleProps>(
  ({ className, as = 'h2', variant = 'default', children, ...props }, ref) => {
    const Component = as;
    
    return (
      <Component
        className={cn(
          "font-semibold leading-tight tracking-tight",
          variant === 'default' && "text-gray-900",
          variant === 'primary' && "text-primary",
          variant === 'secondary' && "text-secondary",
          variant === 'muted' && "text-gray-500",
          as === 'h1' && "text-4xl md:text-5xl",
          as === 'h2' && "text-3xl md:text-4xl",
          as === 'h3' && "text-2xl md:text-3xl",
          as === 'h4' && "text-xl md:text-2xl",
          as === 'h5' && "text-lg md:text-xl",
          as === 'h6' && "text-base md:text-lg",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Title.displayName = "Title";

export { Title };