import React from "react";
import { Link } from "wouter";
import { MapPin, Phone, Mail, CheckCircle2, Shield, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary fill-primary" />
            <span className="font-serif font-bold text-xl text-primary tracking-tight">Lakshmi</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <a href="#about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">About</a>
            <a href="#facilities" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Facilities</a>
            <a href="#contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Contact</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/register">
              <Button className="rounded-full shadow-sm hover-elevate">Register Now</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-primary/5 py-24 lg:py-32">
          <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80">
                Guntur's Premier Ladies Hostel
              </div>
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
                A warm, safe digital home <br className="hidden lg:block"/>
                <span className="text-primary">away from home.</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto lg:mx-0">
                Experience comfort, security, and a nurturing environment. At Lakshmi Ladies Hostel, we care for your well-being so you can focus on your goals.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/register">
                  <Button size="lg" className="rounded-full w-full sm:w-auto shadow-md">
                    Apply for Registration
                  </Button>
                </Link>
                <a href="#facilities">
                  <Button variant="outline" size="lg" className="rounded-full w-full sm:w-auto">
                    View Facilities
                  </Button>
                </a>
              </div>
            </div>
            <div className="flex-1 w-full max-w-lg lg:max-w-none">
              <div className="relative aspect-[4/3] md:aspect-square lg:aspect-[4/3] overflow-hidden rounded-2xl shadow-xl">
                <img src="/src/assets/images/hero.png" alt="Lakshmi Ladies Hostel Exterior" className="object-cover w-full h-full" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Facilities */}
        <section id="facilities" className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="font-serif text-3xl font-bold text-foreground mb-4">Thoughtful Facilities</h2>
              <p className="text-muted-foreground">Everything you need for a comfortable and productive stay.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { title: "24/7 Security", desc: "Round-the-clock CCTV surveillance and secure entry systems.", icon: Shield },
                { title: "Home-style Food", desc: "Nutritious and delicious meals prepared in hygienic kitchens.", icon: Heart },
                { title: "High-speed WiFi", desc: "Uninterrupted internet access for your study and entertainment.", icon: CheckCircle2 },
              ].map((f, i) => (
                <div key={i} className="p-6 rounded-2xl bg-card border shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <f.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-xl mb-2">{f.title}</h3>
                  <p className="text-muted-foreground">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="py-20 bg-muted/50 border-t">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="font-serif text-3xl font-bold text-foreground mb-6">Find Us Here</h2>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="mt-1 w-10 h-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold">Address</h4>
                      <p className="text-muted-foreground mt-1">
                        Sri Sai Baba Nilayam, D. No. 12-24-17,<br/>
                        Gadiyaram vari street, Kothapet,<br/>
                        Opposite Isha Hospital,<br/>
                        Guntur - 522001
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="mt-1 w-10 h-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold">Phone</h4>
                      <p className="text-muted-foreground mt-1">8367740817</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="mt-1 w-10 h-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold">Email</h4>
                      <p className="text-muted-foreground mt-1">narendrareddy83677@gmail.com</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="h-[400px] w-full rounded-2xl overflow-hidden shadow-lg border">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3829.351213038692!2d80.443194!3d16.30472!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a4a75416040cd61%3A0xc6eab44bfec0509a!2sGadiyaram%20Vari%20St%2C%20Kothapeta%2C%20Guntur%2C%20Andhra%20Pradesh%20522001%2C%20India!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-foreground text-background py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="h-5 w-5 text-primary fill-primary" />
            <span className="font-serif font-bold text-lg text-background tracking-tight">Lakshmi</span>
          </div>
          <p className="text-sm text-background/60">
            &copy; {new Date().getFullYear()} Lakshmi Ladies Hostel. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
