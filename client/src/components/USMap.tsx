import { useState } from "react";
import { states, statePathData, stateCenters, type StateTier } from "@/lib/stateData";

const tierConfig = {
  live: { fill: "#16a34a", hover: "#15803d", label: "Live & Updating Weekly", textColor: "#166534" },
  in_progress: { fill: "#facc15", hover: "#eab308", label: "In Progress", textColor: "#854d0e" },
  coming_soon: { fill: "#e5e7eb", hover: "#d1d5db", label: "Coming Soon", textColor: "#6b7280" },
};

export function USMap() {
  const [hovered, setHovered] = useState<string | null>(null);
  const [tapped, setTapped] = useState<string | null>(null);
  const stateMap = new Map(states.map(s => [s.abbrev, s]));

  const getTier = (abbrev: string): StateTier => {
    return stateMap.get(abbrev)?.tier ?? "coming_soon";
  };

  const activeState = tapped ? stateMap.get(tapped) : hovered ? stateMap.get(hovered) : null;

  const handleTouch = (abbrev: string) => {
    setTapped(prev => prev === abbrev ? null : abbrev);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-3 sm:gap-6" data-testid="map-legend">
        {(Object.entries(tierConfig) as [StateTier, typeof tierConfig.live][]).map(([key, conf]) => (
          <div key={key} className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm border border-gray-200" style={{ backgroundColor: conf.fill }} />
            <span className="text-[11px] sm:text-sm text-gray-600">{conf.label}</span>
            <span className="text-[10px] sm:text-xs text-gray-400">
              ({states.filter(s => s.tier === key).length})
            </span>
          </div>
        ))}
      </div>

      {/* Map Container */}
      <div className="relative max-w-4xl mx-auto">
        <svg
          viewBox="0 0 975 610"
          className="w-full h-auto"
          data-testid="us-map"
          role="img"
          aria-label="Map of the United States showing data coverage by state"
        >
          {Object.entries(statePathData).map(([abbrev, path]) => {
            const tier = getTier(abbrev);
            const conf = tierConfig[tier];
            const isActive = hovered === abbrev || tapped === abbrev;
            return (
              <path
                key={abbrev}
                d={path}
                fill={isActive ? conf.hover : conf.fill}
                stroke="white"
                strokeWidth="1.5"
                strokeLinejoin="round"
                className="cursor-pointer transition-colors duration-150"
                onMouseEnter={() => setHovered(abbrev)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => handleTouch(abbrev)}
                data-testid={`state-${abbrev}`}
              />
            );
          })}

          {/* State labels — hidden on mobile via CSS media query */}
          <g className="state-labels">
            {Object.entries(stateCenters).map(([abbrev, [x, y]]) => {
              const tier = getTier(abbrev);
              const color = tier === "coming_soon" ? "#9ca3af" : tier === "in_progress" ? "#713f12" : "#ffffff";
              return (
                <text
                  key={`label-${abbrev}`}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="pointer-events-none select-none"
                  fill={color}
                  fontSize="12"
                  fontWeight="600"
                  fontFamily="system-ui, -apple-system, sans-serif"
                >
                  {abbrev}
                </text>
              );
            })}
          </g>
        </svg>

        {/* Tooltip */}
        {activeState && (
          <div className="absolute top-1 right-1 sm:top-4 sm:right-4 bg-white border border-gray-200 rounded-xl shadow-lg p-2.5 sm:p-4 min-w-[140px] sm:min-w-[200px] pointer-events-none z-10" data-testid="map-tooltip">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full" style={{ backgroundColor: tierConfig[activeState.tier].fill }} />
              <span className="font-semibold text-gray-900 text-xs sm:text-base">{activeState.name}</span>
            </div>
            <div className="text-[11px] sm:text-sm" style={{ color: tierConfig[activeState.tier].textColor }}>
              {tierConfig[activeState.tier].label}
            </div>
            {activeState.records && (
              <div className="text-[11px] sm:text-sm text-gray-500 mt-0.5">
                {activeState.records} entities
              </div>
            )}
          </div>
        )}

        {/* Mobile tap hint */}
        <p className="text-center text-[11px] text-gray-400 mt-2 sm:hidden">
          Tap a state to see details
        </p>
      </div>

      {/* State counts */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-3xl mx-auto">
        {([
          { tier: "live" as StateTier },
          { tier: "in_progress" as StateTier },
          { tier: "coming_soon" as StateTier },
        ]).map(({ tier }) => (
          <div key={tier} className="text-center p-2.5 sm:p-4 rounded-xl border border-gray-100 bg-white">
            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full mx-auto mb-1 sm:mb-2" style={{ backgroundColor: tierConfig[tier].fill, border: tier === "coming_soon" ? "1px solid #d1d5db" : "none" }} />
            <div className="text-lg sm:text-2xl font-bold text-gray-900">
              {states.filter(s => s.tier === tier).length}
            </div>
            <div className="text-[10px] sm:text-sm text-gray-500">{tierConfig[tier].label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
