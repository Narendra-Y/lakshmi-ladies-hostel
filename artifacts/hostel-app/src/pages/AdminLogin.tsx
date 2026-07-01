import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAdminLogin } from "@workspace/api-client-react";
import { Loader2, Lock, Sun, Moon, Eye, EyeOff } from "lucide-react";
import { getStoredTheme, applyTheme, type Theme } from "../App";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const login = useAdminLogin();
  const [showPassword, setShowPassword] = useState(false);
  const [theme, setTheme] = useState<Theme>(getStoredTheme);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "narendrareddy83677@gmail.com", password: "" },
  });

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    localStorage.setItem("hostel_theme", next);
  };

  const onSubmit = (data: FormData) => {
    login.mutate(
      { data },
      {
        onSuccess: (result) => {
          localStorage.setItem("hostel_admin_token", result.token);
          setLocation("/admin/dashboard");
        },
        onError: () => {
          toast({
            title: "Login failed",
            description: "Invalid email or password. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative"
      style={{ background: "linear-gradient(135deg, hsl(330, 60%, 16%) 0%, hsl(330, 50%, 24%) 45%, hsl(345, 55%, 32%) 100%)" }}
    >
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all"
        title="Toggle theme"
      >
        {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-[0.06] bg-white blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-[0.06] bg-white blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm">
        <div className="bg-card rounded-3xl shadow-2xl overflow-hidden border border-card-border">
          {/* Header */}
          <div
            className="px-8 py-8 text-center"
            style={{ background: "linear-gradient(135deg, hsl(330, 60%, 16%), hsl(345, 55%, 32%))" }}
          >
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-4 border border-white/20">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-white">Admin Login</h1>
            <p className="text-white/60 text-sm mt-1">Lakshmi Ladies Hostel</p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  data-testid="input-admin-email"
                  {...form.register("email")}
                  className="mt-1.5"
                  placeholder="admin@email.com"
                  autoComplete="email"
                />
                {form.formState.errors.email && (
                  <p className="text-destructive text-xs mt-1">{form.formState.errors.email.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative mt-1.5">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    data-testid="input-admin-password"
                    {...form.register("password")}
                    className="pr-10"
                    placeholder="Enter password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-destructive text-xs mt-1">{form.formState.errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full py-2.5 font-semibold rounded-xl"
                disabled={login.isPending}
                data-testid="btn-admin-login"
              >
                {login.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in...</>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </div>
        </div>

        <p className="text-center text-white/40 text-xs mt-6">
          Lakshmi Ladies Hostel · Admin Portal
        </p>
      </div>
    </div>
  );
}
