// src/pages/Scraper.tsx
import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  Container,
  Divider,
  FormControlLabel,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Switch,
  Typography,
  Snackbar,
  Tooltip,
  Stack,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import CloudIcon from "@mui/icons-material/Cloud";
import StorageIcon from "@mui/icons-material/Storage";
import RefreshIcon from "@mui/icons-material/Refresh";
import LaunchIcon from "@mui/icons-material/Launch";
import DashboardLayout from "../layouts/DashboardLayout";
import { API } from "../api";

/* Theme tokens (keep consistent with your app) */
const T = {
  bgPanel: "#0f0f0f",
  text: "#ffffff",
  textDim: "#9ca3af",
  border: "rgba(255,255,255,0.10)",
  accent: "#3b82f6",
  accentHover: "#2563eb",
  muted: "rgba(255,255,255,0.04)",
};

type DatabaseSource = {
  id: string;
  name: string;
  type: string;
  url: string;
  scraper_enabled: boolean;
  priority?: number;
  rate_limit?: number;
  last_scraped?: string | null;
};

type ConfigResponse = {
  enabled_sources: string[] | null;
  disabled_sources: string[] | null;
  max_articles_per_source?: number;
  database_sources: DatabaseSource[];
  available_scrapers?: string[];
};

export default function Scraper() {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<ConfigResponse | null>(null);
  const [localServerOn, setLocalServerOn] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [snack, setSnack] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setSnack(null);
    try {
      const res = await API.get("/admin/config/news-sources");
      const data = res.data?.data ?? res.data ?? null;
      if (data) {
        const normalized: ConfigResponse = {
          enabled_sources: data.enabled_sources ?? [],
          disabled_sources: data.disabled_sources ?? [],
          max_articles_per_source: data.max_articles_per_source ?? 0,
          database_sources: Array.isArray(data.database_sources) ? data.database_sources : [],
          available_scrapers: Array.isArray(data.available_scrapers) ? data.available_scrapers : [],
        };
        setConfig(normalized);
      } else {
        setConfig(null);
        setSnack("Empty config returned");
      }
    } catch (err: any) {
      console.error("fetchConfig failed", err);
      setSnack("Failed to load scraper config");
      setConfig(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // local server status fetch (best-effort endpoint; falls back to false)
  const fetchLocalStatus = useCallback(async () => {
    try {
      const res = await API.get("/scraper/local/status").catch(() => null);
      if (res?.data?.on !== undefined) setLocalServerOn(Boolean(res.data.on));
    } catch (e) {
      console.warn("local status fetch failed", e);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
    fetchLocalStatus();
  }, [fetchConfig, fetchLocalStatus]);

  // Toggle a database source scraper_on/off using the specific enable/disable endpoints
  async function toggleSource(id: string, enable: boolean) {
    setSavingId(id);
    try {
      const endpoint = `/admin/config/news-sources/${id}/${enable ? "enable" : "disable"}`;
      // call the enable/disable endpoint
      await API.post(endpoint);
      // optimistic update
      setConfig((c) =>
        c
          ? {
              ...c,
              database_sources: c.database_sources.map((s) => (s.id === id ? { ...s, scraper_enabled: enable } : s)),
              enabled_sources: enable
                ? Array.from(new Set([...(c.enabled_sources ?? []), ...(c.database_sources.find((s) => s.id === id) ? [c.database_sources.find((s) => s.id === id)!.type] : [])]))
                : (c.enabled_sources ?? []).filter(Boolean).filter((t) => t !== (c.database_sources.find((s) => s.id === id)?.type ?? "")),
            }
          : c
      );
      setSnack(enable ? "Scraper enabled for source" : "Scraper disabled for source");
    } catch (e) {
      console.error("toggleSource failed", e);
      setSnack("Failed to toggle source");
    } finally {
      setSavingId(null);
    }
  }

  // Trigger an immediate run/stop for a particular source (best-effort endpoint)
  async function runSource(id: string) {
    setSavingId(id);
    try {
      await API.post(`/api/v1/admin/scraper/${id}/run`).catch(() => null);
      setConfig((c) =>
        c
          ? {
              ...c,
              database_sources: c.database_sources.map((s) => (s.id === id ? { ...s, last_scraped: new Date().toISOString() } : s)),
            }
          : c
      );
      setSnack("Run triggered");
    } catch (e) {
      console.error("runSource failed", e);
      setSnack("Failed to trigger run");
    } finally {
      setSavingId(null);
    }
  }

  async function stopSource(id: string) {
    setSavingId(id);
    try {
      await API.post(`/api/v1/admin/scraper/${id}/stop`).catch(() => null);
      setSnack("Stop sent");
    } catch (e) {
      console.error("stopSource failed", e);
      setSnack("Failed to send stop");
    } finally {
      setSavingId(null);
    }
  }

  async function toggleLocalServer(on: boolean) {
    try {
      await API.post(`/scraper/local/toggle`, { on }).catch(() => null);
      setLocalServerOn(on);
      setSnack(on ? "Local server started" : "Local server stopped");
    } catch (e) {
      console.error("toggleLocalServer failed", e);
      setSnack("Failed to toggle local server");
    }
  }

  // UI helpers
  function formatWhen(ts?: string | null) {
    if (!ts) return "Never";
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return ts;
      return d.toLocaleString();
    } catch {
      return ts;
    }
  }

  return (
    <DashboardLayout>
      <Container sx={{ mt: 4 }}>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2 }}>
          <CloudIcon sx={{ color: T.text, fontSize: 36 }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" sx={{ color: T.text }}>
              Scraper Configuration
            </Typography>
            <Typography sx={{ color: T.textDim, mt: 0.5 }}>
              View and control configured news sources, trigger runs, and manage local scraping server.
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip title="Refresh config">
              <Button
                startIcon={<RefreshIcon />}
                onClick={() => {
                  fetchConfig();
                  fetchLocalStatus();
                }}
                variant="contained"
                sx={{ backgroundColor: T.accent }}
                disabled={loading}
              >
                Refresh
              </Button>
            </Tooltip>
            <Button
              variant="outlined"
              startIcon={<RestartAltIcon />}
              onClick={() => {
                setConfig((c) =>
                  c
                    ? {
                        ...c,
                        database_sources: c.database_sources.map((s) => ({ ...s, scraper_enabled: true })),
                        enabled_sources: c.database_sources.map((s) => s.type),
                      }
                    : c
                );
                setSnack("All sources enabled (local UI only)");
              }}
              sx={{ color: T.text, borderColor: T.muted }}
            >
              Enable all (local)
            </Button>
          </Box>
        </Box>

        {/* top card: global config */}
        <Card sx={{ mb: 3, backgroundColor: T.bgPanel, border: `1px solid ${T.border}` }}>
          <CardContent>
            {loading ? (
              <LinearProgress sx={{ height: 6, borderRadius: 2 }} />
            ) : (
              <>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
                  <Box>
                    <Typography sx={{ color: T.text, fontWeight: 700 }}>Global config</Typography>
                    <Typography sx={{ color: T.textDim, fontSize: 13, mt: 0.5 }}>
                      Max articles per source: <strong style={{ color: T.text }}>{config?.max_articles_per_source ?? "—"}</strong>
                    </Typography>
                    <Typography sx={{ color: T.textDim, fontSize: 13, mt: 0.5 }}>
                      Enabled scrapers:{" "}
                      {(config?.enabled_sources && config.enabled_sources.length > 0) ? (
                        config.enabled_sources.map((s) => <Chip key={s} label={s} size="small" sx={{ mr: 0.5, mt: 0.5 }} />)
                      ) : (
                        <em style={{ color: T.textDim }}>none</em>
                      )}
                    </Typography>
                    <Typography sx={{ color: T.textDim, fontSize: 13, mt: 0.75 }}>
                      Available:{" "}
                      {(config?.available_scrapers ?? []).map((s) => (
                        <Chip key={s} label={s} size="small" sx={{ mr: 0.5, mt: 0.5 }} />
                      ))}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                    <Box sx={{ textAlign: "right" }}>
                      <Typography sx={{ color: T.textDim, fontSize: 12 }}>Local scraping server</Typography>
                      <Typography sx={{ color: localServerOn ? "#86efac" : T.textDim, fontWeight: 700 }}>
                        {localServerOn ? "Running" : "Stopped"}
                      </Typography>
                    </Box>
                    <FormControlLabel
                      control={<Switch checked={localServerOn} onChange={(e) => toggleLocalServer(e.target.checked)} />}
                      label={localServerOn ? "On" : "Off"}
                    />
                  </Box>
                </Box>
              </>
            )}
          </CardContent>
        </Card>

        {/* Database sources list */}
        <Card sx={{ mb: 3, backgroundColor: T.bgPanel, border: `1px solid ${T.border}` }}>
          <CardContent>
            <Typography sx={{ color: T.text, fontWeight: 700, mb: 1 }}>Database sources</Typography>
            {loading ? (
              <LinearProgress sx={{ height: 6, borderRadius: 2 }} />
            ) : config && config.database_sources.length ? (
              <List>
                {config.database_sources.map((src) => (
                  <ListItem
                    key={src.id}
                    sx={{
                      mb: 1,
                      backgroundColor: "rgba(255,255,255,0.02)",
                      borderRadius: 2,
                      alignItems: "flex-start",
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                          <Typography sx={{ color: T.text, fontWeight: 700 }}>{src.name}</Typography>
                          <Chip label={src.type} size="small" sx={{ ml: 1 }} />
                          <Chip
                            label={`priority ${src.priority ?? "—"}`}
                            size="small"
                            sx={{ ml: 1, bgcolor: T.muted, color: T.textDim }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography sx={{ color: T.textDim, fontSize: 13 }}>{src.url}</Typography>
                          <Typography sx={{ color: T.textDim, fontSize: 12, mt: 0.5 }}>
                            Last scraped: <strong style={{ color: T.text }}>{formatWhen(src.last_scraped)}</strong>
                          </Typography>
                          <Typography sx={{ color: T.textDim, fontSize: 12, mt: 0.25 }}>
                            Rate limit: <strong style={{ color: T.text }}>{src.rate_limit ?? "—"}s</strong>
                          </Typography>
                        </Box>
                      }
                    />

                    <ListItemSecondaryAction sx={{ right: 8, display: "flex", gap: 1, alignItems: "center" }}>
                      <Tooltip title="Open source URL">
                        <IconButton size="small" component="a" href={src.url} target="_blank" rel="noreferrer" sx={{ color: T.text }}>
                          <LaunchIcon />
                        </IconButton>
                      </Tooltip>

                      <Chip
                        label={src.scraper_enabled ? "ENABLED" : "DISABLED"}
                        size="small"
                        sx={{
                          bgcolor: src.scraper_enabled ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.02)",
                          color: src.scraper_enabled ? "#86efac" : T.textDim,
                          border: `1px solid ${src.scraper_enabled ? "rgba(34,197,94,0.14)" : "rgba(255,255,255,0.03)"}`,
                          mr: 1,
                        }}
                      />

                      {/* Toggle uses the new enable/disable endpoints */}
                      <FormControlLabel
                        control={
                          <Switch
                            checked={src.scraper_enabled}
                            onChange={(e) => toggleSource(src.id, e.target.checked)}
                            disabled={savingId === src.id}
                          />
                        }
                        label={src.scraper_enabled ? "On" : "Off"}
                      />

                      <Tooltip title="Run now">
                        <span>
                          <IconButton size="small" onClick={() => runSource(src.id)} disabled={savingId === src.id}>
                            <PlayArrowIcon />
                          </IconButton>
                        </span>
                      </Tooltip>

                      <Tooltip title="Stop">
                        <span>
                          <IconButton size="small" onClick={() => stopSource(src.id)} disabled={savingId === src.id}>
                            <StopIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography sx={{ color: T.textDim }}>No database sources found.</Typography>
            )}
          </CardContent>

          <Divider />
          <CardActions sx={{ justifyContent: "flex-end", p: 2 }}>
            <Button
              variant="text"
              startIcon={<RestartAltIcon />}
              onClick={() => {
                fetchConfig();
                setSnack("Refreshed");
              }}
              sx={{ color: T.textDim }}
            >
              Refresh
            </Button>
          </CardActions>
        </Card>

        {/* Lightweight footer card for quick actions / stats */}
        <Card sx={{ backgroundColor: T.bgPanel, border: `1px solid ${T.border}`, mb: 4 }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
              <Box>
                <Typography sx={{ color: T.text, fontWeight: 700 }}>Quick actions</Typography>
                <Typography sx={{ color: T.textDim, fontSize: 13 }}>
                  Use these to run health checks or enable/disable multiple sources quickly.
                </Typography>
              </Box>

              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="contained"
                  onClick={async () => {
                    try {
                      await API.post("/api/v1/admin/config/news-sources/enable-all").catch(() => null);
                      await fetchConfig();
                      setSnack("Requested enable all");
                    } catch (e) {
                      setSnack("Bulk enable failed");
                    }
                  }}
                  sx={{ backgroundColor: T.accent }}
                >
                  Enable all (server)
                </Button>

                <Button
                  variant="outlined"
                  onClick={() => {
                    setConfig((c) =>
                      c ? { ...c, database_sources: c.database_sources.map((s) => ({ ...s, scraper_enabled: false })) } : c
                    );
                    setSnack("Disabled all (client-only)");
                  }}
                  sx={{ color: T.text, borderColor: T.muted }}
                >
                  Disable all (client)
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Snackbar open={!!snack} autoHideDuration={2500} onClose={() => setSnack(null)} message={snack} />
      </Container>
    </DashboardLayout>
  );
}
