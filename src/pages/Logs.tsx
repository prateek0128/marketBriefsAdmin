// src/pages/Logs.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Typography,
  LinearProgress,
  Chip,
  Stack,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  TablePagination,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Divider,
} from "@mui/material";
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

type ActionStat = {
  _id: string;
  count: number;
  failure_count: number;
  success_count: number;
};

type TopAdmin = {
  _id: string;
  action_count: number;
};

type AuditLogEntry = {
  id: string;
  action: string;
  admin_email: string;
  admin_id?: string;
  timestamp: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
  success?: boolean | null;
  request_path?: string;
};

export default function Logs() {
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [stats, setStats] = useState<{
    actions_by_type: ActionStat[];
    top_admins: TopAdmin[];
    date_range_start?: string;
    date_range_end?: string;
  } | null>(null);

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [snack, setSnack] = useState<string | null>(null);

  // Filters/pagination
  const [adminEmail, setAdminEmail] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<string>("");
  const [successFilter, setSuccessFilter] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(25);

  // dialog + selection
  const [openDetails, setOpenDetails] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  // view mode: "terminal" or "table"
  const [viewMode, setViewMode] = useState<"terminal" | "table">("terminal");

  // ---------------- helpers ----------------
  const buildDateIso = (d: string, endOfDay = false) => {
    if (!d) return "";
    return d + (endOfDay ? "T23:59:59Z" : "T00:00:00Z");
  };

  const formatWhen = (ts?: string | null) => {
    if (!ts) return "—";
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return ts;
      return d.toLocaleString();
    } catch {
      return ts;
    }
  };

  // derive a short, pretty human message from a log entry
  function derivePrettyMessage(l: AuditLogEntry) {
    // If details contains obvious fields, use them:
    if (!l.details) return l.action;
    const d = l.details;

    // Common patterns: scraping messages, article info, max_articles_per_source, action/status
    if (d.title) return `📰 Title: "${String(d.title)}"`;
    if (d.action && d.status) return `🔁 ${d.action} — ${d.status}`;
    if (d.max_articles_per_source !== undefined)
      return `⚙️ max_articles_per_source: ${d.max_articles_per_source}`;
    if (d.source_id || d.source_type)
      return `🧭 Source ${d.source_type ?? d.source_id ?? ""} — ${d.status ?? ""}`.trim();
    // If details is small primitive
    if (typeof d === "string" || typeof d === "number" || typeof d === "boolean")
      return String(d);
    // else JSON summary (pick a few keys)
    const keys = Object.keys(d).slice(0, 3);
    if (keys.length === 0) return l.action;
    return keys.map((k) => `${k}: ${JSON.stringify(d[k])}`).join(" • ");
  }

  // determine level and colors/icons
  function levelFromLog(l: AuditLogEntry) {
    // prefer explicit success flag: true -> INFO (success), false -> ERROR
    if (l.success === true) return { level: "INFO", color: T.success, icon: "✅" };
    if (l.success === false) return { level: "ERROR", color: T.error, icon: "❌" };
    // fallback: treat known actions with "UPDATED" / "ENABLED" as INFO
    const a = (l.action || "").toUpperCase();
    if (a.includes("ERROR") || a.includes("FAILED")) return { level: "ERROR", color: T.error, icon: "❌" };
    if (a.includes("WARN") || a.includes("WARNING")) return { level: "WARN", color: T.warn, icon: "⚠️" };
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
    } catch (err) {
      console.error("fetchStats failed", err);
      setSnack("Failed to load stats");
      setStats(null);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchLogs = useCallback(
    async (opts?: { resetPage?: boolean }) => {
      setLoadingLogs(true);
      setSnack(null);
      try {
        if (opts?.resetPage) setPage(0);
        const skip = opts?.resetPage ? 0 : page * rowsPerPage;
        const limit = rowsPerPage;

        const params: Record<string, any> = {
          admin_email: adminEmail ?? "",
          action: actionFilter ?? "",
          success: successFilter === "" ? "" : successFilter,
          start_date: startDate ? buildDateIso(startDate, false) : "",
          end_date: endDate ? buildDateIso(endDate, true) : "",
          skip,
          limit,
        };
        Object.keys(params).forEach((k) => {
          if (params[k] === "" || params[k] == null) delete params[k];
        });

        const res = await API.get("/admin/audit-logs", { params });
        const payload = res.data?.data ?? res.data;
        setLogs(Array.isArray(payload?.audit_logs) ? payload.audit_logs : []);
        setTotalCount(typeof payload?.count === "number" ? payload.count : (Array.isArray(payload?.audit_logs) ? payload.audit_logs.length : 0));
      } catch (err) {
        console.error("fetchLogs failed", err);
        setSnack("Failed to load logs");
        setLogs([]);
        setTotalCount(0);
      } finally {
        setLoadingLogs(false);
      }
    },
    [adminEmail, actionFilter, successFilter, startDate, endDate, page, rowsPerPage]
  );

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
    if (!selectedLog) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(selectedLog.details ?? selectedLog, null, 2));
      setSnack("JSON copied to clipboard");
    } catch {
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

  function handleChangePage(_: any, newPage: number) {
    setPage(newPage);
  }
  function handleChangeRowsPerPage(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const n = parseInt(event.target.value, 10);
    setRowsPerPage(n);
    setPage(0);
  }

  function openDetailsDialog(l: AuditLogEntry) {
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
  return (
    <DashboardLayout>
      <Container sx={{ mt: 4 }}>
        <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between", gap: 2, alignItems: "center" }}>
          <Box>
            <Typography variant="h4" sx={{ color: T.text, fontWeight: 700 }}>
              Audit Logs
            </Typography>
            <Typography sx={{ color: T.textDim, mt: 0.5 }}>
              Terminal-style log viewer — click a line to view full JSON details.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            <Button size="small" onClick={() => setViewMode(viewMode === "terminal" ? "table" : "terminal")} sx={{ color: T.textDim }}>
              {viewMode === "terminal" ? "Switch to Table" : "Switch to Terminal"}
            </Button>
            <Tooltip title="Download CSV of current view">
              <IconButton onClick={downloadCsv} sx={{ color: T.text }}>
                <FileDownloadIcon />
              </IconButton>
            </Tooltip>
            <Button variant="contained" onClick={() => { fetchStats(); fetchLogs({ resetPage: true }); }} startIcon={<RefreshIcon />} sx={{ backgroundColor: T.accent }}>
              Refresh
            </Button>
          </Stack>
        </Box>

        {/* Filters */}
        <Stack spacing={2} sx={{ mb: 2 }}>
          <Card sx={{ backgroundColor: T.bgPanel, border: `1px solid ${T.border}` }}>
            <CardContent>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center">
                <TextField label="Admin email" size="small" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} sx={{ minWidth: 200 }} />
                <FormControl size="small" sx={{ minWidth: 240 }}>
                  <InputLabel id="action-select-label">Action</InputLabel>
                  <Select labelId="action-select-label" value={actionFilter} label="Action" onChange={(e) => setActionFilter(String(e.target.value))}>
                    <MenuItem value="">All</MenuItem>
                    {stats?.actions_by_type?.map((a) => (
                      <MenuItem key={a._id} value={a._id}>
                        {a._id} ({a.count})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel id="success-select-label">Success</InputLabel>
                  <Select labelId="success-select-label" value={successFilter} label="Success" onChange={(e) => setSuccessFilter(String(e.target.value))}>
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="true">Success</MenuItem>
                    <MenuItem value="false">Failure</MenuItem>
                  </Select>
                </FormControl>

                <TextField label="Start date" type="date" size="small" value={startDate} onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 160 }} />
                <TextField label="End date" type="date" size="small" value={endDate} onChange={(e) => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 160 }} />

                <Box sx={{ display: "flex", gap: 1, ml: "auto" }}>
                  <Button variant="contained" onClick={handleApplyFilters} sx={{ backgroundColor: T.accent }}>
                    Apply
                  </Button>
                  <Button variant="outlined" onClick={handleReset} sx={{ color: T.text, borderColor: T.muted }}>
                    Reset
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Stack>

        {/* Terminal view */}
        {viewMode === "terminal" ? (
          <Card sx={{ backgroundColor: T.bgPanel, border: `1px solid ${T.border}`, mb: 2 }}>
            <CardContent>
              {loadingLogs ? (
                <LinearProgress sx={{ height: 6, borderRadius: 2 }} />
              ) : logs.length === 0 ? (
                <Box sx={{ py: 6, color: T.textDim }}>No logs found for the selected filters.</Box>
              ) : (
                <Box
                  sx={{
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, 'Roboto Mono', monospace",
                    fontSize: 13,
                    lineHeight: "20px",
                    color: T.text,
                    maxHeight: "56vh",
                    overflow: "auto",
                    borderRadius: 1,
                    background: "linear-gradient(180deg, rgba(255,255,255,0.01), rgba(0,0,0,0.0))",
                    p: 1,
                  }}
                >
                  {terminalLines.map((ln, idx) => (
                    <Box
                      key={ln.id}
                      onClick={() => openDetailsDialog(ln.entry)}
                      sx={{
                        display: "flex",
                        gap: 2,
                        alignItems: "flex-start",
                        p: "6px 8px",
                        borderLeft: `4px solid ${ln.color}`,
                        mb: 0.5,
                        cursor: "pointer",
                        transition: "background 0.12s ease",
                        "&:hover": { background: "rgba(255,255,255,0.02)" },
                      }}
                      title={ln.raw}
                    >
                      <Box sx={{ width: 120, color: T.textDim, flexShrink: 0 }}>
                        <div style={{ fontVariantNumeric: "tabular-nums" }}>{ln.when}</div>
                      </Box>

                      <Box sx={{ minWidth: 80, display: "flex", alignItems: "center" }}>
                        <Chip label={ln.level} size="small" sx={{ background: ln.color, color: "#000", fontWeight: 700, mr: 1 }} />
                        <span style={{ opacity: 0.9, marginLeft: 6 }}>{ln.icon}</span>
                      </Box>

                      <Box sx={{ flex: 1, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                        <span style={{ color: T.text, fontWeight: 600 }}>{ln.message}</span>
                      </Box>

                      <Box sx={{ flexShrink: 0 }}>
                        <Tooltip title="Copy raw JSON">
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(ln.raw || JSON.stringify(ln.entry, null, 2)).then(
                                () => setSnack("Copied"),
                                () => setSnack("Copy failed")
                              );
                            }}
                            size="small"
                            sx={{ color: T.textDim }}
                          >
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>

            <Divider />
            <Box sx={{ p: 1, display: "flex", justifyContent: "flex-end" }}>
              <TablePagination
                component="div"
                count={totalCount}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[10, 25, 50]}
                sx={{ ".MuiTablePagination-toolbar": { color: T.textDim } }}
              />
            </Box>
          </Card>
        ) : (
          // Table view (kept compact)
          <Card sx={{ backgroundColor: T.bgPanel, border: `1px solid ${T.border}`, mb: 2 }}>
            <CardContent>
              {loadingLogs ? (
                <LinearProgress sx={{ height: 6, borderRadius: 2 }} />
              ) : logs.length === 0 ? (
                <Box sx={{ py: 6, color: T.textDim }}>No logs found for the selected filters.</Box>
              ) : (
                <Box>
                  <Box sx={{ mb: 1, color: T.textDim }}>{totalCount} entries</Box>
                  <Box component="div" sx={{ overflow: "auto", maxHeight: "56vh" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "inherit" }}>
                      <thead>
                        <tr style={{ textAlign: "left", color: T.textDim }}>
                          <th style={{ padding: 8, minWidth: 160 }}>When</th>
                          <th style={{ padding: 8 }}>Action</th>
                          <th style={{ padding: 8 }}>Admin</th>
                          <th style={{ padding: 8 }}>Result</th>
                          <th style={{ padding: 8 }}>Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.map((l) => {
                          const lvl = levelFromLog(l);
                          return (
                            <tr key={l.id} onClick={() => openDetailsDialog(l)} style={{ cursor: "pointer", borderTop: "1px solid rgba(255,255,255,0.02)" }}>
                              <td style={{ padding: 8, color: T.text }}>{formatWhen(l.timestamp)}</td>
                              <td style={{ padding: 8, color: T.text }}>{l.action}</td>
                              <td style={{ padding: 8, color: T.text }}>{l.admin_email || "—"}</td>
                              <td style={{ padding: 8 }}><Chip label={lvl.level} size="small" sx={{ background: lvl.color, color: "#000" }} /></td>
                              <td style={{ padding: 8, color: T.text }}>{typeof l.details === "object" ? JSON.stringify(l.details) : String(l.details ?? "—")}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </Box>
                </Box>
              )}
            </CardContent>

            <Divider />
            <Box sx={{ p: 1, display: "flex", justifyContent: "flex-end" }}>
              <TablePagination
                component="div"
                count={totalCount}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[10, 25, 50]}
                sx={{ ".MuiTablePagination-toolbar": { color: T.textDim } }}
              />
            </Box>
          </Card>
        )}

        <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)} message={snack} />

        {/* details dialog */}
        <Dialog open={openDetails} onClose={closeDetailsDialog} fullWidth maxWidth="md">
          <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography sx={{ fontWeight: 700 }}>{selectedLog?.action ?? "Log details"}</Typography>
            <IconButton onClick={closeDetailsDialog}><CloseIcon /></IconButton>
          </DialogTitle>
          <Divider />
          <DialogContent>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="body2" sx={{ color: T.textDim }}>When:</Typography>
              <Typography sx={{ color: T.text }}>{formatWhen(selectedLog?.timestamp ?? null)}</Typography>
              <Typography variant="body2" sx={{ color: T.textDim, ml: 2 }}>Admin:</Typography>
              <Typography sx={{ color: T.text }}>{selectedLog?.admin_email ?? "—"}</Typography>
              <Typography variant="body2" sx={{ color: T.textDim, ml: 2 }}>IP:</Typography>
              <Typography sx={{ color: T.text }}>{selectedLog?.ip_address ?? "—"}</Typography>
            </Stack>

            <Box component="pre" sx={{ background: "rgba(0,0,0,0.6)", p: 2, borderRadius: 1, color: T.text, maxHeight: 420, overflow: "auto" }}>
              {selectedLog ? JSON.stringify(selectedLog.details ?? selectedLog, null, 2) : ""}
            </Box>
          </DialogContent>
          <DialogActions>
            <Tooltip title="Copy JSON">
              <IconButton onClick={copyDetailsToClipboard}><ContentCopyIcon /></IconButton>
            </Tooltip>
            <Button onClick={closeDetailsDialog}>Close</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </DashboardLayout>
  );
}
