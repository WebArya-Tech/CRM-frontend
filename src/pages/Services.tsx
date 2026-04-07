import { useState, useEffect } from "react";
import { BookOpen, ArrowRight, Loader } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { publicServiceAPI } from "@/lib/api";
import { motion } from "framer-motion";

interface PublicService {
  _id: string;
  title: string;
  description: string;
  subjects: string[];
  features: string[];
  price: string;
  icon: string;
}

export default function Services() {
  const [services, setServices] = useState<PublicService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await publicServiceAPI.getAll();
        setServices(response.data || []);
      } catch (error) {
        console.error("Failed to fetch services:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  return (
    <div className="py-24 bg-background min-h-screen">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Our <span className="text-gradient">Services</span>
            </h1>
            <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive coaching programs designed to help you achieve academic excellence through personalized mentorship.
            </p>
          </motion.div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading our programs...</p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2">
            {services.map((s, i) => (
              <motion.div 
                key={s._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group relative rounded-3xl bg-card p-8 shadow-card border border-border/50 transition-all hover:border-primary/30 hover:shadow-xl hover:translate-y-[-4px]"
              >
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground shadow-inner">
                  <BookOpen className="h-7 w-7" />
                </div>
                <h3 className="text-2xl font-bold text-card-foreground">{s.title}</h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">{s.description}</p>
                
                <div className="mt-8 space-y-3">
                  {s.features.map((f) => (
                    <div key={f} className="flex items-center gap-3 text-muted-foreground">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                      <span className="text-sm font-medium">{f}</span>
                    </div>
                  ))}
                  {s.subjects && s.subjects.length > 0 && (
                     <div className="pt-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Subjects</p>
                        <p className="text-sm font-medium text-foreground">{s.subjects.join(", ")}</p>
                     </div>
                  )}
                </div>
                
                <div className="mt-10 pt-8 border-t border-border/50 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Starting from</p>
                    <span className="text-2xl font-black text-foreground">{s.price}</span>
                  </div>
                  <Link to="/contact">
                    <Button size="lg" className="gradient-primary border-0 text-primary-foreground font-bold shadow-md hover:shadow-primary/20">
                      Enquire Now <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && services.length === 0 && (
          <div className="text-center py-20 bg-muted/20 rounded-3xl border border-dashed border-border">
            <h2 className="text-2xl font-bold mb-4">No content found</h2>
            <p className="text-muted-foreground">Our team is currently updating our service list. Please check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
}
