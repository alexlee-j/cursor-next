import { cn } from "@/lib/utils";

interface DashboardShellProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function DashboardShell({
  children,
  className,
  ...props
}: DashboardShellProps) {
  return (
    <div
      className={cn(
        "flex-1 space-y-4 md:space-y-6 p-1 sm:p-2 md:p-8 pt-0.5 sm:pt-2 md:pt-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
