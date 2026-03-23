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
import { Check, Zap, Shield, BarChart3, Mail, Phone, Building2, Clock, ChevronRight, ArrowRight, Globe, Database, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { USMap } from "@/components/USMap";
import { PricingSection } from "@/components/PricingSection";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";

const LIVE_COUNT = "115,000+";
const STAT_STATES = "11";
const STAT_CONTACT_RATE = "50%+";
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
              <Database className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-gray-900" data-testid="brand-name">NewBizData</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-600">
            <button onClick={() => scrollTo("features")} className="hover:text-gray-900 transition-colors">Features</button>
            <button onClick={() => scrollTo("coverage")} className="hover:text-gray-900 transition-colors">Coverage</button>
            <button onClick={() => scrollTo("pricing")} className="hover:text-gray-900 transition-colors">Pricing</button>
            <button onClick={() => scrollTo("faq")} className="hover:text-gray-900 transition-colors">FAQ</button>
            <Link href="/dashboard" className="text-emerald-600 font-medium hover:text-emerald-700 transition-colors">See the Data</Link>
          </div>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-5 text-sm"
            onClick={() => scrollTo("pricing")}
            data-testid="nav-cta"
          >
            Get Started
          </Button>
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
              Live data from {STAT_STATES} states — updated weekly
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight text-gray-900 leading-[1.1] mb-6" data-testid="hero-heading">
              The most real-time database of{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-500">
                new businesses
              </span>{" "}
              in America
            </h1>

            <p className="text-lg sm:text-xl text-gray-500 leading-relaxed mb-10 max-w-2xl">
              Access freshly filed business entities within days of registration — enriched with verified contact data including email and phone. Stop buying stale leads.
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-4 mb-14">
              <Button
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-8 h-12 text-base shadow-lg shadow-emerald-200/50"
                onClick={() => scrollTo("pricing")}
                data-testid="hero-cta"
              >
                Start for $99/mo
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
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
                { value: <CountUp target={115000} suffix="+" />, label: "Entities Tracked" },
                { value: STAT_STATES, label: "States Live" },
                { value: STAT_CONTACT_RATE, label: "With Contact Info" },
                { value: STAT_UPDATE, label: "Update Frequency" },
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
          <p className="text-center text-sm text-gray-400 mb-6 font-medium uppercase tracking-wider">Trusted by sales teams, marketers, and service providers</p>
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-4 items-center opacity-40">
            {["Insurance Agencies", "Marketing Firms", "B2B SaaS", "Payroll Services", "Commercial Lenders", "Legal Services"].map((name) => (
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
              Fresh leads, not recycled lists
            </h2>
            <p className="text-gray-500 text-lg">
              We pull directly from state registries within days of filing — then enrich every record with verified contact data.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6" data-testid="features-grid">
            {/* Feature 1 - Real-time */}
            <Card className="p-8 border border-gray-100 bg-white hover:border-emerald-200/60 hover:shadow-lg hover:shadow-emerald-50/50 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-5 group-hover:bg-emerald-100 transition-colors">
                <Zap className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Real-Time Filings</h3>
              <p className="text-gray-500 leading-relaxed mb-4">
                New business entities appear in your dashboard within days of being registered with the Secretary of State — not weeks or months like traditional data providers.
              </p>
              <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                <Clock className="w-4 h-4" />
                Updated weekly from official state registries
              </div>
            </Card>

            {/* Feature 2 - Enriched Contacts */}
            <Card className="p-8 border border-gray-100 bg-white hover:border-emerald-200/60 hover:shadow-lg hover:shadow-emerald-50/50 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-5 group-hover:bg-green-100 transition-colors">
                <Mail className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Enriched Contact Data</h3>
              <p className="text-gray-500 leading-relaxed mb-4">
                Over 50% of listings include verified email addresses and phone numbers for key contacts — owners, registered agents, and officers. No more guessing.
              </p>
              <div className="flex flex-wrap gap-3 text-xs">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700">
                  <Mail className="w-3 h-3" /> Email Addresses
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                  <Phone className="w-3 h-3" /> Phone Numbers
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 text-teal-700">
                  <Building2 className="w-3 h-3" /> Business Addresses
                </span>
              </div>
            </Card>

            {/* Feature 3 - Coverage */}
            <Card className="p-8 border border-gray-100 bg-white hover:border-emerald-200/60 hover:shadow-lg hover:shadow-emerald-50/50 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center mb-5 group-hover:bg-teal-100 transition-colors">
                <Globe className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Nationwide Coverage</h3>
              <p className="text-gray-500 leading-relaxed mb-4">
                Currently live in 11 states including TX, FL, NY, and CA — with 15 more in progress and full 50-state coverage on the roadmap. New states added every month.
              </p>
              <div className="flex items-center gap-2 text-sm text-teal-600 font-medium">
                <RefreshCw className="w-4 h-4" />
                New states added monthly
              </div>
            </Card>

            {/* Feature 4 - API & Export */}
            <Card className="p-8 border border-gray-100 bg-white hover:border-emerald-200/60 hover:shadow-lg hover:shadow-emerald-50/50 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-cyan-50 flex items-center justify-center mb-5 group-hover:bg-cyan-100 transition-colors">
                <BarChart3 className="w-6 h-6 text-cyan-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">API Access & CSV Export</h3>
              <p className="text-gray-500 leading-relaxed mb-4">
                Download filtered lists as CSV or connect directly via our REST API. Filter by state, entity type, filing date, industry code, and more. Built for integration.
              </p>
              <div className="flex items-center gap-2 text-sm text-cyan-600 font-medium">
                <Shield className="w-4 h-4" />
                Structured data, ready for your CRM
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
            <p className="text-gray-500 text-lg">From state filing to your inbox in three steps.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "We monitor state registries",
                desc: "Automated pipelines connect to Secretary of State databases, SFTP feeds, and open data APIs across all 50 states.",
              },
              {
                step: "02",
                title: "We enrich every record",
                desc: "Each entity is matched with verified contact information — email, phone, registered agent, principal address, and industry classification.",
              },
              {
                step: "03",
                title: "You get fresh leads",
                desc: "Access your data through the dashboard, download CSV exports, or pull via API. Filter by state, date, entity type, and more.",
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
              We're building the most comprehensive real-time new business database in the country. Here's where we are today.
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
              Start with one state, add more as you grow. Every plan includes enriched contact data, weekly updates, and full export access.
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
                q: "Where does the data come from?",
                a: "We pull directly from official Secretary of State databases, open data APIs (Socrata, CKAN), SFTP feeds, and state registry websites. This is the same data used by government agencies — we just make it accessible and enriched.",
              },
              {
                q: "How fresh is the data?",
                a: "Our automated pipelines run weekly. Most entities appear in our database within 3-7 days of their official filing date. This is significantly faster than traditional lead providers who may lag by weeks or months.",
              },
              {
                q: "What contact data is included?",
                a: "Each entity record includes the business name, address, filing date, entity type, registered agent, and principal office address. Over 50% of listings also include verified email addresses and phone numbers for business contacts.",
              },
              {
                q: "Can I export the data?",
                a: "Yes. Every plan includes unlimited CSV exports. You can filter by date range, entity type, industry code, and more before downloading. API access is also available for automated workflows.",
              },
              {
                q: "How does the pricing work?",
                a: "Your first state is $99/month, which includes all enriched data and weekly updates. Each additional state is just $39/month. You can add or remove states at any time.",
              },
              {
                q: "What if my state isn't live yet?",
                a: "We're adding new states every month. If you need a specific state, let us know — we'll prioritize it and notify you when it goes live. You can also join the waitlist for early access.",
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
            Stop buying stale leads
          </h2>
          <p className="text-lg text-emerald-100 mb-10 max-w-xl mx-auto">
            Get access to the freshest new business data in America. Start with one state, scale to all 50.
          </p>
          <Button
            size="lg"
            className="bg-white text-emerald-700 hover:bg-emerald-50 rounded-full px-10 h-13 text-base font-semibold shadow-xl shadow-emerald-900/20"
            onClick={() => scrollTo("pricing")}
            data-testid="bottom-cta"
          >
            Get Started — $99/mo
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                <Database className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-900">NewBizData</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <span>&copy; {new Date().getFullYear()} NewBizData. All rights reserved.</span>
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
