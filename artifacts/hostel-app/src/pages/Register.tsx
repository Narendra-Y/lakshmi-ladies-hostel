import { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCreateRegistration } from "@workspace/api-client-react";
import {
  ArrowLeft, Upload, CheckCircle, X, Loader2, User, Users, MapPin,
  FileImage, ChevronRight, ScrollText, Clock, Zap, Ban, BookOpen, Lock,
} from "lucide-react";

const schema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  mobileNumber: z.string().min(10, "Enter a valid 10-digit mobile number").max(12),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  email: z.string().email("Enter a valid email").min(1, "Email is required"),
  gender: z.enum(["female", "male", "other"], { required_error: "Please select gender" }),
  profession: z.string().min(2, "Profession is required"),
  guardianName: z.string().min(2, "Guardian name is required"),
  guardianMobile: z.string().min(10, "Enter a valid guardian mobile number"),
  address: z.string().min(10, "Please enter a complete address"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const STEPS = [
  { id: 1, label: "Personal", icon: User },
  { id: 2, label: "Guardian", icon: Users },
  { id: 3, label: "Address", icon: MapPin },
  { id: 4, label: "Documents", icon: FileImage },
  { id: 5, label: "Rules", icon: ScrollText },
];

const HOSTEL_RULES = [
  {
    icon: Clock,
    title: "Notice Period",
    text: "Before vacating the hostel, you must inform 15 days earlier; otherwise the advance amount will not be refunded.",
  },
  {
    icon: Zap,
    title: "Appliance Policy",
    text: "No electronic appliance overuse is allowed in the hostel premises.",
  },
  {
    icon: Lock,
    title: "Gate Timings",
    text: "Gate opens at 6:00 AM and closes at 10:00 PM. All residents must return by closing time.",
  },
  {
    icon: Ban,
    title: "No Refunds",
    text: "Once payment is made, it will not be refunded under any circumstances.",
  },
  {
    icon: BookOpen,
    title: "Logbook",
    text: "Before going outside, tenants must sign in the logbook at the reception.",
  },
];

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((s, idx) => (
        <div key={s.id} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
              step > s.id
                ? "bg-primary text-primary-foreground"
                : step === s.id
                ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                : "bg-muted text-muted-foreground"
            }`}>
              {step > s.id ? <CheckCircle className="w-4 h-4" /> : s.id}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${step >= s.id ? "text-primary" : "text-muted-foreground"}`}>
              {s.label}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 transition-all duration-500 ${step > s.id ? "bg-primary" : "bg-border"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function FileUploadField({
  label,
  accept,
  onUpload,
  testId,
  error,
}: {
  label: string;
  accept: string;
  onUpload: (url: string) => void;
  testId: string;
  error?: string;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    setFileName(file.name);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/uploads", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      onUpload(data.url);
    } catch {
      setPreview(null);
      setFileName(null);
    } finally {
      setUploading(false);
    }
  };

  const clear = () => {
    setPreview(null);
    setFileName(null);
    onUpload("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      <Label className="text-sm font-medium">{label}</Label>
      <div className="mt-2">
        {preview ? (
          <div className="relative inline-block">
            <img src={preview} alt="preview" className="w-28 h-28 object-cover rounded-xl border-2 border-primary/20 shadow-sm" />
            <button
              type="button"
              onClick={clear}
              className="absolute -top-2 -right-2 w-6 h-6 bg-destructive rounded-full flex items-center justify-center shadow-md"
            >
              <X className="w-3 h-3 text-white" />
            </button>
            {uploading && (
              <div className="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              </div>
            )}
          </div>
        ) : fileName ? (
          <div className="flex items-center gap-2 p-3.5 bg-muted rounded-xl text-sm border border-border">
            <CheckCircle className="w-4 h-4 text-primary shrink-0" />
            <span className="truncate text-muted-foreground flex-1">{fileName}</span>
            {uploading
              ? <Loader2 className="w-4 h-4 text-muted-foreground animate-spin shrink-0" />
              : <button type="button" onClick={clear} className="ml-auto shrink-0"><X className="w-4 h-4 text-muted-foreground" /></button>
            }
          </div>
        ) : (
          <button
            type="button"
            data-testid={testId}
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-full border-2 border-dashed border-border rounded-xl p-7 flex flex-col items-center gap-2.5 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <Loader2 className="w-7 h-7 text-primary animate-spin" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="w-5 h-5 text-primary" />
              </div>
            )}
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">{uploading ? "Uploading..." : "Click to upload"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{accept.includes("pdf") ? "JPG, PNG or PDF — max 5MB" : "JPG or PNG — max 5MB"}</p>
            </div>
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>
      {error && <p className="text-destructive text-xs mt-1.5">{error}</p>}
    </div>
  );
}

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [photoUrl, setPhotoUrl] = useState("");
  const [idProofUrl, setIdProofUrl] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState(1);
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [uploadErrors, setUploadErrors] = useState({ photo: "", idProof: "" });

  const createRegistration = useCreateRegistration();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      mobileNumber: "",
      dateOfBirth: "",
      email: "",
      gender: undefined,
      profession: "",
      guardianName: "",
      guardianMobile: "",
      address: "",
      notes: "",
    },
    mode: "onChange",
  });

  const nextStep = async () => {
    if (step === 4) {
      const errors = {
        photo: !photoUrl ? "A photo is required" : "",
        idProof: !idProofUrl ? "ID proof is required" : "",
      };
      setUploadErrors(errors);
      if (errors.photo || errors.idProof) return;
      setStep((s) => s + 1);
      return;
    }
    let fields: (keyof FormData)[] = [];
    if (step === 1) fields = ["fullName", "mobileNumber", "dateOfBirth", "gender", "email", "profession"];
    if (step === 2) fields = ["guardianName", "guardianMobile"];
    if (step === 3) fields = ["address"];
    const valid = await form.trigger(fields);
    if (valid) setStep((s) => s + 1);
  };

  const prevStep = () => setStep((s) => s - 1);

  const onSubmit = async (data: FormData) => {
    if (!rulesAccepted) {
      toast({
        title: "Rules not accepted",
        description: "Please accept the hostel rules and regulations to proceed.",
        variant: "destructive",
      });
      return;
    }
    createRegistration.mutate(
      {
        data: {
          ...data,
          email: data.email,
          notes: data.notes || undefined,
          photoUrl: photoUrl,
          idProofUrl: idProofUrl,
        },
      },
      {
        onSuccess: () => {
          setSubmitted(true);
        },
        onError: (error: unknown) => {
          const apiError = error as { data?: { error?: string }; status?: number };
          if (apiError?.status === 409) {
            toast({
              title: "Already registered",
              description: "This phone number is already registered with us.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Registration failed",
              description: apiError?.data?.error ?? "Please try again.",
              variant: "destructive",
            });
          }
        },
      }
    );
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <div className="relative mx-auto mb-6 w-24 h-24">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center animate-[scale-in_0.4s_ease-out]">
              <CheckCircle className="w-12 h-12 text-primary" />
            </div>
            <div className="absolute inset-0 rounded-full bg-primary/5 animate-ping" style={{ animationDuration: "2s" }} />
          </div>
          <h2 className="text-2xl font-serif font-bold text-foreground mb-3">Application Submitted!</h2>
          <p className="text-muted-foreground mb-2 leading-relaxed">
            Thank you for registering at Lakshmi Ladies Hostel.
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            Our team will review your application and contact you within 24 hours.
          </p>
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-8 text-left">
            <p className="text-sm font-medium text-foreground mb-1">What happens next?</p>
            <ul className="text-xs text-muted-foreground space-y-1.5 mt-2">
              <li className="flex items-start gap-2"><ChevronRight className="w-3 h-3 text-primary mt-0.5 shrink-0" /> Your application is under review</li>
              <li className="flex items-start gap-2"><ChevronRight className="w-3 h-3 text-primary mt-0.5 shrink-0" /> We'll call you within 24 hours to confirm</li>
              <li className="flex items-start gap-2"><ChevronRight className="w-3 h-3 text-primary mt-0.5 shrink-0" /> Bring original ID proof on the joining day</li>
            </ul>
          </div>
          <div className="space-y-3">
            <Button onClick={() => setLocation("/")} className="w-full rounded-xl" data-testid="success-home-btn">
              Return to Home
            </Button>
            <a href="tel:8367740817" className="block">
              <Button variant="outline" className="w-full rounded-xl">
                Call Us: +91 8367 740 817
              </Button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          {step > 1 ? (
            <button className="p-1.5 rounded-lg hover:bg-muted transition-colors" onClick={prevStep}>
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
          ) : (
            <Link href="/">
              <button className="p-1.5 rounded-lg hover:bg-muted transition-colors" data-testid="back-btn">
                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
              </button>
            </Link>
          )}
          <h1 className="font-serif font-semibold text-foreground">Registration Form</h1>
          <span className="ml-auto text-xs text-muted-foreground">Step {step} of {STEPS.length}</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress */}
        <ProgressBar step={step} />

        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          {/* Step 1: Personal Info */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="mb-6">
                <h3 className="text-lg font-serif font-bold text-foreground mb-1">Personal Information</h3>
                <p className="text-sm text-muted-foreground">Tell us about yourself</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">Full Name <span className="text-destructive">*</span></Label>
                  <Input id="fullName" data-testid="input-full-name" {...form.register("fullName")} className="mt-1.5" placeholder="Your full name" />
                  {form.formState.errors.fullName && <p className="text-destructive text-xs mt-1">{form.formState.errors.fullName.message}</p>}
                </div>
                <div>
                  <Label htmlFor="mobileNumber">Mobile Number <span className="text-destructive">*</span></Label>
                  <Input id="mobileNumber" data-testid="input-mobile" {...form.register("mobileNumber")} className="mt-1.5" placeholder="10-digit number" type="tel" />
                  {form.formState.errors.mobileNumber && <p className="text-destructive text-xs mt-1">{form.formState.errors.mobileNumber.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth <span className="text-destructive">*</span></Label>
                  <Input id="dateOfBirth" data-testid="input-dob" type="date" {...form.register("dateOfBirth")} className="mt-1.5" />
                  {form.formState.errors.dateOfBirth && <p className="text-destructive text-xs mt-1">{form.formState.errors.dateOfBirth.message}</p>}
                </div>
                <div>
                  <Label htmlFor="gender">Gender <span className="text-destructive">*</span></Label>
                  <Select onValueChange={(val) => form.setValue("gender", val as "female" | "male" | "other", { shouldValidate: true })}>
                    <SelectTrigger className="mt-1.5" data-testid="select-gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.gender && <p className="text-destructive text-xs mt-1">{form.formState.errors.gender.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                  <Input id="email" data-testid="input-email" type="email" {...form.register("email")} className="mt-1.5" placeholder="your@email.com" />
                  {form.formState.errors.email && <p className="text-destructive text-xs mt-1">{form.formState.errors.email.message}</p>}
                </div>
                <div>
                  <Label htmlFor="profession">Profession <span className="text-destructive">*</span></Label>
                  <Input id="profession" data-testid="input-profession" {...form.register("profession")} className="mt-1.5" placeholder="e.g. Student, Engineer" />
                  {form.formState.errors.profession && <p className="text-destructive text-xs mt-1">{form.formState.errors.profession.message}</p>}
                </div>
              </div>
              <Button type="button" className="w-full rounded-xl py-3" onClick={nextStep}>
                Continue <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {/* Step 2: Guardian */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="mb-6">
                <h3 className="text-lg font-serif font-bold text-foreground mb-1">Guardian Information</h3>
                <p className="text-sm text-muted-foreground">Emergency contact details</p>
              </div>
              <div>
                <Label htmlFor="guardianName">Guardian Full Name <span className="text-destructive">*</span></Label>
                <Input id="guardianName" data-testid="input-guardian-name" {...form.register("guardianName")} className="mt-1.5" placeholder="Parent or guardian name" />
                {form.formState.errors.guardianName && <p className="text-destructive text-xs mt-1">{form.formState.errors.guardianName.message}</p>}
              </div>
              <div>
                <Label htmlFor="guardianMobile">Guardian Mobile Number <span className="text-destructive">*</span></Label>
                <Input id="guardianMobile" data-testid="input-guardian-mobile" {...form.register("guardianMobile")} className="mt-1.5" placeholder="Guardian's phone number" type="tel" />
                {form.formState.errors.guardianMobile && <p className="text-destructive text-xs mt-1">{form.formState.errors.guardianMobile.message}</p>}
              </div>
              <Button type="button" className="w-full rounded-xl py-3" onClick={nextStep}>
                Continue <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {/* Step 3: Address */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="mb-6">
                <h3 className="text-lg font-serif font-bold text-foreground mb-1">Address & Notes</h3>
                <p className="text-sm text-muted-foreground">Your permanent home address</p>
              </div>
              <div>
                <Label htmlFor="address">Permanent Address <span className="text-destructive">*</span></Label>
                <Textarea id="address" data-testid="textarea-address" {...form.register("address")} className="mt-1.5" rows={4} placeholder="Full address including city, state, PIN code" />
                {form.formState.errors.address && <p className="text-destructive text-xs mt-1">{form.formState.errors.address.message}</p>}
              </div>
              <div>
                <Label htmlFor="notes">Additional Notes <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Textarea id="notes" data-testid="textarea-notes" {...form.register("notes")} className="mt-1.5" rows={3} placeholder="Dietary restrictions, medical conditions, or special requirements" />
              </div>
              <Button type="button" className="w-full rounded-xl py-3" onClick={nextStep}>
                Continue <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {/* Step 4: Documents */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="mb-6">
                <h3 className="text-lg font-serif font-bold text-foreground mb-1">Documents & Photo</h3>
                <p className="text-sm text-muted-foreground">Upload a clear photo and your ID proof</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FileUploadField
                  label="Your Photo *"
                  accept="image/jpeg,image/png,image/jpg"
                  onUpload={(url) => { setPhotoUrl(url); if (url) setUploadErrors((e) => ({ ...e, photo: "" })); }}
                  testId="upload-photo"
                  error={uploadErrors.photo}
                />
                <FileUploadField
                  label="ID Proof (Aadhaar / PAN / Passport) *"
                  accept="image/jpeg,image/png,image/jpg,application/pdf"
                  onUpload={(url) => { setIdProofUrl(url); if (url) setUploadErrors((e) => ({ ...e, idProof: "" })); }}
                  testId="upload-id-proof"
                  error={uploadErrors.idProof}
                />
              </div>
              <Button type="button" className="w-full py-3 text-base font-semibold rounded-xl" onClick={nextStep}>
                Continue <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {/* Step 5: Rules & Regulations */}
          {step === 5 && (
            <div className="space-y-5">
              <div className="mb-6">
                <h3 className="text-lg font-serif font-bold text-foreground mb-1">Rules & Regulations</h3>
                <p className="text-sm text-muted-foreground">Please read all rules carefully before submitting your application</p>
              </div>

              <div className="space-y-3">
                {HOSTEL_RULES.map((rule, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-card border border-card-border rounded-xl hover:border-primary/30 transition-colors">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <rule.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-0.5">{rule.title}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{rule.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Agreement Checkbox */}
              <button
                type="button"
                onClick={() => setRulesAccepted(!rulesAccepted)}
                className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                  rulesAccepted
                    ? "bg-primary/5 border-primary"
                    : "bg-muted/40 border-border hover:border-primary/40"
                }`}
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                  rulesAccepted ? "bg-primary border-primary" : "border-muted-foreground"
                }`}>
                  {rulesAccepted && <CheckCircle className="w-3.5 h-3.5 text-primary-foreground" />}
                </div>
                <p className="text-sm font-medium text-foreground leading-snug">
                  I have read, understood, and agree to all the hostel rules and regulations
                </p>
              </button>

              <Button
                type="submit"
                className="w-full py-3 text-base font-semibold rounded-xl"
                disabled={createRegistration.isPending || !rulesAccepted}
                data-testid="btn-submit-registration"
              >
                {createRegistration.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
                ) : (
                  "Submit Application"
                )}
              </Button>
              {!rulesAccepted && (
                <p className="text-xs text-center text-muted-foreground">
                  You must accept the rules to submit your application
                </p>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
