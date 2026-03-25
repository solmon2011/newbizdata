import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, ArrowRight, Check, Shield, Calculator, Building2,
  CreditCard, Briefcase, Palette, ChevronRight, Mail, Phone,
  Globe, MapPin, Eye, Loader2, Sparkles, Send,
} from "lucide-react";
import type { CampaignTemplate } from "@shared/schema";

// ── Category metadata ──────────────────────────────────
const CATEGORIES: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  insurance: { label: "Insurance", icon: Shield, color: "bg-blue-50 text-blue-700 border-blue-200" },
  accounting: { label: "Accounting", icon: Calculator, color: "bg-green-50 text-green-700 border-green-200" },
  real_estate: { label: "Real Estate", icon: Building2, color: "bg-purple-50 text-purple-700 border-purple-200" },
  merchant_services: { label: "Payments", icon: CreditCard, color: "bg-orange-50 text-orange-700 border-orange-200" },
  general: { label: "General", icon: Briefcase, color: "bg-teal-50 text-teal-700 border-teal-200" },
  marketing: { label: "Marketing", icon: Palette, color: "bg-pink-50 text-pink-700 border-pink-200" },
};

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

const ENTITY_TYPES = ["LLC", "Corporation", "Nonprofit", "LP", "LLP"];

interface CustomFields {
  company_name: string;
  phone: string;
  email: string;
  website: string;
  headline: string;
  offer: string;
}

interface ReturnAddress {
  name: string;
  address_line1: string;
  city: string;
  state: string;
  zip: string;
}

export default function CampaignSetup() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);

  // Step 1: Template selection
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);

  // Step 2: Customization
  const [campaignName, setCampaignName] = useState("");
  const [customFields, setCustomFields] = useState<CustomFields>({
    company_name: "", phone: "", email: "", website: "", headline: "", offer: "",
  });
  const [returnAddress, setReturnAddress] = useState<ReturnAddress>({
    name: "", address_line1: "", city: "", state: "", zip: "",
  });

  // Step 3: Targeting
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedEntityTypes, setSelectedEntityTypes] = useState<string[]>([]);

  // Preview state
  const [previewHtml, setPreviewHtml] = useState<{ frontHtml: string; backHtml: string } | null>(null);
  const [showBack, setShowBack] = useState(false);

  // Fetch templates
  const { data: templates, isLoading: loadingTemplates } = useQuery<CampaignTemplate[]>({
    queryKey: ["/api/templates"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/templates");
      return res.json();
    },
  });

  // Fetch available states from the data
  const { data: filters } = useQuery<{ states: string[]; entityTypes: string[] }>({
    queryKey: ["/api/filters"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/filters");
      return res.json();
    },
  });

  // Estimate volume
  const { data: estimate, refetch: refetchEstimate } = useQuery<{ estimated: number }>({
    queryKey: ["/api/campaigns/estimate", selectedStates, selectedEntityTypes],
    queryFn: async () => {
      const res = await apiRequest("POST", "/api/campaigns/estimate", {
        states: selectedStates,
        entityTypes: selectedEntityTypes.length > 0 ? selectedEntityTypes : null,
      });
      return res.json();
    },
    enabled: selectedStates.length > 0,
  });

  // Preview template
  const fetchPreview = useCallback(async () => {
    if (!selectedTemplateId) return;
    try {
      const res = await apiRequest("POST", `/api/templates/${selectedTemplateId}/preview`, { customFields });
      const data = await res.json();
      setPreviewHtml(data);
    } catch { /* ignore */ }
  }, [selectedTemplateId, customFields]);

  useEffect(() => {
    if (step === 2 && selectedTemplateId) {
      const timer = setTimeout(fetchPreview, 500);
      return () => clearTimeout(timer);
    }
  }, [step, selectedTemplateId, customFields, fetchPreview]);

  useEffect(() => {
    if (step === 4 && selectedTemplateId) {
      fetchPreview();
    }
  }, [step, selectedTemplateId, fetchPreview]);

  // Create campaign mutation
  const createMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await apiRequest("POST", "/api/campaigns", {
        name: campaignName || `${templates?.find(t => t.id === selectedTemplateId)?.name} Campaign`,
        templateId: selectedTemplateId,
        states: selectedStates,
        entityTypes: selectedEntityTypes.length > 0 ? selectedEntityTypes : null,
        customFields,
        returnAddress,
        status,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      navigate("/campaigns");
    },
  });

  const selectedTemplate = templates?.find(t => t.id === selectedTemplateId);

  const canAdvance = () => {
    switch (step) {
      case 1: return !!selectedTemplateId;
      case 2: return customFields.company_name && customFields.headline && customFields.offer && returnAddress.name && returnAddress.address_line1 && returnAddress.city && returnAddress.state && returnAddress.zip;
      case 3: return selectedStates.length > 0;
      case 4: return true;
      default: return false;
    }
  };

  const toggleState = (st: string) => {
    setSelectedStates(prev => prev.includes(st) ? prev.filter(s => s !== st) : [...prev, st]);
  };

  const toggleEntityType = (t: string) => {
    setSelectedEntityTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const liveStates = filters?.states ?? [];

  return (
    <div className="min-h-screen bg-gray-50/80">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/campaigns">
              <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors" data-testid="back-link">
                <ArrowLeft className="w-4 h-4" /> Campaigns
              </button>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map(s => (
              <div
                key={s}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                  s === step ? "bg-emerald-100 text-emerald-700" :
                  s < step ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-400"
                }`}
              >
                {s < step ? <Check className="w-3 h-3" /> : null}
                {s === 1 ? "Template" : s === 2 ? "Customize" : s === 3 ? "Target" : "Review"}
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Step 1: Choose Template */}
        {step === 1 && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2" data-testid="step-heading">Choose a template</h1>
            <p className="text-gray-500 mb-8">Pick an industry-specific postcard design. You'll customize the content next.</p>

            {loadingTemplates ? (
              <div className="flex items-center justify-center py-16 text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading templates...
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates?.map((template) => {
                  const cat = CATEGORIES[template.category || "general"] || CATEGORIES.general;
                  const CatIcon = cat.icon;
                  const isSelected = selectedTemplateId === template.id;
                  return (
                    <Card
                      key={template.id}
                      className={`p-5 cursor-pointer transition-all border-2 hover:shadow-md ${
                        isSelected ? "border-emerald-500 bg-emerald-50/30 shadow-md" : "border-transparent hover:border-gray-200"
                      }`}
                      onClick={() => setSelectedTemplateId(template.id)}
                      data-testid={`template-card-${template.id}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cat.color.split(" ")[0]}`}>
                          <CatIcon className={`w-5 h-5 ${cat.color.split(" ")[1]}`} />
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 text-sm mb-1">{template.name}</h3>
                      <p className="text-xs text-gray-500 leading-relaxed mb-3">{template.description}</p>
                      <Badge variant="secondary" className={`text-[10px] ${cat.color}`}>
                        {cat.label}
                      </Badge>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Customize */}
        {step === 2 && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2" data-testid="step-heading">Customize your mailer</h1>
            <p className="text-gray-500 mb-8">Fill in your business details and messaging. Preview updates in real time.</p>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Form */}
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Campaign Name</label>
                  <input
                    type="text"
                    placeholder="My Direct Mail Campaign"
                    value={campaignName}
                    onChange={e => setCampaignName(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-white"
                    data-testid="input-campaign-name"
                  />
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900">Your Business Info</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Company Name *</label>
                      <input type="text" value={customFields.company_name} onChange={e => setCustomFields(f => ({ ...f, company_name: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400" data-testid="input-company-name" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Phone</label>
                      <input type="tel" value={customFields.phone} onChange={e => setCustomFields(f => ({ ...f, phone: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400" data-testid="input-phone" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Email</label>
                      <input type="email" value={customFields.email} onChange={e => setCustomFields(f => ({ ...f, email: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400" data-testid="input-email" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Website</label>
                      <input type="url" value={customFields.website} onChange={e => setCustomFields(f => ({ ...f, website: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400" data-testid="input-website" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Headline *</label>
                    <input type="text" value={customFields.headline} onChange={e => setCustomFields(f => ({ ...f, headline: e.target.value }))}
                      placeholder="e.g., Protect Your New Business Today"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400" data-testid="input-headline" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Offer / Message *</label>
                    <textarea value={customFields.offer} onChange={e => setCustomFields(f => ({ ...f, offer: e.target.value }))}
                      placeholder="Describe your offer or service..."
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 resize-none" data-testid="input-offer" />
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900">Return Address</h3>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Name / Company *</label>
                    <input type="text" value={returnAddress.name} onChange={e => setReturnAddress(a => ({ ...a, name: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400" data-testid="input-return-name" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Address *</label>
                    <input type="text" value={returnAddress.address_line1} onChange={e => setReturnAddress(a => ({ ...a, address_line1: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400" data-testid="input-return-address" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">City *</label>
                      <input type="text" value={returnAddress.city} onChange={e => setReturnAddress(a => ({ ...a, city: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400" data-testid="input-return-city" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">State *</label>
                      <input type="text" value={returnAddress.state} onChange={e => setReturnAddress(a => ({ ...a, state: e.target.value }))}
                        maxLength={2} placeholder="TX"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 uppercase" data-testid="input-return-state" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">ZIP *</label>
                      <input type="text" value={returnAddress.zip} onChange={e => setReturnAddress(a => ({ ...a, zip: e.target.value }))}
                        maxLength={10}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400" data-testid="input-return-zip" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-4">
                <div className="sticky top-20">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-gray-400" /> Live Preview
                    </h3>
                    <div className="flex gap-1">
                      <button onClick={() => setShowBack(false)} className={`px-3 py-1 text-xs rounded-md transition-all ${!showBack ? "bg-emerald-100 text-emerald-700" : "text-gray-500 hover:bg-gray-100"}`}>
                        Front
                      </button>
                      <button onClick={() => setShowBack(true)} className={`px-3 py-1 text-xs rounded-md transition-all ${showBack ? "bg-emerald-100 text-emerald-700" : "text-gray-500 hover:bg-gray-100"}`}>
                        Back
                      </button>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm" data-testid="preview-frame">
                    {previewHtml ? (
                      <div
                        className="w-full"
                        style={{ aspectRatio: "6/4" }}
                        dangerouslySetInnerHTML={{ __html: showBack ? previewHtml.backHtml : previewHtml.frontHtml }}
                      />
                    ) : (
                      <div className="flex items-center justify-center text-gray-400 text-sm" style={{ aspectRatio: "6/4" }}>
                        Start typing to see preview...
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 text-center">6" × 4" postcard — actual size may vary</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Target Audience */}
        {step === 3 && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2" data-testid="step-heading">Target audience</h1>
            <p className="text-gray-500 mb-8">Choose which states and entity types to send postcards to.</p>

            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" /> Select States *
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  States with data are highlighted. You can select any state — new filings will be mailed as data becomes available.
                </p>
                <div className="flex flex-wrap gap-2">
                  {US_STATES.map(st => {
                    const hasData = liveStates.includes(st);
                    const isSelected = selectedStates.includes(st);
                    return (
                      <button
                        key={st}
                        onClick={() => toggleState(st)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                          isSelected
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : hasData
                            ? "bg-white text-gray-700 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50"
                            : "bg-gray-50 text-gray-400 border-gray-100 hover:border-gray-200"
                        }`}
                        data-testid={`state-${st}`}
                      >
                        {st}
                        {hasData && !isSelected && <span className="ml-1 w-1.5 h-1.5 inline-block bg-emerald-400 rounded-full" />}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <button
                    onClick={() => setSelectedStates(liveStates)}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                    data-testid="select-all-live"
                  >
                    Select all live states
                  </button>
                  {selectedStates.length > 0 && (
                    <button
                      onClick={() => setSelectedStates([])}
                      className="text-xs text-gray-500 hover:text-gray-700"
                      data-testid="clear-states"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Filter by Entity Type (optional)</h3>
                <p className="text-xs text-gray-500 mb-4">Leave empty to target all entity types.</p>
                <div className="flex flex-wrap gap-2">
                  {ENTITY_TYPES.map(t => (
                    <button
                      key={t}
                      onClick={() => toggleEntityType(t)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
                        selectedEntityTypes.includes(t)
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white text-gray-700 border-gray-200 hover:border-emerald-300"
                      }`}
                      data-testid={`entity-type-${t}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {selectedStates.length > 0 && (
                <Card className="p-5 bg-emerald-50/50 border-emerald-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Estimated addressable businesses</p>
                      <p className="text-xs text-gray-500 mt-0.5">Based on current data with mailing addresses</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-emerald-700" data-testid="estimate-count">
                        {estimate ? estimate.estimated.toLocaleString() : "—"}
                      </p>
                      <p className="text-xs text-gray-500">~${((estimate?.estimated ?? 0) * 0.70 / 100).toFixed(0)}/batch at $0.70/pc</p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Review & Activate */}
        {step === 4 && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2" data-testid="step-heading">Review & activate</h1>
            <p className="text-gray-500 mb-8">Double-check everything before going live.</p>

            <div className="grid lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                {/* Summary cards */}
                <Card className="p-5">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Template</h3>
                  <div className="flex items-center gap-3">
                    {selectedTemplate && (
                      <>
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${CATEGORIES[selectedTemplate.category || "general"]?.color.split(" ")[0] || "bg-gray-50"}`}>
                          {(() => { const C = CATEGORIES[selectedTemplate.category || "general"]?.icon || Briefcase; return <C className="w-5 h-5 text-gray-700" />; })()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{selectedTemplate.name}</p>
                          <p className="text-xs text-gray-500">{selectedTemplate.size} postcard</p>
                        </div>
                      </>
                    )}
                  </div>
                </Card>

                <Card className="p-5">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Your Details</h3>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-gray-900">{customFields.company_name}</p>
                    {customFields.phone && <p className="text-gray-500 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{customFields.phone}</p>}
                    {customFields.email && <p className="text-gray-500 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{customFields.email}</p>}
                    {customFields.website && <p className="text-gray-500 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" />{customFields.website}</p>}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Headline</p>
                    <p className="text-sm font-medium text-gray-900">{customFields.headline}</p>
                  </div>
                </Card>

                <Card className="p-5">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Targeting</h3>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {selectedStates.map(st => (
                      <span key={st} className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 rounded border border-emerald-200">{st}</span>
                    ))}
                  </div>
                  {selectedEntityTypes.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">Entity types: {selectedEntityTypes.join(", ")}</p>
                  )}
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-500">Estimated reach</span>
                    <span className="text-sm font-bold text-emerald-700">{estimate ? estimate.estimated.toLocaleString() : "—"} businesses</span>
                  </div>
                </Card>

                <Card className="p-5">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Return Address</h3>
                  <p className="text-sm text-gray-900">{returnAddress.name}</p>
                  <p className="text-sm text-gray-500">{returnAddress.address_line1}</p>
                  <p className="text-sm text-gray-500">{returnAddress.city}, {returnAddress.state} {returnAddress.zip}</p>
                </Card>
              </div>

              {/* Preview */}
              <div>
                <div className="sticky top-20">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-gray-400" /> Preview
                    </h3>
                    <div className="flex gap-1">
                      <button onClick={() => setShowBack(false)} className={`px-3 py-1 text-xs rounded-md transition-all ${!showBack ? "bg-emerald-100 text-emerald-700" : "text-gray-500 hover:bg-gray-100"}`}>
                        Front
                      </button>
                      <button onClick={() => setShowBack(true)} className={`px-3 py-1 text-xs rounded-md transition-all ${showBack ? "bg-emerald-100 text-emerald-700" : "text-gray-500 hover:bg-gray-100"}`}>
                        Back
                      </button>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm" data-testid="review-preview">
                    {previewHtml ? (
                      <div
                        className="w-full"
                        style={{ aspectRatio: "6/4" }}
                        dangerouslySetInnerHTML={{ __html: showBack ? previewHtml.backHtml : previewHtml.frontHtml }}
                      />
                    ) : (
                      <div className="flex items-center justify-center text-gray-400 text-sm" style={{ aspectRatio: "6/4" }}>
                        Loading preview...
                      </div>
                    )}
                  </div>

                  <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-semibold text-gray-900">Estimated weekly cost</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-700">
                      ~${((estimate?.estimated ?? 0) * 0.70 / 100).toFixed(0)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Based on {estimate?.estimated.toLocaleString() ?? 0} mailings at $0.70 each. Actual volume varies weekly.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom nav */}
        <div className="mt-10 flex items-center justify-between border-t border-gray-200 pt-6">
          <Button
            variant="outline"
            onClick={() => setStep(s => Math.max(1, s - 1))}
            disabled={step === 1}
            className="rounded-full px-6"
            data-testid="btn-prev"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>

          <div className="flex gap-3">
            {step === 4 && (
              <Button
                variant="outline"
                onClick={() => createMutation.mutate("draft")}
                disabled={createMutation.isPending}
                className="rounded-full px-6"
                data-testid="btn-save-draft"
              >
                Save as Draft
              </Button>
            )}
            {step < 4 ? (
              <Button
                onClick={() => setStep(s => s + 1)}
                disabled={!canAdvance()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-6"
                data-testid="btn-next"
              >
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={() => createMutation.mutate("active")}
                disabled={createMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-6 shadow-lg shadow-emerald-200/50"
                data-testid="btn-activate"
              >
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                Activate Campaign
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
