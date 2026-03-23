import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Search, Download, Filter, ChevronDown, ChevronUp, ArrowUpDown, Mail, Phone, Building2, MapPin, Calendar, X, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";

// Types
interface Entity {
  id: string;
  name: string;
  type: string;
  state: string;
  county: string;
  filingDate: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  city: string;
  zip: string;
  naicsCode: string;
  status: string;
}

type SortField = keyof Entity;
type SortDir = "asc" | "desc";

// Sample data — realistic mix based on actual entity schemas
const SAMPLE_DATA: Entity[] = [
  { id: "NY-7866399", name: "MooreTech LLC", type: "LLC", state: "NY", county: "Saratoga", filingDate: "2026-03-22", contactName: "Susan Moore", contactEmail: "susan@mooretech.co", contactPhone: "(518) 401-3887", address: "68 Springwood Meadows Dr", city: "Ballston Spa", zip: "12020", naicsCode: "541511 - Custom Software Development", status: "Active" },
  { id: "CT-3405513", name: "Stamford Customs LLC", type: "LLC", state: "CT", county: "Fairfield", filingDate: "2026-03-22", contactName: "Anthony Dennis", contactEmail: "anthony@stamfordcustoms.com", contactPhone: "(203) 555-0142", address: "3 Todd Ln", city: "Stamford", zip: "06905", naicsCode: "332999 - Metal Product Mfg", status: "Active" },
  { id: "FL-L26000098741", name: "Sunrise Health Partners LLC", type: "LLC", state: "FL", county: "Miami-Dade", filingDate: "2026-03-21", contactName: "Maria Gonzalez", contactEmail: "maria@sunrisehp.com", contactPhone: "(305) 712-4891", address: "1401 Brickell Ave Ste 320", city: "Miami", zip: "33131", naicsCode: "621111 - Physician Offices", status: "Active" },
  { id: "TX-0805319412", name: "Lone Star Digital Media Inc", type: "Corporation", state: "TX", county: "Travis", filingDate: "2026-03-21", contactName: "Jake Hernandez", contactEmail: "jake@lonestardm.com", contactPhone: "(512) 884-2103", address: "4201 S Congress Ave Ste 108", city: "Austin", zip: "78745", naicsCode: "541810 - Advertising Agencies", status: "Active" },
  { id: "CO-20261234567", name: "Peak Performance Consulting LLC", type: "LLC", state: "CO", county: "Denver", filingDate: "2026-03-20", contactName: "Rachel Kim", contactEmail: "rachel@peakperformance.co", contactPhone: "(720) 331-7762", address: "1755 Blake St Ste 400", city: "Denver", zip: "80202", naicsCode: "541611 - Management Consulting", status: "Active" },
  { id: "OR-1587420", name: "Pacific NW Builders LLC", type: "LLC", state: "OR", county: "Multnomah", filingDate: "2026-03-20", contactName: "Tom Wheeler", contactEmail: "tom@pacificnwbuilders.com", contactPhone: "(503) 662-8914", address: "812 NE Davis St", city: "Portland", zip: "97232", naicsCode: "236220 - Commercial Construction", status: "Active" },
  { id: "FL-L26000098802", name: "Coastal Realty Advisors LLC", type: "LLC", state: "FL", county: "Palm Beach", filingDate: "2026-03-20", contactName: "David Chen", contactEmail: "david@coastalrealtyadvisors.com", contactPhone: "(561) 223-5501", address: "777 S Flagler Dr Ste 200", city: "West Palm Beach", zip: "33401", naicsCode: "531210 - Real Estate Agents", status: "Active" },
  { id: "NY-7866205", name: "Hudson Valley Provisions Inc", type: "Corporation", state: "NY", county: "Dutchess", filingDate: "2026-03-19", contactName: "Emily Vasquez", contactEmail: "emily@hvprovisions.com", contactPhone: "(845) 773-2240", address: "14 Market St", city: "Poughkeepsie", zip: "12601", naicsCode: "311999 - Food Manufacturing", status: "Active" },
  { id: "CT-3405488", name: "New Haven Analytics Group LLC", type: "LLC", state: "CT", county: "New Haven", filingDate: "2026-03-19", contactName: "Priya Patel", contactEmail: "priya@nhanalytics.com", contactPhone: "(203) 555-0198", address: "55 Church St Ste 612", city: "New Haven", zip: "06510", naicsCode: "541720 - Research & Development", status: "Active" },
  { id: "TX-0805319380", name: "Gulf Coast Solar Solutions LLC", type: "LLC", state: "TX", county: "Harris", filingDate: "2026-03-19", contactName: "Marcus Johnson", contactEmail: "marcus@gulfcoastsolar.com", contactPhone: "(832) 610-4477", address: "9850 Westheimer Rd", city: "Houston", zip: "77042", naicsCode: "238210 - Electrical Contractors", status: "Active" },
  { id: "FL-L26000098655", name: "Tampa Bay Pet Wellness Inc", type: "Corporation", state: "FL", county: "Hillsborough", filingDate: "2026-03-18", contactName: "Dr. Lisa Nguyen", contactEmail: "lisa@tbpetwellness.com", contactPhone: "(813) 401-9923", address: "3320 Henderson Blvd", city: "Tampa", zip: "33609", naicsCode: "541940 - Veterinary Services", status: "Active" },
  { id: "CO-20261234490", name: "Mountain View AI Labs LLC", type: "LLC", state: "CO", county: "Boulder", filingDate: "2026-03-18", contactName: "Alex Thornton", contactEmail: "alex@mvailabs.com", contactPhone: "(303) 441-8820", address: "2500 30th St Ste 201", city: "Boulder", zip: "80301", naicsCode: "541715 - Research & Development in Physical Sciences", status: "Active" },
  { id: "NY-7866111", name: "Brooklyn Batch Coffee Roasters LLC", type: "LLC", state: "NY", county: "Kings", filingDate: "2026-03-18", contactName: "Jordan Blake", contactEmail: "jordan@brooklynbatch.com", contactPhone: "(718) 555-0331", address: "241 Dekalb Ave", city: "Brooklyn", zip: "11205", naicsCode: "311920 - Coffee & Tea Manufacturing", status: "Active" },
  { id: "OR-1587388", name: "Willamette Wealth Advisors LLC", type: "LLC", state: "OR", county: "Lane", filingDate: "2026-03-17", contactName: "Sandra Okafor", contactEmail: "sandra@willamettewealth.com", contactPhone: "(541) 302-1198", address: "99 W 10th Ave Ste 305", city: "Eugene", zip: "97401", naicsCode: "523930 - Investment Advice", status: "Active" },
  { id: "TX-0805319201", name: "DFW Express Logistics Inc", type: "Corporation", state: "TX", county: "Dallas", filingDate: "2026-03-17", contactName: "Chris Ramirez", contactEmail: "chris@dfwexpress.com", contactPhone: "(214) 870-4421", address: "2727 LBJ Fwy Ste 600", city: "Dallas", zip: "75234", naicsCode: "484110 - General Freight Trucking", status: "Active" },
  { id: "FL-L26000098512", name: "Everglades Environmental Services LLC", type: "LLC", state: "FL", county: "Broward", filingDate: "2026-03-17", contactName: "Nina Rodriguez", contactEmail: "nina@evergladesenv.com", contactPhone: "(954) 221-8803", address: "110 SE 6th St Ste 1700", city: "Fort Lauderdale", zip: "33301", naicsCode: "562910 - Environmental Remediation", status: "Active" },
  { id: "CT-3405400", name: "Hartford Fintech Solutions LLC", type: "LLC", state: "CT", county: "Hartford", filingDate: "2026-03-16", contactName: "Kevin Walsh", contactEmail: "kevin@hartfordfintech.com", contactPhone: "(860) 555-0276", address: "100 Pearl St Ste 8", city: "Hartford", zip: "06103", naicsCode: "522320 - Financial Transactions Processing", status: "Active" },
  { id: "CO-20261234301", name: "Aspen Trail Outfitters LLC", type: "LLC", state: "CO", county: "Pitkin", filingDate: "2026-03-16", contactName: "Megan Foster", contactEmail: "megan@aspentrail.com", contactPhone: "(970) 920-3341", address: "520 E Durant Ave", city: "Aspen", zip: "81611", naicsCode: "451110 - Sporting Goods Stores", status: "Active" },
  { id: "NY-7865990", name: "Upstate Renewables Corp", type: "Corporation", state: "NY", county: "Albany", filingDate: "2026-03-15", contactName: "Daniel Morrison", contactEmail: "daniel@upstaterenewables.com", contactPhone: "(518) 203-7754", address: "80 State St Ste 400", city: "Albany", zip: "12207", naicsCode: "221114 - Solar Electric Power Generation", status: "Active" },
  { id: "FL-L26000098301", name: "Orlando Tech Accelerator Inc", type: "Corporation", state: "FL", county: "Orange", filingDate: "2026-03-15", contactName: "Stephanie Park", contactEmail: "stephanie@orlandotechaccel.com", contactPhone: "(407) 712-6619", address: "201 S Orange Ave Ste 900", city: "Orlando", zip: "32801", naicsCode: "611430 - Professional Development Training", status: "Active" },
  { id: "TX-0805319098", name: "SA Home Services Group LLC", type: "LLC", state: "TX", county: "Bexar", filingDate: "2026-03-15", contactName: "Roberto Garza", contactEmail: "roberto@sahomeservices.com", contactPhone: "(210) 334-8812", address: "5900 Babcock Rd Ste 102", city: "San Antonio", zip: "78240", naicsCode: "236118 - Residential Remodeling", status: "Active" },
  { id: "OR-1587250", name: "Bend Brewing Collective LLC", type: "LLC", state: "OR", county: "Deschutes", filingDate: "2026-03-14", contactName: "Tyler Adams", contactEmail: "tyler@bendbrewing.co", contactPhone: "(541) 678-2203", address: "1044 NW Bond St", city: "Bend", zip: "97703", naicsCode: "312120 - Breweries", status: "Active" },
  { id: "IA-742001", name: "Heartland AgriTech LLC", type: "LLC", state: "IA", county: "Polk", filingDate: "2026-03-14", contactName: "Beth Larson", contactEmail: "beth@heartlandagritech.com", contactPhone: "(515) 440-2283", address: "666 Walnut St Ste 1000", city: "Des Moines", zip: "50309", naicsCode: "115112 - Soil Preparation Services", status: "Active" },
  { id: "FL-L26000098100", name: "Jax Marine Supply LLC", type: "LLC", state: "FL", county: "Duval", filingDate: "2026-03-14", contactName: "Ryan Mitchell", contactEmail: "ryan@jaxmarinesupply.com", contactPhone: "(904) 332-7701", address: "1515 Prudential Dr Ste 200", city: "Jacksonville", zip: "32207", naicsCode: "441222 - Boat Dealers", status: "Active" },
  { id: "CO-20261234100", name: "Front Range Cybersecurity Inc", type: "Corporation", state: "CO", county: "El Paso", filingDate: "2026-03-13", contactName: "James Wu", contactEmail: "james@frontrangecyber.com", contactPhone: "(719) 331-5540", address: "102 S Tejon St Ste 400", city: "Colorado Springs", zip: "80903", naicsCode: "541512 - Computer Systems Design", status: "Active" },
];

const ALL_STATES = [...new Set(SAMPLE_DATA.map(e => e.state))].sort();
const ALL_TYPES = [...new Set(SAMPLE_DATA.map(e => e.type))].sort();
const ROWS_PER_PAGE = 10;

// Stat badge for the top bar
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

// Filter pill
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

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<SortField>("filingDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // The user's "active subscription" states
  const subscribedStates = ["NY", "CT", "FL", "TX", "CO", "OR", "IA"];

  // Filter + search
  const filtered = useMemo(() => {
    let data = SAMPLE_DATA;

    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.contactName.toLowerCase().includes(q) ||
        e.contactEmail.toLowerCase().includes(q) ||
        e.city.toLowerCase().includes(q) ||
        e.naicsCode.toLowerCase().includes(q) ||
        e.county.toLowerCase().includes(q)
      );
    }

    if (stateFilter.length > 0) {
      data = data.filter(e => stateFilter.includes(e.state));
    }

    if (typeFilter.length > 0) {
      data = data.filter(e => typeFilter.includes(e.type));
    }

    // Sort
    data = [...data].sort((a, b) => {
      const aVal = a[sortField] ?? "";
      const bVal = b[sortField] ?? "";
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });

    return data;
  }, [search, stateFilter, typeFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / ROWS_PER_PAGE);
  const pageData = filtered.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
    setPage(1);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />;
    return sortDir === "asc" ? <ChevronUp className="w-3.5 h-3.5 text-emerald-600" /> : <ChevronDown className="w-3.5 h-3.5 text-emerald-600" />;
  };

  const toggleStateFilter = (st: string) => {
    setStateFilter(prev => prev.includes(st) ? prev.filter(s => s !== st) : [...prev, st]);
    setPage(1);
  };

  const toggleTypeFilter = (t: string) => {
    setTypeFilter(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
    setPage(1);
  };

  const clearFilters = () => {
    setStateFilter([]);
    setTypeFilter([]);
    setSearch("");
    setPage(1);
  };

  const hasFilters = stateFilter.length > 0 || typeFilter.length > 0 || search.trim().length > 0;

  const handleExport = () => {
    const headers = ["ID", "Business Name", "Type", "State", "County", "Filing Date", "Contact", "Email", "Phone", "Address", "City", "ZIP", "NAICS", "Status"];
    const rows = filtered.map(e => [e.id, e.name, e.type, e.state, e.county, e.filingDate, e.contactName, e.contactEmail, e.contactPhone, e.address, e.city, e.zip, e.naicsCode, e.status]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newbizdata-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
                <span className="font-semibold text-gray-900 text-base">NewBizData</span>
              </span>
            </Link>
            <span className="hidden sm:inline text-xs text-gray-400 font-medium ml-2">Database Explorer</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5">
              {subscribedStates.map(st => (
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
          <StatBadge label="Total Entities" value={SAMPLE_DATA.length.toLocaleString()} icon={Building2} />
          <StatBadge label="States Active" value={subscribedStates.length} icon={MapPin} />
          <StatBadge label="With Contact Info" value={`${Math.round((SAMPLE_DATA.filter(e => e.contactEmail).length / SAMPLE_DATA.length) * 100)}%`} icon={Mail} />
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
                onChange={e => { setSearch(e.target.value); setPage(1); }}
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
                {(stateFilter.length + typeFilter.length) > 0 && (
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {stateFilter.length + typeFilter.length}
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
                    {ALL_STATES.map(st => (
                      <button
                        key={st}
                        onClick={() => toggleStateFilter(st)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-all ${stateFilter.includes(st) ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50"}`}
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
                    {ALL_TYPES.map(t => (
                      <button
                        key={t}
                        onClick={() => toggleTypeFilter(t)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-all ${typeFilter.includes(t) ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50"}`}
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
              {stateFilter.map(st => (
                <FilterPill key={`s-${st}`} label={`State: ${st}`} onRemove={() => toggleStateFilter(st)} />
              ))}
              {typeFilter.map(t => (
                <FilterPill key={`t-${t}`} label={`Type: ${t}`} onRemove={() => toggleTypeFilter(t)} />
              ))}
              {search.trim() && (
                <FilterPill label={`Search: "${search}"`} onRemove={() => setSearch("")} />
              )}
              <button onClick={clearFilters} className="text-xs text-gray-500 hover:text-gray-700 underline ml-1" data-testid="clear-filters">
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-500">
            Showing <span className="font-medium text-gray-900">{filtered.length}</span> {filtered.length === 1 ? "entity" : "entities"}
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
                    ["type", "Type"],
                    ["state", "State"],
                    ["contactName", "Contact"],
                    ["contactEmail", "Email"],
                    ["contactPhone", "Phone"],
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageData.map((entity) => (
                  <>
                    <tr
                      key={entity.id}
                      className="hover:bg-emerald-50/40 transition-colors cursor-pointer"
                      onClick={() => setExpandedRow(expandedRow === entity.id ? null : entity.id)}
                      data-testid={`row-${entity.id}`}
                    >
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{entity.filingDate}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{entity.name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${entity.type === "LLC" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-blue-50 text-blue-700 border border-blue-200"}`}>
                          {entity.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-700">{entity.state}</td>
                      <td className="px-4 py-3 text-gray-700">{entity.contactName}</td>
                      <td className="px-4 py-3">
                        <a href={`mailto:${entity.contactEmail}`} onClick={e => e.stopPropagation()} className="text-emerald-600 hover:text-emerald-700 hover:underline">
                          {entity.contactEmail}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{entity.contactPhone}</td>
                      <td className="px-4 py-3 text-gray-600">{entity.city}</td>
                      <td className="px-4 py-3 text-gray-400">
                        {expandedRow === entity.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </td>
                    </tr>
                    {expandedRow === entity.id && (
                      <tr key={`${entity.id}-detail`} className="bg-emerald-50/30">
                        <td colSpan={9} className="px-4 py-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-xs text-gray-500 font-medium block mb-0.5">Full Address</span>
                              <span className="text-gray-900">{entity.address}, {entity.city}, {entity.state} {entity.zip}</span>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500 font-medium block mb-0.5">County</span>
                              <span className="text-gray-900">{entity.county}</span>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500 font-medium block mb-0.5">Industry (NAICS)</span>
                              <span className="text-gray-900">{entity.naicsCode}</span>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500 font-medium block mb-0.5">Filing ID</span>
                              <span className="text-gray-900 font-mono text-xs">{entity.id}</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Data cards — mobile/tablet */}
        <div className="lg:hidden space-y-3 mb-4">
          {pageData.map((entity) => (
            <div
              key={entity.id}
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
              onClick={() => setExpandedRow(expandedRow === entity.id ? null : entity.id)}
              data-testid={`card-${entity.id}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">{entity.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{entity.city}, {entity.state} · {entity.filingDate}</p>
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full shrink-0 ${entity.type === "LLC" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-blue-50 text-blue-700 border border-blue-200"}`}>
                  {entity.type}
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500 w-16 shrink-0">Contact</span>
                  <span className="text-gray-900 font-medium">{entity.contactName}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Mail className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <a href={`mailto:${entity.contactEmail}`} onClick={e => e.stopPropagation()} className="text-emerald-600 hover:underline truncate">
                    {entity.contactEmail}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="text-gray-700">{entity.contactPhone}</span>
                </div>
              </div>
              {expandedRow === entity.id && (
                <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500 block">Address</span>
                    <span className="text-gray-900">{entity.address}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">County</span>
                    <span className="text-gray-900">{entity.county}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500 block">Industry</span>
                    <span className="text-gray-900">{entity.naicsCode}</span>
                  </div>
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
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${p === page ? "bg-emerald-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
                  data-testid={`page-${p}`}
                >
                  {p}
                </button>
              ))}
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
