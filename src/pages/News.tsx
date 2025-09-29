import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Container,
  IconButton,
  Link as MLink,
  Paper,
  Skeleton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import DashboardLayout from "../layouts/DashboardLayout";
import { API } from "../api";
import { useNavigate } from "react-router-dom";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";

/* Theme tokens */
const T = {
  bgPanel: "#0f0f0f",
  text: "#ffffff",
  textDim: "#9ca3af",
  textSubtle: "#d1d5db",
  border: "rgba(255,255,255,0.10)",
  borderHover: "rgba(59,130,246,0.35)",
  accent: "#3b82f6",
  shadow: "0 6px 20px rgba(0,0,0,0.6)",
};

type NewsItem = {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  published_at: string;
  time_ago: string;
  categories: string[];
  impact_score: number;
  impact_label: string;
  sentiment_score: number;
  tag?: string;
};

function impactColor(score: number) {
  if (score >= 9.5) return "#ef4444";
  if (score >= 9.0) return "#f59e0b";
  if (score >= 8.0) return "#3b82f6";
  return "#9ca3af";
}
function sentimentChip(score: number) {
  if (score > 0.15) return { label: "Positive", bg: "#22c55e20", fg: "#22c55e" };
  if (score < -0.15) return { label: "Negative", bg: "#ef444420", fg: "#ef4444" };
  return { label: "Neutral", bg: "#6b728020", fg: "#9ca3af" };
}

const PAGE_SIZE = 10;
const SEARCH_FETCH_LIMIT = 1000; // how many items details/search will fetch (increase if needed)

export default function News() {
  const navigate = useNavigate();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);

  // search by id (uses same endpoint, fetches many and filters locally)
  const [searchId, setSearchId] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<NewsItem[] | null>(null);
  // categories allowed by the backend
  const CATEGORIES = ["Stocks", "Startups", "Mutual Funds", "Crypto", "Economy"] as const;
  type Category = typeof CATEGORIES[number];

  const [category, setCategory] = useState<string | "">(""); // empty = all
  const [sortBy, setSortBy] = useState<string>("impact_desc");

  const sortData = (arr: NewsItem[]) =>
    [...arr].sort((a, b) => {
      if (b.impact_score !== a.impact_score) return b.impact_score - a.impact_score;
      return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
    });

  // --- fetchPage now uses `page` param (not skip) ---
  const fetchPage = useCallback(
    async (p: number) => {
      setLoading(true);
      setErr(null);
      setSearchResults(null); // exit search mode

      try {
        // request the page number and the page size
        const params = new URLSearchParams();
        params.set("page", String(p));          // <-- page param sent to server
        params.set("limit", String(PAGE_SIZE)); // server page size

        if (category) params.set("category", String(category));
        switch (sortBy) {
          case "impact_desc":
            params.set("sort", "impact:desc");
            break;
          case "published_desc":
            params.set("sort", "published_at:desc");
            break;
          case "published_asc":
            params.set("sort", "published_at:asc");
            break;
          case "sentiment_desc":
            params.set("sort", "sentiment_score:desc");
            break;
          default:
            params.set("sort", "impact:desc");
        }

        // cache-buster for debugging (remove later)
        params.set("_cb", String(Date.now()));

        const url = `/news/high-impact?${params.toString()}`;
        console.info("[news] fetchPage requesting:", url);

        const res = await API.get(url);
        const raw = (res.data?.data ?? []) as NewsItem[];

        // If server returns exactly PAGE_SIZE items, assume there might be a next page.
        // If it returns fewer, it's the last page.
        setHasNext(raw.length === PAGE_SIZE);

        // Use the page items as returned by server (no slicing by skip)
        const sortedPageItems = sortData(raw);
        setItems(sortedPageItems);
      } catch (e: any) {
        console.error("❌ News fetch failed:", e?.response?.data || e?.message, e);
        setErr(e?.response?.data?.message || "Failed to load news");
        setItems([]);
        setHasNext(false);
      } finally {
        setLoading(false);
      }
    },
    [category, sortBy]
  );

  // call fetchPage when page changes
  useEffect(() => {
    fetchPage(page);
  }, [page, fetchPage]);

  // search by ID using the same endpoint (fetch many then filter locally)
  async function handleSearchSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const id = searchId.trim();
    if (!id) return;
    setSearchLoading(true);
    setErr(null);
    setSearchResults(null);
    try {
      // use page param so we hit the same backend contract
      const res = await API.get(`/news/high-impact?page=1&limit=${SEARCH_FETCH_LIMIT}`);
      const raw = (res.data?.data ?? []) as NewsItem[];
      const sorted = sortData(raw);
      const found = sorted.filter((x) => x.id === id);
      setSearchResults(found);
    } catch (e: any) {
      console.error("❌ Search failed:", e?.response?.data || e?.message);
      setErr(e?.response?.data?.message || "Search failed");
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }

  function clearSearch() {
    setSearchId("");
    setSearchResults(null);
    // re-fetch current page
    fetchPage(page);
  }

  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => {
    if (!hasNext) return;
    setPage((p) => p + 1);
  };

  const listToRender = searchResults ?? items;
  const totalOnPage = listToRender.length;

  return (
    <DashboardLayout>
      <Container sx={{ mt: 4 }}>
        {/* header + search */}
        <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
          <Typography variant="h4" sx={{ color: T.text }}>
            High-Impact News
          </Typography>

          <Box component="form" onSubmit={handleSearchSubmit} sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
            {/* Category filter */}
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel sx={{ color: T.textDim }}>Category</InputLabel>
              <Select
                value={category}
                label="Category"
                onChange={(e) => setCategory(String(e.target.value))}
                sx={{
                  color: T.text,
                  backgroundColor: "#0b0b0b",
                  "& .MuiSelect-icon": { color: T.textDim },
                }}
              >
                <MenuItem value="">All</MenuItem>
                {CATEGORIES.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Spacer for small screens */}
            <Box sx={{ width: 8 }} />

            {/* Search by ID */}
            <TextField
              size="small"
              placeholder="Search by News ID"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              sx={{
                minWidth: 300,
                "& .MuiOutlinedInput-root": {
                  color: T.text,
                  backgroundColor: "#0b0b0b",
                  "& fieldset": { borderColor: T.border },
                },
              }}
            />
            <Button type="submit" disabled={!searchId.trim() || searchLoading} sx={{ color: "#fff", backgroundColor: T.accent }}>
              {searchLoading ? "Searching..." : "Search"}
            </Button>
            {searchResults !== null && (
              <Button onClick={clearSearch} sx={{ color: "#fff", backgroundColor: "rgba(255,255,255,0.12)" }}>
                Clear
              </Button>
            )}
          </Box>
        </Box>

        {/* summary */}
        <Box sx={{ mb: 2, p: 2, borderRadius: 2, backgroundColor: T.bgPanel, border: `1px solid ${T.border}`, color: T.textDim }}>
          {searchResults ? (
            <Typography>
              Showing <strong style={{ color: T.text }}>{totalOnPage}</strong> result(s) for ID <strong style={{ color: T.text }}>{searchId}</strong>
            </Typography>
          ) : (
            <Typography>
              Page <strong style={{ color: T.text }}>{page}</strong> — showing <strong style={{ color: T.text }}>{totalOnPage}</strong> of {PAGE_SIZE}
            </Typography>
          )}
        </Box>

        {/* grid */}
        {loading ? (
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 2.5 }}>
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <Paper key={i} sx={{ p: 2.5, borderRadius: 3, backgroundColor: T.bgPanel, border: `1px solid ${T.border}` }}>
                <Skeleton height={28} sx={{ bgcolor: "rgba(255,255,255,0.08)" }} />
                <Skeleton height={20} width="60%" sx={{ mt: 1, bgcolor: "rgba(255,255,255,0.06)" }} />
                <Skeleton variant="rectangular" height={76} sx={{ mt: 2, borderRadius: 2, bgcolor: "rgba(255,255,255,0.04)" }} />
              </Paper>
            ))}
          </Box>
        ) : err ? (
          <Paper sx={{ p: 3, borderRadius: 2, backgroundColor: T.bgPanel }}>
            <Typography color="error">{err}</Typography>
          </Paper>
        ) : (
          <>
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 2.5 }}>
              {listToRender.map((n) => {
                const s = sentimentChip(n.sentiment_score);
                const impact = impactColor(n.impact_score);
                return (
                  <Paper
                    key={n.id}
                    onClick={() => navigate(`/news/${n.id}`)}
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      backgroundColor: T.bgPanel,
                      color: T.text,
                      border: `1px solid ${T.border}`,
                      boxShadow: T.shadow,
                      cursor: "pointer",
                      transition: "transform .12s ease",
                      "&:hover": { transform: "translateY(-2px)", borderColor: T.borderHover },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                      <Typography variant="h6" sx={{ flex: 1, lineHeight: 1.25 }}>
                        {n.title}
                      </Typography>

                      <Tooltip title="Open source">
                        <IconButton
                          size="small"
                          component={MLink}
                          href={n.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          sx={{ color: T.accent }}
                        >
                          <OpenInNewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>

                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.25, mt: 1, color: T.textDim }}>
                      <Chip label={n.source} size="small" sx={{ bgcolor: "#111827", color: T.textDim, border: `1px solid ${T.border}` }} />
                      <Typography variant="caption">•</Typography>
                      <Typography variant="caption">{n.time_ago}</Typography>

                      <Chip label={`${n.impact_label} (${n.impact_score.toFixed(1)})`} size="small" sx={{ ml: 1, bgcolor: `${impact}20`, color: impact, border: `1px solid ${impact}55`, fontWeight: 700 }} />
                      <Chip label={s.label} size="small" sx={{ bgcolor: s.bg, color: s.fg, ml: 1, fontWeight: 700 }} />
                      {n.tag && <Chip label={n.tag} size="small" sx={{ ml: 1, bgcolor: "#0b1220", color: "#60a5fa", border: "1px solid #1e3a8a" }} />}
                    </Box>

                    {n.summary && <Typography variant="body2" sx={{ color: T.textSubtle, mt: 1.5 }}>{n.summary}</Typography>}

                    {!!n.categories?.length && (
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1.75 }}>
                        {n.categories.map((c) => (
                          <Chip key={c} label={c} size="small" sx={{ bgcolor: "#111827", color: "#93c5fd", border: "1px solid rgba(147,197,253,.25)" }} />
                        ))}
                      </Box>
                    )}
                  </Paper>
                );
              })}
            </Box>

            {/* pagination bottom (hidden in search mode) */}
            {searchResults === null && (
              <Box sx={{ mt: 3, p: 2, borderRadius: 2, backgroundColor: T.bgPanel, border: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2">Page <strong style={{ color: T.text }}>{page}</strong></Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button onClick={goPrev} disabled={page === 1} sx={{ color: "#fff", backgroundColor: page === 1 ? "rgba(255,255,255,0.12)" : T.accent }}>
                    Prev
                  </Button>
                  <Button onClick={goNext} disabled={!hasNext} sx={{ color: "#fff", backgroundColor: !hasNext ? "rgba(255,255,255,0.12)" : T.accent }}>
                    Next
                  </Button>
                </Box>
              </Box>
            )}
          </>
        )}
      </Container>
    </DashboardLayout>
  );
}
