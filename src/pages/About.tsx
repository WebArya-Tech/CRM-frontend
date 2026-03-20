import { Target, Heart, Lightbulb, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const values = [
  { icon: Target, title: "Excellence", desc: "We strive for the highest standards in education and mentorship." },
  { icon: Heart, title: "Student-First", desc: "Every decision we make puts our students' success at the center." },
  { icon: Lightbulb, title: "Innovation", desc: "We embrace modern teaching methods and technology-driven learning." },
  { icon: Users, title: "Community", desc: "We build a supportive ecosystem for students, parents, and teachers." },
];

export default function About() {
  return (
    <div className="py-24 bg-background overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center mb-24">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              About <span className="text-gradient">Assured Experts</span>
            </h1>
            <p className="mt-6 text-xl text-muted-foreground leading-relaxed">
              Founded in 2018, Assured Experts has been a beacon of academic excellence, helping students achieve their dreams through personalized coaching and expert mentorship.
            </p>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              We believe that every student has unique potential. Our mission is to provide the tools, guidance, and environment necessary for that potential to flourish.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 30 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative z-10 overflow-hidden rounded-3xl border border-border/50 shadow-2xl bg-white">
              <img 
                src="/image3.png" 
                alt="Assured Experts Team" 
                className="w-full h-auto object-contain aspect-video lg:aspect-square"
              />
            </div>
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
          </motion.div>
        </div>

        <div className="mb-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Our Core Values</h2>
            <p className="mt-4 text-lg text-muted-foreground">The principles that guide everything we do.</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v, i) => (
              <motion.div 
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group rounded-2xl bg-card p-8 shadow-card border border-border/50 hover:border-primary/30 transition-all"
              >
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <v.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-card-foreground">{v.title}</h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="rounded-3xl bg-card border border-border/50 p-8 lg:p-16 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_hsl(230_70%_55%_/_0.05),_transparent_40%)]" />
          
          <div className="relative grid gap-16 lg:grid-cols-2 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Our Mission</h2>
              <p className="mt-6 text-xl text-muted-foreground leading-relaxed">
                To democratize quality education by providing personalized, affordable, and accessible coaching that empowers every student to realize their full potential, regardless of their background.
              </p>
              <div className="mt-10">
                <Button size="lg" className="gradient-primary border-0 text-primary-foreground font-bold shadow-lg">
                  Learn More About Our Impact
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              {[
                { label: "Years Experience", value: "7+", color: "text-blue-600", bg: "bg-blue-600/10" },
                { label: "Expert Teachers", value: "30+", color: "text-emerald-600", bg: "bg-emerald-600/10" },
                { label: "Happy Students", value: "500+", color: "text-amber-600", bg: "bg-amber-600/10" },
                { label: "Success Rate", value: "95%", color: "text-rose-600", bg: "bg-rose-600/10" }
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-muted/30 p-6 border border-border/50 text-center hover:bg-muted/50 transition-colors">
                  <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
                  <p className="mt-2 text-sm font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
