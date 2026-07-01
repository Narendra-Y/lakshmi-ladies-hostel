import { Link } from "wouter";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Menu, X, Phone, Mail, MapPin, Wifi, Shield, Utensils,
  BookOpen, Droplets, Sun, Moon, ExternalLink, Star, ArrowUp,
  Clock, Home, Lock, Zap, Ban, ScrollText,
} from "lucide-react";
import { getStoredTheme, applyTheme, type Theme } from "../App";

const facilities = [
  { icon: Wifi, title: "High-Speed WiFi", desc: "Reliable internet for study and remote work, available in all rooms" },
  { icon: Shield, title: "24/7 Security", desc: "CCTV surveillance and secure gated entry for your complete safety" },
  { icon: Utensils, title: "Home-Cooked Meals", desc: "Nutritious South Indian meals served fresh every day" },
  { icon: BookOpen, title: "Study Room", desc: "Quiet, well-lit study space for focused learning and preparation" },
  { icon: Droplets, title: "Hot Water", desc: "Round-the-clock hot water supply in all attached bathrooms" },
  { icon: Sun, title: "Laundry Facility", desc: "Washing machines and drying area for resident use" },
];

const testimonials = [
  { name: "Priya K.", role: "Software Engineer", text: "I've been living here for 2 years. The security and home-cooked meals make it feel like home." },
  { name: "Ananya R.", role: "Medical Student", text: "Clean, safe, and the management is very caring. Highly recommend for students." },
  { name: "Sravani M.", role: "Bank Employee", text: "The location is perfect, right opposite Isha Hospital. Facilities are excellent." },
];

function useInView(ref: React.RefObject<Element | null>, options?: IntersectionObserverInit) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); obs.disconnect(); }
    }, { threshold: 0.1, ...options });
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, options]);
  return inView;
}

function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="p-2 rounded-full hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground"
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [theme, setTheme] = useState<Theme>(getStoredTheme);

  const facilitiesRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);
  const facilitiesInView = useInView(facilitiesRef);
  const aboutInView = useInView(aboutRef);
  const contactInView = useInView(contactRef);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      setShowTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    localStorage.setItem("hostel_theme", next);
  };

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    setMenuOpen(false);
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Sticky Navbar */}
      <nav
        data-testid="navbar"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-background/95 backdrop-blur-md shadow-sm border-b border-border"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-sm">
                <span className="text-primary-foreground text-sm font-bold">L</span>
              </div>
              <span className="font-serif font-semibold text-foreground text-lg leading-tight hidden xs:block sm:block">
                Lakshmi Ladies Hostel
              </span>
              <span className="font-serif font-semibold text-foreground text-base leading-tight xs:hidden sm:hidden block">
                LLH
              </span>
            </div>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-5">
              <button onClick={() => scrollTo(facilitiesRef)} className="text-sm text-muted-foreground hover:text-primary transition-colors">Facilities</button>
              <button onClick={() => scrollTo(aboutRef)} className="text-sm text-muted-foreground hover:text-primary transition-colors">About</button>
              <button onClick={() => scrollTo(contactRef)} className="text-sm text-muted-foreground hover:text-primary transition-colors">Contact</button>
              <Link href="/admin/login" className="text-xs text-muted-foreground hover:text-primary transition-colors">Admin</Link>
              <ThemeToggle theme={theme} onToggle={toggleTheme} />
              <Link href="/register">
                <Button size="sm" className="rounded-full px-5" data-testid="nav-register-btn">Register Now</Button>
              </Link>
            </div>

            {/* Mobile */}
            <div className="md:hidden flex items-center gap-2">
              <ThemeToggle theme={theme} onToggle={toggleTheme} />
              <button
                data-testid="mobile-menu-toggle"
                className="p-2 rounded-md text-muted-foreground"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-background/98 backdrop-blur-md border-t border-border px-4 py-4 space-y-1 shadow-lg">
            <button onClick={() => scrollTo(facilitiesRef)} className="flex items-center gap-3 w-full text-left text-sm text-muted-foreground hover:text-primary py-3 px-2 rounded-lg hover:bg-muted/50 transition-colors">
              <Home className="w-4 h-4" /> Facilities
            </button>
            <button onClick={() => scrollTo(aboutRef)} className="flex items-center gap-3 w-full text-left text-sm text-muted-foreground hover:text-primary py-3 px-2 rounded-lg hover:bg-muted/50 transition-colors">
              <Star className="w-4 h-4" /> About
            </button>
            <button onClick={() => scrollTo(contactRef)} className="flex items-center gap-3 w-full text-left text-sm text-muted-foreground hover:text-primary py-3 px-2 rounded-lg hover:bg-muted/50 transition-colors">
              <Phone className="w-4 h-4" /> Contact
            </button>
            <Link href="/admin/login" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary py-3 px-2 rounded-lg hover:bg-muted/50 transition-colors">
              <Lock className="w-4 h-4" /> Admin Login
            </Link>
            <Link href="/register" onClick={() => setMenuOpen(false)}>
              <Button className="w-full mt-3 rounded-xl" data-testid="mobile-register-btn">Register Now</Button>
            </Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{
          background: "linear-gradient(135deg, hsl(330, 60%, 16%) 0%, hsl(330, 50%, 24%) 45%, hsl(345, 55%, 32%) 100%)",
        }}
      >
        {/* Decorative blobs */}
        <div className="absolute top-16 right-0 w-96 h-96 rounded-full opacity-[0.07] bg-white blur-3xl" />
        <div className="absolute bottom-24 left-0 w-72 h-72 rounded-full opacity-[0.07] bg-white blur-3xl" />
        <div className="absolute top-1/3 left-1/3 w-32 h-32 rounded-full opacity-[0.04] bg-rose-200" />

        <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto pt-20 pb-16">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs sm:text-sm tracking-wide backdrop-blur-sm">
            <MapPin className="w-3.5 h-3.5" />
            Ladies Hostel in Kothapet, Guntur
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-white leading-tight mb-6">
            Lakshmi Ladies
            <br />
            <span className="text-rose-200">Hostel</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-3 leading-relaxed">
            A safe, comfortable home for working women and students in the heart of Kothapet, Guntur.
          </p>
          <p className="text-xs sm:text-sm text-white/50 mb-10 max-w-lg mx-auto">
            Sri Sai Baba Nilayam, D. No. 12-24-17, Gadiyaram vari street, Kothapet, Guntur – 522001
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link href="/register">
              <Button
                size="lg"
                data-testid="hero-register-btn"
                className="w-full sm:w-auto bg-white text-primary hover:bg-rose-50 font-semibold px-8 rounded-full shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
              >
                Register Now
              </Button>
            </Link>
            <button
              onClick={() => scrollTo(facilitiesRef)}
              className="w-full sm:w-auto px-8 py-2.5 rounded-full border border-white/30 text-white hover:bg-white/10 transition-all font-medium text-sm backdrop-blur-sm"
            >
              View Facilities
            </button>
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex flex-wrap justify-center gap-4 sm:gap-8">
            {[
              { icon: Shield, label: "24/7 Security" },
              { icon: Star, label: "Ladies Only" },
              { icon: Clock, label: "Since 2015" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-white/60 text-xs">
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Wave at bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0 60L1440 60L1440 20C1200 55 960 5 720 22C480 39 240 2 0 22V60Z" fill="hsl(var(--background))" />
          </svg>
        </div>
      </section>

      {/* Facilities */}
      <section
        ref={facilitiesRef}
        className={`py-20 sm:py-24 px-4 transition-all duration-700 ${facilitiesInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        data-testid="facilities-section"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-primary text-xs font-semibold tracking-widest uppercase mb-3">What We Offer</p>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-foreground">Our Facilities</h2>
            <div className="mt-4 w-16 h-1 bg-primary mx-auto rounded-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {facilities.map((f, i) => (
              <div
                key={f.title}
                data-testid={`facility-card-${f.title.toLowerCase().replace(/\s+/g, "-")}`}
                className="group bg-card border border-card-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1.5"
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section
        ref={aboutRef}
        className={`py-20 sm:py-24 px-4 bg-secondary/40 transition-all duration-700 ${aboutInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        data-testid="about-section"
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-center">
            <div>
              <p className="text-primary text-xs font-semibold tracking-widest uppercase mb-3">Our Story</p>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-foreground mb-6">
                A Home Away<br />From Home
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Lakshmi Ladies Hostel was established with a singular mission — to provide a safe, nurturing environment for women pursuing education and careers in Guntur.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Located opposite Isha Hospital in the heart of Kothapet, we are conveniently accessible to colleges, offices, and essential services. Our hostel is designed to feel like a second home.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We pride ourselves on maintaining high standards of hygiene, security, and hospitality — because every resident deserves to live with dignity and comfort.
              </p>
              <Link href="/register" className="mt-8 inline-block">
                <Button className="rounded-full px-8" data-testid="about-register-btn">Register Your Spot</Button>
              </Link>
            </div>
            <div className="space-y-3">
              {[
                { icon: MapPin, label: "Location", value: "Kothapet, opposite Isha Hospital, Guntur – 522001" },
                { icon: Shield, label: "Safety", value: "Ladies only, with 24/7 CCTV & gated entry" },
                { icon: Utensils, label: "Meals", value: "Home-cooked South Indian meals included" },
                { icon: Clock, label: "Timings", value: "Entry permitted until 10:00 PM daily" },
              ].map((item) => (
                <div key={item.label} className="flex gap-4 p-4 sm:p-5 bg-card border border-card-border rounded-xl hover:shadow-sm transition-shadow">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <item.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{item.label}</p>
                    <p className="text-foreground font-medium mt-0.5 text-sm">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-primary text-xs font-semibold tracking-widest uppercase mb-3">Resident Stories</p>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-foreground">What Our Residents Say</h2>
            <div className="mt-4 w-16 h-1 bg-primary mx-auto rounded-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-card border border-card-border rounded-2xl p-6 shadow-sm">
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4 italic">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-3 border-t border-border">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary text-xs font-semibold">{t.name[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rules & Regulations */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-primary text-xs font-semibold tracking-widest uppercase mb-3">Guidelines</p>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-foreground">Rules & Regulations</h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto text-sm sm:text-base">
              We maintain a respectful, safe, and welcoming environment for all residents. Please read and follow these guidelines.
            </p>
            <div className="mt-4 w-16 h-1 bg-primary mx-auto rounded-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                number: "01",
                title: "Gate Timings",
                description: "The hostel gate closes at 9:00 PM daily. All residents must return before closing time. Late entry must be requested in advance with valid reason.",
              },
              {
                number: "02",
                title: "No Male Visitors",
                description: "Male visitors are strictly not permitted inside the hostel premises at any time. Female visitors are allowed only in common areas between 9 AM and 6 PM.",
              },
              {
                number: "03",
                title: "Cleanliness & Hygiene",
                description: "Residents must keep their rooms, washrooms, and shared spaces clean at all times. Littering or misusing facilities will not be tolerated.",
              },
              {
                number: "04",
                title: "Monthly Fee Payment",
                description: "Monthly rent must be paid by the 5th of every month. Failure to pay on time may attract a late fee. Consistent non-payment may result in vacating the room.",
              },
              {
                number: "05",
                title: "No Loud Noise",
                description: "Quiet hours are observed from 10:00 PM to 6:00 AM. Playing loud music, hosting parties, or causing disturbances is strictly prohibited.",
              },
              {
                number: "06",
                title: "Respectful Conduct",
                description: "All residents must treat fellow residents, staff, and management with courtesy and respect. Quarreling, harassment, or antisocial behavior will result in immediate notice.",
              },
            ].map((rule) => (
              <div key={rule.number} className="bg-card border border-card-border rounded-2xl p-6 shadow-sm flex gap-4">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold text-sm font-serif">{rule.number}</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1.5">{rule.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{rule.description}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-8">
            By registering, you agree to abide by all rules and regulations of Lakshmi Ladies Hostel.
          </p>
        </div>
      </section>

      {/* CTA Banner */}
      <section
        className="py-16 sm:py-20 px-4 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, hsl(330, 60%, 16%), hsl(345, 55%, 32%))" }}
      >
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-white mb-4">Ready to Join Our Hostel?</h2>
          <p className="text-white/70 mb-8 text-base sm:text-lg">Fill out the registration form today and secure your spot in a safe, comfortable home.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register">
              <Button
                size="lg"
                data-testid="cta-register-btn"
                className="w-full sm:w-auto bg-white text-primary hover:bg-rose-50 font-semibold px-10 rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
              >
                Register Now
              </Button>
            </Link>
            <a href="tel:8367740817">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10 rounded-full px-8 bg-transparent"
              >
                <Phone className="w-4 h-4 mr-2" /> Call Us
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section
        ref={contactRef}
        className={`py-20 sm:py-24 px-4 transition-all duration-700 ${contactInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        data-testid="contact-section"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-primary text-xs font-semibold tracking-widest uppercase mb-3">Get in Touch</p>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-foreground">Contact Us</h2>
            <div className="mt-4 w-16 h-1 bg-primary mx-auto rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
            <div className="space-y-5">
              <div className="flex gap-4 items-start p-4 bg-card border border-card-border rounded-xl hover:shadow-sm transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground mb-1">Address</p>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Sri Sai Baba Nilayam<br />
                    D. No. 12-24-17, Gadiyaram vari street<br />
                    Kothapet, opposite Isha Hospital<br />
                    Guntur – 522001, Andhra Pradesh
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start p-4 bg-card border border-card-border rounded-xl hover:shadow-sm transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">Phone</p>
                  <a href="tel:8367740817" className="text-primary text-sm hover:underline font-medium" data-testid="contact-phone">
                    +91 8367 740 817
                  </a>
                </div>
              </div>
              <div className="flex gap-4 items-start p-4 bg-card border border-card-border rounded-xl hover:shadow-sm transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground mb-1">Email</p>
                  <a href="mailto:narendrareddy83677@gmail.com" className="text-primary text-sm hover:underline font-medium break-all" data-testid="contact-email">
                    narendrareddy83677@gmail.com
                  </a>
                </div>
              </div>
              <a
                href="https://maps.google.com/?q=Kothapet+Guntur+Andhra+Pradesh+522001"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 w-full justify-center py-3 px-5 rounded-xl border border-primary/30 text-primary hover:bg-primary/5 transition-colors text-sm font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                Get Directions on Google Maps
              </a>
            </div>

            {/* Google Maps */}
            <div className="rounded-2xl overflow-hidden border border-card-border shadow-sm" style={{ minHeight: "320px" }}>
              <iframe
                title="Lakshmi Ladies Hostel Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3825.5!2d80.4359!3d16.3134!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a35f40c0843b4bf%3A0x7f6f3b5c3d2e8a1d!2sKothapet%2C%20Guntur%2C%20Andhra%20Pradesh!5e0!3m2!1sen!2sin!4v1699999999999!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: "320px", display: "block" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                data-testid="google-maps"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground/5 border-t border-border py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground text-xs font-bold">L</span>
                </div>
                <p className="font-serif font-semibold text-foreground">Lakshmi Ladies Hostel</p>
              </div>
              <p className="text-muted-foreground text-sm">Kothapet, Guntur – 522001</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
              <a href="tel:8367740817" className="hover:text-primary transition-colors">8367740817</a>
              <span className="hidden sm:block">·</span>
              <a href="mailto:narendrareddy83677@gmail.com" className="hover:text-primary transition-colors">Email Us</a>
              <span className="hidden sm:block">·</span>
              <Link href="/register" className="hover:text-primary transition-colors">Register</Link>
              <span className="hidden sm:block">·</span>
              <Link href="/admin/login" className="hover:text-primary transition-colors">Admin</Link>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-muted-foreground text-xs">© {new Date().getFullYear()} Lakshmi Ladies Hostel. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Scroll to top */}
      {showTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 w-10 h-10 rounded-full bg-primary shadow-lg flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-all hover:-translate-y-0.5"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
