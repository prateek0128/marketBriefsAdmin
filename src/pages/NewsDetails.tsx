// src/pages/NewsDetails.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Chip,
  Container,
  IconButton,
  Link as MLink,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Snackbar,
  Alert,
  Divider,
} from "@mui/material";
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

function impactColor(score: number) {
  if (score >= 9.5) return "#ef4444";
  if (score >= 9.0) return "#f59e0b";
  if (score >= 8.0) return "#3b82f6";
  return "#9ca3af";
}
function sentimentStyleFromScore(score: number) {
  if (score > 0.15) return { bg: "#22c55e20", fg: "#22c55e", text: "Positive" };
  if (score < -0.15) return { bg: "#ef444420", fg: "#ef4444", text: "Negative" };
  return { bg: "#6b728020", fg: "#9ca3af", text: "Neutral" };
}

export default function NewsDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<any | null>(null);
  const [err, setErr] = useState<string | null>(null);

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
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity?: "success" | "error" }>({
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
        const found = list.find((x: any) => x.id === id);
        if (!mounted) return;
        if (!found) {
          setErr("Article not found");
          setItem(null);
        } else {
          setItem(found);
          setErr(null);
        }
      } catch (e: any) {
        console.error("News details load failed:", e?.response?.data || e?.message);
        setErr(e?.response?.data?.message || "Failed to load news");
        setItem(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  // populate edit form when item arrives
  useEffect(() => {
    if (!item) return;
    setEditForm({
      title: item.title ?? "",
      summary: item.summary ?? "",
      categories: (item.categories ?? []).join(", "),
      impact_score: item.impact_score != null ? String(item.impact_score) : "",
      sentiment: item.sentiment_label ?? "",
    });
  }, [item]);

  const sentimentDisplay = useMemo(() => {
    if (!item) return sentimentStyleFromScore(0);
    if (item.sentiment_label) {
      return { bg: "#6b728020", fg: "#9ca3af", text: String(item.sentiment_label) };
    }
    return sentimentStyleFromScore(Number(item.sentiment_score ?? 0));
  }, [item]);

  const handleSave = async () => {
    if (!item) return;
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
    } catch (e) {
      console.error("Update failed:", e);
      setSnack({ open: true, message: "Update failed", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    try {
      await API.delete(`/admin/news/${item.id}`);
      setSnack({ open: true, message: "News deleted", severity: "success" });
      setDelOpen(false);
      setTimeout(() => navigate("/news"), 400);
    } catch (e) {
      console.error("Delete failed:", e);
      setSnack({ open: true, message: "Delete failed", severity: "error" });
    }
  };

  // helper to safely turn unknown to string when rendering
  const safeString = (v: unknown) => {
    if (v == null) return "—";
    if (typeof v === "string") return v;
    if (typeof v === "number" || typeof v === "boolean") return String(v);
    try {
      return JSON.stringify(v, null, 2);
    } catch {
      return String(v);
    }
  };

  return (
    <DashboardLayout>
      <Container sx={{ mt: 4, mb: 6 }}>
        <Button
          onClick={() => navigate(-1)}
          sx={{
            mb: 2,
            color: "#9ca3af",
            border: "1px solid rgba(255,255,255,.12)",
            borderRadius: 2,
            px: 1,
          }}
        >
          <ArrowBackIosNewIcon fontSize="small" sx={{ mr: 1 }} />
          Back
        </Button>

        {loading ? (
          <Paper sx={{ p: 4, borderRadius: 3, backgroundColor: "#0f0f0f", color: "#fff" }}>
            <Typography>Loading…</Typography>
          </Paper>
        ) : err ? (
          <Paper sx={{ p: 3, borderRadius: 2, backgroundColor: "#0f0f0f", color: "#fff" }}>
            <Typography color="error">{err}</Typography>
          </Paper>
        ) : item ? (
          <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 3, backgroundColor: "#0f0f0f", color: "#fff", border: "1px solid rgba(255,255,255,0.06)" }}>
            {/* Title + actions */}
            <Box sx={{ display: "flex", gap: 2, justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap" }}>
              <Box sx={{ flex: "1 1 60%" }}>
                <Typography variant="h5" sx={{ mb: 1 }}>
                  {safeString(item.title)}
                </Typography>

                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                  <Chip label={safeString(item.source)} size="small" sx={{ bgcolor: "#111827", color: "#93c5fd" }} />
                  <Chip label={item.published_at ? new Date(String(item.published_at)).toLocaleString() : "—"} size="small" sx={{ bgcolor: "#111827" }} />
                  <Chip
                    label={`${safeString(item.impact_label)} (${item.impact_score != null ? Number(item.impact_score).toFixed(2) : "—"})`}
                    size="small"
                    sx={{
                      bgcolor: `${impactColor(Number(item.impact_score ?? 0))}20`,
                      color: impactColor(Number(item.impact_score ?? 0)),
                      fontWeight: 700,
                    }}
                  />
                  <Chip
                    label={`Sentiment: ${sentimentDisplay.text} (${item.sentiment_score != null ? Number(item.sentiment_score).toFixed(2) : "—"})`}
                    size="small"
                    sx={{ bgcolor: sentimentDisplay.bg, color: sentimentDisplay.fg, fontWeight: 700 }}
                  />
                  {item.tag && <Chip label={safeString(item.tag)} size="small" sx={{ textTransform: "capitalize" }} />}
                </Box>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "flex-end" }}>
                <IconButton
                  href={safeString(item.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ color: "#3b82f6" }}
                  aria-label="open-source"
                >
                  <OpenInNewIcon />
                </IconButton>

                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button startIcon={<EditIcon />} onClick={() => setEditOpen(true)} variant="outlined" size="small">
                    Edit
                  </Button>
                  <Button startIcon={<DeleteIcon />} onClick={() => setDelOpen(true)} variant="outlined" color="error" size="small">
                    Delete
                  </Button>
                </Box>
              </Box>
            </Box>

            <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.06)" }} />

            {/* Metadata grid (CSS grid) */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 2,
                alignItems: "start",
              }}
            >
              <Box>
                <Typography variant="body2" sx={{ color: "#9ca3af", mb: 0.5 }}>
                  <strong>ID:</strong> {safeString(item.id)}
                </Typography>

                <Typography variant="body2" sx={{ color: "#9ca3af", mb: 0.5 }}>
                  <strong>Source URL:</strong>{" "}
                  <MLink href={safeString(item.url)} target="_blank" rel="noopener noreferrer">
                    {safeString(item.url)}
                  </MLink>
                </Typography>

                <Typography variant="body2" sx={{ color: "#9ca3af", mb: 0.5 }}>
                  <strong>Time ago:</strong> {safeString(item.time_ago)}
                </Typography>

                <Typography variant="body2" sx={{ color: "#9ca3af", mb: 0.5 }}>
                  <strong>Date extracted:</strong> {safeString(item.date_extracted)}
                </Typography>

                <Box sx={{ mt: 1 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Categories
                  </Typography>
                  {Array.isArray(item.categories) && item.categories.length ? (
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      {item.categories.map((c: unknown, i: number) => (
                        <Chip key={String(i)} label={safeString(c)} size="small" sx={{ bgcolor: "#111827", color: "#93c5fd" }} />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2">—</Typography>
                  )}
                </Box>
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Authors
                </Typography>
                {Array.isArray(item.authors) && item.authors.length ? (
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {item.authors.map((a: unknown, i: number) => (
                      <Chip key={String(i)} label={safeString(a)} size="small" sx={{ bgcolor: "#0b1220", color: "#c4d3f6" }} />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2">—</Typography>
                )}

                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">Engagement</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    ❤ {Number(item.engagement?.likes ?? 0)} • 💬 {Number(item.engagement?.comments ?? 0)}
                  </Typography>
                </Box>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">Reading level</Typography>
                  <Typography variant="body2">{safeString(item.reading_level)}</Typography>
                </Box>
              </Box>
            </Box>

            <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.06)" }} />

            {/* Summary / content */}
            {item.summary ? (
              <>
                <Typography variant="subtitle2">Summary</Typography>
                <Typography variant="body1" sx={{ mt: 1, color: "#d1d5db", whiteSpace: "pre-wrap" }}>
                  {safeString(item.summary)}
                </Typography>
              </>
            ) : null}

            {item.content ? (
              <>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">Content</Typography>
                  <Typography variant="body2" sx={{ mt: 1, color: "#c7cdd6", whiteSpace: "pre-wrap" }}>
                    {safeString(item.content)}
                  </Typography>
                </Box>
              </>
            ) : null}

            {/* Titles by level */}
            {item.title_by_level && typeof item.title_by_level === "object" && (
              <>
                <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.06)" }} />
                <Typography variant="subtitle2">Titles by level</Typography>
                <Box sx={{ mt: 1 }}>
                  {Object.entries(item.title_by_level as Record<string, unknown>).map(([level, text]) => (
                    <Box key={level} sx={{ mb: 1 }}>
                      <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                        <strong>{safeString(level)}</strong>
                      </Typography>
                      <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                        {safeString(text)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </>
            )}

            {/* Summaries by level */}
            {item.summary_by_level && typeof item.summary_by_level === "object" && (
              <>
                <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.06)" }} />
                <Typography variant="subtitle2">Summaries by level</Typography>
                <Box sx={{ mt: 1 }}>
                  {Object.entries(item.summary_by_level as Record<string, unknown>).map(([level, text]) => (
                    <Box key={level} sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                        <strong>{safeString(level)}</strong>
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mt: 0.5 }}>
                        {safeString(text)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </>
            )}

            <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.06)" }} />

            {/* Raw payload preview */}
            <Box sx={{ background: "#080808", p: 2, borderRadius: 1 }}>
              <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                Raw JSON (for debugging)
              </Typography>
              <Box component="pre" sx={{ fontSize: 12, mt: 1, whiteSpace: "pre-wrap", color: "#e5e7eb" }}>
                {JSON.stringify(item, null, 2)}
              </Box>
            </Box>
          </Paper>
        ) : null}

        {/* Edit dialog */}
        <EditNewsDialog
  open={editOpen}
  item={item}
  onClose={() => setEditOpen(false)}
  onSaved={(u) => setItem(u)}
/>


        {/* Delete confirm */}
        <Dialog open={delOpen} onClose={() => setDelOpen(false)}>
          <DialogTitle>Delete Article?</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to delete this article? This can't be undone.</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDelOpen(false)}>Cancel</Button>
            <Button color="error" onClick={handleDelete}>
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          <Alert severity={snack.severity}>{snack.message}</Alert>
        </Snackbar>
      </Container>
    </DashboardLayout>
  );
}
