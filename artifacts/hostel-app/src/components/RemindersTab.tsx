import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Loader2, CalendarCheck,
} from "lucide-react";

function ReminderCard({ item, onMarkPaid }: { item: ReminderItem; onMarkPaid: (id: number) => void }) {
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
        <Button
          size="sm"
          variant={item.paymentStatus === "paid" ? "outline" : "default"}
          className="shrink-0 rounded-lg text-xs"
          onClick={() => onMarkPaid(item.id)}
        >
          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
          Mark Paid
        </Button>
      </div>
    </div>
  );
}

export default function RemindersTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  if (total === 0) {
    return (
      <div className="bg-card border border-card-border rounded-2xl p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <CalendarClock className="w-8 h-8 text-primary" />
        </div>
        <p className="text-lg font-semibold text-foreground mb-2">No payment reminders</p>
        <p className="text-sm text-muted-foreground">
          Payment reminders appear here once tenants are assigned to rooms with a joining date.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
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
              <ReminderCard key={item.id} item={item} onMarkPaid={handleMarkPaid} />
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
              <ReminderCard key={item.id} item={item} onMarkPaid={handleMarkPaid} />
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
              <ReminderCard key={item.id} item={item} onMarkPaid={handleMarkPaid} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
