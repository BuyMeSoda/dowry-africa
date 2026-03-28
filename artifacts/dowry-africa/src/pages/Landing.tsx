import { Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Heart, ShieldCheck, Star, Users } from "lucide-react";
import { motion } from "framer-motion";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 overflow-hidden">
          <div className="absolute inset-0 z-0">
             <img src={`${import.meta.env.BASE_URL}images/pattern-bg.png`} alt="" className="w-full h-full object-cover opacity-40 mix-blend-multiply" />
          </div>
          
          <div className="container mx-auto px-4 md:px-8 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="w-full lg:w-1/2"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium mb-6">
                  <Star className="w-4 h-4 text-primary" />
                  The #1 platform for African marriages
                </div>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold leading-[1.1] text-foreground mb-6">
                  Built for marriage.<br />
                  <span className="text-primary italic font-medium">Not just matches.</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl leading-relaxed">
                  Dowry.Africa is an exclusive matchmaking platform connecting commitment-ready Africans and the diaspora worldwide. Find a partner who shares your roots, values, and vision for the future.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/register" className="px-8 py-4 bg-primary text-primary-foreground rounded-full font-semibold text-lg text-center shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    Apply for Membership
                  </Link>
                  <Link href="/login" className="px-8 py-4 bg-white text-foreground border border-border rounded-full font-semibold text-lg text-center hover:bg-secondary transition-all duration-300">
                    Member Login
                  </Link>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="w-full lg:w-1/2 relative"
              >
                <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl">
                  <img src={`${import.meta.env.BASE_URL}images/hero-couple.png`} alt="Elegant couple" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  
                  {/* Floating Badge */}
                  <div className="absolute bottom-8 left-8 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl flex items-center gap-4">
                     <img src={`${import.meta.env.BASE_URL}images/trust-badge.png`} alt="Verified" className="w-12 h-12" />
                     <div>
                       <p className="font-display font-bold text-foreground">Verified Member</p>
                       <p className="text-sm text-muted-foreground">Identity & Intent checked</p>
                     </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Stats Strip */}
        <section className="bg-foreground text-background py-16">
          <div className="container mx-auto px-4 md:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-white/10">
              <div>
                <p className="text-4xl md:text-5xl font-display font-bold text-primary mb-2">48K+</p>
                <p className="text-white/70 font-medium">Active Members</p>
              </div>
              <div>
                <p className="text-4xl md:text-5xl font-display font-bold text-primary mb-2">12</p>
                <p className="text-white/70 font-medium">Countries</p>
              </div>
              <div>
                <p className="text-4xl md:text-5xl font-display font-bold text-primary mb-2">2100+</p>
                <p className="text-white/70 font-medium">Engagements</p>
              </div>
              <div>
                <p className="text-4xl md:text-5xl font-display font-bold text-primary mb-2">94%</p>
                <p className="text-white/70 font-medium">Verified Profiles</p>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-24 bg-secondary/30">
          <div className="container mx-auto px-4 md:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">A Refined Approach</h2>
              <p className="text-muted-foreground text-lg">We prioritize quality over quantity. Every feature is designed to foster deep connections and long-term commitment.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: ShieldCheck, title: "Curated Community", desc: "Every profile undergoes verification to ensure authentic intent and real identities." },
                { icon: Heart, title: "Compatibility Dimensions", desc: "Matches based on values, life stage, cultural heritage, and practical timelines." },
                { icon: Users, title: "Meaningful Dialogue", desc: "Guided prompts and structured messaging encourage deep, intentional conversations." }
              ].map((feature, idx) => (
                <div key={idx} className="bg-white p-8 rounded-3xl shadow-lg border border-border/50 hover:shadow-xl transition-all duration-300">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-display font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      
      <footer className="bg-foreground text-white py-12">
        <div className="container mx-auto px-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="font-display text-2xl font-bold text-white">Dowry.Africa</p>
          <p className="text-white/50 text-sm">© {new Date().getFullYear()} Dowry.Africa. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
