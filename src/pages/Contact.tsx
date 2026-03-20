import { useState } from "react";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const contactInfo = [
  { icon: MapPin, label: "Address", value: "Assured Experts, No. 81, Ground Floor, Share Space, Borewell Road, Whitefield, Bangalore - 560066" },
  { icon: Phone, label: "Phone", value: "+91 91 87385 124" },
  { icon: Mail, label: "Email", value: "assuredexperts1@gmail.com" },
  { icon: Clock, label: "Hours", value: "Mon - Sat: 8:00 AM - 8:00 PM" },
];

import { motion } from "framer-motion";

export default function Contact() {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Message sent!", description: "We'll get back to you within 24 hours." });
    setForm({ name: "", email: "", phone: "", message: "" });
  };

  return (
    <div className="py-24 bg-background overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Connect with <span className="text-gradient">Assured Experts</span>
            </h1>
            <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto">
              Have questions about our programs or want to schedule a demo? We'd love to hear from you.
            </p>
          </motion.div>
        </div>

        <div className="grid gap-16 lg:grid-cols-2 lg:items-start">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl bg-card border border-border/50 p-8 lg:p-10 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_hsl(230_70%_55%_/_0.05),_transparent_40%)]" />
            <div className="relative">
              <h2 className="text-2xl font-bold text-foreground mb-8">Send us a message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground ml-1">Your Name</label>
                    <Input 
                      value={form.name} 
                      onChange={(e) => setForm({ ...form, name: e.target.value })} 
                      placeholder="John Doe" 
                      required 
                      className="h-12 px-4 rounded-xl border-border/60 focus:ring-primary/20 focus:border-primary bg-muted/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground ml-1">Email Address</label>
                    <Input 
                      type="email" 
                      value={form.email} 
                      onChange={(e) => setForm({ ...form, email: e.target.value })} 
                      placeholder="john@example.com" 
                      required 
                      className="h-12 px-4 rounded-xl border-border/60 focus:ring-primary/20 focus:border-primary bg-muted/30"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground ml-1">Phone Number</label>
                  <Input 
                    value={form.phone} 
                    onChange={(e) => setForm({ ...form, phone: e.target.value })} 
                    placeholder="+91 XXXXX XXXXX" 
                    className="h-12 px-4 rounded-xl border-border/60 focus:ring-primary/20 focus:border-primary bg-muted/30"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground ml-1">Your Message</label>
                  <Textarea 
                    value={form.message} 
                    onChange={(e) => setForm({ ...form, message: e.target.value })} 
                    placeholder="Tell us about your requirements..." 
                    rows={5} 
                    required 
                    className="px-4 py-3 rounded-xl border-border/60 focus:ring-primary/20 focus:border-primary bg-muted/30"
                  />
                </div>
                <Button type="submit" className="w-full h-14 text-lg font-bold gradient-primary border-0 text-primary-foreground shadow-xl hover:shadow-primary/20 transition-all">
                  Send Message
                </Button>
              </form>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="grid gap-6 sm:grid-cols-2">
              {contactInfo.map((c, i) => (
                <motion.div 
                  key={c.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="rounded-2xl bg-card border border-border/50 p-6 shadow-card hover:border-primary/30 transition-all"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <c.icon className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">{c.label}</p>
                  <p className="text-lg font-bold text-foreground">{c.value}</p>
                </motion.div>
              ))}
            </div>

            <div className="rounded-3xl overflow-hidden border border-border/50 shadow-2xl h-[400px] relative">
              {/* Placeholder for map */}
              <div className="absolute inset-0 bg-muted flex flex-col items-center justify-center text-center p-8">
                <MapPin className="h-12 w-12 text-primary mb-4 opacity-20" />
                <p className="text-lg font-bold text-muted-foreground">Map will be loaded here</p>
                <p className="text-sm text-muted-foreground mt-2">Borewell Road, Whitefield, Bangalore - 560066
</p>
              </div>
              <img 
                src="https://www.google.com/maps/place/Borewell+Rd,+Whitefield,+Bengaluru,+Karnataka+560066/@12.9675824,77.7426514,16.07z/data=!4m6!3m5!1s0x3bae1207529d557f:0x6bb971fe4b3c9d69!8m2!3d12.9691593!4d77.7427492!16s%2Fg%2F1vq738qb?entry=ttu&g_ep=EgoyMDI2MDMxNy4wIKXMDSoASAFQAw%3D%3D" 
                alt="Office Location" 
                className="h-full w-full object-cover"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
