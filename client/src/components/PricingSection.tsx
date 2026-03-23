import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Plus, Minus, ArrowRight, Lock } from "lucide-react";
import { states, liveStates, inProgressStates, type StateInfo } from "@/lib/stateData";

const BASE_PRICE = 99;
const ADDON_PRICE = 39;

export function PricingSection() {
  const [selectedStates, setSelectedStates] = useState<Set<string>>(new Set());

  const toggleState = (abbrev: string) => {
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

  const count = selectedStates.size;
  const monthlyPrice = count === 0 ? 0 : BASE_PRICE + Math.max(0, count - 1) * ADDON_PRICE;

  return (
    <div className="space-y-10">
      {/* Pricing Summary Card */}
      <div className="max-w-2xl mx-auto">
        <Card className="border border-gray-200 bg-white rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-8 py-6 text-white">
            <div className="flex items-baseline justify-between flex-wrap gap-4">
              <div>
                <p className="text-emerald-100 text-sm font-medium mb-1">Your monthly total</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold tracking-tight" data-testid="price-total">
                    ${monthlyPrice}
                  </span>
                  <span className="text-emerald-200 text-lg">/mo</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-emerald-200 text-sm">
                  {count === 0 && "Select states below"}
                  {count === 1 && "1 state selected"}
                  {count > 1 && `${count} states selected`}
                </p>
                {count > 1 && (
                  <p className="text-emerald-100 text-xs mt-1">
                    $99 first state + ${(count - 1) * ADDON_PRICE} ({count - 1} x $39)
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

      {/* Pricing breakdown */}
      <div className="max-w-2xl mx-auto">
        <div className="grid sm:grid-cols-2 gap-4">
          <Card className="p-6 border border-gray-100 bg-white text-center">
            <div className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2">First State</div>
            <div className="text-4xl font-bold text-gray-900 mb-1">$99</div>
            <div className="text-sm text-gray-500">/month</div>
          </Card>
          <Card className="p-6 border border-gray-100 bg-white text-center">
            <div className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2">Each Additional</div>
            <div className="text-4xl font-bold text-gray-900 mb-1">$39</div>
            <div className="text-sm text-gray-500">/month per state</div>
          </Card>
        </div>
      </div>

      {/* State Selector */}
      <div className="max-w-4xl mx-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">
          Choose your states
        </h3>

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
                selected={selectedStates.has(state.abbrev)}
                onToggle={toggleState}
                disabled={false}
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
                selected={selectedStates.has(state.abbrev)}
                onToggle={toggleState}
                disabled={true}
              />
            ))}
          </div>
        </div>

        {/* Get Started CTA */}
        {count > 0 && (
          <div className="text-center mt-10">
            <Button
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-10 h-13 text-base font-semibold shadow-lg shadow-emerald-200/50"
              data-testid="pricing-cta"
            >
              Get Started — ${monthlyPrice}/mo
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <p className="text-sm text-gray-400 mt-3">Cancel anytime. No contracts.</p>
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
}: {
  state: StateInfo;
  selected: boolean;
  onToggle: (abbrev: string) => void;
  disabled: boolean;
}) {
  if (disabled) {
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
      onClick={() => onToggle(state.abbrev)}
      className={`
        flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-left w-full
        ${selected
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
