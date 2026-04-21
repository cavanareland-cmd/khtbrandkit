import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import logo from "@/assets/karin-logo.png";

const Auth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Masuk · Brand Kit Studio · KHT";
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate("/studio");
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/studio");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Email dan password wajib diisi");
      return;
    }
    if (password.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/studio` },
        });
        if (error) throw error;
        toast.success("Akun dibuat! Mengarahkan ke studio...");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Selamat datang kembali!");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      if (message.includes("already registered")) {
        toast.error("Email sudah terdaftar. Silakan masuk.");
        setMode("signin");
      } else if (message.includes("Invalid login")) {
        toast.error("Email atau password salah");
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-soft arabesque-pattern">
      <div className="hidden lg:flex flex-1 bg-gradient-hero relative overflow-hidden p-16 flex-col justify-between text-primary-foreground">
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="KHT" className="h-12 w-12 brightness-0 invert" />
            <div>
              <p className="font-display text-xl font-bold">Karin Hidayah Tour</p>
              <p className="font-alt text-[10px] uppercase tracking-[0.3em] text-primary-foreground/70">Brand Kit Studio</p>
            </div>
          </Link>
        </div>

        <div className="relative z-10 space-y-6">
          <p className="font-alt text-xs uppercase tracking-[0.3em] text-accent">AI-Powered Studio</p>
          <h1 className="font-display text-5xl xl:text-6xl font-bold leading-tight">
            Buat materi promosi <em className="text-accent">elegan</em> dalam hitungan detik.
          </h1>
          <p className="text-lg text-primary-foreground/80 max-w-md leading-relaxed">
            Flyer, poster, story Instagram, dan banner — semua sesuai brand KHT. Cukup isi form, AI yang tangani sisanya.
          </p>
        </div>

        <div className="relative z-10 font-display italic text-primary-foreground/60">
          "Labbaik Allahumma Labbaik"
        </div>

        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-secondary/30 blur-3xl" />
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <img src={logo} alt="KHT" className="h-12 w-12" />
            <div>
              <p className="font-display text-lg font-bold text-primary">Karin Hidayah Tour</p>
              <p className="font-alt text-[10px] uppercase tracking-widest text-secondary/70">Brand Kit Studio</p>
            </div>
          </div>

          <div>
            <p className="font-alt text-xs uppercase tracking-[0.3em] text-accent mb-3">
              {mode === "signin" ? "Masuk" : "Daftar"}
            </p>
            <h2 className="font-display text-4xl font-bold text-secondary mb-2">
              {mode === "signin" ? "Selamat Datang" : "Bergabung"}
            </h2>
            <p className="text-muted-foreground">
              {mode === "signin"
                ? "Masuk untuk mulai membuat media promosi."
                : "Buat akun untuk akses Brand Kit Studio."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="anda@karinhidayahtour.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                minLength={6}
                className="h-12"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-primary text-primary-foreground hover:shadow-glow transition-smooth font-medium"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "signin" ? "Masuk" : "Daftar Sekarang"}
            </Button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                className="text-sm text-muted-foreground hover:text-primary transition-smooth"
              >
                {mode === "signin"
                  ? "Belum punya akun? Daftar di sini"
                  : "Sudah punya akun? Masuk"}
              </button>
            </div>
          </form>

          <div className="text-center pt-4 border-t border-border">
            <Link to="/" className="text-xs font-alt uppercase tracking-widest text-muted-foreground hover:text-primary transition-smooth">
              ← Kembali ke Brand Kit
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
