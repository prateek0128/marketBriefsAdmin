// src/components/EditNewsDialog.tsx
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Button,
  Snackbar,
  Alert,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Box,
  Chip,
} from "@mui/material";
import { API } from "../api";

const T = {
  panel: "#0f0f0f",
  text: "#ffffff",
  textDim: "#9ca3af",
  borderStrong: "rgba(255,255,255,.12)",
  accent: "#3b82f6",
};

const CATEGORIES = ["Stocks", "Startups", "Mutual Funds", "Crypto", "Economy"] as const;
const SENTIMENTS = ["positive", "neutral", "negative"] as const;
const TAGS = ["bullish", "bearish"] as const;

type Levels = {
  novice: string;
  beginner: string;
  intermediate: string;
  expert: string;
};

export type NewsDetailPartial = {
  id: string;
  title?: string;
  title_by_level?: Levels;
  summary_by_level?: Levels;
  categories?: string[];
  impact_score?: number;
  sentiment?: string;
  sentiment_score?: number;
  market_mood?: { bullish?: number; bearish?: number; neutral?: number };
  sector?: string;
  tag?: string;
};

type FormState = {
  title: string;
  title_by_level: Levels;
  summary_by_level: Levels;
  categories: string[];
  impact_score: string;
  sentiment: string;
  sentiment_score: string;
  market_mood: { bullish: string; bearish: string; neutral: string };
  sector: string;
  tag: string;
};

type Props = {
  open: boolean;
  item: NewsDetailPartial | null;
  onClose: () => void;
  onSaved?: (updated: any) => void;
};

export default function EditNewsDialog({ open, item, onClose, onSaved }: Props) {
  const emptyLevels: Levels = { novice: "", beginner: "", intermediate: "", expert: "" };

  const [form, setForm] = useState<FormState>({
    title: "",
    title_by_level: { ...emptyLevels },
    summary_by_level: { ...emptyLevels },
    categories: [],
    impact_score: "",
    sentiment: "",
    sentiment_score: "",
    market_mood: { bullish: "", bearish: "", neutral: "" },
    sector: "",
    tag: "",
  });

  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: "success" | "error" }>(
    { open: false, message: "", severity: "success" }
  );

  useEffect(() => {
    if (!item) {
      setForm({
        title: "",
        title_by_level: { ...emptyLevels },
        summary_by_level: { ...emptyLevels },
        categories: [],
        impact_score: "",
        sentiment: "",
        sentiment_score: "",
        market_mood: { bullish: "", bearish: "", neutral: "" },
        sector: "",
        tag: "",
      });
      return;
    }

    setForm({
      title: item.title ?? "",
      title_by_level: item.title_by_level ?? { ...emptyLevels },
      summary_by_level: item.summary_by_level ?? { ...emptyLevels },
      categories: Array.isArray(item.categories) ? item.categories : item.categories ? String(item.categories).split(",").map((s) => s.trim()) : [],
      impact_score: item.impact_score != null ? String(item.impact_score) : "",
      sentiment: item.sentiment ?? "",
      sentiment_score: item.sentiment_score != null ? String(item.sentiment_score) : "",
      market_mood: item.market_mood
        ? {
            bullish: item.market_mood.bullish != null ? String(item.market_mood.bullish) : "",
            bearish: item.market_mood.bearish != null ? String(item.market_mood.bearish) : "",
            neutral: item.market_mood.neutral != null ? String(item.market_mood.neutral) : "",
          }
        : { bullish: "", bearish: "", neutral: "" },
      sector: item.sector ?? "",
      tag: item.tag ?? "",
    });
  }, [item, open]);

  const handleChange = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((s) => ({ ...s, [k]: v }));
  };

  // helper for level fields
  const handleLevelChange = (levelKey: keyof Levels, key: "title_by_level" | "summary_by_level", value: string) => {
    setForm((s) => ({
      ...s,
      [key]: { ...(s[key] as Levels), [levelKey]: value } as Levels,
    }));
  };

  const handleSave = async () => {
    if (!item?.id) {
      setSnack({ open: true, message: "No article selected", severity: "error" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title,
        title_by_level: form.title_by_level,
        summary_by_level: form.summary_by_level,
        categories: form.categories,
        impact_score: parseFloat(form.impact_score || "0"),
        sentiment: form.sentiment || undefined,
        sentiment_score: parseFloat(form.sentiment_score || "0"),
        market_mood: {
          bullish: parseFloat(form.market_mood.bullish || "0"),
          bearish: parseFloat(form.market_mood.bearish || "0"),
          neutral: parseFloat(form.market_mood.neutral || "0"),
        },
        sector: form.sector || undefined,
        tag: form.tag || undefined,
      };

      const res = await API.put(`/admin/news/${item.id}`, payload);
      const updated = res.data?.data ?? res.data ?? { ...item, ...payload };
      setSnack({ open: true, message: "News updated", severity: "success" });
      onSaved && onSaved(updated);
      onClose();
    } catch (e: any) {
      console.error("EditNewsDialog save failed:", e?.response?.data || e?.message);
      setSnack({
        open: true,
        message: e?.response?.data?.message || "Failed to update article",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  // typed list of level keys for rendering
  const levelKeys = Object.keys(form.title_by_level) as (keyof Levels)[];

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            backgroundColor: T.panel,
            color: T.text,
            border: `1px solid ${T.borderStrong}`,
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle>Edit news</DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Title"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              fullWidth
              variant="filled"
              InputProps={{ sx: { backgroundColor: "#0b0b0b", color: T.text } }}
              InputLabelProps={{ sx: { color: T.textDim } }}
            />

            {/* Title by level */}
            {levelKeys.map((lvl) => (
              <TextField
                key={lvl}
                label={`Title (${lvl})`}
                value={form.title_by_level[lvl]}
                onChange={(e) => handleLevelChange(lvl, "title_by_level", e.target.value)}
                fullWidth
                variant="filled"
                InputProps={{ sx: { backgroundColor: "#0b0b0b", color: T.text } }}
                InputLabelProps={{ sx: { color: T.textDim } }}
              />
            ))}

            {/* Summary by level */}
            {levelKeys.map((lvl) => (
              <TextField
                key={`summary-${lvl}`}
                label={`Summary (${lvl})`}
                value={form.summary_by_level[lvl]}
                onChange={(e) => handleLevelChange(lvl, "summary_by_level", e.target.value)}
                fullWidth
                multiline
                rows={2}
                variant="filled"
                InputProps={{ sx: { backgroundColor: "#0b0b0b", color: T.text } }}
                InputLabelProps={{ sx: { color: T.textDim } }}
              />
            ))}

            {/* Categories multi-select */}
            <FormControl fullWidth>
              <InputLabel sx={{ color: T.textDim }}>Categories</InputLabel>
              <Select
                multiple
                value={form.categories}
                onChange={(e) => handleChange("categories", e.target.value as string[])}
                input={<OutlinedInput label="Categories" />}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                    {(selected as string[]).map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
                sx={{ backgroundColor: "#0b0b0b", color: T.text }}
              >
                {CATEGORIES.map((c) => (
                  <MenuItem key={c} value={c}>
                    <Checkbox checked={form.categories.indexOf(c) > -1} />
                    <ListItemText primary={c} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Scores + sentiment + tag */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Impact score"
                value={form.impact_score}
                onChange={(e) => handleChange("impact_score", e.target.value)}
                variant="filled"
                sx={{ width: { xs: "100%", sm: 200 } }}
                InputProps={{ sx: { backgroundColor: "#0b0b0b", color: T.text } }}
                InputLabelProps={{ sx: { color: T.textDim } }}
              />

              {/* Sentiment dropdown */}
              <FormControl sx={{ width: { xs: "100%", sm: 240 } }}>
                <InputLabel sx={{ color: T.textDim }}>Sentiment</InputLabel>
                <Select
                  value={form.sentiment}
                  onChange={(e) => handleChange("sentiment", e.target.value as string)}
                  sx={{ backgroundColor: "#0b0b0b", color: T.text }}
                >
                  {SENTIMENTS.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Sentiment score"
                value={form.sentiment_score}
                onChange={(e) => handleChange("sentiment_score", e.target.value)}
                variant="filled"
                sx={{ width: { xs: "100%", sm: 160 } }}
                InputProps={{ sx: { backgroundColor: "#0b0b0b", color: T.text } }}
                InputLabelProps={{ sx: { color: T.textDim } }}
              />

              {/* Tag dropdown */}
              <FormControl sx={{ width: { xs: "100%", sm: 160 } }}>
                <InputLabel sx={{ color: T.textDim }}>Tag</InputLabel>
                <Select
                  value={form.tag}
                  onChange={(e) => handleChange("tag", e.target.value as string)}
                  sx={{ backgroundColor: "#0b0b0b", color: T.text }}
                >
                  {TAGS.map((t) => (
                    <MenuItem key={t} value={t}>
                      {t}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            {/* Market mood */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Market mood (bullish)"
                value={form.market_mood.bullish}
                onChange={(e) => handleChange("market_mood", { ...form.market_mood, bullish: e.target.value })}
                variant="filled"
                sx={{ width: { xs: "100%", sm: 160 } }}
                InputProps={{ sx: { backgroundColor: "#0b0b0b", color: T.text } }}
                InputLabelProps={{ sx: { color: T.textDim } }}
              />

              <TextField
                label="Market mood (bearish)"
                value={form.market_mood.bearish}
                onChange={(e) => handleChange("market_mood", { ...form.market_mood, bearish: e.target.value })}
                variant="filled"
                sx={{ width: { xs: "100%", sm: 160 } }}
                InputProps={{ sx: { backgroundColor: "#0b0b0b", color: T.text } }}
                InputLabelProps={{ sx: { color: T.textDim } }}
              />

              <TextField
                label="Market mood (neutral)"
                value={form.market_mood.neutral}
                onChange={(e) => handleChange("market_mood", { ...form.market_mood, neutral: e.target.value })}
                variant="filled"
                sx={{ width: { xs: "100%", sm: 160 } }}
                InputProps={{ sx: { backgroundColor: "#0b0b0b", color: T.text } }}
                InputLabelProps={{ sx: { color: T.textDim } }}
              />
            </Stack>

            <TextField
              label="Sector"
              value={form.sector}
              onChange={(e) => handleChange("sector", e.target.value)}
              fullWidth
              variant="filled"
              InputProps={{ sx: { backgroundColor: "#0b0b0b", color: T.text } }}
              InputLabelProps={{ sx: { color: T.textDim } }}
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} sx={{ color: T.textDim }} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            sx={{
              color: "#fff",
              backgroundColor: T.accent,
              "&:hover": { backgroundColor: "#2563eb" },
            }}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={2500} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert severity={snack.severity} sx={{ width: "100%" }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </>
  );
}
