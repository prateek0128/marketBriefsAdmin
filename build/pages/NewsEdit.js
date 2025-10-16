import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// src/components/EditNewsDialog.tsx
import { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Stack, Button, Snackbar, Alert, MenuItem, Select, InputLabel, FormControl, OutlinedInput, Checkbox, ListItemText, Box, Chip, } from "@mui/material";
import { API } from "../api";
const T = {
    panel: "#0f0f0f",
    text: "#ffffff",
    textDim: "#9ca3af",
    borderStrong: "rgba(255,255,255,.12)",
    accent: "#3b82f6",
};
const CATEGORIES = ["Stocks", "Startups", "Mutual Funds", "Crypto", "Economy"];
const SENTIMENTS = ["positive", "neutral", "negative"];
const TAGS = ["bullish", "bearish"];
export default function EditNewsDialog({ open, item, onClose, onSaved }) {
    const emptyLevels = { novice: "", beginner: "", intermediate: "", expert: "" };
    const [form, setForm] = useState({
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
    const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });
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
    const handleChange = (k, v) => {
        setForm((s) => ({ ...s, [k]: v }));
    };
    // helper for level fields
    const handleLevelChange = (levelKey, key, value) => {
        setForm((s) => ({
            ...s,
            [key]: { ...s[key], [levelKey]: value },
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
        }
        catch (e) {
            console.error("EditNewsDialog save failed:", e?.response?.data || e?.message);
            setSnack({
                open: true,
                message: e?.response?.data?.message || "Failed to update article",
                severity: "error",
            });
        }
        finally {
            setSaving(false);
        }
    };
    // typed list of level keys for rendering
    const levelKeys = Object.keys(form.title_by_level);
    return (_jsxs(_Fragment, { children: [_jsxs(Dialog, { open: open, onClose: onClose, fullWidth: true, maxWidth: "md", PaperProps: {
                    sx: {
                        backgroundColor: T.panel,
                        color: T.text,
                        border: `1px solid ${T.borderStrong}`,
                        borderRadius: 2,
                    },
                }, children: [_jsx(DialogTitle, { children: "Edit news" }), _jsx(DialogContent, { children: _jsxs(Stack, { spacing: 2, sx: { mt: 1 }, children: [_jsx(TextField, { label: "Title", value: form.title, onChange: (e) => handleChange("title", e.target.value), fullWidth: true, variant: "filled", InputProps: { sx: { backgroundColor: "#0b0b0b", color: T.text } }, InputLabelProps: { sx: { color: T.textDim } } }), levelKeys.map((lvl) => (_jsx(TextField, { label: `Title (${lvl})`, value: form.title_by_level[lvl], onChange: (e) => handleLevelChange(lvl, "title_by_level", e.target.value), fullWidth: true, variant: "filled", InputProps: { sx: { backgroundColor: "#0b0b0b", color: T.text } }, InputLabelProps: { sx: { color: T.textDim } } }, lvl))), levelKeys.map((lvl) => (_jsx(TextField, { label: `Summary (${lvl})`, value: form.summary_by_level[lvl], onChange: (e) => handleLevelChange(lvl, "summary_by_level", e.target.value), fullWidth: true, multiline: true, rows: 2, variant: "filled", InputProps: { sx: { backgroundColor: "#0b0b0b", color: T.text } }, InputLabelProps: { sx: { color: T.textDim } } }, `summary-${lvl}`))), _jsxs(FormControl, { fullWidth: true, children: [_jsx(InputLabel, { sx: { color: T.textDim }, children: "Categories" }), _jsx(Select, { multiple: true, value: form.categories, onChange: (e) => handleChange("categories", e.target.value), input: _jsx(OutlinedInput, { label: "Categories" }), renderValue: (selected) => (_jsx(Box, { sx: { display: "flex", gap: 0.5, flexWrap: "wrap" }, children: selected.map((value) => (_jsx(Chip, { label: value, size: "small" }, value))) })), sx: { backgroundColor: "#0b0b0b", color: T.text }, children: CATEGORIES.map((c) => (_jsxs(MenuItem, { value: c, children: [_jsx(Checkbox, { checked: form.categories.indexOf(c) > -1 }), _jsx(ListItemText, { primary: c })] }, c))) })] }), _jsxs(Stack, { direction: { xs: "column", sm: "row" }, spacing: 2, children: [_jsx(TextField, { label: "Impact score", value: form.impact_score, onChange: (e) => handleChange("impact_score", e.target.value), variant: "filled", sx: { width: { xs: "100%", sm: 200 } }, InputProps: { sx: { backgroundColor: "#0b0b0b", color: T.text } }, InputLabelProps: { sx: { color: T.textDim } } }), _jsxs(FormControl, { sx: { width: { xs: "100%", sm: 240 } }, children: [_jsx(InputLabel, { sx: { color: T.textDim }, children: "Sentiment" }), _jsx(Select, { value: form.sentiment, onChange: (e) => handleChange("sentiment", e.target.value), sx: { backgroundColor: "#0b0b0b", color: T.text }, children: SENTIMENTS.map((s) => (_jsx(MenuItem, { value: s, children: s }, s))) })] }), _jsx(TextField, { label: "Sentiment score", value: form.sentiment_score, onChange: (e) => handleChange("sentiment_score", e.target.value), variant: "filled", sx: { width: { xs: "100%", sm: 160 } }, InputProps: { sx: { backgroundColor: "#0b0b0b", color: T.text } }, InputLabelProps: { sx: { color: T.textDim } } }), _jsxs(FormControl, { sx: { width: { xs: "100%", sm: 160 } }, children: [_jsx(InputLabel, { sx: { color: T.textDim }, children: "Tag" }), _jsx(Select, { value: form.tag, onChange: (e) => handleChange("tag", e.target.value), sx: { backgroundColor: "#0b0b0b", color: T.text }, children: TAGS.map((t) => (_jsx(MenuItem, { value: t, children: t }, t))) })] })] }), _jsxs(Stack, { direction: { xs: "column", sm: "row" }, spacing: 2, children: [_jsx(TextField, { label: "Market mood (bullish)", value: form.market_mood.bullish, onChange: (e) => handleChange("market_mood", { ...form.market_mood, bullish: e.target.value }), variant: "filled", sx: { width: { xs: "100%", sm: 160 } }, InputProps: { sx: { backgroundColor: "#0b0b0b", color: T.text } }, InputLabelProps: { sx: { color: T.textDim } } }), _jsx(TextField, { label: "Market mood (bearish)", value: form.market_mood.bearish, onChange: (e) => handleChange("market_mood", { ...form.market_mood, bearish: e.target.value }), variant: "filled", sx: { width: { xs: "100%", sm: 160 } }, InputProps: { sx: { backgroundColor: "#0b0b0b", color: T.text } }, InputLabelProps: { sx: { color: T.textDim } } }), _jsx(TextField, { label: "Market mood (neutral)", value: form.market_mood.neutral, onChange: (e) => handleChange("market_mood", { ...form.market_mood, neutral: e.target.value }), variant: "filled", sx: { width: { xs: "100%", sm: 160 } }, InputProps: { sx: { backgroundColor: "#0b0b0b", color: T.text } }, InputLabelProps: { sx: { color: T.textDim } } })] }), _jsx(TextField, { label: "Sector", value: form.sector, onChange: (e) => handleChange("sector", e.target.value), fullWidth: true, variant: "filled", InputProps: { sx: { backgroundColor: "#0b0b0b", color: T.text } }, InputLabelProps: { sx: { color: T.textDim } } })] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: onClose, sx: { color: T.textDim }, disabled: saving, children: "Cancel" }), _jsx(Button, { onClick: handleSave, disabled: saving, sx: {
                                    color: "#fff",
                                    backgroundColor: T.accent,
                                    "&:hover": { backgroundColor: "#2563eb" },
                                }, children: saving ? "Saving…" : "Save" })] })] }), _jsx(Snackbar, { open: snack.open, autoHideDuration: 2500, onClose: () => setSnack((s) => ({ ...s, open: false })), children: _jsx(Alert, { severity: snack.severity, sx: { width: "100%" }, children: snack.message }) })] }));
}
