import { Outlet, Link } from "react-router-dom";
import { PublicNavbar } from "./PublicNavbar";
import { GraduationCap, Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, MessageCircle } from "lucide-react";

export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-border/40 bg-card/50 pt-20 pb-10">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-6">
              <Link to="/" className="flex items-center gap-3 group">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-md">
                  <GraduationCap className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold tracking-tight text-foreground">Assured Experts</span>
              </Link>
              <p className="text-sm leading-relaxed text-muted-foreground max-w-xs">
                Empowering students to achieve their academic dreams through expert mentorship and personalized learning paths.
              </p>
              <div className="flex gap-4">
                {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                  <a key={i} href="#" className="h-9 w-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-all duration-300">
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-foreground mb-6">Quick Links</h4>
              <ul className="space-y-4">
                {["Home", "About Us", "Our Services", "Contact"].map((item) => (
                  <li key={item}>
                    <Link to={item === "Home" ? "/" : `/${item.toLowerCase().replace(" ", "")}`} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-foreground mb-6">Courses</h4>
              <ul className="space-y-4">
                {["Course 1", "Course 2", "Course 3", "Course 4"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-sm font-bold uppercase tracking-wider text-foreground mb-6">Contact Us</h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm text-muted-foreground">Assured Experts, No. 81, Ground Floor, Share Space, Borewell Road, Whitefield, Bangalore - 560066</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm text-muted-foreground">+91 91 87385 124</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm text-muted-foreground">assuredexperts1@gmail.com</span>
                </li>
              </ul>
            </div>
          </div>
<div className="mt-12 pt-6 border-t border-slate-300 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">

  <span>© 2026 DronaVyas Ixpoe Private Limited</span>

  <div className="flex flex-wrap items-center gap-3">
    <span>Designed & Developed by</span>

    <a
      href="https://webarya.com"
      target="_blank"
      rel="noopener noreferrer"
      className="text-green-600 font-medium hover:underline"
    >
      WebArya
    </a>

    <a
      href="tel:+919187385124"
      className="flex items-center gap-1 text-green-600 hover:underline"
    >
      <Phone size={14} />
      +91 9187 385 124
    </a>

    <a
      href="https://wa.me/919187385124"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1 text-green-600 hover:underline"
    >
      <MessageCircle size={14} />
      WhatsApp
    </a>
  </div>

</div>

        </div>
      </footer>
    </div>
  );
}
