import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, Users, BookOpen, Award, ArrowRight, CheckCircle, Star } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

const highlights = [
  { icon: Users, value: "5000+", label: "Students Enrolled" },
  { icon: BookOpen, value: "50+", label: "Expert Courses" },
  { icon: Award, value: "95%", label: "Success Rate" },
  { icon: Star, value: "4.9", label: "Average Rating" },
];

const features = [
  "Personalized one-on-one coaching sessions",
  "Expert faculty with 10+ years experience",
  "Comprehensive study materials included",
  "Regular progress tracking and assessments",
  "Flexible scheduling for working students",
  "Affordable pricing with EMI options",
];

export default function Home() {
  const { isAuthenticated, user } = useAuth();

  // Redirect authenticated users to their dashboard
  if (isAuthenticated && user) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'teacher') return <Navigate to="/teacher" replace />;
    if (user.role === 'student') return <Navigate to="/student" replace />;
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden gradient-hero py-20 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(var(--primary)_/_0.15),_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_hsl(var(--accent)_/_0.1),_transparent_50%)]" />
        
        <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
                <GraduationCap className="h-4 w-4" />
                Trusted by 5000+ students
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-7xl">
                Unlock Your
                <span className="text-gradient block mt-2"> Academic Potential</span>
              </h1>
              <p className="mt-6 text-xl leading-relaxed text-muted-foreground max-w-xl">
                Expert coaching for all competitive and board exams. Personalized learning paths, dedicated mentors, and proven results to help you excel.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link to="/contact">
                  <Button size="lg" className="h-14 px-8 text-lg font-bold gradient-primary border-0 text-white shadow-xl hover:shadow-primary/20 transition-all duration-300">
                    Get Started <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/about">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-semibold border-primary/20 text-primary hover:bg-primary/5">
                    Learn More
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: 30 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative"
            >
              <div className="relative z-10 overflow-hidden rounded-2xl border border-white/10 shadow-2xl bg-white">
                <img 
                  src="/image3.png" 
                  alt="Assured Experts Team" 
                  className="w-full h-auto object-contain aspect-[4/3]"
                />
              </div>

              <div className="absolute -top-6 -right-6 z-0 h-32 w-32 rounded-full bg-primary/20 blur-3xl" />
              <div className="absolute -bottom-10 -left-10 z-0 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative -mt-10 z-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-8">
            {highlights.map((h, i) => (
              <motion.div
                key={h.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                className="glass rounded-2xl p-6 text-center shadow-card hover:translate-y-[-4px] transition-transform duration-300"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <h.icon className="h-6 w-6" />
                </div>
                <p className="text-3xl font-bold text-card-foreground">{h.value}</p>
                <p className="text-sm font-medium text-muted-foreground mt-1">{h.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-background">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Why Choose <span className="text-gradient">Assured Experts?</span>
            </h2>
            <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
              We combine expert mentorship with cutting-edge technology to deliver results that speak for themselves.
            </p>
          </motion.div>

          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="space-y-8">
              <div className="grid gap-6 sm:grid-cols-2">
                {features.map((f, i) => (
                  <motion.div 
                    key={f}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="flex items-start gap-4 p-4 rounded-xl hover:bg-muted/50 transition-colors duration-200"
                  >
                    <div className="mt-1 h-6 w-6 shrink-0 rounded-full bg-success/10 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-success" />
                    </div>
                    <span className="text-foreground font-medium">{f}</span>
                  </motion.div>
                ))}
              </div>
              
              <div className="pt-4">
                <Link to="/services">
                  <Button variant="outline" size="lg" className="group h-12 px-6 border-primary/20 hover:border-primary/50 hover:bg-primary/5 text-primary">
                    View Our Services <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="relative rounded-3xl overflow-hidden gradient-primary p-1"
            >
              <div className="bg-card rounded-[1.4rem] p-8 lg:p-10">
                <h3 className="text-2xl font-bold text-foreground mb-6">Start Your Journey Today</h3>
                <p className="text-muted-foreground mb-8 text-lg">
                  Join hundreds of successful students who achieved their dream scores with our guidance.
                </p>
                
                <div className="space-y-4">
                  {[
                    { title: "Course 1 Success", desc: "Top 500 National Rank Achievers", color: "bg-blue-500/10 text-blue-600" },
                    { title: "Course 2 Result", desc: "98% students achieved target scores", color: "bg-emerald-500/10 text-emerald-600" },
                    { title: "Course 3 Outcome", desc: "Average improvement: 35%", color: "bg-amber-500/10 text-emerald-600" }
                  ].map((item, i) => (
                    <motion.div 
                      key={item.title}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
                      className="group flex items-center justify-between rounded-2xl border border-border/50 bg-muted/30 p-5 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300"
                    >
                      <div>
                        <p className="font-bold text-foreground">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                      <div className={`h-10 w-10 rounded-full ${item.color} flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity`}>
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-10 pt-8 border-t border-border">
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-10 w-10 rounded-full border-2 border-card bg-muted flex items-center justify-center overflow-hidden">
                          <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="Student" />
                        </div>
                      ))}
                    </div>
                    <div className="text-sm">
                      <p className="font-bold text-foreground">Join 5,000+ students</p>
                      <p className="text-muted-foreground">already learning with us</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Professional Banner Section */}
      <section className="py-24 bg-card/10">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative rounded-3xl overflow-hidden border border-border/50 shadow-2xl bg-white"
          >
            <img 
              src="/image4.jpeg" 
              alt="Assured Experts - Trusted Professionals" 
              className="w-full h-auto object-contain"
            />
          </motion.div>
        </div>
      </section>
    </div>
  );
}
