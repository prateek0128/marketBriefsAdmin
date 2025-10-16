import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/pages/Logs.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button, Card, CardContent, Container, Typography, LinearProgress, Chip, Stack, TextField, Select, MenuItem, InputLabel, FormControl, TablePagination, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Tooltip, Divider, } from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CloseIcon from "@mui/icons-material/Close";
import RefreshIcon from "@mui/icons-material/Refresh";
import DashboardLayout from "../layouts/DashboardLayout";
import { API } from "../api";
const T = {
    bgPanel: "#0f0f0f",
    text: "#ffffff",
    textDim: "#9ca3af",
    border: "rgba(255,255,255,0.10)",
    accent: "#3b82f6",
    muted: "rgba(255,255,255,0.04)",
    success: "#16a34a",
    warn: "#f59e0b",
    error: "#ef4444",
};
export default function Logs() {
    const [loadingStats, setLoadingStats] = useState(true);
    const [loadingLogs, setLoadingLogs] = useState(true);
    const [stats, setStats] = useState(null);
    const [logs, setLogs] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [snack, setSnack] = useState(null);
    // Filters/pagination
    const [adminEmail, setAdminEmail] = useState("");
    const [actionFilter, setActionFilter] = useState("");
    const [successFilter, setSuccessFilter] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    // dialog + selection
    const [openDetails, setOpenDetails] = useState(false);
    const [selectedLog, setSelectedLog] = useState(null);
    // view mode: "terminal" or "table"
    const [viewMode, setViewMode] = useState("terminal");
    // ---------------- helpers ----------------
    const buildDateIso = (d, endOfDay = false) => {
        if (!d)
            return "";
        return d + (endOfDay ? "T23:59:59Z" : "T00:00:00Z");
    };
    const formatWhen = (ts) => {
        if (!ts)
            return "—";
        try {
            const d = new Date(ts);
            if (isNaN(d.getTime()))
                return ts;
            return d.toLocaleString();
        }
        catch {
            return ts;
        }
    };
    // derive a short, pretty human message from a log entry
    function derivePrettyMessage(l) {
        // If details contains obvious fields, use them:
        if (!l.details)
            return l.action;
        const d = l.details;
        // Common patterns: scraping messages, article info, max_articles_per_source, action/status
        if (d.title)
            return `📰 Title: "${String(d.title)}"`;
        if (d.action && d.status)
            return `🔁 ${d.action} — ${d.status}`;
        if (d.max_articles_per_source !== undefined)
            return `⚙️ max_articles_per_source: ${d.max_articles_per_source}`;
        if (d.source_id || d.source_type)
            return `🧭 Source ${d.source_type ?? d.source_id ?? ""} — ${d.status ?? ""}`.trim();
        // If details is small primitive
        if (typeof d === "string" || typeof d === "number" || typeof d === "boolean")
            return String(d);
        // else JSON summary (pick a few keys)
        const keys = Object.keys(d).slice(0, 3);
        if (keys.length === 0)
            return l.action;
        return keys.map((k) => `${k}: ${JSON.stringify(d[k])}`).join(" • ");
    }
    // determine level and colors/icons
    function levelFromLog(l) {
        // prefer explicit success flag: true -> INFO (success), false -> ERROR
        if (l.success === true)
            return { level: "INFO", color: T.success, icon: "✅" };
        if (l.success === false)
            return { level: "ERROR", color: T.error, icon: "❌" };
        // fallback: treat known actions with "UPDATED" / "ENABLED" as INFO
        const a = (l.action || "").toUpperCase();
        if (a.includes("ERROR") || a.includes("FAILED"))
            return { level: "ERROR", color: T.error, icon: "❌" };
        if (a.includes("WARN") || a.includes("WARNING"))
            return { level: "WARN", color: T.warn, icon: "⚠️" };
        return { level: "INFO", color: T.textDim, icon: "ℹ️" };
    }
    // ---------------- fetch ----------------
    const fetchStats = useCallback(async () => {
        setLoadingStats(true);
        setSnack(null);
        try {
            const res = await API.get("/admin/audit-logs/stats");
            const payload = res.data?.data ?? res.data;
            setStats({
                actions_by_type: Array.isArray(payload?.actions_by_type) ? payload.actions_by_type : [],
                top_admins: Array.isArray(payload?.top_admins) ? payload.top_admins : [],
                date_range_start: payload?.date_range_start,
                date_range_end: payload?.date_range_end,
            });
        }
        catch (err) {
            console.error("fetchStats failed", err);
            setSnack("Failed to load stats");
            setStats(null);
        }
        finally {
            setLoadingStats(false);
        }
    }, []);
    const fetchLogs = useCallback(async (opts) => {
        setLoadingLogs(true);
        setSnack(null);
        try {
            if (opts?.resetPage)
                setPage(0);
            const skip = opts?.resetPage ? 0 : page * rowsPerPage;
            const limit = rowsPerPage;
            const params = {
                admin_email: adminEmail ?? "",
                action: actionFilter ?? "",
                success: successFilter === "" ? "" : successFilter,
                start_date: startDate ? buildDateIso(startDate, false) : "",
                end_date: endDate ? buildDateIso(endDate, true) : "",
                skip,
                limit,
            };
            Object.keys(params).forEach((k) => {
                if (params[k] === "" || params[k] == null)
                    delete params[k];
            });
            const res = await API.get("/admin/audit-logs", { params });
            const payload = res.data?.data ?? res.data;
            setLogs(Array.isArray(payload?.audit_logs) ? payload.audit_logs : []);
            setTotalCount(typeof payload?.count === "number" ? payload.count : (Array.isArray(payload?.audit_logs) ? payload.audit_logs.length : 0));
        }
        catch (err) {
            console.error("fetchLogs failed", err);
            setSnack("Failed to load logs");
            setLogs([]);
            setTotalCount(0);
        }
        finally {
            setLoadingLogs(false);
        }
    }, [adminEmail, actionFilter, successFilter, startDate, endDate, page, rowsPerPage]);
    useEffect(() => {
        fetchStats();
        fetchLogs({ resetPage: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useEffect(() => {
        fetchLogs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, rowsPerPage]);
    // ---------------- CSV / copy ----------------
    function downloadCsv() {
        if (!logs || logs.length === 0) {
            setSnack("No logs to export");
            return;
        }
        const header = ["timestamp", "action", "admin_email", "success", "ip_address", "request_path", "details"];
        const rows = logs.map((l) => [
            l.timestamp,
            l.action,
            l.admin_email ?? "",
            String(l.success ?? ""),
            l.ip_address ?? "",
            l.request_path ?? "",
            typeof l.details === "object" ? JSON.stringify(l.details) : String(l.details ?? ""),
        ]);
        const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }
    async function copyDetailsToClipboard() {
        if (!selectedLog)
            return;
        try {
            await navigator.clipboard.writeText(JSON.stringify(selectedLog.details ?? selectedLog, null, 2));
            setSnack("JSON copied to clipboard");
        }
        catch {
            setSnack("Copy failed");
        }
    }
    // ---------------- UI handlers ----------------
    function handleApplyFilters() {
        setPage(0);
        fetchLogs({ resetPage: true });
    }
    function handleReset() {
        setAdminEmail("");
        setActionFilter("");
        setSuccessFilter("");
        setStartDate("");
        setEndDate("");
        setPage(0);
        setRowsPerPage(25);
        fetchLogs({ resetPage: true });
    }
    function handleChangePage(_, newPage) {
        setPage(newPage);
    }
    function handleChangeRowsPerPage(event) {
        const n = parseInt(event.target.value, 10);
        setRowsPerPage(n);
        setPage(0);
    }
    function openDetailsDialog(l) {
        setSelectedLog(l);
        setOpenDetails(true);
    }
    function closeDetailsDialog() {
        setSelectedLog(null);
        setOpenDetails(false);
    }
    // ---------- derived for terminal ----------
    const terminalLines = useMemo(() => {
        // format each log into an object for rendering
        return logs.map((l) => {
            const lvl = levelFromLog(l);
            const pretty = derivePrettyMessage(l);
            const when = formatWhen(l.timestamp);
            const raw = typeof l.details === "object" ? JSON.stringify(l.details) : String(l.details ?? "");
            return { id: l.id, when, level: lvl.level, color: lvl.color, icon: lvl.icon, message: pretty, raw, entry: l };
        });
    }, [logs]);
    // ---------------- render ----------------
    return (_jsx(DashboardLayout, { children: _jsxs(Container, { sx: { mt: 4 }, children: [_jsxs(Box, { sx: { mb: 2, display: "flex", justifyContent: "space-between", gap: 2, alignItems: "center" }, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "h4", sx: { color: T.text, fontWeight: 700 }, children: "Audit Logs" }), _jsx(Typography, { sx: { color: T.textDim, mt: 0.5 }, children: "Terminal-style log viewer \u2014 click a line to view full JSON details." })] }), _jsxs(Stack, { direction: "row", spacing: 1, alignItems: "center", children: [_jsx(Button, { size: "small", onClick: () => setViewMode(viewMode === "terminal" ? "table" : "terminal"), sx: { color: T.textDim }, children: viewMode === "terminal" ? "Switch to Table" : "Switch to Terminal" }), _jsx(Tooltip, { title: "Download CSV of current view", children: _jsx(IconButton, { onClick: downloadCsv, sx: { color: T.text }, children: _jsx(FileDownloadIcon, {}) }) }), _jsx(Button, { variant: "contained", onClick: () => { fetchStats(); fetchLogs({ resetPage: true }); }, startIcon: _jsx(RefreshIcon, {}), sx: { backgroundColor: T.accent }, children: "Refresh" })] })] }), _jsx(Stack, { spacing: 2, sx: { mb: 2 }, children: _jsx(Card, { sx: { backgroundColor: T.bgPanel, border: `1px solid ${T.border}` }, children: _jsx(CardContent, { children: _jsxs(Stack, { direction: { xs: "column", md: "row" }, spacing: 2, alignItems: "center", children: [_jsx(TextField, { label: "Admin email", size: "small", value: adminEmail, onChange: (e) => setAdminEmail(e.target.value), sx: { minWidth: 200 } }), _jsxs(FormControl, { size: "small", sx: { minWidth: 240 }, children: [_jsx(InputLabel, { id: "action-select-label", children: "Action" }), _jsxs(Select, { labelId: "action-select-label", value: actionFilter, label: "Action", onChange: (e) => setActionFilter(String(e.target.value)), children: [_jsx(MenuItem, { value: "", children: "All" }), stats?.actions_by_type?.map((a) => (_jsxs(MenuItem, { value: a._id, children: [a._id, " (", a.count, ")"] }, a._id)))] })] }), _jsxs(FormControl, { size: "small", sx: { minWidth: 140 }, children: [_jsx(InputLabel, { id: "success-select-label", children: "Success" }), _jsxs(Select, { labelId: "success-select-label", value: successFilter, label: "Success", onChange: (e) => setSuccessFilter(String(e.target.value)), children: [_jsx(MenuItem, { value: "", children: "All" }), _jsx(MenuItem, { value: "true", children: "Success" }), _jsx(MenuItem, { value: "false", children: "Failure" })] })] }), _jsx(TextField, { label: "Start date", type: "date", size: "small", value: startDate, onChange: (e) => setStartDate(e.target.value), InputLabelProps: { shrink: true }, sx: { minWidth: 160 } }), _jsx(TextField, { label: "End date", type: "date", size: "small", value: endDate, onChange: (e) => setEndDate(e.target.value), InputLabelProps: { shrink: true }, sx: { minWidth: 160 } }), _jsxs(Box, { sx: { display: "flex", gap: 1, ml: "auto" }, children: [_jsx(Button, { variant: "contained", onClick: handleApplyFilters, sx: { backgroundColor: T.accent }, children: "Apply" }), _jsx(Button, { variant: "outlined", onClick: handleReset, sx: { color: T.text, borderColor: T.muted }, children: "Reset" })] })] }) }) }) }), viewMode === "terminal" ? (_jsxs(Card, { sx: { backgroundColor: T.bgPanel, border: `1px solid ${T.border}`, mb: 2 }, children: [_jsx(CardContent, { children: loadingLogs ? (_jsx(LinearProgress, { sx: { height: 6, borderRadius: 2 } })) : logs.length === 0 ? (_jsx(Box, { sx: { py: 6, color: T.textDim }, children: "No logs found for the selected filters." })) : (_jsx(Box, { sx: {
                                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, 'Roboto Mono', monospace",
                                    fontSize: 13,
                                    lineHeight: "20px",
                                    color: T.text,
                                    maxHeight: "56vh",
                                    overflow: "auto",
                                    borderRadius: 1,
                                    background: "linear-gradient(180deg, rgba(255,255,255,0.01), rgba(0,0,0,0.0))",
                                    p: 1,
                                }, children: terminalLines.map((ln, idx) => (_jsxs(Box, { onClick: () => openDetailsDialog(ln.entry), sx: {
                                        display: "flex",
                                        gap: 2,
                                        alignItems: "flex-start",
                                        p: "6px 8px",
                                        borderLeft: `4px solid ${ln.color}`,
                                        mb: 0.5,
                                        cursor: "pointer",
                                        transition: "background 0.12s ease",
                                        "&:hover": { background: "rgba(255,255,255,0.02)" },
                                    }, title: ln.raw, children: [_jsx(Box, { sx: { width: 120, color: T.textDim, flexShrink: 0 }, children: _jsx("div", { style: { fontVariantNumeric: "tabular-nums" }, children: ln.when }) }), _jsxs(Box, { sx: { minWidth: 80, display: "flex", alignItems: "center" }, children: [_jsx(Chip, { label: ln.level, size: "small", sx: { background: ln.color, color: "#000", fontWeight: 700, mr: 1 } }), _jsx("span", { style: { opacity: 0.9, marginLeft: 6 }, children: ln.icon })] }), _jsx(Box, { sx: { flex: 1, whiteSpace: "pre-wrap", wordBreak: "break-word" }, children: _jsx("span", { style: { color: T.text, fontWeight: 600 }, children: ln.message }) }), _jsx(Box, { sx: { flexShrink: 0 }, children: _jsx(Tooltip, { title: "Copy raw JSON", children: _jsx(IconButton, { onClick: (e) => {
                                                        e.stopPropagation();
                                                        navigator.clipboard.writeText(ln.raw || JSON.stringify(ln.entry, null, 2)).then(() => setSnack("Copied"), () => setSnack("Copy failed"));
                                                    }, size: "small", sx: { color: T.textDim }, children: _jsx(ContentCopyIcon, { fontSize: "small" }) }) }) })] }, ln.id))) })) }), _jsx(Divider, {}), _jsx(Box, { sx: { p: 1, display: "flex", justifyContent: "flex-end" }, children: _jsx(TablePagination, { component: "div", count: totalCount, page: page, onPageChange: handleChangePage, rowsPerPage: rowsPerPage, onRowsPerPageChange: handleChangeRowsPerPage, rowsPerPageOptions: [10, 25, 50], sx: { ".MuiTablePagination-toolbar": { color: T.textDim } } }) })] })) : (
                // Table view (kept compact)
                _jsxs(Card, { sx: { backgroundColor: T.bgPanel, border: `1px solid ${T.border}`, mb: 2 }, children: [_jsx(CardContent, { children: loadingLogs ? (_jsx(LinearProgress, { sx: { height: 6, borderRadius: 2 } })) : logs.length === 0 ? (_jsx(Box, { sx: { py: 6, color: T.textDim }, children: "No logs found for the selected filters." })) : (_jsxs(Box, { children: [_jsxs(Box, { sx: { mb: 1, color: T.textDim }, children: [totalCount, " entries"] }), _jsx(Box, { component: "div", sx: { overflow: "auto", maxHeight: "56vh" }, children: _jsxs("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "inherit" }, children: [_jsx("thead", { children: _jsxs("tr", { style: { textAlign: "left", color: T.textDim }, children: [_jsx("th", { style: { padding: 8, minWidth: 160 }, children: "When" }), _jsx("th", { style: { padding: 8 }, children: "Action" }), _jsx("th", { style: { padding: 8 }, children: "Admin" }), _jsx("th", { style: { padding: 8 }, children: "Result" }), _jsx("th", { style: { padding: 8 }, children: "Details" })] }) }), _jsx("tbody", { children: logs.map((l) => {
                                                        const lvl = levelFromLog(l);
                                                        return (_jsxs("tr", { onClick: () => openDetailsDialog(l), style: { cursor: "pointer", borderTop: "1px solid rgba(255,255,255,0.02)" }, children: [_jsx("td", { style: { padding: 8, color: T.text }, children: formatWhen(l.timestamp) }), _jsx("td", { style: { padding: 8, color: T.text }, children: l.action }), _jsx("td", { style: { padding: 8, color: T.text }, children: l.admin_email || "—" }), _jsx("td", { style: { padding: 8 }, children: _jsx(Chip, { label: lvl.level, size: "small", sx: { background: lvl.color, color: "#000" } }) }), _jsx("td", { style: { padding: 8, color: T.text }, children: typeof l.details === "object" ? JSON.stringify(l.details) : String(l.details ?? "—") })] }, l.id));
                                                    }) })] }) })] })) }), _jsx(Divider, {}), _jsx(Box, { sx: { p: 1, display: "flex", justifyContent: "flex-end" }, children: _jsx(TablePagination, { component: "div", count: totalCount, page: page, onPageChange: handleChangePage, rowsPerPage: rowsPerPage, onRowsPerPageChange: handleChangeRowsPerPage, rowsPerPageOptions: [10, 25, 50], sx: { ".MuiTablePagination-toolbar": { color: T.textDim } } }) })] })), _jsx(Snackbar, { open: !!snack, autoHideDuration: 3000, onClose: () => setSnack(null), message: snack }), _jsxs(Dialog, { open: openDetails, onClose: closeDetailsDialog, fullWidth: true, maxWidth: "md", children: [_jsxs(DialogTitle, { sx: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [_jsx(Typography, { sx: { fontWeight: 700 }, children: selectedLog?.action ?? "Log details" }), _jsx(IconButton, { onClick: closeDetailsDialog, children: _jsx(CloseIcon, {}) })] }), _jsx(Divider, {}), _jsxs(DialogContent, { children: [_jsxs(Stack, { direction: "row", spacing: 2, alignItems: "center", sx: { mb: 1 }, children: [_jsx(Typography, { variant: "body2", sx: { color: T.textDim }, children: "When:" }), _jsx(Typography, { sx: { color: T.text }, children: formatWhen(selectedLog?.timestamp ?? null) }), _jsx(Typography, { variant: "body2", sx: { color: T.textDim, ml: 2 }, children: "Admin:" }), _jsx(Typography, { sx: { color: T.text }, children: selectedLog?.admin_email ?? "—" }), _jsx(Typography, { variant: "body2", sx: { color: T.textDim, ml: 2 }, children: "IP:" }), _jsx(Typography, { sx: { color: T.text }, children: selectedLog?.ip_address ?? "—" })] }), _jsx(Box, { component: "pre", sx: { background: "rgba(0,0,0,0.6)", p: 2, borderRadius: 1, color: T.text, maxHeight: 420, overflow: "auto" }, children: selectedLog ? JSON.stringify(selectedLog.details ?? selectedLog, null, 2) : "" })] }), _jsxs(DialogActions, { children: [_jsx(Tooltip, { title: "Copy JSON", children: _jsx(IconButton, { onClick: copyDetailsToClipboard, children: _jsx(ContentCopyIcon, {}) }) }), _jsx(Button, { onClick: closeDetailsDialog, children: "Close" })] })] })] }) }));
}
