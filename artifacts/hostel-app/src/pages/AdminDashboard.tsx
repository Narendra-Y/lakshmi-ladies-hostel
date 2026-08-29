import { useState, useEffect, useRef } from "react";
import { useLocation, Link, Redirect } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  useListRegistrations,
  useGetRegistrationStats,
  useUpdateRegistrationStatus,
  useDeleteRegistration,
  useGetQrCode,
  getListRegistrationsQueryKey,
  getGetRegistrationStatsQueryKey,
  getGetQrCodeQueryKey,
} from "@workspace/api-client-react";
import type { Registration } from "@workspace/api-client-react";
import {
  LogOut, Search, Download, FileText, QrCode, Check, X, Trash2, Eye,
  Users, Clock, CheckCircle2, XCircle, ChevronLeft, ChevronRight,
  Loader2, Sun, Moon, AlertTriangle, Phone, Mail, MapPin, Calendar,
  Briefcase, Shield, User, Home, Bell, Building2, BarChart3, CalendarClock,
} from "lucide-react";
import { getStoredTheme, applyTheme, type Theme } from "../App";
import RoomsTab from "../components/RoomsTab";
import RemindersTab from "../components/RemindersTab";
import { resolveUploadUrl } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
  approved: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
  rejected: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
};

function RegistrationDetail({ reg }: { reg: Registration }) {
  const rows: { icon: React.ElementType; label: string; value: string | null | undefined }[] = [
    { icon: Phone, label: "Mobile", value: reg.mobileNumber },
    { icon: Calendar, label: "Date of Birth", value: reg.dateOfBirth },
    { icon: Mail, label: "Email", value: reg.email },
    { icon: User, label: "Gender", value: reg.gender },
    { icon: Briefcase, label: "Profession", value: reg.profession },
    { icon: Shield, label: "Guardian", value: reg.guardianName },
    { icon: Phone, label: "Guardian Mobile", value: reg.guardianMobile },
    { icon: MapPin, label: "Address", value: reg.address },
    { icon: Calendar, label: "Registered", value: new Date(reg.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) },
  ];

  return (
    <div className="space-y-4">
      {reg.photoUrl && (
        <div className="flex justify-center">
          <img src={resolveUploadUrl(reg.photoUrl)} alt="Photo" className="w-24 h-24 rounded-full object-cover border-4 border-primary/20 shadow-md" />
        </div>
      )}
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border mx-auto block text-center w-fit ${STATUS_COLORS[reg.status]}`}>
        {reg.status.toUpperCase()}
      </div>
      <div className="space-y-2">
        {rows.map(({ icon: Icon, label, value }) =>
          value ? (
            <div key={label} className="flex gap-3 items-start py-2 border-b border-border/50 last:border-0">
              <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm text-foreground font-medium capitalize break-words">{value}</p>
              </div>
            </div>
          ) : null
        )}
      </div>
      {reg.notes && (
        <div className="bg-muted/50 rounded-xl p-3">
          <p className="text-xs text-muted-foreground mb-1">Notes</p>
          <p className="text-sm text-foreground">{reg.notes}</p>
        </div>
      )}
      {reg.idProofUrl && (
        <a
          href={resolveUploadUrl(reg.idProofUrl)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-primary text-sm underline underline-offset-2"
        >
          <Eye className="w-4 h-4" /> View ID Proof
        </a>
      )}
    </div>
  );
}

function useAdminGuard() {
  const [, setLocation] = useLocation();
  const token = localStorage.getItem("hostel_admin_token");
  useEffect(() => {
    if (!token) setLocation("/admin/login");
  }, [token, setLocation]);
  return !!token;
}

function SkeletonCard() {
  return (
    <div className="bg-card border border-card-border rounded-2xl p-5 shadow-sm animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-3 w-16 bg-muted rounded" />
          <div className="h-8 w-12 bg-muted rounded" />
        </div>
        <div className="w-10 h-10 rounded-xl bg-muted" />
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-border">
      {[...Array(6)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-muted rounded animate-pulse" style={{ width: `${60 + i * 10}%` }} />
        </td>
      ))}
    </tr>
  );
}

function StatCard({ label, value, icon: Icon, color, isLoading }: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  isLoading?: boolean;
}) {
  if (isLoading) return <SkeletonCard />;
  return (
    <div className="bg-card border border-card-border rounded-2xl p-5 shadow-sm" data-testid={`stat-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{label}</p>
          <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: "destructive" | "default";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({ open, title, description, confirmLabel = "Confirm", variant = "destructive", loading, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${variant === "destructive" ? "bg-destructive/10" : "bg-primary/10"}`}>
              <AlertTriangle className={`w-5 h-5 ${variant === "destructive" ? "text-destructive" : "text-primary"}`} />
            </div>
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel} disabled={loading} className="flex-1">Cancel</Button>
          <Button
            variant={variant}
            onClick={onConfirm}
            disabled={loading}
            className="flex-1"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAuthed = useAdminGuard();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [theme, setTheme] = useState<Theme>(getStoredTheme);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [newRegCount, setNewRegCount] = useState(0);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "rooms" | "reminders">("overview");
  const prevTotalRef = useRef<number | null>(null);
  const notifInitialized = useRef(false);

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    localStorage.setItem("hostel_theme", next);
  };

  const params = {
    search: search || undefined,
    status: statusFilter !== "all" ? (statusFilter as "pending" | "approved" | "rejected") : undefined,
    page,
    limit: 15,
  };

  const { data: regs, isLoading: regsLoading, error: regsError } = useListRegistrations(params, {
    query: { queryKey: getListRegistrationsQueryKey(params), enabled: isAuthed },
  });
  const { data: stats, isLoading: statsLoading, error: statsError } = useGetRegistrationStats({
    query: { queryKey: getGetRegistrationStatsQueryKey(), enabled: isAuthed, refetchInterval: 30000 },
  });

  // If token is invalid or expired (401), clear token and redirect to login
  useEffect(() => {
    const err = (regsError || statsError) as any;
    if (err && (err.status === 401 || err.status === 403)) {
      localStorage.removeItem("hostel_admin_token");
      setLocation("/admin/login");
    }
  }, [regsError, statsError, setLocation]);

  // Notification: detect new registrations while admin is on dashboard
  useEffect(() => {
    if (!stats) return;
    const current = stats.total;
    if (!notifInitialized.current) {
      prevTotalRef.current = current;
      notifInitialized.current = true;
      return;
    }
    if (prevTotalRef.current !== null && current > prevTotalRef.current) {
      const diff = current - prevTotalRef.current;
      setNewRegCount((n) => n + diff);
      toast({
        title: `🔔 New Registration${diff > 1 ? "s" : ""}`,
        description: `${diff} new registration${diff > 1 ? "s" : ""} received! Review ${diff > 1 ? "them" : "it"} in the dashboard.`,
      });
      queryClient.invalidateQueries({ queryKey: getListRegistrationsQueryKey() });
    }
    prevTotalRef.current = current;
  }, [stats?.total]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: qrData } = useGetQrCode({
    query: { enabled: showQr && isAuthed, queryKey: getGetQrCodeQueryKey() },
  });

  const updateStatus = useUpdateRegistrationStatus();
  const deleteReg = useDeleteRegistration();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListRegistrationsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetRegistrationStatsQueryKey() });
  };

  const handleStatus = (id: number, status: "approved" | "rejected") => {
    updateStatus.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          toast({ title: `Registration ${status}`, description: `The registration has been ${status}.` });
          invalidate();
          if (selectedReg?.id === id) setSelectedReg(null);
        },
        onError: () => toast({ title: "Error", description: "Failed to update status.", variant: "destructive" }),
      }
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteReg.mutate(
      { id: deleteTarget.id },
      {
        onSuccess: () => {
          toast({ title: "Deleted", description: "Registration deleted successfully." });
          invalidate();
          if (selectedReg?.id === deleteTarget.id) setSelectedReg(null);
          setDeleteTarget(null);
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
          setDeleteTarget(null);
        },
      }
    );
  };

  const handleLogout = () => {
    localStorage.removeItem("hostel_admin_token");
    setLocation("/admin/login");
  };

  const exportCSV = () => {
    if (!regs?.data?.length) return;
    const headers = ["ID", "Name", "Mobile", "DOB", "Email", "Gender", "Profession", "Guardian", "Guardian Mobile", "Address", "Status", "Date"];
    const rows = regs.data.map((r) => [
      r.id, r.fullName, r.mobileNumber, r.dateOfBirth, r.email ?? "", r.gender,
      r.profession, r.guardianName, r.guardianMobile, r.address, r.status,
      new Date(r.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `registrations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    if (!regs?.data?.length) return;
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text("Lakshmi Ladies Hostel — Registrations", 14, 15);
    doc.setFontSize(9);
    doc.setTextColor(120, 80, 100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 21);
    autoTable(doc, {
      startY: 26,
      head: [["#", "Name", "Mobile", "DOB", "Gender", "Profession", "Status", "Date"]],
      body: regs.data.map((r, i) => [
        i + 1, r.fullName, r.mobileNumber, r.dateOfBirth, r.gender, r.profession, r.status,
        new Date(r.createdAt).toLocaleDateString(),
      ]),
      headStyles: { fillColor: [130, 40, 80] },
      alternateRowStyles: { fillColor: [252, 248, 250] },
      styles: { fontSize: 8, cellPadding: 3 },
    });
    doc.save(`registrations-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const downloadQr = () => {
    if (!qrData?.qrCode) return;
    const a = document.createElement("a");
    a.href = qrData.qrCode;
    a.download = "lakshmi-ladies-hostel-qr.png";
    a.click();
  };

  if (!isAuthed) return <Redirect to="/admin/login" />;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <span className="text-primary-foreground text-xs font-bold">L</span>
            </div>
            <div className="hidden sm:block min-w-0">
              <p className="font-serif font-semibold text-foreground text-sm leading-none truncate">Lakshmi Ladies Hostel</p>
              <p className="text-xs text-muted-foreground">Admin Dashboard</p>
            </div>
            <div className="sm:hidden">
              <p className="font-serif font-semibold text-foreground text-sm">Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => { setShowNotifPanel((v) => !v); setNewRegCount(0); }}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground relative"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {newRegCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                    {newRegCount > 9 ? "9+" : newRegCount}
                  </span>
                )}
              </button>
              {showNotifPanel && (
                <div className="absolute right-0 top-10 w-72 bg-card border border-card-border rounded-2xl shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">Notifications</p>
                    <button onClick={() => setShowNotifPanel(false)} className="text-muted-foreground hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="px-4 py-4 text-sm text-muted-foreground">
                    {newRegCount > 0 ? (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Bell className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-foreground font-medium">New Registrations</p>
                          <p className="text-xs mt-0.5">{newRegCount} new registration{newRegCount > 1 ? "s" : ""} arrived while you were active.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p>No new notifications</p>
                        <p className="text-xs mt-1">Auto-checks every 30 seconds</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
              title="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Return to Home */}
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hidden sm:flex" title="Return to Home">
                <Home className="w-4 h-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Home</span>
              </Button>
            </Link>

            {/* Logout */}
            <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="btn-logout" className="text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
        {/* Tab Navigation */}
        <div className="flex gap-1 bg-muted/50 p-1 rounded-xl border border-border">
          {(
            [
              { id: "overview", label: "Overview", Icon: BarChart3 },
              { id: "rooms", label: "Rooms", Icon: Building2 },
              { id: "reminders", label: "Reminders", Icon: CalendarClock },
            ] as const
          ).map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === id
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {activeTab === "overview" && (<>
        {/* Primary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard label="Total" value={stats?.total ?? 0} icon={Users} color="bg-primary/10 text-primary" isLoading={statsLoading} />
          <StatCard label="Pending" value={stats?.pending ?? 0} icon={Clock} color="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" isLoading={statsLoading} />
          <StatCard label="Approved" value={stats?.approved ?? 0} icon={CheckCircle2} color="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" isLoading={statsLoading} />
          <StatCard label="Rejected" value={stats?.rejected ?? 0} icon={XCircle} color="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" isLoading={statsLoading} />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {statsLoading
            ? [1, 2, 3].map((i) => (
                <div key={i} className="bg-card border border-card-border rounded-xl p-4 text-center animate-pulse">
                  <div className="h-7 w-8 bg-muted rounded mx-auto mb-1" />
                  <div className="h-3 w-16 bg-muted rounded mx-auto" />
                </div>
              ))
            : [
                { label: "Today", value: stats?.todayCount ?? 0 },
                { label: "This Week", value: stats?.thisWeekCount ?? 0 },
                { label: "This Month", value: stats?.thisMonthCount ?? 0 },
              ].map((s) => (
                <div key={s.label} className="bg-card border border-card-border rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={exportCSV} data-testid="btn-export-csv" className="rounded-lg">
              <FileText className="w-4 h-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">CSV</span>
            </Button>
            <Button variant="outline" size="sm" onClick={exportPDF} data-testid="btn-export-pdf" className="rounded-lg">
              <Download className="w-4 h-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Export PDF</span>
              <span className="sm:hidden">PDF</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowQr(true)} data-testid="btn-show-qr" className="rounded-lg">
              <QrCode className="w-4 h-4 sm:mr-1.5" />
              <span className="hidden sm:inline">QR Code</span>
              <span className="sm:hidden">QR</span>
            </Button>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                data-testid="input-search"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search name, mobile..."
                className="pl-9 rounded-lg"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-28 sm:w-32 rounded-lg" data-testid="select-status-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table — desktop */}
        <div className="bg-card border border-card-border rounded-2xl overflow-hidden shadow-sm hidden sm:block">
          {regsLoading ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {["#", "Name", "Mobile", "Profession", "Status", "Date", "Actions"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
                </tbody>
              </table>
            </div>
          ) : regsError ? (
            <div className="text-center py-16 bg-card rounded-2xl p-8 border border-card-border">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>
              <p className="font-semibold text-foreground text-base mb-1">Server is connecting...</p>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
                The server may be waking up from sleep. Click retry below to reload data.
              </p>
              <Button onClick={() => invalidate()} size="sm" className="gap-2">
                <RefreshCw className="w-4 h-4" /> Retry Connection
              </Button>
            </div>
          ) : !regs?.data?.length ? (
            <div className="text-center py-20 text-muted-foreground">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 opacity-40" />
              </div>
              <p className="font-medium text-foreground mb-1">No registrations found</p>
              <p className="text-sm">{search || statusFilter !== "all" ? "Try adjusting your search or filter." : "New registrations will appear here."}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="registrations-table">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">#</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Mobile</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Profession</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Date</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {regs.data.map((reg, idx) => (
                    <tr key={reg.id} className="hover:bg-muted/30 transition-colors group" data-testid={`row-registration-${reg.id}`}>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{(page - 1) * 15 + idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {reg.photoUrl ? (
                            <img src={resolveUploadUrl(reg.photoUrl)} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 ring-2 ring-border" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <span className="text-primary text-xs font-semibold">{reg.fullName[0]?.toUpperCase()}</span>
                            </div>
                          )}
                          <span className="font-medium text-foreground">{reg.fullName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{reg.mobileNumber}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{reg.profession}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[reg.status]}`}>
                          {reg.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">
                        {new Date(reg.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setSelectedReg(reg)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground" data-testid={`btn-view-${reg.id}`} title="View">
                            <Eye className="w-4 h-4" />
                          </button>
                          {reg.status !== "approved" && (
                            <button onClick={() => handleStatus(reg.id, "approved")} className="p-1.5 rounded-lg hover:bg-emerald-50 transition-colors text-emerald-600" data-testid={`btn-approve-${reg.id}`} title="Approve">
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          {reg.status !== "rejected" && (
                            <button onClick={() => handleStatus(reg.id, "rejected")} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-red-500" data-testid={`btn-reject-${reg.id}`} title="Reject">
                              <X className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => setDeleteTarget({ id: reg.id, name: reg.fullName })} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-red-400" data-testid={`btn-delete-${reg.id}`} title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {regs && regs.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-sm text-muted-foreground">
                {(page - 1) * 15 + 1}–{Math.min(page * 15, regs.total)} of {regs.total}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page <= 1} data-testid="btn-prev-page">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= regs.totalPages} data-testid="btn-next-page">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Card layout — mobile */}
        <div className="sm:hidden space-y-3">
          {regsLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="bg-card border border-card-border rounded-xl p-4 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-muted" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded w-32" />
                    <div className="h-3 bg-muted rounded w-24" />
                  </div>
                  <div className="h-5 w-16 bg-muted rounded-full" />
                </div>
              </div>
            ))
          ) : !regs?.data?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium text-foreground">No registrations found</p>
              <p className="text-sm mt-1">{search || statusFilter !== "all" ? "Try adjusting filters." : "New registrations will appear here."}</p>
            </div>
          ) : (
            regs.data.map((reg) => (
              <div key={reg.id} className="bg-card border border-card-border rounded-xl p-4 shadow-sm" data-testid={`row-registration-${reg.id}`}>
                <div className="flex items-start gap-3">
                  {reg.photoUrl ? (
                    <img src={resolveUploadUrl(reg.photoUrl)} alt="" className="w-11 h-11 rounded-full object-cover shrink-0 ring-2 ring-border" />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-primary text-sm font-semibold">{reg.fullName[0]?.toUpperCase()}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className="font-semibold text-foreground truncate">{reg.fullName}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border shrink-0 ${STATUS_COLORS[reg.status]}`}>
                        {reg.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">{reg.mobileNumber}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{reg.profession}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border">
                  <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs" onClick={() => setSelectedReg(reg)}>
                    <Eye className="w-3.5 h-3.5 mr-1" /> View
                  </Button>
                  {reg.status !== "approved" && (
                    <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700" onClick={() => handleStatus(reg.id, "approved")}>
                      <Check className="w-3.5 h-3.5 mr-1" /> Approve
                    </Button>
                  )}
                  {reg.status !== "rejected" && (
                    <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => handleStatus(reg.id, "rejected")}>
                      <X className="w-3.5 h-3.5 mr-1" /> Reject
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400 hover:bg-red-50" onClick={() => setDeleteTarget({ id: reg.id, name: reg.fullName })}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
          {regs && regs.totalPages > 1 && (
            <div className="flex items-center justify-between py-2">
              <p className="text-xs text-muted-foreground">{(page - 1) * 15 + 1}–{Math.min(page * 15, regs.total)} of {regs.total}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}><ChevronLeft className="w-4 h-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= regs.totalPages}><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </div>
        </>)}
        {activeTab === "rooms" && <RoomsTab />}
        {activeTab === "reminders" && <RemindersTab />}
      </div>

      {/* Registration Detail Dialog */}
      <Dialog open={!!selectedReg} onOpenChange={() => setSelectedReg(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg">{selectedReg?.fullName}</DialogTitle>
          </DialogHeader>
          {selectedReg && <RegistrationDetail reg={selectedReg} />}
          {selectedReg && (
            <div className="flex gap-2 pt-4 border-t border-border mt-2">
              {selectedReg.status !== "approved" && (
                <Button size="sm" className="flex-1 rounded-lg" onClick={() => { handleStatus(selectedReg.id, "approved"); setSelectedReg(null); }} data-testid="btn-detail-approve">
                  <Check className="w-4 h-4 mr-1" /> Approve
                </Button>
              )}
              {selectedReg.status !== "rejected" && (
                <Button size="sm" variant="outline" className="flex-1 rounded-lg border-red-200 text-red-600 hover:bg-red-50" onClick={() => { handleStatus(selectedReg.id, "rejected"); setSelectedReg(null); }} data-testid="btn-detail-reject">
                  <X className="w-4 h-4 mr-1" /> Reject
                </Button>
              )}
              <Button size="sm" variant="destructive" className="rounded-lg" onClick={() => { setDeleteTarget({ id: selectedReg.id, name: selectedReg.fullName }); setSelectedReg(null); }} data-testid="btn-detail-delete">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={showQr} onOpenChange={setShowQr}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="font-serif">Registration QR Code</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Scan to open the registration form directly</p>
          {qrData?.qrCode ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <img src={qrData.qrCode} alt="QR Code" className="w-56 h-56 rounded-2xl border border-border shadow-sm" data-testid="img-qr-code" />
              </div>
              <p className="text-xs text-muted-foreground break-all bg-muted rounded-lg px-3 py-2">{qrData.registrationUrl}</p>
              <Button onClick={downloadQr} className="w-full rounded-xl" data-testid="btn-download-qr">
                <Download className="w-4 h-4 mr-2" /> Download QR as PNG
              </Button>
            </div>
          ) : (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Registration"
        description={`Are you sure you want to permanently delete the registration for "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteReg.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
