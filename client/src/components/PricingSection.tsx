import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Plus, ArrowRight, Lock, Zap } from "lucide-react";
import { states, liveStates, inProgressStates, type StateInfo } from "@/lib/stateData";

const BASE_PRICE = 99;
const ADDON_PRICE = 39;
const ALL_STATES_PRICE = 699;
const ANNUAL_DISCOUNT = 0.33;

export function PricingSection() {
  const [selectedStates, setSelectedStates] = useState<Set<string>>(new Set());
  const [allStates, setAllStates] = useState(false);
  const [annual, setAnnual] = useState(true);

  const toggleState = (abbrev: string) => {
    if (allStates) return;
    setSelectedStates(prev => {
      const next = new Set(prev);
      if (next.has(abbrev)) {
        next.delete(abbrev);
      } else {
        next.add(abbrev);
      }
      return next;
    });
  };

  const toggleAllStates = () => {
    if (allStates) {
      setAllStates(false);
    } else {
      setAllStates(true);
      setSelectedStates(new Set());
    }
  };

  const count = allStates ? 50 : selectedStates.size;
  const monthlyPrice = allStates
    ? ALL_STATES_PRICE
    : count === 0
      ? 0
      : BASE_PRICE + Math.max(0, count - 1) * ADDON_PRICE;

  const effectiveMonthly = annual ? Math.round(monthlyPrice * (1 - ANNUAL_DISCOUNT)) : monthlyPrice;
  const annualTotal = effectiveMonthly * 12;
  const monthlySavings = annual ? monthlyPrice - effectiveMonthly : 0;

  return (
    <div className="space-y-10">
      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-3">
        <span className={`text-sm font-medium ${!annual ? "text-gray-900" : "text-gray-400"}`}>Monthly</span>
        <button
          onClick={() => setAnnual(!annual)}
          className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${annual ? "bg-emerald-600" : "bg-gray-300"}`}
          data-testid="billing-toggle"
          aria-label="Toggle annual billing"
        >
          <div className="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200" style={{ transform: annual ? 'translateX(30px)' : 'translateX(2px)' }} />
        </button>
        <span className={`text-sm font-medium ${annual ? "text-gray-900" : "text-gray-400"}`}>Annual</span>
        {annual && (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200/60 text-xs font-semibold">
            Save 33%
          </Badge>
        )}
      </div>

      {/* Pricing Summary Card */}
      <div className="max-w-2xl mx-auto">
        <Card className="border border-gray-200 bg-white rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-8 py-6 text-white">
            <div className="flex items-baseline justify-between flex-wrap gap-4">
              <div>
                <p className="text-emerald-100 text-sm font-medium mb-1">
                  {annual ? "Your annual total" : "Your monthly total"}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold tracking-tight" data-testid="price-total">
                    ${effectiveMonthly}
                  </span>
                  <span className="text-emerald-200 text-lg">/mo</span>
                </div>
                {annual && monthlyPrice > 0 && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-emerald-300 text-sm line-through">${monthlyPrice}/mo</span>
                    <span className="text-xs bg-white/20 rounded-full px-2 py-0.5 font-medium">
                      ${annualTotal.toLocaleString()}/yr
                    </span>
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-emerald-200 text-sm">
                  {count === 0 && "Select states below"}
                  {count === 50 && "All 50 states"}
                  {count > 0 && count < 50 && `${count} state${count > 1 ? "s" : ""} selected`}
                </p>
                {!allStates && count > 1 && (
                  <p className="text-emerald-100 text-xs mt-1">
                    $99 first state + ${(count - 1) * ADDON_PRICE} ({count - 1} x $39)
                  </p>
                )}
                {annual && monthlySavings > 0 && (
                  <p className="text-emerald-100 text-xs mt-1">
                    You save ${(monthlySavings * 12).toLocaleString()}/yr
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="px-8 py-6">
            <p className="text-sm font-medium text-gray-900 mb-4">Every plan includes:</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                "Weekly data updates",
                "Enriched contact data (email + phone)",
                "Unlimited CSV exports",
                "REST API access",
                "Filter by entity type & date",
                "Dashboard access",
              ].map((feat) => (
                <div key={feat} className="flex items-center gap-2.5 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  {feat}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Pricing tiers */}
      <div className="max-w-3xl mx-auto">
        <div className="grid sm:grid-cols-3 gap-4">
          <Card className="p-6 border border-gray-100 bg-white text-center">
            <div className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2">First State</div>
            <div className="flex items-baseline justify-center gap-1">
              {annual && <span className="text-lg text-gray-400 line-through mr-1">${BASE_PRICE}</span>}
              <span className="text-4xl font-bold text-gray-900">${annual ? Math.round(BASE_PRICE * (1 - ANNUAL_DISCOUNT)) : BASE_PRICE}</span>
            </div>
            <div className="text-sm text-gray-500">/month</div>
          </Card>
          <Card className="p-6 border border-gray-100 bg-white text-center">
            <div className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2">Each Additional</div>
            <div className="flex items-baseline justify-center gap-1">
              {annual && <span className="text-lg text-gray-400 line-through mr-1">${ADDON_PRICE}</span>}
              <span className="text-4xl font-bold text-gray-900">${annual ? Math.round(ADDON_PRICE * (1 - ANNUAL_DISCOUNT)) : ADDON_PRICE}</span>
            </div>
            <div className="text-sm text-gray-500">/month per state</div>
          </Card>
          <Card className={`p-6 text-center relative overflow-hidden transition-all ${allStates ? "border-2 border-emerald-500 bg-emerald-50/30 shadow-md shadow-emerald-100" : "border border-emerald-200 bg-white"}`}>
            <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">Best Value</div>
            <div className="text-xs text-emerald-600 uppercase tracking-wider font-medium mb-2">All 50 States</div>
            <div className="flex items-baseline justify-center gap-1">
              {annual && <span className="text-lg text-gray-400 line-through mr-1">${ALL_STATES_PRICE}</span>}
              <span className="text-4xl font-bold text-gray-900">${annual ? Math.round(ALL_STATES_PRICE * (1 - ANNUAL_DISCOUNT)) : ALL_STATES_PRICE}</span>
            </div>
            <div className="text-sm text-gray-500">/month</div>
            <button
              onClick={toggleAllStates}
              className={`mt-3 w-full py-2 rounded-lg text-sm font-semibold transition-all ${allStates ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"}`}
              data-testid="all-states-btn"
            >
              {allStates ? (
                <span className="inline-flex items-center gap-1.5"><Check className="w-4 h-4" /> Selected</span>
              ) : (
                <span className="inline-flex items-center gap-1.5"><Zap className="w-4 h-4" /> Select All States</span>
              )}
            </button>
          </Card>
        </div>
      </div>

      {/* State Selector */}
      <div className="max-w-4xl mx-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">
          {allStates ? "All states included" : "Choose your states"}
        </h3>
        {allStates && (
          <p className="text-sm text-gray-500 text-center mb-6">
            Every state — live, in progress, and coming soon — included in your plan.
          </p>
        )}

        {/* Live States */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-sm font-medium text-gray-900">Live & Updating Weekly</span>
            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200/60 text-xs ml-1">
              {liveStates.length} states
            </Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3" data-testid="live-state-selector">
            {liveStates.map((state) => (
              <StateCard
                key={state.abbrev}
                state={state}
                selected={allStates || selectedStates.has(state.abbrev)}
                onToggle={toggleState}
                disabled={false}
                allStatesMode={allStates}
              />
            ))}
          </div>
        </div>

        {/* In Progress States */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <span className="text-sm font-medium text-gray-900">In Progress</span>
            <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 border-yellow-200/60 text-xs ml-1">
              {inProgressStates.length} states
            </Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3" data-testid="progress-state-selector">
            {inProgressStates.map((state) => (
              <StateCard
                key={state.abbrev}
                state={state}
                selected={allStates}
                onToggle={toggleState}
                disabled={!allStates}
                allStatesMode={allStates}
              />
            ))}
          </div>
        </div>

        {/* Get Started CTA */}
        {(count > 0 || allStates) && (
          <div className="text-center mt-10">
            <Button
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-10 h-13 text-base font-semibold shadow-lg shadow-emerald-200/50"
              data-testid="pricing-cta"
            >
              Get Started — ${effectiveMonthly}/mo
              {annual && <span className="text-emerald-200 ml-1.5 text-sm font-normal">billed annually</span>}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <p className="text-sm text-gray-400 mt-3">
              {annual ? `$${annualTotal.toLocaleString()} billed annually. Cancel anytime.` : "Cancel anytime. No contracts."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function StateCard({
  state,
  selected,
  onToggle,
  disabled,
  allStatesMode,
}: {
  state: StateInfo;
  selected: boolean;
  onToggle: (abbrev: string) => void;
  disabled: boolean;
  allStatesMode: boolean;
}) {
  if (disabled && !allStatesMode) {
    return (
      <div
        className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50/50 opacity-60 cursor-not-allowed"
        data-testid={`state-card-${state.abbrev}`}
      >
        <Lock className="w-4 h-4 text-gray-400 shrink-0" />
        <div>
          <div className="text-sm font-medium text-gray-500">{state.name}</div>
          <div className="text-xs text-gray-400">Coming soon</div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => !allStatesMode && onToggle(state.abbrev)}
      className={`
        flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-left w-full
        ${allStatesMode
          ? "border-emerald-300 bg-emerald-50 cursor-default"
          : selected
            ? "border-emerald-300 bg-emerald-50 shadow-sm shadow-emerald-100"
            : "border-gray-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/30"
        }
      `}
      data-testid={`state-card-${state.abbrev}`}
    >
      <div className={`
        w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors
        ${selected
          ? "bg-emerald-600 text-white"
          : "bg-gray-100 text-gray-400"
        }
      `}>
        {selected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">{state.name}</div>
        {state.records && (
          <div className="text-xs text-gray-400">{state.records} entities</div>
        )}
      </div>
    </button>
  );
}
