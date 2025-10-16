import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from "react";
import { Box, Button, Chip, Container, IconButton, Link as MLink, Paper, Skeleton, TextField, Tooltip, Typography, } from "@mui/material";
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
function impactColor(score) {
    if (score >= 9.5)
        return "#ef4444";
    if (score >= 9.0)
        return "#f59e0b";
    if (score >= 8.0)
        return "#3b82f6";
    return "#9ca3af";
}
function sentimentChip(score) {
    if (score > 0.15)
        return { label: "Positive", bg: "#22c55e20", fg: "#22c55e" };
    if (score < -0.15)
        return { label: "Negative", bg: "#ef444420", fg: "#ef4444" };
    return { label: "Neutral", bg: "#6b728020", fg: "#9ca3af" };
}
const PAGE_SIZE = 10;
const SEARCH_FETCH_LIMIT = 1000; // how many items details/search will fetch (increase if needed)
export default function News() {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);
    const [page, setPage] = useState(1);
    const [hasNext, setHasNext] = useState(false);
    // search by id (uses same endpoint, fetches many and filters locally)
    const [searchId, setSearchId] = useState("");
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchResults, setSearchResults] = useState(null);
    // categories allowed by the backend
    const CATEGORIES = ["Stocks", "Startups", "Mutual Funds", "Crypto", "Economy"];
    const [category, setCategory] = useState(""); // empty = all
    const [sortBy, setSortBy] = useState("impact_desc");
    const sortData = (arr) => [...arr].sort((a, b) => {
        if (b.impact_score !== a.impact_score)
            return b.impact_score - a.impact_score;
        return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
    });
    // --- fetchPage now uses `page` param (not skip) ---
    const fetchPage = useCallback(async (p) => {
        setLoading(true);
        setErr(null);
        setSearchResults(null); // exit search mode
        try {
            // request the page number and the page size
            const params = new URLSearchParams();
            params.set("page", String(p)); // <-- page param sent to server
            params.set("limit", String(PAGE_SIZE)); // server page size
            if (category)
                params.set("category", String(category));
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
            const raw = (res.data?.data ?? []);
            // If server returns exactly PAGE_SIZE items, assume there might be a next page.
            // If it returns fewer, it's the last page.
            setHasNext(raw.length === PAGE_SIZE);
            // Use the page items as returned by server (no slicing by skip)
            const sortedPageItems = sortData(raw);
            setItems(sortedPageItems);
        }
        catch (e) {
            console.error("❌ News fetch failed:", e?.response?.data || e?.message, e);
            setErr(e?.response?.data?.message || "Failed to load news");
            setItems([]);
            setHasNext(false);
        }
        finally {
            setLoading(false);
        }
    }, [category, sortBy]);
    // call fetchPage when page changes
    useEffect(() => {
        fetchPage(page);
    }, [page, fetchPage]);
    // search by ID using the same endpoint (fetch many then filter locally)
    async function handleSearchSubmit(e) {
        if (e)
            e.preventDefault();
        const id = searchId.trim();
        if (!id)
            return;
        setSearchLoading(true);
        setErr(null);
        setSearchResults(null);
        try {
            // use page param so we hit the same backend contract
            const res = await API.get(`/news/high-impact?page=1&limit=${SEARCH_FETCH_LIMIT}`);
            const raw = (res.data?.data ?? []);
            const sorted = sortData(raw);
            const found = sorted.filter((x) => x.id === id);
            setSearchResults(found);
        }
        catch (e) {
            console.error("❌ Search failed:", e?.response?.data || e?.message);
            setErr(e?.response?.data?.message || "Search failed");
            setSearchResults([]);
        }
        finally {
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
        if (!hasNext)
            return;
        setPage((p) => p + 1);
    };
    const listToRender = searchResults ?? items;
    const totalOnPage = listToRender.length;
    return (_jsx(DashboardLayout, { children: _jsxs(Container, { sx: { mt: 4 }, children: [_jsxs(Box, { sx: { mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }, children: [_jsx(Typography, { variant: "h4", sx: { color: T.text }, children: "High-Impact News" }), _jsxs(Box, { component: "form", onSubmit: handleSearchSubmit, sx: { display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }, children: [_jsxs(FormControl, { size: "small", sx: { minWidth: 160 }, children: [_jsx(InputLabel, { sx: { color: T.textDim }, children: "Category" }), _jsxs(Select, { value: category, label: "Category", onChange: (e) => setCategory(String(e.target.value)), sx: {
                                                color: T.text,
                                                backgroundColor: "#0b0b0b",
                                                "& .MuiSelect-icon": { color: T.textDim },
                                            }, children: [_jsx(MenuItem, { value: "", children: "All" }), CATEGORIES.map((c) => (_jsx(MenuItem, { value: c, children: c }, c)))] })] }), _jsx(Box, { sx: { width: 8 } }), _jsx(TextField, { size: "small", placeholder: "Search by News ID", value: searchId, onChange: (e) => setSearchId(e.target.value), sx: {
                                        minWidth: 300,
                                        "& .MuiOutlinedInput-root": {
                                            color: T.text,
                                            backgroundColor: "#0b0b0b",
                                            "& fieldset": { borderColor: T.border },
                                        },
                                    } }), _jsx(Button, { type: "submit", disabled: !searchId.trim() || searchLoading, sx: { color: "#fff", backgroundColor: T.accent }, children: searchLoading ? "Searching..." : "Search" }), searchResults !== null && (_jsx(Button, { onClick: clearSearch, sx: { color: "#fff", backgroundColor: "rgba(255,255,255,0.12)" }, children: "Clear" }))] })] }), _jsx(Box, { sx: { mb: 2, p: 2, borderRadius: 2, backgroundColor: T.bgPanel, border: `1px solid ${T.border}`, color: T.textDim }, children: searchResults ? (_jsxs(Typography, { children: ["Showing ", _jsx("strong", { style: { color: T.text }, children: totalOnPage }), " result(s) for ID ", _jsx("strong", { style: { color: T.text }, children: searchId })] })) : (_jsxs(Typography, { children: ["Page ", _jsx("strong", { style: { color: T.text }, children: page }), " \u2014 showing ", _jsx("strong", { style: { color: T.text }, children: totalOnPage }), " of ", PAGE_SIZE] })) }), loading ? (_jsx(Box, { sx: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 2.5 }, children: Array.from({ length: PAGE_SIZE }).map((_, i) => (_jsxs(Paper, { sx: { p: 2.5, borderRadius: 3, backgroundColor: T.bgPanel, border: `1px solid ${T.border}` }, children: [_jsx(Skeleton, { height: 28, sx: { bgcolor: "rgba(255,255,255,0.08)" } }), _jsx(Skeleton, { height: 20, width: "60%", sx: { mt: 1, bgcolor: "rgba(255,255,255,0.06)" } }), _jsx(Skeleton, { variant: "rectangular", height: 76, sx: { mt: 2, borderRadius: 2, bgcolor: "rgba(255,255,255,0.04)" } })] }, i))) })) : err ? (_jsx(Paper, { sx: { p: 3, borderRadius: 2, backgroundColor: T.bgPanel }, children: _jsx(Typography, { color: "error", children: err }) })) : (_jsxs(_Fragment, { children: [_jsx(Box, { sx: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 2.5 }, children: listToRender.map((n) => {
                                const s = sentimentChip(n.sentiment_score);
                                const impact = impactColor(n.impact_score);
                                return (_jsxs(Paper, { onClick: () => navigate(`/news/${n.id}`), sx: {
                                        p: 2.5,
                                        borderRadius: 3,
                                        backgroundColor: T.bgPanel,
                                        color: T.text,
                                        border: `1px solid ${T.border}`,
                                        boxShadow: T.shadow,
                                        cursor: "pointer",
                                        transition: "transform .12s ease",
                                        "&:hover": { transform: "translateY(-2px)", borderColor: T.borderHover },
                                    }, children: [_jsxs(Box, { sx: { display: "flex", alignItems: "flex-start", gap: 1 }, children: [_jsx(Typography, { variant: "h6", sx: { flex: 1, lineHeight: 1.25 }, children: n.title }), _jsx(Tooltip, { title: "Open source", children: _jsx(IconButton, { size: "small", component: MLink, href: n.url, target: "_blank", rel: "noreferrer", onClick: (e) => e.stopPropagation(), sx: { color: T.accent }, children: _jsx(OpenInNewIcon, { fontSize: "small" }) }) })] }), _jsxs(Box, { sx: { display: "flex", flexWrap: "wrap", gap: 1.25, mt: 1, color: T.textDim }, children: [_jsx(Chip, { label: n.source, size: "small", sx: { bgcolor: "#111827", color: T.textDim, border: `1px solid ${T.border}` } }), _jsx(Typography, { variant: "caption", children: "\u2022" }), _jsx(Typography, { variant: "caption", children: n.time_ago }), _jsx(Chip, { label: `${n.impact_label} (${n.impact_score.toFixed(1)})`, size: "small", sx: { ml: 1, bgcolor: `${impact}20`, color: impact, border: `1px solid ${impact}55`, fontWeight: 700 } }), _jsx(Chip, { label: s.label, size: "small", sx: { bgcolor: s.bg, color: s.fg, ml: 1, fontWeight: 700 } }), n.tag && _jsx(Chip, { label: n.tag, size: "small", sx: { ml: 1, bgcolor: "#0b1220", color: "#60a5fa", border: "1px solid #1e3a8a" } })] }), n.summary && _jsx(Typography, { variant: "body2", sx: { color: T.textSubtle, mt: 1.5 }, children: n.summary }), !!n.categories?.length && (_jsx(Box, { sx: { display: "flex", gap: 1, flexWrap: "wrap", mt: 1.75 }, children: n.categories.map((c) => (_jsx(Chip, { label: c, size: "small", sx: { bgcolor: "#111827", color: "#93c5fd", border: "1px solid rgba(147,197,253,.25)" } }, c))) }))] }, n.id));
                            }) }), searchResults === null && (_jsxs(Box, { sx: { mt: 3, p: 2, borderRadius: 2, backgroundColor: T.bgPanel, border: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [_jsxs(Typography, { variant: "body2", children: ["Page ", _jsx("strong", { style: { color: T.text }, children: page })] }), _jsxs(Box, { sx: { display: "flex", gap: 1 }, children: [_jsx(Button, { onClick: goPrev, disabled: page === 1, sx: { color: "#fff", backgroundColor: page === 1 ? "rgba(255,255,255,0.12)" : T.accent }, children: "Prev" }), _jsx(Button, { onClick: goNext, disabled: !hasNext, sx: { color: "#fff", backgroundColor: !hasNext ? "rgba(255,255,255,0.12)" : T.accent }, children: "Next" })] })] }))] }))] }) }));
}
