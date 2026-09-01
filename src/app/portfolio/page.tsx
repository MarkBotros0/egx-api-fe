"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import PortfolioSummary from "../components/PortfolioSummary";
import RiskDashboard from "../components/RiskDashboard";
import HoldingsTable from "../components/HoldingsTable";
import PEFreshnessBanner from "../components/PEFreshnessBanner";
import AddHoldingForm from "../components/AddHoldingForm";
import SellHoldingForm from "../components/SellHoldingForm";
import AddDividendForm from "../components/AddDividendForm";
import DividendsTable from "../components/DividendsTable";
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
  recordDividend,
  deleteDividend,
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
  // `sales === null` alone cannot distinguish "still loading", "failed" and
  // "no sales ever" — and the never-traded empty state must only show for the
  // third. Tracked separately so a slow or failing /api/sales never renders
  // "No holdings yet" over a real trading history.
  const [salesLoaded, setSalesLoaded] = useState(false);
  const [salesError, setSalesError] = useState<string | null>(null);
  const [sellingId, setSellingId] = useState<string | null>(null);
  const [sellError, setSellError] = useState<string | null>(null);
  const [dividendFor, setDividendFor] = useState<{
    symbol: string;
    name: string;
    sector: string;
    shares: number | null;
  } | null>(null);
  const [dividendError, setDividendError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { version: weightsVersion } = useScoreWeights();

  // Derived above the scroll-lock effect on purpose: the lock and the sell
  // modal's render condition MUST be the same expression. `sellingId` alone is
  // not it — the Sell button comes from `analysis.holdings` while this lookup
  // reads `portfolio.portfolio`, two separate fetches that can disagree (delete
  // a holding while its sell form is open and the form vanishes with the id
  // still set). Locking on the id alone left the body unscrollable with no
  // modal on screen and no Cancel button to escape it.
  const sellingHolding = sellingId
    ? portfolio?.portfolio.find((h) => h.id === sellingId)
    : null;
  const sellModalOpen = Boolean(sellingHolding);

  // Lock body scroll when mobile modal is open (iOS needs position:fixed, not just overflow:hidden)
  //
  // Mobile ONLY. Above `md` both forms render INLINE, above the holdings
  // table — locking the body there froze the page with the form scrolled out
  // of view and its Cancel button unreachable, so only a reload escaped.
  useEffect(() => {
    if (!showForm && !sellModalOpen && !dividendFor) return;
    if (window.matchMedia("(min-width: 768px)").matches) return;
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
  }, [showForm, sellModalOpen, dividendFor]);

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
      setSalesError(null);
    } catch (e: any) {
      // A sales failure must not take down the portfolio page — it is
      // surfaced as its own retry line, not the page-wide error banner.
      setSalesError(e?.message || "Could not load closed positions");
    } finally {
      setSalesLoaded(true);
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
    } else if (portfolio && portfolio.portfolio.length === 0) {
      // No holdings left to analyse — nothing else will clear the loading flag
      // that refreshAfterMutation set, so clear it here. Selling out completely
      // lands on the sold-out branch, where a stuck spinner and a permanently
      // disabled refresh button would be the only things on screen.
      setLoading(false);
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
    // Reopening starts clean — a rejection from a previous attempt describes
    // values that are no longer on screen.
    setSellError(null);
    setSellingId(id);
  };

  const closeSellForm = () => {
    setSellError(null);
    setSellingId(null);
  };

  const handleSellSubmit = async (data: {
    quantity: number;
    sell_price: number;
    sell_date: string;
    notes: string;
  }) => {
    if (!sellingId) return;
    try {
      setSellError(null);
      await recordSale({ holding_id: sellingId, ...data });
      setSellingId(null);
      await Promise.all([refreshAfterMutation(), loadSales()]);
    } catch (e: any) {
      // Into the form, not the page banner: on mobile the form covers the
      // whole viewport, so a banner behind it is invisible and the rejection
      // reads as the button doing nothing.
      setSellError(e.message);
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

  const handleAddDividend = (holding: {
    symbol: string;
    name?: string;
    sector?: string;
    quantity?: number;
  }) => {
    // Reopening starts clean — a rejection from a previous attempt describes
    // values that are no longer on screen.
    setDividendError(null);
    setDividendFor({
      symbol: holding.symbol,
      name: holding.name ?? holding.symbol,
      sector: holding.sector ?? "",
      shares: holding.quantity ?? null,
    });
  };

  const closeDividendForm = () => {
    setDividendError(null);
    setDividendFor(null);
  };

  const handleDividendSubmit = async (data: {
    symbol: string;
    name: string;
    sector: string;
    amount: number;
    pay_date: string;
    shares: number | null;
    notes: string;
  }) => {
    try {
      setDividendError(null);
      await recordDividend(data);
      setDividendFor(null);
      // A dividend changes no share count, so the heavy analysis only needs
      // re-running for the per-holding figure — which comes from it.
      await Promise.all([refreshAfterMutation(), loadSales()]);
    } catch (e: any) {
      // Into the form, not the page banner: on mobile the form covers the whole
      // viewport, so a banner behind it is invisible and the rejection reads as
      // the button doing nothing. This is also where the 409 duplicate message
      // surfaces.
      setDividendError(e.message);
    }
  };

  const handleDeleteDividend = async (id: string) => {
    try {
      await deleteDividend(id);
      await Promise.all([refreshAfterMutation(), loadSales()]);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const editingHolding = editingId
    ? portfolio?.portfolio.find((h) => h.id === editingId)
    : null;
  // `sellingHolding` is derived near the top, beside the scroll-lock effect.

  // Open holdings AND symbols with a trading history, so a dividend can be
  // recorded against a position that has already been sold.
  const dividendSymbols = useMemo(() => {
    const map = new Map<
      string,
      { symbol: string; name: string; sector: string; shares: number | null }
    >();
    for (const s of sales?.sales ?? []) {
      map.set(s.symbol, {
        symbol: s.symbol, name: s.name, sector: s.sector, shares: null,
      });
    }
    // Open holdings win — they carry a live share count.
    for (const h of portfolio?.portfolio ?? []) {
      map.set(h.symbol, {
        symbol: h.symbol,
        name: h.name ?? h.symbol,
        sector: h.sector ?? "",
        shares: h.quantity ?? null,
      });
    }
    return Array.from(map.values()).sort((a, b) =>
      a.symbol.localeCompare(b.symbol)
    );
  }, [sales, portfolio]);

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

        {/* Sell form — full screen on mobile, inline on desktop.
            Gated on `sellingHolding`, the same value `sellModalOpen` is derived
            from, so the body-scroll lock can never outlive what is on screen. */}
        {sellingHolding && (
          <>
            <div className="fixed inset-0 z-[60] flex flex-col bg-charcoal-dark md:hidden">
              <div
                className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 pb-3"
                style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
              >
                <h2 className="text-lg font-bold text-white">Record Sale</h2>
                <button
                  onClick={closeSellForm}
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
                  onCancel={closeSellForm}
                  error={sellError}
                  onDismissError={() => setSellError(null)}
                />
              </div>
            </div>

            <div className="mb-6 hidden md:block">
              <SellHoldingForm
                holding={sellingHolding}
                onSubmit={handleSellSubmit}
                onCancel={closeSellForm}
                error={sellError}
                onDismissError={() => setSellError(null)}
              />
            </div>
          </>
        )}

        {/* Dividend form — full screen on mobile, inline on desktop.
            Gated on `dividendFor`, the same value the scroll-lock effect
            checks, so the body-scroll lock can never outlive what is on
            screen. */}
        {dividendFor && (
          <>
            {/* Mobile: full-screen */}
            <div className="fixed inset-0 z-[60] flex flex-col bg-charcoal-dark md:hidden">
              {/* Header — respects safe-area-inset-top so it clears the status
                  bar in the installed PWA, and shrink-0 so it cannot squash
                  when the form below it overflows. Identical to the Record
                  Sale modal's header on purpose: two full-screen modals that
                  sit at the same z-index must not look like different apps. */}
              <div
                className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 pb-3"
                style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
              >
                <h2 className="text-lg font-bold text-white">Record Dividend</h2>
                <button
                  onClick={closeDividendForm}
                  className="min-h-[44px] min-w-[44px] text-sm text-white/50"
                >
                  Cancel
                </button>
              </div>
              <div
                className="flex-1 overflow-y-auto p-4"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                <AddDividendForm
                  symbols={dividendSymbols}
                  presetSymbol={dividendFor.symbol}
                  onSubmit={handleDividendSubmit}
                  onCancel={closeDividendForm}
                  error={dividendError}
                  onDismissError={() => setDividendError(null)}
                />
              </div>
            </div>
            {/* Desktop: inline card */}
            <div className="mb-6 hidden md:block">
              <AddDividendForm
                symbols={dividendSymbols}
                presetSymbol={dividendFor.symbol}
                onSubmit={handleDividendSubmit}
                onCancel={closeDividendForm}
                error={dividendError}
                onDismissError={() => setDividendError(null)}
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

        {/* Closed positions fail on their own line, never as the page-wide
            banner — the rest of the page is unaffected by a /api/sales
            outage, and without this the failure was completely silent. */}
        {salesError && (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-loss/20 bg-loss/5 px-4 py-3 text-xs text-loss">
            <span>Couldn&apos;t load your closed positions.</span>
            <button
              onClick={() => loadSales()}
              className="min-h-[44px] text-xs text-white/50 underline hover:text-white"
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
        ) : !portfolio?.portfolio.length &&
          !showForm &&
          salesLoaded &&
          !salesError &&
          !sales?.sales.length &&
          !sales?.dividends.length ? (
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
            {sales && (
              <DividendsTable
                dividends={sales.dividends}
                onDelete={handleDeleteDividend}
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

            {sales && (sales.sales.length > 0 || sales.dividends.length > 0) && (
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
            {sales && (
              <DividendsTable
                dividends={sales.dividends}
                onDelete={handleDeleteDividend}
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
                onAddDividend={handleAddDividend}
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
