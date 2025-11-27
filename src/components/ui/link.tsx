import * as React from "react";
import { Link as RouterLink, LinkProps as RouterLinkProps } from "react-router-dom";
import { cn } from "../../lib/utils";

export interface LinkProps extends RouterLinkProps {
  variant?: 'default' | 'primary' | 'secondary' | 'muted' | 'underline' | 'nav';
  external?: boolean;
}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ className, variant = 'default', external = false, to, children, ...props }, ref) => {
    const linkClasses = cn(
      "transition-colors duration-200",
      variant === 'default' && "text-gray-700 hover:text-gray-900",
      variant === 'primary' && "text-primary hover:text-primary/80",
      variant === 'secondary' && "text-secondary hover:text-secondary/80",
      variant === 'muted' && "text-gray-500 hover:text-gray-700",
      variant === 'underline' && "text-gray-700 hover:text-gray-900 underline underline-offset-4",
      variant === 'nav' && "text-gray-600 hover:text-primary font-medium",
      className
    );

    if (external) {
      return (
        <a
          className={linkClasses}
          href={to.toString()}
          target="_blank"
          rel="noopener noreferrer"
          ref={ref}
          {...props}
        >
          {children}
        </a>
      );
    }

    return (
      <RouterLink
        className={linkClasses}
        to={to}
        ref={ref}
        {...props}
      >
        {children}
      </RouterLink>
    );
  }
);

Link.displayName = "Link";

export { Link };