import { cn } from "@/lib/utils";

type Status = "Active" | "Paused" | "Completed" | "Inactive" | "Scheduled" | "Cancelled" | "Postponed" | "CREATE" | "UPDATE" | "DELETE";

const statusStyles: Record<string, string> = {
  Active: "bg-success/10 text-success border-success/20",
  Scheduled: "bg-info/10 text-info border-info/20",
  Completed: "bg-primary/10 text-primary border-primary/20",
  Paused: "bg-warning/10 text-warning border-warning/20",
  Postponed: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Inactive: "bg-muted text-muted-foreground border-border",
  Cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  CREATE: "bg-success/10 text-success border-success/20",
  UPDATE: "bg-info/10 text-info border-info/20",
  DELETE: "bg-destructive/10 text-destructive border-destructive/20",
};

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", statusStyles[status] || "bg-muted text-muted-foreground", className)}>
      {status}
    </span>
  );
}
