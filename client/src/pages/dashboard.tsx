import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Search, Download, Filter, ChevronDown, ChevronUp, ArrowUpDown, Mail, Phone, Building2, MapPin, Calendar, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import type { Entity } from "@shared/schema";

type SortField = "name" | "filingDate" | "city" | "state" | "entityType";
type SortDir = "asc" | "desc";

// ── Stat Badge ─────────────────────────────────────────
function StatBadge({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white border border-gray-200 rounded-lg">
      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
        <Icon className="w-4 h-4 text-emerald-600" />
      </div>
      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-sm font-semibold text-gray-900">{value}</div>
      </div>
    </div>
  );
}

// ── Filter Pill ────────────────────────────────────────
function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
      {label}
      <button onClick={onRemove} className="hover:bg-emerald-100 rounded-full p-0.5 transition-colors">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

// ── Debounce hook ──────────────────────────────────────
function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ── Entity type color helper ───────────────────────────
function typeStyle(type: string | null) {
  if (!type) return "bg-gray-50 text-gray-600 border border-gray-200";
  if (type === "LLC") return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  if (type === "Corporation") return "bg-blue-50 text-blue-700 border border-blue-200";
  if (type === "Nonprofit") return "bg-purple-50 text-purple-700 border border-purple-200";
  if (type === "LP" || type === "LLP") return "bg-amber-50 text-amber-700 border border-amber-200";
  return "bg-gray-50 text-gray-600 border border-gray-200";
}

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortField>("filingDate");
  const [sortOrder, setSortOrder] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const limit = 25;

  const debouncedSearch = useDebounce(search, 300);

  // ── Fetch stats ────────────────────────────────────
  const { data: stats } = useQuery<{ total: number; states: number; withContact: number }>({
    queryKey: ["/api/stats"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/stats");
      return res.json();
    },
  });

  // ── Fetch filter options ───────────────────────────
  const { data: filters } = useQuery<{ states: string[]; entityTypes: string[] }>({
    queryKey: ["/api/filters"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/filters");
      return res.json();
    },
  });

  // ── Fetch entities ─────────────────────────────────
  const queryParams = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sortBy,
    sortOrder,
  });
  if (debouncedSearch) queryParams.set("search", debouncedSearch);
  if (stateFilter) queryParams.set("state", stateFilter);
  if (typeFilter) queryParams.set("entityType", typeFilter);

  const { data: entityResult, isLoading } = useQuery<{
    data: Entity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>({
    queryKey: ["/api/entities", debouncedSearch, stateFilter, typeFilter, page, sortBy, sortOrder],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/entities?${queryParams.toString()}`);
      return res.json();
    },
  });

  const entities = entityResult?.data ?? [];
  const total = entityResult?.total ?? 0;
  const totalPages = entityResult?.totalPages ?? 1;

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [debouncedSearch, stateFilter, typeFilter]);

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) return <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />;
    return sortOrder === "asc" ? <ChevronUp className="w-3.5 h-3.5 text-emerald-600" /> : <ChevronDown className="w-3.5 h-3.5 text-emerald-600" />;
  };

  const clearFilters = () => {
    setStateFilter("");
    setTypeFilter("");
    setSearch("");
    setPage(1);
  };

  const hasFilters = stateFilter || typeFilter || search.trim();

  const handleExport = useCallback(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (stateFilter) params.set("state", stateFilter);
    if (typeFilter) params.set("entityType", typeFilter);
    params.set("sortBy", sortBy);
    params.set("sortOrder", sortOrder);
    window.open(`/api/export/csv?${params.toString()}`, "_blank");
  }, [debouncedSearch, stateFilter, typeFilter, sortBy, sortOrder]);

  // ── Pagination range ───────────────────────────────
  const paginationRange = () => {
    const range: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) range.push(i);
    } else {
      range.push(1);
      if (page > 3) range.push("...");
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) range.push(i);
      if (page < totalPages - 2) range.push("...");
      range.push(totalPages);
    }
    return range;
  };

  const contactPercent = stats ? Math.round((stats.withContact / stats.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50/80">
      {/* Top nav bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <span className="flex items-center gap-2 cursor-pointer" data-testid="logo-link">
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <Building2 className="w-4.5 h-4.5 text-white" />
                </div>
                <span className="font-semibold text-gray-900 text-base">EveryNewCustomer</span>
              </span>
            </Link>
            <span className="hidden sm:inline text-xs text-gray-400 font-medium ml-2">Database Explorer</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5">
              {(filters?.states ?? []).map(st => (
                <span key={st} className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                  {st}
                </span>
              ))}
            </div>
            <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-semibold" data-testid="user-avatar">
              S
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-5 sm:py-6">
        {/* Stats row */}
        <div className="flex flex-wrap gap-3 mb-5">
          <StatBadge label="Total Entities" value={stats ? stats.total.toLocaleString() : "—"} icon={Building2} />
          <StatBadge label="States Active" value={stats?.states ?? "—"} icon={MapPin} />
          <StatBadge label="With Contact Info" value={stats ? `${contactPercent}%` : "—"} icon={Mail} />
          <StatBadge label="Last Updated" value="Today" icon={Calendar} />
        </div>

        {/* Search + filter bar */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-4">
          <div className="p-3 sm:p-4 flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, contact, email, city, industry..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all bg-gray-50 placeholder:text-gray-400"
                data-testid="search-input"
              />
            </div>

            {/* Filter + Export buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-lg border transition-all ${showFilters ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"}`}
                data-testid="filter-toggle"
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
                {(stateFilter || typeFilter) && (
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {(stateFilter ? 1 : 0) + (typeFilter ? 1 : 0)}
                  </span>
                )}
              </button>
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-sm"
                data-testid="export-btn"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
            </div>
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="px-3 sm:px-4 pb-4 border-t border-gray-100 pt-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">State</label>
                  <div className="flex flex-wrap gap-1.5">
                    {(filters?.states ?? []).map(st => (
                      <button
                        key={st}
                        onClick={() => { setStateFilter(stateFilter === st ? "" : st); setPage(1); }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-all ${stateFilter === st ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50"}`}
                        data-testid={`filter-state-${st}`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Entity Type</label>
                  <div className="flex flex-wrap gap-1.5">
                    {(filters?.entityTypes ?? []).map(t => (
                      <button
                        key={t}
                        onClick={() => { setTypeFilter(typeFilter === t ? "" : t); setPage(1); }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-all ${typeFilter === t ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50"}`}
                        data-testid={`filter-type-${t}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active filter pills */}
          {hasFilters && (
            <div className="px-3 sm:px-4 pb-3 flex flex-wrap items-center gap-2">
              {stateFilter && <FilterPill label={`State: ${stateFilter}`} onRemove={() => setStateFilter("")} />}
              {typeFilter && <FilterPill label={`Type: ${typeFilter}`} onRemove={() => setTypeFilter("")} />}
              {search.trim() && <FilterPill label={`Search: "${search}"`} onRemove={() => setSearch("")} />}
              <button onClick={clearFilters} className="text-xs text-gray-500 hover:text-gray-700 underline ml-1" data-testid="clear-filters">
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-500">
            {isLoading ? (
              <span className="inline-flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading...</span>
            ) : (
              <>Showing <span className="font-medium text-gray-900">{total.toLocaleString()}</span> {total === 1 ? "entity" : "entities"}</>
            )}
          </p>
        </div>

        {/* Data table — desktop */}
        <div className="hidden lg:block bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="data-table">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {([
                    ["filingDate", "Filed"],
                    ["name", "Business Name"],
                    ["entityType", "Type"],
                    ["state", "State"],
                    ["city", "City"],
                  ] as [SortField, string][]).map(([field, label]) => (
                    <th
                      key={field}
                      onClick={() => toggleSort(field)}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                    >
                      <span className="inline-flex items-center gap-1">
                        {label}
                        <SortIcon field={field} />
                      </span>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entities.map((entity) => (
                  <>
                    <tr
                      key={entity.id}
                      className="hover:bg-emerald-50/40 transition-colors cursor-pointer"
                      onClick={() => setExpandedRow(expandedRow === entity.id ? null : entity.id)}
                      data-testid={`row-${entity.id}`}
                    >
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{entity.filingDate || "—"}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 max-w-[280px] truncate">{entity.name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${typeStyle(entity.entityType)}`}>
                          {entity.entityType || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-700">{entity.state}</td>
                      <td className="px-4 py-3 text-gray-600">{entity.city || "—"}</td>
                      <td className="px-4 py-3 text-gray-700">{entity.contactName || "—"}</td>
                      <td className="px-4 py-3">
                        {entity.email ? (
                          <a href={`mailto:${entity.email}`} onClick={e => e.stopPropagation()} className="text-emerald-600 hover:text-emerald-700 hover:underline">
                            {entity.email}
                          </a>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {expandedRow === entity.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </td>
                    </tr>
                    {expandedRow === entity.id && (
                      <tr key={`${entity.id}-detail`} className="bg-emerald-50/30">
                        <td colSpan={8} className="px-4 py-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-xs text-gray-500 font-medium block mb-0.5">Full Address</span>
                              <span className="text-gray-900">{[entity.address, entity.city, entity.state, entity.zipCode].filter(Boolean).join(", ")}</span>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500 font-medium block mb-0.5">County</span>
                              <span className="text-gray-900">{entity.county || "—"}</span>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500 font-medium block mb-0.5">Industry (NAICS)</span>
                              <span className="text-gray-900">{entity.naicsCode || "—"}</span>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500 font-medium block mb-0.5">Source ID</span>
                              <span className="text-gray-900 font-mono text-xs">{entity.sourceId || "—"}</span>
                            </div>
                            {entity.phone && (
                              <div>
                                <span className="text-xs text-gray-500 font-medium block mb-0.5">Phone</span>
                                <span className="text-gray-900">{entity.phone}</span>
                              </div>
                            )}
                            {entity.jurisdiction && (
                              <div>
                                <span className="text-xs text-gray-500 font-medium block mb-0.5">Jurisdiction</span>
                                <span className="text-gray-900">{entity.jurisdiction}</span>
                              </div>
                            )}
                            {entity.status && (
                              <div>
                                <span className="text-xs text-gray-500 font-medium block mb-0.5">Status</span>
                                <span className="text-gray-900">{entity.status}</span>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
                {!isLoading && entities.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-500">
                      No entities found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Data cards — mobile/tablet */}
        <div className="lg:hidden space-y-3 mb-4">
          {isLoading && (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...
            </div>
          )}
          {entities.map((entity) => (
            <div
              key={entity.id}
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
              onClick={() => setExpandedRow(expandedRow === entity.id ? null : entity.id)}
              data-testid={`card-${entity.id}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">{entity.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{entity.city || "—"}, {entity.state} · {entity.filingDate || "—"}</p>
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full shrink-0 ${typeStyle(entity.entityType)}`}>
                  {entity.entityType || "—"}
                </span>
              </div>
              <div className="space-y-1.5">
                {entity.contactName && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-500 w-16 shrink-0">Contact</span>
                    <span className="text-gray-900 font-medium">{entity.contactName}</span>
                  </div>
                )}
                {entity.email && (
                  <div className="flex items-center gap-2 text-xs">
                    <Mail className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <a href={`mailto:${entity.email}`} onClick={e => e.stopPropagation()} className="text-emerald-600 hover:underline truncate">
                      {entity.email}
                    </a>
                  </div>
                )}
                {entity.phone && (
                  <div className="flex items-center gap-2 text-xs">
                    <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="text-gray-700">{entity.phone}</span>
                  </div>
                )}
              </div>
              {expandedRow === entity.id && (
                <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500 block">Address</span>
                    <span className="text-gray-900">{entity.address || "—"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">ZIP</span>
                    <span className="text-gray-900">{entity.zipCode || "—"}</span>
                  </div>
                  {entity.naicsCode && (
                    <div className="col-span-2">
                      <span className="text-gray-500 block">Industry</span>
                      <span className="text-gray-900">{entity.naicsCode}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              data-testid="prev-page"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <div className="flex items-center gap-1">
              {paginationRange().map((p, i) =>
                p === "..." ? (
                  <span key={`dots-${i}`} className="px-2 text-gray-400 text-sm">...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${p === page ? "bg-emerald-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
                    data-testid={`page-${p}`}
                  >
                    {p}
                  </button>
                )
              )}
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              data-testid="next-page"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
