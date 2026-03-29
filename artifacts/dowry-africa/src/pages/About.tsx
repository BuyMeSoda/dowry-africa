import { Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { motion } from "framer-motion";

export default function About() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero split section */}
        <section className="relative overflow-hidden">
          <div className="container mx-auto px-4 md:px-8">
            <div className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)]">

              {/* Image column */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.9 }}
                className="w-full lg:w-[48%] lg:sticky lg:top-20 lg:self-start"
              >
                <div className="relative aspect-[3/4] lg:aspect-auto lg:h-[calc(100vh-120px)] rounded-3xl overflow-hidden shadow-2xl mt-10 lg:mt-10">
                  <img
                    src={`${import.meta.env.BASE_URL}images/about-couple.png`}
                    alt="An elegant African couple"
                    className="w-full h-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                  {/* Pull-quote overlay */}
                  <div className="absolute bottom-8 left-8 right-8">
                    <p className="font-display text-white text-xl md:text-2xl font-bold leading-snug drop-shadow-lg">
                      "Not just matches.<br />
                      <span className="text-primary">But marriages.</span>"
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Text column */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.15 }}
                className="w-full lg:w-[52%] lg:pl-16 xl:pl-20 py-12 lg:py-20 flex flex-col justify-center"
              >
                {/* Label */}
                <p className="text-primary font-semibold text-sm tracking-widest uppercase mb-6">
                  Our Story
                </p>

                {/* Headline */}
                <h1 className="font-display font-bold text-4xl md:text-5xl xl:text-6xl text-foreground leading-[1.1] mb-12">
                  Why we built<br />Dowry.Africa
                </h1>

                {/* Body */}
                <div className="space-y-7 text-[1.1rem] leading-[1.85] text-foreground/80 max-w-xl">

                  <p>
                    Dowry.Africa was born from a simple truth:{" "}
                    <span className="text-primary font-semibold">Modern dating is broken.</span>
                  </p>

                  <p>
                    Endless talking stages. Unclear intentions. People looking for everything — except something real.
                  </p>

                  <p>
                    For Africans, both at home and across the diaspora, the challenge is even deeper. We are navigating love between cultures, across borders, and within traditions that once guided relationships — but no longer fit the world we live in today.
                  </p>

                  <div className="w-12 h-px bg-primary/40 my-2" />

                  <p>
                    Dowry.Africa is not about the past. It is about redefining what commitment looks like today.
                  </p>

                  <p>
                    A place where intention matters. Where values matter. Where people show up ready — not just curious.
                  </p>

                  <p>
                    We are building a platform for Africans who are done with games, and ready to build something real.
                  </p>

                  <p className="text-foreground font-semibold text-lg leading-relaxed">
                    <span className="text-primary">Not just matches. But marriages. Families. Futures.</span>
                  </p>

                  <p className="text-foreground font-semibold text-lg">
                    <span className="text-primary">Dowry.Africa is where serious people come.</span>
                  </p>
                </div>

                {/* CTA */}
                <div className="mt-12">
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 px-10 py-4 bg-primary text-primary-foreground rounded-full font-semibold text-base shadow-lg shadow-primary/30 hover:bg-primary/90 hover:-translate-y-0.5 transition-all duration-300"
                  >
                    Apply for Membership
                  </Link>
                  <p className="text-muted-foreground text-sm mt-4">
                    Verified members only. We review every application personally.
  </p>
                </div>
              </motion.div>

            </div>
          </div>
        </section>

        {/* Values strip */}
        <section className="bg-foreground text-background py-16 mt-8">
          <div className="container mx-auto px-4 md:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
              <div>
                <p className="font-display text-3xl font-bold text-primary mb-2">Intention</p>
                <p className="text-background/60 text-sm leading-relaxed">Every member is here for one reason — to find a life partner, not a talking stage.</p>
              </div>
              <div>
                <p className="font-display text-3xl font-bold text-primary mb-2">Culture</p>
                <p className="text-background/60 text-sm leading-relaxed">Built by Africans, for Africans — honouring where we come from and where we are going.</p>
              </div>
              <div>
                <p className="font-display text-3xl font-bold text-primary mb-2">Commitment</p>
                <p className="text-background/60 text-sm leading-relaxed">Not just matching people. Building marriages, families, and futures that last.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
