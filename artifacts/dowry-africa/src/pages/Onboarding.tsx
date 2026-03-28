import { useState } from "react";
import { useLocation } from "wouter";
import { useUpdateProfile } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Loader2 } from "lucide-react";

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const updateMutation = useUpdateProfile();

  // Form state
  const [formData, setFormData] = useState({
    intent: "marriage_ready",
    city: "",
    country: "",
    heritage: [] as string[],
    faith: "",
    languages: [] as string[],
    lifeStage: "",
    marriageTimeline: "",
    bio: "",
    quote: "",
    photoUrl: "https://images.unsplash.com/photo-1531123897727-8f129e1bfd8c?w=800&q=80" // Mock stock photo 
  });

  const nextStep = () => setStep(s => Math.min(4, s + 1));
  const prevStep = () => setStep(s => Math.max(1, s - 1));

  const handleComplete = () => {
    updateMutation.mutate({ data: formData }, {
      onSuccess: () => {
        toast({ title: "Profile complete", description: "Welcome to Dowry.Africa." });
        setLocation("/discover");
      }
    });
  };

  const heritages = ["Igbo", "Yoruba", "Akan", "Zulu", "Kikuyu", "Hausa", "Amhara", "Shona", "Oromo", "Swahili", "Other"];

  const toggleHeritage = (h: string) => {
    setFormData(prev => ({
      ...prev,
      heritage: prev.heritage.includes(h) 
        ? prev.heritage.filter(x => x !== h)
        : [...prev.heritage, h]
    }));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-border/50">
        
        {/* Progress bar */}
        <div className="flex h-1.5 w-full bg-secondary">
           <div className="bg-primary transition-all duration-500 ease-out" style={{ width: `${(step / 4) * 100}%` }} />
        </div>

        <div className="p-8 sm:p-12 relative min-h-[500px]">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="space-y-6">
                <h2 className="text-3xl font-display font-bold">What are you looking for?</h2>
                <p className="text-muted-foreground text-lg">Dowry.Africa is a community for intentional dating.</p>
                
                <div className="space-y-4 mt-8">
                  {[
                    { id: 'marriage_ready', label: 'Marriage Ready', desc: 'Looking to get married within 1-2 years.' },
                    { id: 'serious_relationship', label: 'Serious Relationship', desc: 'Looking for a committed partner to build a life with.' },
                    { id: 'friendship_first', label: 'Friendship First', desc: 'Open to a relationship, but want to start as friends.' }
                  ].map(opt => (
                    <button 
                      key={opt.id}
                      onClick={() => setFormData({...formData, intent: opt.id})}
                      className={`w-full text-left p-6 rounded-2xl border-2 transition-all ${formData.intent === opt.id ? 'border-primary bg-primary/5 shadow-md' : 'border-border hover:border-primary/30'}`}
                    >
                      <h3 className="font-bold text-lg text-foreground">{opt.label}</h3>
                      <p className="text-muted-foreground mt-1">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="space-y-6">
                <h2 className="text-3xl font-display font-bold">Cultural Roots</h2>
                <p className="text-muted-foreground text-lg">Shared heritage often forms a strong foundation.</p>
                
                <div className="mt-8 space-y-6">
                  <div>
                    <label className="block font-medium mb-3">Heritage / Ethnicity</label>
                    <div className="flex flex-wrap gap-2">
                      {heritages.map(h => (
                        <button
                          key={h}
                          onClick={() => toggleHeritage(h)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${formData.heritage.includes(h) ? 'bg-primary text-white border-primary shadow-md' : 'bg-white text-foreground hover:bg-secondary border-border'}`}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block font-medium mb-2">Faith</label>
                    <select 
                      value={formData.faith}
                      onChange={e => setFormData({...formData, faith: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Select faith</option>
                      <option value="Christianity">Christianity</option>
                      <option value="Islam">Islam</option>
                      <option value="Traditional">Traditional</option>
                      <option value="Spiritual but not religious">Spiritual but not religious</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="space-y-6">
                <h2 className="text-3xl font-display font-bold">Location & Life Stage</h2>
                
                <div className="mt-8 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-foreground/80">City</label>
                      <input 
                        type="text" 
                        value={formData.city}
                        onChange={e => setFormData({...formData, city: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        placeholder="e.g. London"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-foreground/80">Country</label>
                      <input 
                        type="text" 
                        value={formData.country}
                        onChange={e => setFormData({...formData, country: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        placeholder="e.g. UK"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-medium mb-2">Life Stage</label>
                    <select 
                      value={formData.lifeStage}
                      onChange={e => setFormData({...formData, lifeStage: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Select life stage</option>
                      <option value="Established Career">Established Career</option>
                      <option value="Building Career">Building Career</option>
                      <option value="Entrepreneur">Entrepreneur</option>
                      <option value="Student/Postgrad">Student/Postgrad</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium mb-2">Marriage Timeline</label>
                    <select 
                      value={formData.marriageTimeline}
                      onChange={e => setFormData({...formData, marriageTimeline: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Select timeline</option>
                      <option value="Within 1 year">Within 1 year</option>
                      <option value="1-2 years">1-2 years</option>
                      <option value="3+ years">3+ years</option>
                      <option value="Not sure yet">Not sure yet</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="step4" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="space-y-6">
                <h2 className="text-3xl font-display font-bold">Your Story</h2>
                <p className="text-muted-foreground text-lg">Let your personality shine.</p>
                
                <div className="mt-8 space-y-5">
                  <div>
                    <label className="block font-medium mb-2">Personal Quote or Mantra</label>
                    <input 
                      type="text" 
                      value={formData.quote}
                      onChange={e => setFormData({...formData, quote: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-display italic"
                      placeholder='"Family is everything to me"'
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-2">Bio</label>
                    <textarea 
                      value={formData.bio}
                      onChange={e => setFormData({...formData, bio: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 min-h-[120px] resize-none"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="absolute bottom-8 left-8 right-8 flex justify-between pt-6 border-t border-border/50 bg-white">
            {step > 1 ? (
              <button onClick={prevStep} className="px-6 py-3 font-medium text-muted-foreground hover:text-foreground transition-colors">
                Back
              </button>
            ) : <div />}
            
            {step < 4 ? (
              <button onClick={nextStep} className="px-8 py-3 bg-primary text-white rounded-full font-medium shadow-md shadow-primary/20 hover:-translate-y-0.5 transition-all flex items-center gap-2">
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleComplete} disabled={updateMutation.isPending} className="px-8 py-3 bg-foreground text-white rounded-full font-medium shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2">
                {updateMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Complete Profile"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
