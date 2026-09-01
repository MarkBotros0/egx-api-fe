"use client";

import { useState, useEffect, useCallback } from "react";
import PortfolioSummary from "../components/PortfolioSummary";
import RiskDashboard from "../components/RiskDashboard";
import HoldingsTable from "../components/HoldingsTable";
import PEFreshnessBanner from "../components/PEFreshnessBanner";
import AddHoldingForm from "../components/AddHoldingForm";
import SellHoldingForm from "../components/SellHoldingForm";
import RealizedGainsCard from "../components/RealizedGainsCard";
import ClosedPositionsTable from "../components/ClosedPositionsTable";
import AdvicePanel from "../components/AdvicePanel";
import CorrelationHeatmap from "../components/CorrelationHeatmap";
import MonteCarloChart from "../components/MonteCarloChart";
import MacroCard from "../components/MacroCard";
import { useScoreWeights } from "../components/ScoreWeightsProvider";
import { useTickers } from "../components/TickersProvider";
import { ChartSkeleton, TableSkeleton } from "../components/LoadingSkeleton";
import {
  fetchPortfolio,
  addHolding,
  updateHolding,
  deleteHolding,
  fetchPortfolioAnalysis,
  fetchSales,
  recordSale,
  deleteSale,
} from "../lib/api";
import type {
  Portfolio,
  PortfolioAnalysisResponse,
  PortfolioHolding,
  SalesResponse,
} from "../lib/types";

export default function PortfolioPage() {
  const { tickers } = useTickers();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [portfolioLoading, setPortfolioLoading] = useState(true);
  const [analysis, setAnalysis] = useState<PortfolioAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sales, setSales] = useState<SalesResponse | null>(null);
  const [sellingId, setSellingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { version: weightsVersion } = useScoreWeights();

  // Lock body scroll when mobile modal is open (iOS needs position:fixed, not just overflow:hidden)
  useEffect(() => {
    if (!showForm && !sellingId) return;
    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      window.scrollTo(0, scrollY);
    };
  }, [showForm, sellingId]);

  // Load portfolio from Turso via API
  const loadPortfolio = useCallback(async () => {
    setPortfolioLoading(true);
    try {
      const p = await fetchPortfolio();
      setPortfolio(p);
      return p;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setPortfolioLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPortfolio();
  }, [loadPortfolio]);

  // Sales are loaded on their own: they need no price fetch, so the Winnings
  // card paints immediately even when portfolio analysis is slow or fails.
  const loadSales = useCallback(async () => {
    try {
      setSales(await fetchSales());
    } catch {
      // A sales failure must not take down the portfolio page.
    }
  }, []);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  // Analyze portfolio
  const analyze = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchPortfolioAnalysis();
      setAnalysis(data);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }, []);

  // Analyze whenever analysis is cleared (initial load or after a mutation),
  // provided the portfolio has holdings.
  useEffect(() => {
    if (portfolio && portfolio.portfolio.length > 0 && analysis === null) {
      analyze();
    }
  }, [portfolio, analysis, analyze]);

  // Re-analyze when composite weights change.
  useEffect(() => {
    if (portfolio && portfolio.portfolio.length > 0) {
      analyze();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weightsVersion]);

  const refreshAfterMutation = useCallback(async () => {
    setAnalysis(null);
    setLoading(true);
    await loadPortfolio();
  }, [loadPortfolio]);

  const handleAdd = async (data: Omit<PortfolioHolding, "id" | "created_at" | "updated_at">) => {
    try {
      await addHolding(data);
      setShowForm(false);
      await refreshAfterMutation();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteHolding(id);
      await refreshAfterMutation();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setShowForm(true);
  };

  const handleUpdate = async (data: Omit<PortfolioHolding, "id" | "created_at" | "updated_at">) => {
    if (editingId) {
      try {
        await updateHolding(editingId, data);
        setEditingId(null);
        setShowForm(false);
        await refreshAfterMutation();
      } catch (e: any) {
        setError(e.message);
      }
    }
  };

  const handleSell = (id: string) => {
    setSellingId(id);
  };

  const handleSellSubmit = async (data: {
    quantity: number;
    sell_price: number;
    sell_date: string;
    notes: string;
  }) => {
    if (!sellingId) return;
    try {
      await recordSale({ holding_id: sellingId, ...data });
      setSellingId(null);
      await Promise.all([refreshAfterMutation(), loadSales()]);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDeleteSale = async (id: string) => {
    try {
      await deleteSale(id);
      await Promise.all([refreshAfterMutation(), loadSales()]);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const editingHolding = editingId
    ? portfolio?.portfolio.find((h) => h.id === editingId)
    : null;

  const sellingHolding = sellingId
    ? portfolio?.portfolio.find((h) => h.id === sellingId)
    : null;

  return (
    <div>
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-white md:text-2xl">My Portfolio</h1>
            <p className="mt-1 text-xs text-white/40 md:text-sm">
              Track your holdings and get educational insights.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => {
                if (portfolio && portfolio.portfolio.length > 0) {
                  refreshAfterMutation();
                }
              }}
              disabled={loading || portfolioLoading}
              aria-label="Refresh analysis"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-white/10 text-white/60 transition-colors hover:border-accent/30 hover:text-accent disabled:opacity-40"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={loading ? "animate-spin" : ""}
              >
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </button>
            {/* Desktop add button */}
            <button
              onClick={() => {
                setEditingId(null);
                setShowForm(!showForm);
              }}
              className="hidden rounded-lg bg-accent px-4 py-2 text-sm font-medium text-charcoal-dark transition-opacity hover:opacity-90 md:block"
            >
              {showForm ? "Cancel" : "+ Add Stock"}
            </button>
          </div>
        </div>

        {/* Mobile FAB */}
        {!showForm && (
          <button
            onClick={() => {
              setEditingId(null);
              setShowForm(true);
            }}
            className="fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-2xl font-bold text-charcoal-dark shadow-lg shadow-accent/25 transition-transform active:scale-95 md:hidden"
            style={{ bottom: 'calc(env(safe-area-inset-bottom) + 76px)' }}
          >
            +
          </button>
        )}

        {/* Add/Edit form — full screen on mobile, inline on desktop */}
        {showForm && (
          <>
            {/* Mobile full-screen modal */}
            <div className="fixed inset-0 z-[60] flex flex-col bg-charcoal-dark md:hidden">
              {/* Header — respects safe-area-inset-top so it clears the status bar in PWA */}
              <div
                className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 pb-3"
                style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}
              >
                <h2 className="text-lg font-bold text-white">
                  {editingId ? "Edit Holding" : "Add Stock"}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  className="min-h-[44px] min-w-[44px] text-sm text-white/50"
                >
                  Cancel
                </button>
              </div>
              {/* Scrollable body — independent scroll so native date picker renders correctly */}
              <div className="flex-1 overflow-y-auto p-4" style={{ WebkitOverflowScrolling: "touch" }}>
                <AddHoldingForm
                  tickers={tickers}
                  onSubmit={editingId ? handleUpdate : handleAdd}
                  onCancel={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  initialValues={
                    editingHolding
                      ? {
                          symbol: editingHolding.symbol,
                          buy_price: editingHolding.buy_price,
                          buy_date: editingHolding.buy_date,
                          quantity: editingHolding.quantity,
                          target_price: editingHolding.target_price,
                          stop_loss: editingHolding.stop_loss,
                          notes: editingHolding.notes,
                        }
                      : undefined
                  }
                />
              </div>
            </div>

            {/* Desktop inline form */}
            <div className="mb-6 hidden md:block">
              <AddHoldingForm
                tickers={tickers}
                onSubmit={editingId ? handleUpdate : handleAdd}
                onCancel={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                initialValues={
                  editingHolding
                    ? {
                        symbol: editingHolding.symbol,
                        buy_price: editingHolding.buy_price,
                        buy_date: editingHolding.buy_date,
                        quantity: editingHolding.quantity,
                        target_price: editingHolding.target_price,
                        stop_loss: editingHolding.stop_loss,
                        notes: editingHolding.notes,
                      }
                    : undefined
                }
              />
            </div>
          </>
        )}

        {/* Sell form — full screen on mobile, inline on desktop */}
        {sellingId && sellingHolding && (
          <>
            <div className="fixed inset-0 z-[60] flex flex-col bg-charcoal-dark md:hidden">
              <div
                className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 pb-3"
                style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
              >
                <h2 className="text-lg font-bold text-white">Record Sale</h2>
                <button
                  onClick={() => setSellingId(null)}
                  className="min-h-[44px] min-w-[44px] text-sm text-white/50"
                >
                  Cancel
                </button>
              </div>
              <div
                className="flex-1 overflow-y-auto p-4"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                <SellHoldingForm
                  holding={sellingHolding}
                  onSubmit={handleSellSubmit}
                  onCancel={() => setSellingId(null)}
                />
              </div>
            </div>

            <div className="mb-6 hidden md:block">
              <SellHoldingForm
                holding={sellingHolding}
                onSubmit={handleSellSubmit}
                onCancel={() => setSellingId(null)}
              />
            </div>
          </>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-loss/20 bg-loss/5 p-4 text-sm text-loss">
            {error}
            <button
              onClick={() => analyze()}
              className="ml-3 text-xs text-white/50 underline hover:text-white"
            >
              Retry
            </button>
          </div>
        )}

        {portfolioLoading && !portfolio ? (
          <div className="space-y-6">
            <ChartSkeleton height="h-48" />
            <TableSkeleton rows={4} />
          </div>
        ) : !portfolio?.portfolio.length && !showForm && !sales?.sales.length ? (
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-16 text-center">
            <p className="mb-2 text-lg text-white/50">No holdings yet</p>
            <p className="mb-4 text-sm text-white/30">
              Add your first stock to start tracking your portfolio performance
              and getting educational insights.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="rounded-lg bg-accent px-6 py-2 text-sm font-medium text-charcoal-dark"
            >
              Add Your First Stock
            </button>
          </div>
        ) : !portfolio?.portfolio.length && !showForm ? (
          /* Sold out, but there is a trading history to keep on screen. */
          <div className="space-y-6">
            {sales && (
              <RealizedGainsCard
                summary={sales.summary}
                riskFreeRatePct={sales.risk_free_rate_pct}
              />
            )}
            {sales && (
              <ClosedPositionsTable
                sales={sales.sales}
                riskFreeRatePct={sales.risk_free_rate_pct}
                onDelete={handleDeleteSale}
              />
            )}
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-8 text-center">
              <p className="text-sm text-white/40">You have no open positions.</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-3 rounded-lg bg-accent px-6 py-2 text-sm font-medium text-charcoal-dark"
              >
                Add a Stock
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <PEFreshnessBanner />
            {/* Summary — top-of-page overview */}
            {!analysis && portfolio?.portfolio.length ? (
              <ChartSkeleton height="h-48" />
            ) : analysis ? (
              <PortfolioSummary metrics={analysis.portfolio_metrics} />
            ) : null}

            {sales && sales.sales.length > 0 && (
              <RealizedGainsCard
                summary={sales.summary}
                riskFreeRatePct={sales.risk_free_rate_pct}
              />
            )}
            {sales && sales.sales.length > 0 && (
              <ClosedPositionsTable
                sales={sales.sales}
                riskFreeRatePct={sales.risk_free_rate_pct}
                onDelete={handleDeleteSale}
              />
            )}

            {/* Holdings table */}
            {!analysis && portfolio?.portfolio.length ? (
              <TableSkeleton rows={Math.min(portfolio.portfolio.length, 6)} />
            ) : analysis ? (
              <HoldingsTable
                holdings={analysis.holdings}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onSell={handleSell}
              />
            ) : null}

            {/* Advice signals */}
            {analysis && analysis.signals.length > 0 && (
              <AdvicePanel signals={analysis.signals} />
            )}

            {/* Risk Dashboard */}
            {analysis?.portfolio_metrics.sharpe_ratio != null && (
              <RiskDashboard metrics={analysis.portfolio_metrics} />
            )}

            {/* Correlation Heatmap */}
            {analysis?.correlation_matrix && analysis.correlation_matrix.symbols.length >= 2 && (
              <CorrelationHeatmap data={analysis.correlation_matrix} />
            )}

            {/* Monte Carlo Simulation */}
            {analysis?.monte_carlo && (
              <MonteCarloChart data={analysis.monte_carlo} />
            )}

            {/* Macro context — background information, least urgent */}
            {analysis?.macro && (
              <MacroCard data={analysis.macro} />
            )}

            {loading && analysis && (
              <p className="text-center text-xs text-white/30">
                Refreshing analysis...
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
