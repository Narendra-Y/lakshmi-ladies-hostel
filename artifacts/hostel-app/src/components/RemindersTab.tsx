import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  useGetPaymentReminders,
  useUpdatePaymentStatus,
  getGetPaymentRemindersQueryKey,
  getListRegistrationsQueryKey,
} from "@workspace/api-client-react";
import type { ReminderItem } from "@workspace/api-client-react";
import {
  CalendarClock, Phone, Mail, CheckCircle2, AlertTriangle, Clock, IndentIncrease,
  Loader2, CalendarCheck, Zap, History, RefreshCw, Send, Check, ExternalLink,
} from "lucide-react";
import WhatsAppReminderDialog, { WhatsAppIcon } from "./WhatsAppReminderDialog";
import {
  sendTestWhatsAppReminder,
  triggerAutoReminders,
  fetchReminderLogs,
  type ReminderLogItem,
} from "@/lib/api-reminders";

function ReminderCard({
  item,
  onMarkPaid,
  onWhatsAppReminder,
}: {
  item: ReminderItem;
  onMarkPaid: (id: number) => void;
  onWhatsAppReminder: (item: ReminderItem) => void;
}) {
  const isOverdue = item.daysUntilDue < 0;
  const isToday = item.daysUntilDue === 0;

  return (
    <div className={`bg-card border rounded-xl p-4 sm:p-5 shadow-sm transition-all ${
      isOverdue
        ? "border-red-300 dark:border-red-800"
        : isToday
        ? "border-amber-300 dark:border-amber-700"
        : "border-card-border"
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="font-semibold text-foreground text-sm">{item.fullName}</p>
            {item.paymentStatus && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                item.paymentStatus === "paid"
                  ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : item.paymentStatus === "overdue"
                  ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400"
                  : "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400"
              }`}>
                {item.paymentStatus.toUpperCase()}
              </span>
            )}
          </div>
          <div className="space-y-1 mt-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Phone className="w-3 h-3 shrink-0" />
              <span>{item.mobileNumber}</span>
            </div>
            {item.email && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="w-3 h-3 shrink-0" />
                <span className="truncate">{item.email}</span>
              </div>
            )}
            {item.joiningDate && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarCheck className="w-3 h-3 shrink-0" />
                <span>Joined: {new Date(item.joiningDate).toLocaleDateString()}</span>
              </div>
            )}
            {item.nextPaymentDate && (
              <div className={`flex items-center gap-2 text-xs font-medium ${
                isOverdue ? "text-red-600 dark:text-red-400" : isToday ? "text-amber-600 dark:text-amber-400" : "text-foreground"
              }`}>
                <CalendarClock className="w-3 h-3 shrink-0" />
                <span>
                  Due: {new Date(item.nextPaymentDate).toLocaleDateString()}
                  {isOverdue && ` (${Math.abs(item.daysUntilDue)} days overdue)`}
                  {isToday && " (Due today!)"}
                  {!isOverdue && !isToday && ` (in ${item.daysUntilDue} days)`}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap justify-end">
          <Button
            size="sm"
            onClick={() => onWhatsAppReminder(item)}
            className="rounded-lg text-xs bg-[#25D366] hover:bg-[#20bd5a] text-white gap-1.5 shadow-sm"
          >
            <WhatsAppIcon className="w-3.5 h-3.5 fill-white" />
            <span className="hidden sm:inline">WhatsApp</span> Reminder
          </Button>
          <Button
            size="sm"
            variant={item.paymentStatus === "paid" ? "outline" : "default"}
            className="rounded-lg text-xs"
            onClick={() => onMarkPaid(item.id)}
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Mark Paid
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function RemindersTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTenantForWa, setSelectedTenantForWa] = useState<ReminderItem | null>(null);

  // Auto-reminder states
  const [showTestModal, setShowTestModal] = useState(false);
  const [testNumber, setTestNumber] = useState("6302661388");
  const [testName, setTestName] = useState("Narendra Y");
  const [testRent, setTestRent] = useState(7000);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);

  const [isRunningAuto, setIsRunningAuto] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [logs, setLogs] = useState<ReminderLogItem[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const { data: reminders, isLoading } = useGetPaymentReminders({
    query: { queryKey: getGetPaymentRemindersQueryKey(), refetchInterval: 60000 },
  });

  const updatePayment = useUpdatePaymentStatus();

  const handleMarkPaid = (tenantId: number) => {
    updatePayment.mutate(
      { id: tenantId, data: { paymentStatus: "paid" } },
      {
        onSuccess: () => {
          toast({ title: "Payment recorded", description: "Monthly fee marked as paid. Next due date updated." });
          queryClient.invalidateQueries({ queryKey: getGetPaymentRemindersQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListRegistrationsQueryKey() });
        },
        onError: () => toast({ title: "Error", description: "Failed to update payment status.", variant: "destructive" }),
      }
    );
  };

  const handleRunAutoNow = async () => {
    setIsRunningAuto(true);
    try {
      const res = await triggerAutoReminders();
      toast({
        title: "Auto-Reminders Processed",
        description: res.message,
      });
      queryClient.invalidateQueries({ queryKey: getGetPaymentRemindersQueryKey() });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to trigger auto reminders",
        variant: "destructive",
      });
    } finally {
      setIsRunningAuto(false);
    }
  };

  const handleOpenLogs = async () => {
    setShowLogsModal(true);
    setLogsLoading(true);
    try {
      const res = await fetchReminderLogs();
      setLogs(res.logs || []);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to load logs",
        variant: "destructive",
      });
    } finally {
      setLogsLoading(false);
    }
  };

  const handleSendTest = async () => {
    setIsTesting(true);
    try {
      const res = await sendTestWhatsAppReminder({
        mobileNumber: testNumber,
        fullName: testName,
        rentDue: testRent,
        outstandingDue: 0,
        otherBillsDue: 0,
      });
      setTestResult(res);
      toast({
        title: "Test Reminder Dispatched",
        description: `Reminder successfully sent to ${testNumber}`,
      });
    } catch (err: any) {
      toast({
        title: "Test Failed",
        description: err?.message || "Could not send test reminder",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-card border border-card-border rounded-xl p-4 animate-pulse">
            <div className="h-4 w-48 bg-muted rounded mb-3" />
            <div className="h-3 w-32 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  const total = (reminders?.today?.length ?? 0) + (reminders?.upcoming?.length ?? 0) + (reminders?.overdue?.length ?? 0);

  return (
    <div className="space-y-8">
      {/* Automated WhatsApp Notification Banner */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground text-sm sm:text-base">
                  Automatic Monthly WhatsApp Reminders
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  ACTIVE
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Automatically scans database and sends WhatsApp due reminders when a tenant's month is completed.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <Button
              size="sm"
              variant="outline"
              onClick={handleOpenLogs}
              className="rounded-xl text-xs gap-1.5 border-border shadow-sm"
            >
              <History className="w-3.5 h-3.5" />
              Logs
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRunAutoNow}
              disabled={isRunningAuto}
              className="rounded-xl text-xs gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300"
            >
              {isRunningAuto ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              Run Auto Now
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setShowTestModal(true);
                setTestResult(null);
              }}
              className="bg-[#25D366] hover:bg-[#20bd5a] text-white font-medium rounded-xl text-xs gap-1.5 shadow-sm"
            >
              <WhatsAppIcon className="w-3.5 h-3.5 fill-white" />
              Test WhatsApp (6302661388)
            </Button>
          </div>
        </div>
      </div>

      {total === 0 ? (
        <div className="bg-card border border-card-border rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <CalendarClock className="w-8 h-8 text-primary" />
          </div>
          <p className="text-lg font-semibold text-foreground mb-2">No payment reminders</p>
          <p className="text-sm text-muted-foreground">
            Payment reminders appear here once tenants are assigned to rooms with a joining date.
          </p>
        </div>
      ) : (
        <>
          {/* Today */}
          {(reminders?.today?.length ?? 0) > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="font-semibold text-foreground">Due Today</h3>
                <span className="ml-auto bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {reminders!.today.length}
                </span>
              </div>
              <div className="space-y-3">
                {reminders!.today.map((item) => (
                  <ReminderCard
                    key={item.id}
                    item={item}
                    onMarkPaid={handleMarkPaid}
                    onWhatsAppReminder={(it) => setSelectedTenantForWa(it)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Overdue */}
          {(reminders?.overdue?.length ?? 0) > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="font-semibold text-foreground">Overdue Payments</h3>
                <span className="ml-auto bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {reminders!.overdue.length}
                </span>
              </div>
              <div className="space-y-3">
                {reminders!.overdue.map((item) => (
                  <ReminderCard
                    key={item.id}
                    item={item}
                    onMarkPaid={handleMarkPaid}
                    onWhatsAppReminder={(it) => setSelectedTenantForWa(it)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming */}
          {(reminders?.upcoming?.length ?? 0) > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <IndentIncrease className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">Upcoming (Next 30 days)</h3>
                <span className="ml-auto bg-primary/10 text-primary text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {reminders!.upcoming.length}
                </span>
              </div>
              <div className="space-y-3">
                {reminders!.upcoming.map((item) => (
                  <ReminderCard
                    key={item.id}
                    item={item}
                    onMarkPaid={handleMarkPaid}
                    onWhatsAppReminder={(it) => setSelectedTenantForWa(it)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Manual WhatsApp Reminder Dialog */}
      <WhatsAppReminderDialog
        open={!!selectedTenantForWa}
        onOpenChange={(open) => !open && setSelectedTenantForWa(null)}
        tenant={selectedTenantForWa}
      />

      {/* Test WhatsApp Dialog for 6302661388 */}
      <Dialog open={showTestModal} onOpenChange={setShowTestModal}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <WhatsAppIcon className="w-5 h-5 fill-emerald-600" />
              </div>
              <div>
                <DialogTitle className="font-serif text-lg">Test Automated WhatsApp</DialogTitle>
                <DialogDescription className="text-xs">
                  Trigger automated dispatch to test number
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground block mb-1">Mobile Number</Label>
                <Input
                  value={testNumber}
                  onChange={(e) => setTestNumber(e.target.value)}
                  placeholder="e.g. 6302661388"
                  className="h-9 text-sm rounded-lg"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground block mb-1">Tenant Name</Label>
                <Input
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  placeholder="e.g. Narendra Y"
                  className="h-9 text-sm rounded-lg"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground block mb-1">Rent Due (₹)</Label>
              <Input
                type="number"
                value={testRent}
                onChange={(e) => setTestRent(Number(e.target.value) || 0)}
                className="h-9 text-sm rounded-lg"
              />
            </div>

            <div className="bg-[#e5ddd5]/30 dark:bg-muted/40 p-3 rounded-xl border border-border/80 font-sans text-xs whitespace-pre-line leading-relaxed text-foreground select-all">
{`Hello ${testName} 👋,

This is a reminder about your pending dues.
Your current due details are as follows 👇

Rent Due : Rs. ${testRent.toLocaleString("en-IN")}/-,
Outstanding Due : Rs. 0/-,
Other Bills Due : Rs. 0/-,
-----------------------------------------
Total Due : Rs. ${testRent.toLocaleString("en-IN")}/-

For any clarification, please contact owner`}
            </div>

            {testResult && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
                <p className="font-semibold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                  <Check className="w-4 h-4" /> Dispatched Successfully
                </p>
                <p className="text-[11px] text-muted-foreground">Provider: {testResult.provider} | Status: {testResult.status}</p>
                {testResult.directUrl && (
                  <a
                    href={testResult.directUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 underline font-medium mt-1"
                  >
                    Open in WhatsApp Web / App <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2 sm:justify-between">
            <Button variant="outline" size="sm" onClick={() => setShowTestModal(false)} className="rounded-xl">
              Close
            </Button>
            <Button
              size="sm"
              disabled={isTesting || !testNumber}
              onClick={handleSendTest}
              className="bg-[#25D366] hover:bg-[#20bd5a] text-white font-medium rounded-xl gap-2 shadow-sm"
            >
              {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <WhatsAppIcon className="w-4 h-4 fill-white" />}
              Send Test Reminder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Automated Logs Modal */}
      <Dialog open={showLogsModal} onOpenChange={setShowLogsModal}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg">Automated Reminder Logs</DialogTitle>
            <DialogDescription className="text-xs">
              History of automated WhatsApp messages dispatched by the background scheduler
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            {logsLoading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                No automated reminder logs recorded yet.
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl border border-border bg-card/60 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-foreground">{log.tenantName} ({log.mobileNumber})</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        log.status === "delivered" || log.status === "sent"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300"
                          : "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-300"
                      }`}
                    >
                      {log.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                    <span>Total Due: ₹{log.totalDue?.toLocaleString("en-IN")}</span>
                    <span>{new Date(log.sentAt).toLocaleString("en-IN")}</span>
                  </div>
                  {log.error && (
                    <p className="text-red-600 dark:text-red-400 text-[11px] mt-1 bg-red-50 dark:bg-red-950/30 p-1.5 rounded">
                      Error: {log.error}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
