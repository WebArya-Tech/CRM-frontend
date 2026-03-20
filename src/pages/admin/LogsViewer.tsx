import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateTime } from "@/lib/crmUtils";
import { logAPI } from "@/lib/api";
import { LogEntry } from "@/types/types";

export default function LogsViewer() {
  const [dateFilter, setDateFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all-users");

  const [allLogs, setAllLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        setError(null);

        const filters: Record<string, any> = {};
        if (actionFilter !== "all") filters.actionType = actionFilter;
        if (roleFilter !== "all") filters.actorRole = roleFilter;

        if (dateFilter) {
          const fromDate = new Date(`${dateFilter}T00:00:00.000Z`).toISOString();
          const toDate = new Date(`${dateFilter}T23:59:59.999Z`).toISOString();
          filters.fromDate = fromDate;
          filters.toDate = toDate;
        }

        const resp = await logAPI.getAll(1, 500, filters);
        setAllLogs(resp.data || []);
      } catch (e) {
        console.error("Failed to fetch logs:", e);
        setError("Failed to load logs. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [dateFilter, actionFilter, roleFilter]);

  const filteredLogs = useMemo(() => {
    return allLogs.filter((log) => {
      if (userFilter !== "all-users" && !log.actorUserId.includes(userFilter)) return false;
      return true;
    });
  }, [allLogs, userFilter]);

  const exportLogsToCSV = (logs: LogEntry[]): string => {
    const headers = [
      "Log ID",
      "Timestamp",
      "Actor User ID",
      "Actor Role",
      "Action Type",
      "Object Type",
      "Object ID",
      "Remarks",
    ];

    const rows = logs.map((log) => [
      log.logId,
      log.timestamp,
      log.actorUserId,
      log.actorRole,
      log.actionType,
      log.objectType,
      log.objectId,
      log.remarks || "",
    ]);

    // return [headers.join(","), ...rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))].join("\n");
    return [headers.join(","), ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))].join("\n");
  };

  const handleExportCSV = () => {
    const csv = exportLogsToCSV(filteredLogs);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `logs-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const uniqueUsers = [...new Set(allLogs.map((l) => l.actorUserId))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Activity Logs</h1>
          <p className="text-muted-foreground">
            Read-only audit trail of all system actions
          </p>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </div>
        <Button
          onClick={handleExportCSV}
          variant="outline"
          className="gap-2"
          disabled={loading || filteredLogs.length === 0}
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <Label className="text-xs font-semibold uppercase text-muted-foreground">
            Date
          </Label>
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="mt-1.5"
          />
        </div>

        <div>
          <Label className="text-xs font-semibold uppercase text-muted-foreground">
            Action
          </Label>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="CREATE">Create</SelectItem>
              <SelectItem value="UPDATE">Update</SelectItem>
              <SelectItem value="DELETE">Delete</SelectItem>
              <SelectItem value="LOGIN">Login</SelectItem>
              <SelectItem value="NOTIFICATION">Notification</SelectItem>
              <SelectItem value="EXPORT">Export</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs font-semibold uppercase text-muted-foreground">
            Role
          </Label>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="Admin">Admin</SelectItem>
              <SelectItem value="Teacher">Teacher</SelectItem>
              <SelectItem value="Student">Student</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs font-semibold uppercase text-muted-foreground">
            User ID
          </Label>
          <Select value={userFilter} onValueChange={setUserFilter}>
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="All Users" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-users">All Users</SelectItem>
              {uniqueUsers.map((user) => (
                <SelectItem key={user} value={user}>
                  {user}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-card border border-border/50 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-muted-foreground">
                  Timestamp
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-muted-foreground">
                  Action
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-muted-foreground">
                  Object Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-muted-foreground">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-muted-foreground">
                  Object ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-muted-foreground">
                  Remarks
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLogs.map((log) => (
                <tr key={log.logId} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 text-xs text-muted-foreground font-mono whitespace-nowrap">
                    {formatDateTime(log.timestamp)}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                        log.actionType === "CREATE"
                          ? "bg-green-100/50 text-green-800"
                          : log.actionType === "UPDATE"
                            ? "bg-blue-100/50 text-blue-800"
                            : log.actionType === "DELETE"
                              ? "bg-red-100/50 text-red-800"
                              : "bg-gray-100/50 text-gray-800"
                      }`}
                    >
                      {log.actionType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-card-foreground">
                    {log.objectType}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {log.actorUserId}
                    <span className="block text-xs text-muted-foreground/70">
                      {log.actorRole}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground font-mono">
                    {log.objectId}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs">
                    {log.remarks || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && filteredLogs.length === 0 && (
          <div className="px-6 py-12 text-center text-muted-foreground">
            No logs found matching the selected filters
          </div>
        )}
      </div>

      <div className="text-xs text-muted-foreground">
        Showing {filteredLogs.length} of {allLogs.length} total logs
      </div>
    </div>
  );
}
