const getBaseUrl = () =>
  typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? "https://lakshmi-ladies-hostel.onrender.com"
    : "";

export interface ReminderLogItem {
  id: number;
  tenantId?: number | null;
  tenantName: string;
  mobileNumber: string;
  message: string;
  rentDue: number;
  outstandingDue: number;
  otherBillsDue: number;
  totalDue: number;
  status: "sent" | "delivered" | "failed";
  provider: string;
  error?: string | null;
  sentAt: string;
}

export async function sendTestWhatsAppReminder(data: {
  mobileNumber: string;
  fullName: string;
  rentDue?: number;
  outstandingDue?: number;
  otherBillsDue?: number;
}): Promise<{
  success: boolean;
  status: string;
  provider: string;
  mobileNumber: string;
  message: string;
  directUrl: string;
}> {
  const token = localStorage.getItem("hostel_admin_token");
  const res = await fetch(`${getBaseUrl()}/api/reminders/test-whatsapp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to send test reminder");
  }

  return res.json();
}

export async function triggerAutoReminders(): Promise<{
  success: boolean;
  message: string;
  summary: {
    processed: number;
    sent: number;
    failed: number;
    details: any[];
  };
}> {
  const token = localStorage.getItem("hostel_admin_token");
  const res = await fetch(`${getBaseUrl()}/api/reminders/trigger-auto`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to trigger auto reminders");
  }

  return res.json();
}

export async function fetchReminderLogs(): Promise<{ logs: ReminderLogItem[] }> {
  const token = localStorage.getItem("hostel_admin_token");
  const res = await fetch(`${getBaseUrl()}/api/reminders/logs`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch reminder logs");
  }

  return res.json();
}
