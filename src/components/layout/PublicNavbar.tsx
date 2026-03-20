import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { GraduationCap, Menu, X } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "../ThemeToggle";
const logo = "/image2.png";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Contact", href: "/contact" },
];

export function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 border-b border-border/40 bg-card/70 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-[1400px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-lg group-hover:scale-105 transition-transform duration-300">
            <img src={logo} alt="Assured Experts" className="h-8 w-8" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-foreground leading-none">Assured Experts</span>
          </div>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-2 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              to={l.href}
              className={cn(
                "relative rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200",
                location.pathname === l.href
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {l.label}
              {location.pathname === l.href && (
                <motion.div 
                  layoutId="nav-underline"
                  className="absolute bottom-1 left-4 right-4 h-0.5 bg-primary rounded-full"
                />
              )}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <ThemeToggle />
          <Link to="/login">
            <Button variant="ghost" className="font-semibold text-muted-foreground hover:text-foreground">
              Login
            </Button>
          </Link>

        </div>

        {/* Mobile toggle */}
        <button 
          className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors" 
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-border bg-card md:hidden"
        >
          <div className="space-y-2 px-4 py-6">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                to={l.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "block rounded-xl px-4 py-3 text-base font-semibold transition-colors",
                  location.pathname === l.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {l.label}
              </Link>
            ))}
            <div className="grid grid-cols-2 gap-4 pt-4">
              <Link to="/login" onClick={() => setOpen(false)}>
                <Button variant="outline" className="w-full h-12 font-bold">Login</Button>
              </Link>
              <Link to="/contact" onClick={() => setOpen(false)}>
                <Button className="w-full h-12 font-bold gradient-primary border-0 text-primary-foreground">Join Now</Button>
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </nav>
  );
}
