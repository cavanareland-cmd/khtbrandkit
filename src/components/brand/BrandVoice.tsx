import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, X, Heart, Shield, Sparkles, Users, Star, Award, BookOpen, Compass } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useBrandKit } from "@/hooks/useBrandKit";
import EditButton from "./admin/EditButton";
import VoiceEditor from "./admin/VoiceEditor";

const ICON_MAP: Record<string, LucideIcon> = {
  Shield, Heart, Sparkles, Users, Star, Award, BookOpen, Compass,
};

type Personality = { icon: string; title: string; desc: string };
type Usage = { q: string; do: string[]; dont: string[] };

const BrandVoice = () => {
  const personality = useBrandKit("voice_personality");
  const voiceDo = useBrandKit("voice_do");
  const voiceDont = useBrandKit("voice_dont");
  const usage = useBrandKit("voice_usage");
  const [editorOpen, setEditorOpen] = useState(false);

  const personalityList: Personality[] = personality.entries.map((e) => e.data as unknown as Personality);
  const doList = voiceDo.entries.map((e) => (e.data as { text: string }).text);
  const dontList = voiceDont.entries.map((e) => (e.data as { text: string }).text);
  const usageList: Usage[] = usage.entries.map((e) => e.data as unknown as Usage);

  const voiceExamples = [
    { label: "Yang Kami Katakan", items: doList, type: "do" as const },
    { label: "Yang Kami Hindari", items: dontList, type: "dont" as const },
  ];

  return (
    <section id="voice" className="py-24 bg-gradient-soft relative overflow-hidden">
      <div className="absolute inset-0 arabesque-pattern opacity-50" />
      <div className="container relative">
        <div className="max-w-2xl mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="font-alt text-xs uppercase tracking-[0.3em] text-accent mb-4">05 — Brand Voice</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-secondary mb-4">Panduan Gaya & Suara</h2>
            <p className="text-lg text-muted-foreground">
              Cara KHT berkomunikasi dengan jamaah — penuh hormat, jelas, dan menenangkan.
            </p>
          </div>
          <EditButton onClick={() => setEditorOpen(true)} label="Edit Voice" />
        </div>

        <Tabs defaultValue="personality" className="w-full mt-8">
          <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-3 bg-card border border-border p-1.5 h-auto rounded-full shadow-md mb-10">
            <TabsTrigger value="personality" className="rounded-full font-alt text-xs uppercase tracking-widest data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-elegant px-6 py-2.5">
              Kepribadian
            </TabsTrigger>
            <TabsTrigger value="voice" className="rounded-full font-alt text-xs uppercase tracking-widest data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-elegant px-6 py-2.5">
              Gaya Bahasa
            </TabsTrigger>
            <TabsTrigger value="usage" className="rounded-full font-alt text-xs uppercase tracking-widest data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-elegant px-6 py-2.5">
              Dos & Don'ts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personality" className="mt-0">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {personalityList.map((p) => {
                const Icon = ICON_MAP[p.icon] ?? Sparkles;
                return (
                  <div key={p.title} className="group rounded-2xl bg-card border border-border p-7 shadow-md hover:shadow-elegant hover:-translate-y-1 transition-smooth">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-primary flex items-center justify-center mb-5 shadow-elegant group-hover:scale-110 transition-smooth">
                      <Icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <h3 className="font-display text-2xl font-bold text-secondary mb-2">{p.title}</h3>
                    <p className="text-sm text-foreground/70 leading-relaxed">{p.desc}</p>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="voice" className="mt-0">
            <div className="grid md:grid-cols-2 gap-6">
              {voiceExamples.map((v) => (
                <div
                  key={v.label}
                  className={`rounded-2xl border p-8 shadow-md ${v.type === "do" ? "bg-card border-primary/20" : "bg-card border-destructive/20"}`}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${v.type === "do" ? "bg-primary text-primary-foreground" : "bg-destructive text-destructive-foreground"}`}>
                      {v.type === "do" ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                    </div>
                    <h3 className="font-display text-xl font-bold text-foreground">{v.label}</h3>
                  </div>
                  <ul className="space-y-4">
                    {v.items.map((item, i) => (
                      <li key={i} className="flex gap-3 items-start">
                        <span className={`mt-2 h-1.5 w-1.5 rounded-full shrink-0 ${v.type === "do" ? "bg-primary" : "bg-destructive"}`} />
                        <p className={`text-base leading-relaxed ${v.type === "do" ? "text-foreground italic font-display" : "text-foreground/60 line-through"}`}>
                          "{item}"
                        </p>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 pt-6 border-t border-border">
                    <p className="font-alt text-[10px] uppercase tracking-widest text-muted-foreground">
                      {v.type === "do" ? "Tone: Tenang, Hormat, Berkah" : "Hindari: Berlebihan, Agresif, Spam"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="usage" className="mt-0">
            <div className="rounded-2xl bg-card border border-border shadow-md overflow-hidden">
              <Accordion type="single" collapsible className="w-full">
                {usageList.map((item, i) => (
                  <AccordionItem key={i} value={`item-${i}`} className="border-b border-border last:border-0 px-6">
                    <AccordionTrigger className="font-display text-lg font-semibold hover:text-primary py-6">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="pb-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <p className="flex items-center gap-2 font-alt text-xs uppercase tracking-widest text-primary mb-3">
                            <Check className="h-4 w-4" /> Boleh
                          </p>
                          <ul className="space-y-2">
                            {(item.do ?? []).map((d, j) => (
                              <li key={j} className="text-sm text-foreground/80 flex gap-2">
                                <span className="text-primary mt-1">✓</span>{d}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="flex items-center gap-2 font-alt text-xs uppercase tracking-widest text-destructive mb-3">
                            <X className="h-4 w-4" /> Tidak Boleh
                          </p>
                          <ul className="space-y-2">
                            {(item.dont ?? []).map((d, j) => (
                              <li key={j} className="text-sm text-foreground/60 flex gap-2">
                                <span className="text-destructive mt-1">✗</span>{d}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <VoiceEditor open={editorOpen} onOpenChange={setEditorOpen} />
    </section>
  );
};

export default BrandVoice;
