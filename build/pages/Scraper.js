import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/pages/Scraper.tsx
import { useCallback, useEffect, useState } from "react";
import { Box, Button, Card, CardContent, CardActions, Chip, Container, Divider, FormControlLabel, IconButton, LinearProgress, List, ListItem, ListItemSecondaryAction, ListItemText, Switch, Typography, Snackbar, Tooltip, TextField, Stack, } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import CloudIcon from "@mui/icons-material/Cloud";
import RefreshIcon from "@mui/icons-material/Refresh";
import LaunchIcon from "@mui/icons-material/Launch";
import DashboardLayout from "../layouts/DashboardLayout";
import { API } from "../api";
/* Theme tokens */
const T = {
    bgPanel: "#0f0f0f",
    text: "#ffffff",
    textDim: "#9ca3af",
    border: "rgba(255,255,255,0.10)",
    accent: "#3b82f6",
    muted: "rgba(255,255,255,0.04)",
};
export default function Scraper() {
    const [loading, setLoading] = useState(true);
    const [config, setConfig] = useState(null);
    const [localServerOn, setLocalServerOn] = useState(false);
    const [savingId, setSavingId] = useState(null);
    const [snack, setSnack] = useState(null);
    // scraping limits UI state
    const [limitValue, setLimitValue] = useState("");
    const [savingLimit, setSavingLimit] = useState(false);
    const [limitError, setLimitError] = useState(null);
    /** Fetch current scraper configuration */
    const fetchConfig = useCallback(async () => {
        setLoading(true);
        setSnack(null);
        try {
            const res = await API.get("/admin/config/news-sources");
            const payload = res.data?.data ?? res.data;
            if (payload) {
                const normalized = {
                    enabled_sources: payload.enabled_sources ?? [],
                    disabled_sources: payload.disabled_sources ?? [],
                    max_articles_per_source: typeof payload.max_articles_per_source === "number"
                        ? payload.max_articles_per_source
                        : 0,
                    database_sources: Array.isArray(payload.database_sources)
                        ? payload.database_sources
                        : [],
                    available_scrapers: Array.isArray(payload.available_scrapers)
                        ? payload.available_scrapers
                        : [],
                };
                setConfig(normalized);
                // initialize limit UI from config
                setLimitValue(normalized.max_articles_per_source ?? 0);
            }
            else {
                setSnack("Empty config returned");
                setConfig(null);
                setLimitValue("");
            }
        }
        catch (err) {
            console.error("fetchConfig failed", err);
            setSnack("Failed to load scraper config");
            setConfig(null);
            setLimitValue("");
        }
        finally {
            setLoading(false);
        }
    }, []);
    /** Fetch local scraper server status */
    const fetchLocalStatus = useCallback(async () => {
        try {
            const res = await API.get("/scraper/local/status").catch(() => null);
            if (res?.data?.on !== undefined)
                setLocalServerOn(Boolean(res.data.on));
        }
        catch (e) {
            console.warn("local status fetch failed", e);
        }
    }, []);
    useEffect(() => {
        fetchConfig();
        fetchLocalStatus();
    }, [fetchConfig, fetchLocalStatus]);
    /** Toggle source on/off (enable or disable) */
    async function toggleSource(id, enable) {
        setSavingId(id);
        // Optimistic update
        setConfig((c) => c
            ? {
                ...c,
                database_sources: c.database_sources.map((s) => s.id === id ? { ...s, scraper_enabled: enable } : s),
            }
            : c);
        try {
            const endpoint = `/admin/config/news-sources/${id}/${enable ? "enable" : "disable"}`;
            await API.put(endpoint);
            setSnack(enable ? "Source enabled" : "Source disabled");
        }
        catch (err) {
            console.error("toggleSource failed", err);
            setSnack("Failed to toggle source");
            // rollback
            setConfig((c) => c
                ? {
                    ...c,
                    database_sources: c.database_sources.map((s) => s.id === id ? { ...s, scraper_enabled: !enable } : s),
                }
                : c);
        }
        finally {
            setSavingId(null);
        }
    }
    /** Toggle local server (optional feature) */
    async function toggleLocalServer(on) {
        try {
            // keep using POST as before (backend may expect this)
            await API.post("/scraper/local/toggle", { on });
            setLocalServerOn(on);
            setSnack(on ? "Local server started" : "Local server stopped");
        }
        catch (err) {
            console.error("toggleLocalServer failed", err);
            setSnack("Failed to toggle local server");
        }
    }
    /** Update scraping limit on server */
    async function updateScrapingLimit() {
        // validate
        setLimitError(null);
        if (limitValue === "" || limitValue === null) {
            setLimitError("Enter a limit");
            return;
        }
        const n = Number(limitValue);
        if (!Number.isInteger(n) || n <= 0) {
            setLimitError("Limit must be a positive integer");
            return;
        }
        setSavingLimit(true);
        try {
            // backend expects PUT to /admin/config/scraping-limits with JSON body
            const res = await API.put("/admin/config/scraping-limits", { max_articles_per_source: n });
            const payload = res.data?.data ?? res.data;
            const newLimit = typeof payload?.max_articles_per_source === "number"
                ? payload.max_articles_per_source
                : n;
            // update config state from server response
            setConfig((c) => (c ? { ...c, max_articles_per_source: newLimit } : c));
            setLimitValue(newLimit);
            setSnack("Scraping limit updated");
        }
        catch (err) {
            console.error("updateScrapingLimit failed", err);
            setSnack("Failed to update scraping limit");
        }
        finally {
            setSavingLimit(false);
        }
    }
    return (_jsx(DashboardLayout, { children: _jsxs(Container, { sx: { mt: 4 }, children: [_jsxs(Box, { sx: { display: "flex", gap: 2, alignItems: "center", mb: 2 }, children: [_jsx(CloudIcon, { sx: { color: T.text, fontSize: 36 } }), _jsxs(Box, { sx: { flex: 1 }, children: [_jsx(Typography, { variant: "h4", sx: { color: T.text }, children: "Scraper Configuration" }), _jsx(Typography, { sx: { color: T.textDim, mt: 0.5 }, children: "Toggle scrapers for each database source and manage scraping limits." })] }), _jsx(Tooltip, { title: "Refresh config", children: _jsx(Button, { startIcon: _jsx(RefreshIcon, {}), onClick: () => {
                                    fetchConfig();
                                    fetchLocalStatus();
                                }, variant: "contained", sx: { backgroundColor: T.accent }, disabled: loading, children: "Refresh" }) })] }), _jsx(Card, { sx: { mb: 3, backgroundColor: T.bgPanel, border: `1px solid ${T.border}` }, children: _jsx(CardContent, { children: loading ? (_jsx(LinearProgress, { sx: { height: 6, borderRadius: 2 } })) : (_jsxs(Box, { sx: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }, children: [_jsxs(Box, { children: [_jsx(Typography, { sx: { color: T.text, fontWeight: 700 }, children: "Global Config" }), _jsxs(Typography, { sx: { color: T.textDim, fontSize: 13, mt: 0.5 }, children: ["Max articles per source:", " ", _jsx("strong", { style: { color: T.text }, children: config?.max_articles_per_source ?? "—" })] })] }), _jsxs(Box, { sx: { display: "flex", gap: 2, alignItems: "center" }, children: [_jsxs(Box, { sx: { textAlign: "right" }, children: [_jsx(Typography, { sx: { color: T.textDim, fontSize: 12 }, children: "Local scraping server" }), _jsx(Typography, { sx: { color: localServerOn ? "#86efac" : T.textDim, fontWeight: 700 }, children: localServerOn ? "Running" : "Stopped" })] }), _jsx(FormControlLabel, { control: _jsx(Switch, { checked: localServerOn, onChange: (e) => toggleLocalServer(e.target.checked) }), label: localServerOn ? "On" : "Off" })] })] })) }) }), _jsx(Card, { sx: { mb: 3, backgroundColor: T.bgPanel, border: `1px solid ${T.border}` }, children: _jsx(CardContent, { children: _jsxs(Stack, { direction: { xs: "column", sm: "row" }, spacing: 2, alignItems: "center", children: [_jsxs(Box, { children: [_jsx(Typography, { sx: { color: T.text, fontWeight: 700 }, children: "Scraping limit" }), _jsx(Typography, { sx: { color: T.textDim, fontSize: 13 }, children: "Maximum number of articles to fetch per source." })] }), _jsx(TextField, { label: "Max articles per source", type: "number", size: "small", value: limitValue, onChange: (e) => {
                                        const v = e.target.value;
                                        // allow empty input
                                        setLimitValue(v === "" ? "" : Number(v));
                                        setLimitError(null);
                                    }, inputProps: { min: 1 }, sx: { width: 160 } }), _jsx(Button, { variant: "contained", startIcon: _jsx(SaveIcon, {}), onClick: updateScrapingLimit, disabled: savingLimit || limitValue === "" || Number(limitValue) === config?.max_articles_per_source, sx: { backgroundColor: T.accent }, children: savingLimit ? "Saving..." : "Save" }), limitError && _jsx(Typography, { sx: { color: "#f87171", ml: 1 }, children: limitError })] }) }) }), _jsxs(Card, { sx: { backgroundColor: T.bgPanel, border: `1px solid ${T.border}` }, children: [_jsxs(CardContent, { children: [_jsx(Typography, { sx: { color: T.text, fontWeight: 700, mb: 1 }, children: "Database Sources" }), loading ? (_jsx(LinearProgress, { sx: { height: 6, borderRadius: 2 } })) : config && config.database_sources.length ? (_jsx(List, { children: config.database_sources.map((src) => (_jsxs(ListItem, { sx: {
                                            mb: 1,
                                            backgroundColor: "rgba(255,255,255,0.02)",
                                            borderRadius: 2,
                                            alignItems: "flex-start",
                                        }, children: [_jsx(ListItemText, { primary: _jsxs(Box, { sx: { display: "flex", gap: 1, alignItems: "center" }, children: [_jsx(Typography, { sx: { color: T.text, fontWeight: 700 }, children: src.name }), _jsx(Chip, { label: src.type, size: "small", sx: { ml: 1 } })] }), secondary: _jsx(Box, { sx: { mt: 1 }, children: _jsx(Typography, { sx: { color: T.textDim, fontSize: 13 }, children: src.url }) }) }), _jsxs(ListItemSecondaryAction, { sx: { right: 8, display: "flex", gap: 1, alignItems: "center" }, children: [_jsx(Tooltip, { title: "Open source URL", children: _jsx(IconButton, { size: "small", component: "a", href: src.url, target: "_blank", rel: "noreferrer", sx: { color: T.text }, children: _jsx(LaunchIcon, {}) }) }), _jsx(Chip, { label: src.scraper_enabled ? "ENABLED" : "DISABLED", size: "small", sx: {
                                                            bgcolor: src.scraper_enabled ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.02)",
                                                            color: src.scraper_enabled ? "#86efac" : T.textDim,
                                                            border: `1px solid ${src.scraper_enabled ? "rgba(34,197,94,0.14)" : "rgba(255,255,255,0.03)"}`,
                                                            mr: 1,
                                                        } }), _jsx(FormControlLabel, { control: _jsx(Switch, { checked: src.scraper_enabled, onChange: (e) => toggleSource(src.id, e.target.checked), disabled: savingId === src.id }), label: src.scraper_enabled ? "On" : "Off" })] })] }, src.id))) })) : (_jsx(Typography, { sx: { color: T.textDim }, children: "No database sources found." }))] }), _jsx(Divider, {}), _jsx(CardActions, { sx: { justifyContent: "flex-end", p: 2 }, children: _jsx(Button, { variant: "text", startIcon: _jsx(RefreshIcon, {}), onClick: fetchConfig, sx: { color: T.textDim }, children: "Refresh" }) })] }), _jsx(Snackbar, { open: !!snack, autoHideDuration: 2500, onClose: () => setSnack(null), message: snack })] }) }));
}
