import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Check, Zap, Shield, BarChart3, Mail, Phone, Building2, Clock, ChevronRight, ArrowRight, Globe, Database, RefreshCw, Send, Target, Eye, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { USMap } from "@/components/USMap";
import { PricingSection } from "@/components/PricingSection";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";

const LIVE_COUNT = "140,000+";
const STAT_STATES = "11";
const STAT_UPDATE = "Weekly";

function CountUp({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target]);
  return <>{count.toLocaleString()}{suffix}</>;
}

export default function Landing() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100" data-testid="nav-bar">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
              <Mail className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-gray-900" data-testid="brand-name">EveryNewCustomer</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-600">
            <button onClick={() => scrollTo("features")} className="hover:text-gray-900 transition-colors">Features</button>
            <button onClick={() => scrollTo("coverage")} className="hover:text-gray-900 transition-colors">Coverage</button>
            <button onClick={() => scrollTo("pricing")} className="hover:text-gray-900 transition-colors">Pricing</button>
            <button onClick={() => scrollTo("faq")} className="hover:text-gray-900 transition-colors">FAQ</button>
            <Link href="/campaigns" className="text-emerald-600 font-medium hover:text-emerald-700 transition-colors">Campaigns</Link>
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors">See the Data</Link>
          </div>
          <Link href="/campaign/new">
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-5 text-sm"
              data-testid="nav-cta"
            >
              Start Your Campaign
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-24 sm:pt-28 sm:pb-32">
        {/* Subtle grid bg */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-emerald-50 via-green-50/50 to-transparent rounded-full blur-3xl opacity-60 -translate-y-1/2 translate-x-1/4" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-6 bg-emerald-50 text-emerald-700 border-emerald-200/60 px-3 py-1.5 text-xs font-medium rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block mr-2 animate-pulse" />
              Automated direct mail — set it and forget it
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight text-gray-900 leading-[1.1] mb-6" data-testid="hero-heading">
              Automatically reach every{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-500">
                new business
              </span>{" "}
              in your market
            </h1>

            <p className="text-lg sm:text-xl text-gray-500 leading-relaxed mb-10 max-w-2xl">
              New LLCs and corporations filed this week get your postcard by next week. Pick your template, choose your states, and we handle the rest — fully automated.
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-4 mb-14">
              <Link href="/campaign/new">
                <Button
                  size="lg"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-8 h-12 text-base shadow-lg shadow-emerald-200/50"
                  data-testid="hero-cta"
                >
                  Start Your Campaign
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="rounded-full px-8 h-12 text-base border-gray-200 text-gray-600 hover:bg-gray-50"
                onClick={() => scrollTo("coverage")}
                data-testid="hero-secondary-cta"
              >
                View Coverage Map
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6" data-testid="hero-stats">
              {[
                { value: <CountUp target={140000} suffix="+" />, label: "Entities Tracked" },
                { value: STAT_STATES, label: "States Live" },
                { value: "Direct to Mailbox", label: "Delivery Method" },
                { value: STAT_UPDATE, label: "Sending Frequency" },
              ].map((stat, i) => (
                <div key={i} className="text-left">
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="py-10 border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-center text-sm text-gray-400 mb-6 font-medium uppercase tracking-wider">Perfect for businesses that sell to new companies</p>
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-4 items-center opacity-40">
            {["Insurance Agencies", "Accounting Firms", "Commercial Real Estate", "Payment Processors", "Marketing Agencies", "Legal Services"].map((name) => (
              <span key={name} className="text-sm font-semibold text-gray-600 tracking-wide">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="secondary" className="mb-4 bg-emerald-50 text-emerald-700 border-emerald-200/60 px-3 py-1 text-xs rounded-full">
              Features
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-4">
              Mail that sends itself
            </h2>
            <p className="text-gray-500 text-lg">
              Choose a template, pick your states, and every new business filing automatically receives your postcard.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6" data-testid="features-grid">
            {/* Feature 1 - Automated */}
            <Card className="p-8 border border-gray-100 bg-white hover:border-emerald-200/60 hover:shadow-lg hover:shadow-emerald-50/50 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-5 group-hover:bg-emerald-100 transition-colors">
                <Send className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Fully Automated Sending</h3>
              <p className="text-gray-500 leading-relaxed mb-4">
                New businesses file every week. Your postcard goes out automatically — no manual work, no spreadsheets, no trips to the post office. Set it once and let it run.
              </p>
              <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                <Clock className="w-4 h-4" />
                Postcards sent within days of filing
              </div>
            </Card>

            {/* Feature 2 - Templates */}
            <Card className="p-8 border border-gray-100 bg-white hover:border-emerald-200/60 hover:shadow-lg hover:shadow-emerald-50/50 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-5 group-hover:bg-green-100 transition-colors">
                <Sparkles className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Professional Templates</h3>
              <p className="text-gray-500 leading-relaxed mb-4">
                Industry-specific postcard designs for insurance, accounting, real estate, payments, and more. Add your branding, headline, and offer — preview instantly.
              </p>
              <div className="flex flex-wrap gap-3 text-xs">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700">
                  <Shield className="w-3 h-3" /> Insurance
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                  <BarChart3 className="w-3 h-3" /> Accounting
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 text-teal-700">
                  <Building2 className="w-3 h-3" /> Real Estate
                </span>
              </div>
            </Card>

            {/* Feature 3 - Tracking */}
            <Card className="p-8 border border-gray-100 bg-white hover:border-emerald-200/60 hover:shadow-lg hover:shadow-emerald-50/50 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center mb-5 group-hover:bg-teal-100 transition-colors">
                <Eye className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Real-Time Tracking</h3>
              <p className="text-gray-500 leading-relaxed mb-4">
                Know exactly what's happening with every piece of mail. Track sent, in transit, and delivered status for every postcard in your campaign dashboard.
              </p>
              <div className="flex items-center gap-2 text-sm text-teal-600 font-medium">
                <RefreshCw className="w-4 h-4" />
                Status updates via Lob delivery tracking
              </div>
            </Card>

            {/* Feature 4 - Targeting */}
            <Card className="p-8 border border-gray-100 bg-white hover:border-emerald-200/60 hover:shadow-lg hover:shadow-emerald-50/50 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-cyan-50 flex items-center justify-center mb-5 group-hover:bg-cyan-100 transition-colors">
                <Target className="w-6 h-6 text-cyan-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Precise Targeting</h3>
              <p className="text-gray-500 leading-relaxed mb-4">
                Target by state, entity type (LLC, Corporation, etc.), and more. Reach exactly the businesses most likely to need your services — no wasted spend.
              </p>
              <div className="flex items-center gap-2 text-sm text-cyan-600 font-medium">
                <Globe className="w-4 h-4" />
                11 states live, more added monthly
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-gray-50/70 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-4">How it works</h2>
            <p className="text-gray-500 text-lg">From new business filing to postcard in mailbox — three steps.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Pick a template & customize",
                desc: "Choose from our industry-specific postcard designs. Add your company name, headline, offer, and return address. Preview your mailer instantly.",
              },
              {
                step: "02",
                title: "Choose your target states",
                desc: "Select the states you want to reach. Optionally filter by entity type. We'll show you estimated weekly volume and cost.",
              },
              {
                step: "03",
                title: "Activate & let it run",
                desc: "Hit activate and we take care of the rest. Every week when new businesses file, your postcard goes out automatically via USPS first-class mail.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 flex items-center justify-center mx-auto mb-5 shadow-sm">
                  <span className="text-lg font-bold text-emerald-600">{item.step}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coverage Map */}
      <section id="coverage" className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="secondary" className="mb-4 bg-emerald-50 text-emerald-700 border-emerald-200/60 px-3 py-1 text-xs rounded-full">
              Coverage
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-4">
              Growing across all 50 states
            </h2>
            <p className="text-gray-500 text-lg">
              We monitor official state registries and send your postcards to every new filing. Here's where we are today.
            </p>
          </div>
          <USMap />
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 sm:py-28 bg-gray-50/70 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="secondary" className="mb-4 bg-emerald-50 text-emerald-700 border-emerald-200/60 px-3 py-1 text-xs rounded-full">
              Pricing
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-4">
              Pay only for the states you need
            </h2>
            <p className="text-gray-500 text-lg">
              Start with one state, add more as you grow. Postage and printing included in per-piece pricing.
            </p>
          </div>
          <PricingSection />
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 sm:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-4">
              Frequently asked questions
            </h2>
          </div>
          <Accordion type="single" collapsible className="space-y-3" data-testid="faq-section">
            {[
              {
                q: "How does automated direct mail work?",
                a: "You create a campaign by choosing a postcard template, customizing it with your branding and offer, and selecting target states. Every week, when new businesses file with the Secretary of State, we automatically send your postcard to each one via USPS first-class mail.",
              },
              {
                q: "How fresh is the data?",
                a: "Our automated pipelines run weekly. Most entities appear in our system within 3-7 days of their official filing date. Postcards are sent the same week the filing is processed.",
              },
              {
                q: "What does a postcard cost?",
                a: "Postcards cost approximately $0.70 each including printing and first-class postage. Volume varies by state — a high-filing state like Texas or Florida might send hundreds per week, while smaller states send dozens.",
              },
              {
                q: "Can I customize the postcard design?",
                a: "Yes. We offer industry-specific templates for insurance, accounting, real estate, payments, and more. You customize the headline, offer text, contact details, and return address. You can preview the postcard before activating.",
              },
              {
                q: "What states are available?",
                a: "We're currently live in 11 states including TX, FL, NY, and CA — with more added monthly. You can target any combination of states in your campaign.",
              },
              {
                q: "Can I also access the raw business data?",
                a: "Yes. The database explorer is still available — search, filter, and export new business filings as CSV. Direct mail automation is an additional feature built on top of the same data.",
              },
            ].map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-gray-100 rounded-xl px-6 data-[state=open]:border-emerald-200/60 data-[state=open]:bg-emerald-50/20 transition-colors">
                <AccordionTrigger className="text-left text-base font-medium text-gray-900 hover:no-underline py-5">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-gray-500 leading-relaxed pb-5">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-24 bg-gradient-to-br from-emerald-600 via-green-600 to-emerald-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
            Be the first in their mailbox
          </h2>
          <p className="text-lg text-emerald-100 mb-10 max-w-xl mx-auto">
            Every week, thousands of new businesses launch. Make sure yours is the first offer they see.
          </p>
          <Link href="/campaign/new">
            <Button
              size="lg"
              className="bg-white text-emerald-700 hover:bg-emerald-50 rounded-full px-10 h-13 text-base font-semibold shadow-xl shadow-emerald-900/20"
              data-testid="bottom-cta"
            >
              Start Your Campaign
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                <Mail className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-900">EveryNewCustomer</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <Link href="/campaigns" className="hover:text-gray-600 transition-colors">Campaigns</Link>
              <Link href="/dashboard" className="hover:text-gray-600 transition-colors">Database</Link>
              <span>&copy; {new Date().getFullYear()} EveryNewCustomer. All rights reserved.</span>
            </div>
          </div>
          <div className="mt-6 text-center">
            <PerplexityAttribution />
          </div>
        </div>
      </footer>
    </div>
  );
}
