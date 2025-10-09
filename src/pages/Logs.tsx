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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
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
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import CloseIcon from "@mui/icons-material/Close";
import DashboardLayout from "../layouts/DashboardLayout";
import { API } from "../api";

const T = {
  bgPanel: "#0f0f0f",
  text: "#ffffff",
  textDim: "#9ca3af",
  border: "rgba(255,255,255,0.10)",
  accent: "#3b82f6",
  muted: "rgba(255,255,255,0.04)",
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
  success?: boolean;
  request_path?: string;
};

export default function Logs() {
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [stats, setStats] = useState<{ actions_by_type: ActionStat[]; top_admins: TopAdmin[]; date_range_start?: string; date_range_end?: string } | null>(null);

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [snack, setSnack] = useState<string | null>(null);

  // filters
  const [adminEmail, setAdminEmail] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<string>("");
  const [successFilter, setSuccessFilter] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // pagination
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(25);

  // details modal
  const [openDetails, setOpenDetails] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  // ---------------- utils ----------------
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

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    setSnack(null);
    try {
      const res = await API.get("/admin/audit-logs/stats");
      const payload = res.data?.data ?? res.data ?? null;
      setStats({
        actions_by_type: Array.isArray(payload?.actions_by_type) ? payload.actions_by_type : [],
        top_admins: Array.isArray(payload?.top_admins) ? payload.top_admins : [],
        date_range_start: payload?.date_range_start ?? undefined,
        date_range_end: payload?.date_range_end ?? undefined,
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

        // remove empties
        Object.keys(params).forEach((k) => {
          if (params[k] === "" || params[k] === null || params[k] === undefined) delete params[k];
        });

        const res = await API.get("/admin/audit-logs", { params });
        const payload = res.data?.data ?? res.data ?? null;

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
    // refetch logs when page or rowsPerPage changes
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage]);

  // computed values for action bars
  const actionMax = useMemo(() => {
    return stats?.actions_by_type?.reduce((m, a) => Math.max(m, a.count ?? 0), 0) ?? 0;
  }, [stats]);

  // ---------------- handlers ----------------
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

  function openDetailsDialog(log: AuditLogEntry) {
    setSelectedLog(log);
    setOpenDetails(true);
  }
  function closeDetailsDialog() {
    setSelectedLog(null);
    setOpenDetails(false);
  }

  async function copyDetailsToClipboard() {
    if (!selectedLog) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(selectedLog.details ?? selectedLog, null, 2));
      setSnack("JSON copied to clipboard");
    } catch (e) {
      setSnack("Copy failed");
    }
  }

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

  // ---------------- render ----------------
  return (
    <DashboardLayout>
      <Container sx={{ mt: 4 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h4" sx={{ color: T.text, fontWeight: 700 }}>
            Audit Logs
          </Typography>
          <Typography sx={{ color: T.textDim, mt: 0.5 }}>
            Nice, actionable view combining stats and raw audit log entries.
          </Typography>
        </Box>

        {/* top summary + actions */}
        <Stack direction="column" spacing={2} sx={{ mb: 2 }}>
          <Card sx={{ backgroundColor: T.bgPanel, border: `1px solid ${T.border}` }}>
            <CardContent>
              {loadingStats ? (
                <LinearProgress sx={{ height: 6, borderRadius: 2 }} />
              ) : (
                <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center">
                  <Box>
                    <Typography sx={{ color: T.textDim, fontSize: 13 }}>Date range</Typography>
                    <Typography sx={{ color: T.text, fontWeight: 700 }}>
                      {formatWhen(stats?.date_range_start ?? null)} — {formatWhen(stats?.date_range_end ?? null)}
                    </Typography>
                  </Box>

                  <Box sx={{ ml: 2 }}>
                    <Typography sx={{ color: T.textDim, fontSize: 13 }}>Actions overview</Typography>
                    <Typography sx={{ color: T.text, fontWeight: 700 }}>
                      {stats?.actions_by_type?.reduce((s, a) => s + (a.count ?? 0), 0) ?? 0} total
                    </Typography>
                  </Box>

                  <Box sx={{ flex: 1 }} />

                  <Stack direction="row" spacing={1} alignItems="center">
                    <Tooltip title="Download CSV of current page">
                      <IconButton onClick={downloadCsv} sx={{ color: T.text }}>
                        <FileDownloadIcon />
                      </IconButton>
                    </Tooltip>
                    <Button variant="contained" onClick={() => { fetchStats(); fetchLogs({ resetPage: true }); }} sx={{ backgroundColor: T.accent }}>
                      Refresh
                    </Button>
                  </Stack>
                </Stack>
              )}
            </CardContent>
          </Card>

          {/* actions-by-type visual list */}
          <Card sx={{ backgroundColor: T.bgPanel, border: `1px solid ${T.border}` }}>
            <CardContent>
              <Typography sx={{ color: T.text, fontWeight: 700, mb: 1 }}>Actions by type</Typography>
              {loadingStats ? (
                <LinearProgress sx={{ height: 6, borderRadius: 2 }} />
              ) : stats?.actions_by_type && stats.actions_by_type.length > 0 ? (
                <Stack spacing={1}>
                  {stats.actions_by_type.map((a) => {
                    const pct = actionMax > 0 ? Math.round((a.count / actionMax) * 100) : 0;
                    return (
                      <Box key={a._id} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box sx={{ width: 260, minWidth: 160 }}>
                          <Typography sx={{ color: T.text, fontWeight: 600 }}>{a._id}</Typography>
                          <Typography sx={{ color: T.textDim, fontSize: 12 }}>{a.count} occurrences</Typography>
                        </Box>

                        <Box sx={{ flex: 1, mr: 2 }}>
                          <Box sx={{ background: "rgba(255,255,255,0.03)", height: 10, borderRadius: 999, overflow: "hidden" }}>
                            <Box sx={{ height: "100%", width: `${pct}%`, background: T.accent }} />
                          </Box>
                        </Box>

                        <Chip label={`${a.success_count ?? 0} ✅ / ${a.failure_count ?? 0} ❌`} size="small" sx={{ color: T.text, bgcolor: T.muted }} />
                      </Box>
                    );
                  })}
                </Stack>
              ) : (
                <Typography sx={{ color: T.textDim }}>No action stats available.</Typography>
              )}
            </CardContent>
          </Card>

          {/* filters */}
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

                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button variant="contained" onClick={handleApplyFilters} sx={{ backgroundColor: T.accent }}>
                    Apply filters
                  </Button>
                  <Button variant="outlined" onClick={handleReset} sx={{ color: T.text, borderColor: T.muted }}>
                    Reset
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Stack>

        {/* logs table */}
        <Card sx={{ backgroundColor: T.bgPanel, border: `1px solid ${T.border}` }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography sx={{ color: T.text, fontWeight: 700 }}>Audit entries</Typography>
              <Typography sx={{ color: T.textDim }}>{totalCount} entries</Typography>
            </Stack>

            {loadingLogs ? (
              <LinearProgress sx={{ height: 6, borderRadius: 2 }} />
            ) : logs.length === 0 ? (
              <Box sx={{ py: 6, color: T.textDim }}>No logs found for the selected filters.</Box>
            ) : (
              <>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: T.textDim }}>When</TableCell>
                      <TableCell sx={{ color: T.textDim }}>Action</TableCell>
                      <TableCell sx={{ color: T.textDim }}>Admin</TableCell>
                      <TableCell sx={{ color: T.textDim }}>Result</TableCell>
                      <TableCell sx={{ color: T.textDim }}>Details</TableCell>
                      <TableCell sx={{ color: T.textDim }}>IP / Path</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {logs.map((l) => (
                      <TableRow key={l.id} hover sx={{ cursor: "pointer" }} onClick={() => openDetailsDialog(l)}>
                        <TableCell sx={{ color: T.text, whiteSpace: "nowrap" }}>{formatWhen(l.timestamp)}</TableCell>
                        <TableCell sx={{ color: T.text }}>{l.action}</TableCell>
                        <TableCell sx={{ color: T.text }}>{l.admin_email || "—"}</TableCell>
                        <TableCell>
                          <Chip
                            label={l.success ? "OK" : "FAIL"}
                            size="small"
                            sx={{
                              bgcolor: l.success ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)",
                              color: l.success ? "#86efac" : "#fca5a5",
                              border: `1px solid ${l.success ? "rgba(34,197,94,0.14)" : "rgba(239,68,68,0.14)"}`,
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: T.text, maxWidth: 360, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {typeof l.details === "object" ? JSON.stringify(l.details) : String(l.details ?? "—")}
                        </TableCell>
                        <TableCell sx={{ color: T.textDim }}>{l.ip_address ?? "—"} — {l.request_path ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <TablePagination
                  component="div"
                  count={totalCount}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[10, 25, 50]}
                  sx={{
                    ".MuiTablePagination-toolbar": { color: T.textDim },
                  }}
                />
              </>
            )}
          </CardContent>
        </Card>

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
