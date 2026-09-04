import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Copy, Check, ExternalLink } from "lucide-react";

export function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      stroke="currentColor"
      strokeWidth="0"
      fill="currentColor"
      className={className}
    >
      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.54 1.772.822 2.791.822 3.184 0 5.77-2.586 5.77-5.766.001-3.183-2.585-5.768-5.77-5.768zm0-1.872c4.218 0 7.64 3.422 7.64 7.64 0 4.22-3.422 7.64-7.64 7.64-1.284 0-2.502-.321-3.578-.887l-5.183 1.359 1.385-5.053c-.636-1.127-.994-2.427-.994-3.799 0-4.218 3.422-7.64 7.64-7.64zm3.627 10.828c-.149-.074-.882-.435-1.019-.485-.136-.049-.235-.074-.335.075s-.385.485-.472.585-.174.112-.323.037c-.149-.074-.629-.232-1.198-.739-.443-.395-.742-.883-.829-1.032s-.009-.23.065-.304c.067-.067.149-.174.223-.261.074-.087.099-.149.149-.248.05-.099.025-.186-.012-.261s-.335-.807-.46-1.105c-.121-.29-.244-.251-.335-.255l-.286-.005c-.099 0-.261.037-.397.186s-.521.509-.521 1.241.533 1.439.608 1.539c.074.099 1.05 1.603 2.544 2.248.355.153.633.245.85.314.357.113.682.097.939.059.286-.043.882-.361 1.006-.709.124-.348.124-.646.087-.709-.037-.062-.136-.099-.285-.174z" />
    </svg>
  );
}

export function openWhatsAppReminder(tenant: { fullName: string; mobileNumber: string }, dues?: { rentDue?: number; outstandingDue?: number; otherBillsDue?: number }) {
  const rent = dues?.rentDue ?? 7000;
  const outstanding = dues?.outstandingDue ?? 0;
  const other = dues?.otherBillsDue ?? 0;
  const total = rent + outstanding + other;

  const formatRs = (num: number) => Number(num || 0).toLocaleString("en-IN");

  const message = `Hello ${tenant.fullName} 👋,

This is a reminder about your pending dues.
Your current due details are as follows 👇

Rent Due : Rs. ${formatRs(rent)}/-,
Outstanding Due : Rs. ${formatRs(outstanding)}/-,
Other Bills Due : Rs. ${formatRs(other)}/-,
-----------------------------------------
Total Due : Rs. ${formatRs(total)}/-

For any clarification, please contact owner`;

  const cleanPhone = tenant.mobileNumber.replace(/\D/g, "");
  const formattedPhone = cleanPhone.length > 10 ? cleanPhone : `91${cleanPhone.slice(-10)}`;
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, "_blank");
}

interface WhatsAppReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: {
    fullName: string;
    mobileNumber: string;
    rentAmount?: number;
  } | null;
}

export default function WhatsAppReminderDialog({
  open,
  onOpenChange,
  tenant,
}: WhatsAppReminderDialogProps) {
  const { toast } = useToast();
  const [rentDue, setRentDue] = useState<number>(7000);
  const [outstandingDue, setOutstandingDue] = useState<number>(0);
  const [otherBillsDue, setOtherBillsDue] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (tenant) {
      setRentDue(tenant.rentAmount || 7000);
      setOutstandingDue(0);
      setOtherBillsDue(0);
      setCopied(false);
    }
  }, [tenant]);

  if (!tenant) return null;

  const totalDue = (Number(rentDue) || 0) + (Number(outstandingDue) || 0) + (Number(otherBillsDue) || 0);

  const formatRs = (num: number) => {
    return Number(num || 0).toLocaleString("en-IN");
  };

  const message = `Hello ${tenant.fullName} 👋,

This is a reminder about your pending dues.
Your current due details are as follows 👇

Rent Due : Rs. ${formatRs(rentDue)}/-,
Outstanding Due : Rs. ${formatRs(outstandingDue)}/-,
Other Bills Due : Rs. ${formatRs(otherBillsDue)}/-,
-----------------------------------------
Total Due : Rs. ${formatRs(totalDue)}/-

For any clarification, please contact owner`;

  const cleanPhone = tenant.mobileNumber.replace(/\D/g, "");
  const formattedPhone = cleanPhone.length > 10 ? cleanPhone : `91${cleanPhone.slice(-10)}`;
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    toast({
      title: "Copied to clipboard",
      description: "WhatsApp reminder text copied successfully.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = () => {
    window.open(whatsappUrl, "_blank");
    toast({
      title: "Opening WhatsApp...",
      description: `Sending due reminder to ${tenant.fullName}`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <WhatsAppIcon className="w-5 h-5 fill-emerald-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-serif">WhatsApp Due Reminder</DialogTitle>
              <DialogDescription className="text-xs">
                To {tenant.fullName} ({tenant.mobileNumber})
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Due Breakup Inputs */}
          <div className="grid grid-cols-3 gap-2 bg-muted/40 p-3 rounded-xl border border-border/60">
            <div>
              <Label className="text-xs text-muted-foreground block mb-1">Rent Due (₹)</Label>
              <Input
                type="number"
                min="0"
                value={rentDue || ""}
                onChange={(e) => setRentDue(parseFloat(e.target.value) || 0)}
                className="h-9 text-sm rounded-lg"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground block mb-1">Outstanding (₹)</Label>
              <Input
                type="number"
                min="0"
                value={outstandingDue || ""}
                onChange={(e) => setOutstandingDue(parseFloat(e.target.value) || 0)}
                className="h-9 text-sm rounded-lg"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground block mb-1">Other Bills (₹)</Label>
              <Input
                type="number"
                min="0"
                value={otherBillsDue || ""}
                onChange={(e) => setOtherBillsDue(parseFloat(e.target.value) || 0)}
                className="h-9 text-sm rounded-lg"
              />
            </div>
          </div>

          {/* Total Display */}
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl">
            <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">Total Calculated Due:</span>
            <span className="text-base font-bold text-emerald-700 dark:text-emerald-400 font-mono">
              ₹ {formatRs(totalDue)}
            </span>
          </div>

          {/* Message Live Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Message Preview</Label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied" : "Copy Text"}
              </button>
            </div>
            <div className="bg-[#e5ddd5]/30 dark:bg-muted/40 p-3.5 rounded-xl border border-border/80 font-sans text-xs whitespace-pre-line leading-relaxed text-foreground select-all">
              {message}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2 sm:justify-between">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="rounded-xl">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSend}
            className="bg-[#25D366] hover:bg-[#20bd5a] text-white font-medium rounded-xl gap-2 shadow-sm"
          >
            <WhatsAppIcon className="w-4 h-4 fill-white" />
            Send on WhatsApp
            <ExternalLink className="w-3.5 h-3.5 ml-0.5 opacity-80" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
