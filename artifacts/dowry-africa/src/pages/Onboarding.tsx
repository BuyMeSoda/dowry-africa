import { useState } from "react";
import { useLocation } from "wouter";
import { useUpdateProfile } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { usePhotoUpload } from "@/hooks/usePhotoUpload";
import { useAuth } from "@/lib/auth";
import { motion, AnimatePresence } from "framer-motion";
import { COUNTRY_GROUPS } from "@/lib/country-options";
import { CountryMultiSelect } from "@/components/ui/CountryMultiSelect";
import { ChevronRight, Loader2, Camera } from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";

const TOTAL_STEPS = 5;

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const updateMutation = useUpdateProfile();
  const { uploading, progress, triggerPicker, inputRef, upload } = usePhotoUpload();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photoUploaded, setPhotoUploaded] = useState(false);

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
  });

  const nextStep = () => setStep(s => Math.min(TOTAL_STEPS, s + 1));
  const prevStep = () => setStep(s => Math.max(1, s - 1));

  const handleComplete = () => {
    updateMutation.mutate({ data: formData }, {
      onSuccess: () => {
        toast({ title: "Profile complete", description: "Welcome to Dowry.Africa." });
        setLocation("/discover");
      }
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-border/50">

        {/* Progress bar */}
        <div className="flex h-1.5 w-full bg-secondary">
          <div className="bg-primary transition-all duration-500 ease-out" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
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
                <h2 className="text-3xl font-display font-bold">Your Roots</h2>
                <p className="text-muted-foreground text-lg">Shared background often forms a strong foundation.</p>

                <div className="mt-8 space-y-6">
                  <div>
                    <label className="block font-medium mb-3">Country of origin</label>
                    <CountryMultiSelect
                      selected={formData.heritage}
                      onChange={heritage => setFormData(prev => ({ ...prev, heritage }))}
                      placeholder="Select countries of origin…"
                    />
                    {formData.heritage.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {formData.heritage.map(h => (
                          <span key={h} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">{h}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block font-medium mb-2">Faith</label>
                    <select
                      value={formData.faith}
                      onChange={e => setFormData({...formData, faith: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Select faith</option>
                      <option value="Christian">Christian</option>
                      <option value="Muslim">Muslim</option>
                      <option value="Traditional African">Traditional African</option>
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
                      <label className="block text-sm font-medium mb-2 text-foreground/80">Country of residence</label>
                      <select
                        value={formData.country}
                        onChange={e => setFormData({...formData, country: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">Select country…</option>
                        {COUNTRY_GROUPS.map(group => (
                          <optgroup key={group.group} label={group.group}>
                            {group.options.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
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

            {step === 5 && (
              <motion.div key="step5" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="space-y-6 flex flex-col items-center text-center">
                <h2 className="text-3xl font-display font-bold">Add your photo</h2>
                <p className="text-muted-foreground text-lg">A real photo gets 5× more connections. You can skip this and add one later.</p>

                <div className="mt-4 flex flex-col items-center gap-5">
                  <button
                    type="button"
                    onClick={triggerPicker}
                    disabled={uploading}
                    className="w-36 h-36 rounded-full overflow-hidden relative group focus:outline-none cursor-pointer border-4 border-border shadow-lg"
                    title="Add profile photo"
                  >
                    <UserAvatar
                      name={user?.name ?? ""}
                      photoUrl={previewUrl}
                      className="w-full h-full"
                      textClassName="text-5xl font-bold"
                    />
                    {uploading ? (
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                        <Loader2 className="w-7 h-7 text-white animate-spin mb-1" />
                        <span className="text-white text-xs font-semibold">{progress}%</span>
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-8 h-8 text-white" />
                      </div>
                    )}
                  </button>

                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setPreviewUrl(URL.createObjectURL(file));
                      const uploaded = await upload(file);
                      if (uploaded) {
                        setPhotoUploaded(true);
                        toast({ title: "Photo uploaded!", description: "Your profile photo is set." });
                      } else {
                        setPreviewUrl(null);
                        toast({ variant: "destructive", title: "Upload failed", description: "Please try again." });
                      }
                      e.target.value = "";
                    }}
                  />

                  {photoUploaded ? (
                    <div className="text-emerald-600 font-semibold text-sm">Photo uploaded successfully!</div>
                  ) : (
                    <button
                      type="button"
                      onClick={triggerPicker}
                      disabled={uploading}
                      className="px-6 py-3 border-2 border-primary text-primary rounded-full font-semibold hover:bg-primary/5 transition-colors disabled:opacity-50"
                    >
                      {uploading ? `Uploading… ${progress}%` : "Choose Photo"}
                    </button>
                  )}
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

            {step < TOTAL_STEPS ? (
              <button onClick={nextStep} className="px-8 py-3 bg-primary text-white rounded-full font-medium shadow-md shadow-primary/20 hover:-translate-y-0.5 transition-all flex items-center gap-2">
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center gap-3">
                {!photoUploaded && (
                  <button
                    onClick={handleComplete}
                    disabled={updateMutation.isPending}
                    className="px-6 py-3 text-muted-foreground font-medium hover:text-foreground transition-colors"
                  >
                    Skip
                  </button>
                )}
                <button
                  onClick={handleComplete}
                  disabled={updateMutation.isPending}
                  className="px-8 py-3 bg-foreground text-white rounded-full font-medium shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2"
                >
                  {updateMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Complete Profile"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
