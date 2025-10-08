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
} from "@mui/material";
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

  /** Fetch current scraper configuration */
  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/admin/config/news-sources");
      const data = res.data?.data ?? res.data ?? null;
      if (data) {
        const normalized: ConfigResponse = {
          enabled_sources: data.enabled_sources ?? [],
          disabled_sources: data.disabled_sources ?? [],
          max_articles_per_source: data.max_articles_per_source ?? 0,
          database_sources: Array.isArray(data.database_sources)
            ? data.database_sources
            : [],
          available_scrapers: Array.isArray(data.available_scrapers)
            ? data.available_scrapers
            : [],
        };
        setConfig(normalized);
      } else {
        setSnack("Empty config returned");
      }
    } catch (err) {
      console.error("fetchConfig failed", err);
      setSnack("Failed to load scraper config");
    } finally {
      setLoading(false);
    }
  }, []);

  /** Fetch local scraper server status */
  const fetchLocalStatus = useCallback(async () => {
    try {
      const res = await API.get("/scraper/local/status").catch(() => null);
      if (res?.data?.on !== undefined)
        setLocalServerOn(Boolean(res.data.on));
    } catch {
      console.warn("Local status fetch failed");
    }
  }, []);

  useEffect(() => {
    fetchConfig();
    fetchLocalStatus();
  }, [fetchConfig, fetchLocalStatus]);

  /** Toggle source on/off (enable or disable) */
  async function toggleSource(id: string, enable: boolean) {
    setSavingId(id);

    // Optimistic update
    setConfig((c) =>
      c
        ? {
            ...c,
            database_sources: c.database_sources.map((s) =>
              s.id === id ? { ...s, scraper_enabled: enable } : s
            ),
          }
        : c
    );

    try {
      const endpoint = `/admin/config/news-sources/${id}/${enable ? "enable" : "disable"}`;
      await API.put(endpoint);
      setSnack(enable ? "Source enabled" : "Source disabled");
    } catch (err) {
      console.error("toggleSource failed", err);
      setSnack("Failed to toggle source");

      // rollback
      setConfig((c) =>
        c
          ? {
              ...c,
              database_sources: c.database_sources.map((s) =>
                s.id === id ? { ...s, scraper_enabled: !enable } : s
              ),
            }
          : c
      );
    } finally {
      setSavingId(null);
    }
  }

  /** Toggle local server (optional feature) */
  async function toggleLocalServer(on: boolean) {
    try {
      await API.post("/scraper/local/toggle", { on });
      setLocalServerOn(on);
      setSnack(on ? "Local server started" : "Local server stopped");
    } catch {
      setSnack("Failed to toggle local server");
    }
  }

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
        {/* Header */}
        <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2 }}>
          <CloudIcon sx={{ color: T.text, fontSize: 36 }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" sx={{ color: T.text }}>
              Scraper Configuration
            </Typography>
            <Typography sx={{ color: T.textDim, mt: 0.5 }}>
              Toggle scrapers for each database source on or off.
            </Typography>
          </Box>
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
        </Box>

        {/* Local server + global info */}
        <Card sx={{ mb: 3, backgroundColor: T.bgPanel, border: `1px solid ${T.border}` }}>
          <CardContent>
            {loading ? (
              <LinearProgress sx={{ height: 6, borderRadius: 2 }} />
            ) : (
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
                <Box>
                  <Typography sx={{ color: T.text, fontWeight: 700 }}>Global Config</Typography>
                  <Typography sx={{ color: T.textDim, fontSize: 13, mt: 0.5 }}>
                    Max articles per source:{" "}
                    <strong style={{ color: T.text }}>
                      {config?.max_articles_per_source ?? "—"}
                    </strong>
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography sx={{ color: T.textDim, fontSize: 12 }}>
                      Local scraping server
                    </Typography>
                    <Typography
                      sx={{
                        color: localServerOn ? "#86efac" : T.textDim,
                        fontWeight: 700,
                      }}
                    >
                      {localServerOn ? "Running" : "Stopped"}
                    </Typography>
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localServerOn}
                        onChange={(e) => toggleLocalServer(e.target.checked)}
                      />
                    }
                    label={localServerOn ? "On" : "Off"}
                  />
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Database Sources */}
        <Card sx={{ backgroundColor: T.bgPanel, border: `1px solid ${T.border}` }}>
          <CardContent>
            <Typography sx={{ color: T.text, fontWeight: 700, mb: 1 }}>
              Database Sources
            </Typography>

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
                          <Typography sx={{ color: T.text, fontWeight: 700 }}>
                            {src.name}
                          </Typography>
                          <Chip label={src.type} size="small" sx={{ ml: 1 }} />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography sx={{ color: T.textDim, fontSize: 13 }}>
                            {src.url}
                          </Typography>
                          <Typography sx={{ color: T.textDim, fontSize: 12, mt: 0.5 }}>
                            Last scraped:{" "}
                            <strong style={{ color: T.text }}>
                              {formatWhen(src.last_scraped)}
                            </strong>
                          </Typography>
                        </Box>
                      }
                    />

                    <ListItemSecondaryAction sx={{ right: 8, display: "flex", gap: 1, alignItems: "center" }}>
                      <Tooltip title="Open source URL">
                        <IconButton
                          size="small"
                          component="a"
                          href={src.url}
                          target="_blank"
                          rel="noreferrer"
                          sx={{ color: T.text }}
                        >
                          <LaunchIcon />
                        </IconButton>
                      </Tooltip>

                      <Chip
                        label={src.scraper_enabled ? "ENABLED" : "DISABLED"}
                        size="small"
                        sx={{
                          bgcolor: src.scraper_enabled
                            ? "rgba(34,197,94,0.06)"
                            : "rgba(255,255,255,0.02)",
                          color: src.scraper_enabled ? "#86efac" : T.textDim,
                          border: `1px solid ${
                            src.scraper_enabled
                              ? "rgba(34,197,94,0.14)"
                              : "rgba(255,255,255,0.03)"
                          }`,
                          mr: 1,
                        }}
                      />

                      <FormControlLabel
                        control={
                          <Switch
                            checked={src.scraper_enabled}
                            onChange={(e) =>
                              toggleSource(src.id, e.target.checked)
                            }
                            disabled={savingId === src.id}
                          />
                        }
                        label={src.scraper_enabled ? "On" : "Off"}
                      />
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
              startIcon={<RefreshIcon />}
              onClick={fetchConfig}
              sx={{ color: T.textDim }}
            >
              Refresh
            </Button>
          </CardActions>
        </Card>

        <Snackbar
          open={!!snack}
          autoHideDuration={2500}
          onClose={() => setSnack(null)}
          message={snack}
        />
      </Container>
    </DashboardLayout>
  );
}
