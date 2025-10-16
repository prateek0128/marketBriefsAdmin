import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// src/pages/NewsDetails.tsx
import { useEffect, useMemo, useState } from "react";
import { Box, Chip, Container, IconButton, Link as MLink, Paper, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert, Divider, } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import { API } from "../api";
import EditNewsDialog from "../pages/NewsEdit";
/**
 * NewsDetails page
 * - Fetches /news/high-impact
 * - Finds article by id param
 * - Renders *all* fields (id, title, url, source, published_at, time_ago, categories,
 *   impact_score/label, sentiment_score/label, authors, engagement, tag,
 *   reading_level, title_by_level, summary_by_level, content, raw JSON)
 *
 * TypeScript note: we coerce unknown nested entries to string when rendering to avoid
 * `Type 'unknown' is not assignable to type 'ReactNode'` errors.
 */
function impactColor(score) {
    if (score >= 9.5)
        return "#ef4444";
    if (score >= 9.0)
        return "#f59e0b";
    if (score >= 8.0)
        return "#3b82f6";
    return "#9ca3af";
}
function sentimentStyleFromScore(score) {
    if (score > 0.15)
        return { bg: "#22c55e20", fg: "#22c55e", text: "Positive" };
    if (score < -0.15)
        return { bg: "#ef444420", fg: "#ef4444", text: "Negative" };
    return { bg: "#6b728020", fg: "#9ca3af", text: "Neutral" };
}
export default function NewsDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [item, setItem] = useState(null);
    const [err, setErr] = useState(null);
    // edit/delete UI state
    const [editOpen, setEditOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        title: "",
        summary: "",
        categories: "",
        impact_score: "",
        sentiment: "",
    });
    const [saving, setSaving] = useState(false);
    const [delOpen, setDelOpen] = useState(false);
    const [snack, setSnack] = useState({
        open: false,
        message: "",
        severity: "success",
    });
    // load list and pick item by id (per your request use /news/high-impact)
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                const res = await API.get("/news/high-impact");
                const list = res.data?.data ?? [];
                const found = list.find((x) => x.id === id);
                if (!mounted)
                    return;
                if (!found) {
                    setErr("Article not found");
                    setItem(null);
                }
                else {
                    setItem(found);
                    setErr(null);
                }
            }
            catch (e) {
                console.error("News details load failed:", e?.response?.data || e?.message);
                setErr(e?.response?.data?.message || "Failed to load news");
                setItem(null);
            }
            finally {
                if (mounted)
                    setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [id]);
    // populate edit form when item arrives
    useEffect(() => {
        if (!item)
            return;
        setEditForm({
            title: item.title ?? "",
            summary: item.summary ?? "",
            categories: (item.categories ?? []).join(", "),
            impact_score: item.impact_score != null ? String(item.impact_score) : "",
            sentiment: item.sentiment_label ?? "",
        });
    }, [item]);
    const sentimentDisplay = useMemo(() => {
        if (!item)
            return sentimentStyleFromScore(0);
        if (item.sentiment_label) {
            return { bg: "#6b728020", fg: "#9ca3af", text: String(item.sentiment_label) };
        }
        return sentimentStyleFromScore(Number(item.sentiment_score ?? 0));
    }, [item]);
    const handleSave = async () => {
        if (!item)
            return;
        setSaving(true);
        try {
            const payload = {
                title: editForm.title,
                summary: editForm.summary,
                categories: editForm.categories.split(",").map((s) => s.trim()).filter(Boolean),
                impact_score: parseFloat(editForm.impact_score || "0"),
                sentiment: editForm.sentiment,
            };
            // admin edit endpoint
            const res = await API.put(`/admin/news/${item.id}`, payload);
            const updated = res.data?.data ?? { ...item, ...payload };
            setItem(updated);
            setSnack({ open: true, message: "News updated", severity: "success" });
            setEditOpen(false);
        }
        catch (e) {
            console.error("Update failed:", e);
            setSnack({ open: true, message: "Update failed", severity: "error" });
        }
        finally {
            setSaving(false);
        }
    };
    const handleDelete = async () => {
        if (!item)
            return;
        try {
            await API.delete(`/admin/news/${item.id}`);
            setSnack({ open: true, message: "News deleted", severity: "success" });
            setDelOpen(false);
            setTimeout(() => navigate("/news"), 400);
        }
        catch (e) {
            console.error("Delete failed:", e);
            setSnack({ open: true, message: "Delete failed", severity: "error" });
        }
    };
    // helper to safely turn unknown to string when rendering
    const safeString = (v) => {
        if (v == null)
            return "—";
        if (typeof v === "string")
            return v;
        if (typeof v === "number" || typeof v === "boolean")
            return String(v);
        try {
            return JSON.stringify(v, null, 2);
        }
        catch {
            return String(v);
        }
    };
    return (_jsx(DashboardLayout, { children: _jsxs(Container, { sx: { mt: 4, mb: 6 }, children: [_jsxs(Button, { onClick: () => navigate(-1), sx: {
                        mb: 2,
                        color: "#9ca3af",
                        border: "1px solid rgba(255,255,255,.12)",
                        borderRadius: 2,
                        px: 1,
                    }, children: [_jsx(ArrowBackIosNewIcon, { fontSize: "small", sx: { mr: 1 } }), "Back"] }), loading ? (_jsx(Paper, { sx: { p: 4, borderRadius: 3, backgroundColor: "#0f0f0f", color: "#fff" }, children: _jsx(Typography, { children: "Loading\u2026" }) })) : err ? (_jsx(Paper, { sx: { p: 3, borderRadius: 2, backgroundColor: "#0f0f0f", color: "#fff" }, children: _jsx(Typography, { color: "error", children: err }) })) : item ? (_jsxs(Paper, { sx: { p: { xs: 2, md: 4 }, borderRadius: 3, backgroundColor: "#0f0f0f", color: "#fff", border: "1px solid rgba(255,255,255,0.06)" }, children: [_jsxs(Box, { sx: { display: "flex", gap: 2, justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap" }, children: [_jsxs(Box, { sx: { flex: "1 1 60%" }, children: [_jsx(Typography, { variant: "h5", sx: { mb: 1 }, children: safeString(item.title) }), _jsxs(Box, { sx: { display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }, children: [_jsx(Chip, { label: safeString(item.source), size: "small", sx: { bgcolor: "#111827", color: "#93c5fd" } }), _jsx(Chip, { label: item.published_at ? new Date(String(item.published_at)).toLocaleString() : "—", size: "small", sx: { bgcolor: "#111827" } }), _jsx(Chip, { label: `${safeString(item.impact_label)} (${item.impact_score != null ? Number(item.impact_score).toFixed(2) : "—"})`, size: "small", sx: {
                                                        bgcolor: `${impactColor(Number(item.impact_score ?? 0))}20`,
                                                        color: impactColor(Number(item.impact_score ?? 0)),
                                                        fontWeight: 700,
                                                    } }), _jsx(Chip, { label: `Sentiment: ${sentimentDisplay.text} (${item.sentiment_score != null ? Number(item.sentiment_score).toFixed(2) : "—"})`, size: "small", sx: { bgcolor: sentimentDisplay.bg, color: sentimentDisplay.fg, fontWeight: 700 } }), item.tag && _jsx(Chip, { label: safeString(item.tag), size: "small", sx: { textTransform: "capitalize" } })] })] }), _jsxs(Box, { sx: { display: "flex", flexDirection: "column", gap: 1, alignItems: "flex-end" }, children: [_jsx(IconButton, { href: safeString(item.url), target: "_blank", rel: "noopener noreferrer", sx: { color: "#3b82f6" }, "aria-label": "open-source", children: _jsx(OpenInNewIcon, {}) }), _jsxs(Box, { sx: { display: "flex", gap: 1 }, children: [_jsx(Button, { startIcon: _jsx(EditIcon, {}), onClick: () => setEditOpen(true), variant: "outlined", size: "small", children: "Edit" }), _jsx(Button, { startIcon: _jsx(DeleteIcon, {}), onClick: () => setDelOpen(true), variant: "outlined", color: "error", size: "small", children: "Delete" })] })] })] }), _jsx(Divider, { sx: { my: 2, borderColor: "rgba(255,255,255,0.06)" } }), _jsxs(Box, { sx: {
                                display: "grid",
                                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                                gap: 2,
                                alignItems: "start",
                            }, children: [_jsxs(Box, { children: [_jsxs(Typography, { variant: "body2", sx: { color: "#9ca3af", mb: 0.5 }, children: [_jsx("strong", { children: "ID:" }), " ", safeString(item.id)] }), _jsxs(Typography, { variant: "body2", sx: { color: "#9ca3af", mb: 0.5 }, children: [_jsx("strong", { children: "Source URL:" }), " ", _jsx(MLink, { href: safeString(item.url), target: "_blank", rel: "noopener noreferrer", children: safeString(item.url) })] }), _jsxs(Typography, { variant: "body2", sx: { color: "#9ca3af", mb: 0.5 }, children: [_jsx("strong", { children: "Time ago:" }), " ", safeString(item.time_ago)] }), _jsxs(Typography, { variant: "body2", sx: { color: "#9ca3af", mb: 0.5 }, children: [_jsx("strong", { children: "Date extracted:" }), " ", safeString(item.date_extracted)] }), _jsxs(Box, { sx: { mt: 1 }, children: [_jsx(Typography, { variant: "subtitle2", sx: { mb: 1 }, children: "Categories" }), Array.isArray(item.categories) && item.categories.length ? (_jsx(Box, { sx: { display: "flex", gap: 1, flexWrap: "wrap" }, children: item.categories.map((c, i) => (_jsx(Chip, { label: safeString(c), size: "small", sx: { bgcolor: "#111827", color: "#93c5fd" } }, String(i)))) })) : (_jsx(Typography, { variant: "body2", children: "\u2014" }))] })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "subtitle2", sx: { mb: 1 }, children: "Authors" }), Array.isArray(item.authors) && item.authors.length ? (_jsx(Box, { sx: { display: "flex", gap: 1, flexWrap: "wrap" }, children: item.authors.map((a, i) => (_jsx(Chip, { label: safeString(a), size: "small", sx: { bgcolor: "#0b1220", color: "#c4d3f6" } }, String(i)))) })) : (_jsx(Typography, { variant: "body2", children: "\u2014" })), _jsxs(Box, { sx: { mt: 2 }, children: [_jsx(Typography, { variant: "subtitle2", children: "Engagement" }), _jsxs(Typography, { variant: "body2", sx: { mt: 0.5 }, children: ["\u2764 ", Number(item.engagement?.likes ?? 0), " \u2022 \uD83D\uDCAC ", Number(item.engagement?.comments ?? 0)] })] }), _jsxs(Box, { sx: { mt: 2 }, children: [_jsx(Typography, { variant: "subtitle2", children: "Reading level" }), _jsx(Typography, { variant: "body2", children: safeString(item.reading_level) })] })] })] }), _jsx(Divider, { sx: { my: 2, borderColor: "rgba(255,255,255,0.06)" } }), item.summary ? (_jsxs(_Fragment, { children: [_jsx(Typography, { variant: "subtitle2", children: "Summary" }), _jsx(Typography, { variant: "body1", sx: { mt: 1, color: "#d1d5db", whiteSpace: "pre-wrap" }, children: safeString(item.summary) })] })) : null, item.content ? (_jsx(_Fragment, { children: _jsxs(Box, { sx: { mt: 2 }, children: [_jsx(Typography, { variant: "subtitle2", children: "Content" }), _jsx(Typography, { variant: "body2", sx: { mt: 1, color: "#c7cdd6", whiteSpace: "pre-wrap" }, children: safeString(item.content) })] }) })) : null, item.title_by_level && typeof item.title_by_level === "object" && (_jsxs(_Fragment, { children: [_jsx(Divider, { sx: { my: 2, borderColor: "rgba(255,255,255,0.06)" } }), _jsx(Typography, { variant: "subtitle2", children: "Titles by level" }), _jsx(Box, { sx: { mt: 1 }, children: Object.entries(item.title_by_level).map(([level, text]) => (_jsxs(Box, { sx: { mb: 1 }, children: [_jsx(Typography, { variant: "body2", sx: { color: "#9ca3af" }, children: _jsx("strong", { children: safeString(level) }) }), _jsx(Typography, { variant: "body1", sx: { whiteSpace: "pre-wrap" }, children: safeString(text) })] }, level))) })] })), item.summary_by_level && typeof item.summary_by_level === "object" && (_jsxs(_Fragment, { children: [_jsx(Divider, { sx: { my: 2, borderColor: "rgba(255,255,255,0.06)" } }), _jsx(Typography, { variant: "subtitle2", children: "Summaries by level" }), _jsx(Box, { sx: { mt: 1 }, children: Object.entries(item.summary_by_level).map(([level, text]) => (_jsxs(Box, { sx: { mb: 2 }, children: [_jsx(Typography, { variant: "body2", sx: { color: "#9ca3af" }, children: _jsx("strong", { children: safeString(level) }) }), _jsx(Typography, { variant: "body2", sx: { whiteSpace: "pre-wrap", mt: 0.5 }, children: safeString(text) })] }, level))) })] })), _jsx(Divider, { sx: { my: 2, borderColor: "rgba(255,255,255,0.06)" } }), _jsxs(Box, { sx: { background: "#080808", p: 2, borderRadius: 1 }, children: [_jsx(Typography, { variant: "caption", sx: { color: "#9ca3af" }, children: "Raw JSON (for debugging)" }), _jsx(Box, { component: "pre", sx: { fontSize: 12, mt: 1, whiteSpace: "pre-wrap", color: "#e5e7eb" }, children: JSON.stringify(item, null, 2) })] })] })) : null, _jsx(EditNewsDialog, { open: editOpen, item: item, onClose: () => setEditOpen(false), onSaved: (u) => setItem(u) }), _jsxs(Dialog, { open: delOpen, onClose: () => setDelOpen(false), children: [_jsx(DialogTitle, { children: "Delete Article?" }), _jsx(DialogContent, { children: _jsx(Typography, { children: "Are you sure you want to delete this article? This can't be undone." }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setDelOpen(false), children: "Cancel" }), _jsx(Button, { color: "error", onClick: handleDelete, children: "Delete" })] })] }), _jsx(Snackbar, { open: snack.open, autoHideDuration: 3000, onClose: () => setSnack((s) => ({ ...s, open: false })), children: _jsx(Alert, { severity: snack.severity, children: snack.message }) })] }) }));
}
