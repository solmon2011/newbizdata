import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Mail, Send, Pause, Play, Eye, ArrowLeft, Building2,
  MapPin, DollarSign, Clock, CheckCircle, AlertTriangle,
  Truck, ChevronRight, Loader2, BarChart3, Sparkles, ArrowRight,
} from "lucide-react";
import type { Campaign, MailPiece } from "@shared/schema";

// ── Status badge helper ─────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    draft: { label: "Draft", cls: "bg-gray-100 text-gray-600 border-gray-200" },
    active: { label: "Active", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    paused: { label: "Paused", cls: "bg-amber-50 text-amber-700 border-amber-200" },
    pending: { label: "Pending", cls: "bg-blue-50 text-blue-700 border-blue-200" },
    mailed: { label: "Mailed", cls: "bg-teal-50 text-teal-700 border-teal-200" },
    delivered: { label: "Delivered", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    returned: { label: "Returned", cls: "bg-red-50 text-red-700 border-red-200" },
  };
  const m = map[status] || map.draft;
  return <Badge className={`text-[10px] ${m.cls} border`}>{m.label}</Badge>;
}

// ═══════════════════════════════════════════════════════
// Campaign List View
// ═══════════════════════════════════════════════════════
function CampaignList() {
  const { data: campaignList, isLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/campaigns");
      return res.json();
    },
  });

  return (
    <div className="min-h-screen bg-gray-50/80">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <span className="flex items-center gap-2 cursor-pointer" data-testid="logo-link">
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <Mail className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-gray-900 text-base">EveryNewCustomer</span>
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Database
            </Link>
            <Link href="/campaign/new">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-4 text-sm" data-testid="btn-new-campaign">
                <Plus className="w-4 h-4 mr-1.5" /> New Campaign
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" data-testid="page-heading">Campaigns</h1>
            <p className="text-gray-500 text-sm mt-1">Manage your automated direct mail campaigns</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading campaigns...
          </div>
        ) : !campaignList || campaignList.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No campaigns yet</h2>
            <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
              Create your first direct mail campaign to automatically send postcards to new businesses.
            </p>
            <Link href="/campaign/new">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-6" data-testid="btn-create-first">
                <Plus className="w-4 h-4 mr-2" /> Create Your First Campaign
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {campaignList.map(campaign => {
              const states: string[] = (() => { try { return JSON.parse(campaign.states); } catch { return []; } })();
              return (
                <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
                  <Card
                    className="p-5 hover:shadow-md hover:border-emerald-200/60 transition-all cursor-pointer"
                    data-testid={`campaign-card-${campaign.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <h3 className="font-semibold text-gray-900 text-sm truncate">{campaign.name}</h3>
                          <StatusBadge status={campaign.status} />
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {states.slice(0, 5).join(", ")}{states.length > 5 ? ` +${states.length - 5}` : ""}
                          </span>
                          <span className="flex items-center gap-1">
                            <Send className="w-3.5 h-3.5" />
                            {(campaign.totalSent ?? 0).toLocaleString()} sent
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5" />
                            ${((campaign.totalCost ?? 0) / 100).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" />
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Campaign Detail View
// ═══════════════════════════════════════════════════════
function CampaignDetail({ id }: { id: number }) {
  const [previewSide, setPreviewSide] = useState<"front" | "back">("front");
  const [mailPage, setMailPage] = useState(1);

  const { data: campaign, isLoading, refetch } = useQuery<Campaign & { mailStats: { total: number; pending: number; mailed: number; delivered: number; returned: number }; template: any }>({
    queryKey: ["/api/campaigns", id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/campaigns/${id}`);
      return res.json();
    },
  });

  const { data: preview } = useQuery<{ frontHtml: string; backHtml: string }>({
    queryKey: ["/api/campaigns", id, "preview"],
    queryFn: async () => {
      const res = await apiRequest("POST", `/api/campaigns/${id}/preview`);
      return res.json();
    },
    enabled: !!campaign,
  });

  const { data: mailPiecesData } = useQuery<{ data: MailPiece[]; total: number; totalPages: number }>({
    queryKey: ["/api/campaigns", id, "mail-pieces", mailPage],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/campaigns/${id}/mail-pieces?page=${mailPage}&limit=10`);
      return res.json();
    },
    enabled: !!campaign,
  });

  const toggleMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const res = await apiRequest("PATCH", `/api/campaigns/${id}`, { status: newStatus });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
    },
  });

  const executeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/campaigns/${id}/execute`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", id, "mail-pieces", mailPage] });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50/80 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50/80 flex items-center justify-center">
        <p className="text-gray-500">Campaign not found</p>
      </div>
    );
  }

  const states: string[] = (() => { try { return JSON.parse(campaign.states); } catch { return []; } })();
  const customFields = (() => { try { return JSON.parse(campaign.customFields); } catch { return {}; } })();
  const stats = campaign.mailStats;

  return (
    <div className="min-h-screen bg-gray-50/80">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/campaigns">
              <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors" data-testid="back-to-campaigns">
                <ArrowLeft className="w-4 h-4" /> Campaigns
              </button>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {campaign.status === "active" ? (
              <Button
                variant="outline" size="sm"
                onClick={() => toggleMutation.mutate("paused")}
                disabled={toggleMutation.isPending}
                className="rounded-full text-xs"
                data-testid="btn-pause"
              >
                <Pause className="w-3.5 h-3.5 mr-1.5" /> Pause
              </Button>
            ) : campaign.status === "paused" || campaign.status === "draft" ? (
              <Button
                size="sm"
                onClick={() => toggleMutation.mutate("active")}
                disabled={toggleMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs"
                data-testid="btn-activate"
              >
                <Play className="w-3.5 h-3.5 mr-1.5" /> Activate
              </Button>
            ) : null}
            {campaign.status === "active" && (
              <Button
                size="sm"
                onClick={() => executeMutation.mutate()}
                disabled={executeMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs"
                data-testid="btn-execute"
              >
                {executeMutation.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-1.5" />}
                Send Now
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Campaign header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900" data-testid="campaign-name">{campaign.name}</h1>
            <StatusBadge status={campaign.status} />
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {states.map(st => (
              <span key={st} className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 rounded border border-emerald-200">{st}</span>
            ))}
          </div>
        </div>

        {executeMutation.isSuccess && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700" data-testid="execute-result">
            Successfully sent {(executeMutation.data as any)?.sent ?? 0} postcards.
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { label: "Total Sent", value: (campaign.totalSent ?? 0).toLocaleString(), icon: Send, color: "text-emerald-600 bg-emerald-50" },
            { label: "Pending", value: stats.pending.toLocaleString(), icon: Clock, color: "text-blue-600 bg-blue-50" },
            { label: "In Transit", value: stats.mailed.toLocaleString(), icon: Truck, color: "text-teal-600 bg-teal-50" },
            { label: "Delivered", value: stats.delivered.toLocaleString(), icon: CheckCircle, color: "text-emerald-600 bg-emerald-50" },
            { label: "Total Spend", value: `$${((campaign.totalCost ?? 0) / 100).toFixed(2)}`, icon: DollarSign, color: "text-gray-600 bg-gray-50" },
          ].map(stat => (
            <Card key={stat.label} className="p-4">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                  <p className="text-sm font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Preview */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-gray-400" /> Postcard Preview
              </h3>
              <div className="flex gap-1">
                <button onClick={() => setPreviewSide("front")} className={`px-3 py-1 text-xs rounded-md transition-all ${previewSide === "front" ? "bg-emerald-100 text-emerald-700" : "text-gray-500 hover:bg-gray-100"}`}>
                  Front
                </button>
                <button onClick={() => setPreviewSide("back")} className={`px-3 py-1 text-xs rounded-md transition-all ${previewSide === "back" ? "bg-emerald-100 text-emerald-700" : "text-gray-500 hover:bg-gray-100"}`}>
                  Back
                </button>
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden" data-testid="campaign-preview">
              {preview ? (
                <div
                  className="w-full"
                  style={{ aspectRatio: "6/4" }}
                  dangerouslySetInnerHTML={{ __html: previewSide === "front" ? preview.frontHtml : preview.backHtml }}
                />
              ) : (
                <div className="flex items-center justify-center text-gray-400 text-sm" style={{ aspectRatio: "6/4" }}>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Loading preview...
                </div>
              )}
            </div>
          </Card>

          {/* Campaign details */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Campaign Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Company</span>
                <span className="text-gray-900 font-medium">{customFields.company_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Headline</span>
                <span className="text-gray-900 font-medium text-right max-w-[200px] truncate">{customFields.headline}</span>
              </div>
              {customFields.phone && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Phone</span>
                  <span className="text-gray-900">{customFields.phone}</span>
                </div>
              )}
              {customFields.email && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Email</span>
                  <span className="text-gray-900">{customFields.email}</span>
                </div>
              )}
              {customFields.website && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Website</span>
                  <span className="text-gray-900">{customFields.website}</span>
                </div>
              )}
              <div className="pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-500 block mb-1">Offer</span>
                <p className="text-gray-700 text-xs leading-relaxed">{customFields.offer}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Mail pieces table */}
        <Card className="mt-6 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Mail Pieces</h3>
            <p className="text-xs text-gray-500 mt-0.5">{mailPiecesData?.total ?? 0} total pieces</p>
          </div>
          {!mailPiecesData || mailPiecesData.data.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              No mail pieces sent yet. {campaign.status === "active" ? 'Click "Send Now" to execute the campaign.' : "Activate the campaign to start sending."}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="mail-pieces-table">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Entity ID</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Lob ID</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cost</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {mailPiecesData.data.map(piece => (
                      <tr key={piece.id} className="hover:bg-gray-50" data-testid={`piece-row-${piece.id}`}>
                        <td className="px-4 py-3 text-gray-700 font-mono text-xs">#{piece.entityId}</td>
                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">{piece.lobId || "—"}</td>
                        <td className="px-4 py-3"><StatusBadge status={piece.status} /></td>
                        <td className="px-4 py-3 text-gray-700">{piece.costCents ? `$${(piece.costCents / 100).toFixed(2)}` : "—"}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{piece.sentAt || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {mailPiecesData.totalPages > 1 && (
                <div className="p-3 border-t border-gray-100 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setMailPage(p => Math.max(1, p - 1))}
                    disabled={mailPage === 1}
                    className="px-3 py-1 text-xs text-gray-500 hover:text-gray-900 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-gray-500">Page {mailPage} of {mailPiecesData.totalPages}</span>
                  <button
                    onClick={() => setMailPage(p => Math.min(mailPiecesData.totalPages, p + 1))}
                    disabled={mailPage === mailPiecesData.totalPages}
                    className="px-3 py-1 text-xs text-gray-500 hover:text-gray-900 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </Card>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Router wrapper — decides list vs detail
// ═══════════════════════════════════════════════════════
export default function CampaignDashboard() {
  const [matchDetail, params] = useRoute("/campaigns/:id");

  if (matchDetail && params?.id) {
    const id = parseInt(params.id, 10);
    if (!isNaN(id)) return <CampaignDetail id={id} />;
  }

  return <CampaignList />;
}
