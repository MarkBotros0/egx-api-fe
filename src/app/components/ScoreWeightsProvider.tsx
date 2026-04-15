"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ScoreWeights } from "../lib/types";
import {
  fetchScoreWeights,
  updateScoreWeights,
  type ScoreWeightsResponse,
} from "../lib/api";
import {
  DEFAULT_WEIGHTS,
  FALLBACK_WEIGHT_PRESETS,
} from "../lib/constants";

interface ScoreWeightsCtx {
  weights: ScoreWeights;
  draft: ScoreWeights;
  presets: Record<string, ScoreWeights>;
  loading: boolean;
  saving: boolean;
  error: string | null;
  version: number;            // bumped after save, lets consumers know to refetch
  setDraft: (draft: ScoreWeights) => void;
  updateDraftField: (key: keyof ScoreWeights, value: number) => void;
  resetDraft: () => void;
  applyPreset: (name: string) => void;
  save: () => Promise<void>;
}

const Ctx = createContext<ScoreWeightsCtx | null>(null);

export function ScoreWeightsProvider({ children }: { children: React.ReactNode }) {
  const [weights, setWeights] = useState<ScoreWeights>(DEFAULT_WEIGHTS);
  const [draft, setDraftState] = useState<ScoreWeights>(DEFAULT_WEIGHTS);
  const [presets, setPresets] = useState<Record<string, ScoreWeights>>(FALLBACK_WEIGHT_PRESETS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchScoreWeights()
      .then((resp: ScoreWeightsResponse) => {
        if (cancelled) return;
        const w = resp.weights ?? DEFAULT_WEIGHTS;
        setWeights(w);
        setDraftState(w);
        if (resp.presets) setPresets(resp.presets);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.message || "Failed to load weights");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setDraft = useCallback((d: ScoreWeights) => setDraftState(d), []);

  const updateDraftField = useCallback(
    (key: keyof ScoreWeights, value: number) => {
      setDraftState((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const resetDraft = useCallback(() => setDraftState(weights), [weights]);

  const applyPreset = useCallback(
    (name: string) => {
      const preset = presets[name];
      if (preset) setDraftState({ ...preset });
    },
    [presets]
  );

  const save = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const resp = await updateScoreWeights(draft);
      const w = resp.weights ?? draft;
      setWeights(w);
      setDraftState(w);
      setVersion((v) => v + 1);
    } catch (e: any) {
      setError(e?.message || "Failed to save weights");
      throw e;
    } finally {
      setSaving(false);
    }
  }, [draft]);

  const value = useMemo<ScoreWeightsCtx>(
    () => ({
      weights,
      draft,
      presets,
      loading,
      saving,
      error,
      version,
      setDraft,
      updateDraftField,
      resetDraft,
      applyPreset,
      save,
    }),
    [weights, draft, presets, loading, saving, error, version, setDraft, updateDraftField, resetDraft, applyPreset, save]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useScoreWeights(): ScoreWeightsCtx {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // When rendered outside the provider (shouldn't happen in app, but guard
    // components used in storybook-like contexts), return an inert shape.
    return {
      weights: DEFAULT_WEIGHTS,
      draft: DEFAULT_WEIGHTS,
      presets: FALLBACK_WEIGHT_PRESETS,
      loading: false,
      saving: false,
      error: null,
      version: 0,
      setDraft: () => {},
      updateDraftField: () => {},
      resetDraft: () => {},
      applyPreset: () => {},
      save: async () => {},
    };
  }
  return ctx;
}

/** Normalize weights to sum to 100 for display purposes (mirrors backend math). */
export function normalizeWeights(w: ScoreWeights): ScoreWeights {
  const total = Math.max(
    0,
    (w.trend || 0) + (w.momentum || 0) + (w.volume || 0) + (w.volatility || 0) + (w.divergence || 0)
  );
  if (total <= 0) return { ...DEFAULT_WEIGHTS };
  return {
    trend: +((w.trend / total) * 100).toFixed(2),
    momentum: +((w.momentum / total) * 100).toFixed(2),
    volume: +((w.volume / total) * 100).toFixed(2),
    volatility: +((w.volatility / total) * 100).toFixed(2),
    divergence: +((w.divergence / total) * 100).toFixed(2),
  };
}
