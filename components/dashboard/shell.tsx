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
        "flex-1 space-y-4 md:space-y-6 p-4 md:p-8 pt-4 md:pt-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
