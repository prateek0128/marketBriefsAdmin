import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Typography, Paper, CircularProgress, Box } from "@mui/material";
import { API } from "../api";
import DashboardLayout from "../layouts/DashboardLayout";
function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        API.get("/admin/users")
            .then((res) => {
            const users = res.data.data.users || [];
            const total = res.data.data.total || users.length;
            const completed = users.filter((u) => u.onboarding_completed).length;
            const pending = total - completed;
            setStats({ total, completed, pending });
            setLoading(false);
        })
            .catch((err) => {
            console.error("❌ Dashboard stats failed:", err.response?.data || err.message);
            setLoading(false);
        });
    }, []);
    return (_jsxs(DashboardLayout, { children: [_jsx(Typography, { variant: "h4", gutterBottom: true, sx: { color: "#fff", fontWeight: "bold", mb: 3 }, children: "Dashboard" }), loading ? (_jsx(CircularProgress, { sx: { color: "#10a37f" } })) : (_jsxs(Box, { sx: {
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 3,
                    mt: 2,
                }, children: [_jsx(Box, { sx: { flex: "1 1 300px", minWidth: "300px" }, children: _jsxs(Paper, { sx: {
                                p: 3,
                                textAlign: "center",
                                backgroundColor: "#1e1e1e", // GPT dark gray
                                color: "#fff",
                                borderRadius: 3,
                                border: "1px solid rgba(255,255,255,0.1)",
                                boxShadow: "0 4px 16px rgba(0,0,0,0.6)",
                            }, children: [_jsx(Typography, { variant: "h6", sx: { color: "#9ca3af" }, children: "Total Users" }), _jsx(Typography, { variant: "h3", sx: { fontWeight: "bold", color: "#10a37f" }, children: stats?.total })] }) }), _jsx(Box, { sx: { flex: "1 1 300px", minWidth: "300px" }, children: _jsxs(Paper, { sx: {
                                p: 3,
                                textAlign: "center",
                                backgroundColor: "#1e1e1e",
                                color: "#fff",
                                borderRadius: 3,
                                border: "1px solid rgba(255,255,255,0.1)",
                                boxShadow: "0 4px 16px rgba(0,0,0,0.6)",
                            }, children: [_jsx(Typography, { variant: "h6", sx: { color: "#9ca3af" }, children: "Onboarding Completed" }), _jsx(Typography, { variant: "h3", sx: { fontWeight: "bold", color: "#22c55e" }, children: stats?.completed })] }) }), _jsx(Box, { sx: { flex: "1 1 300px", minWidth: "300px" }, children: _jsxs(Paper, { sx: {
                                p: 3,
                                textAlign: "center",
                                backgroundColor: "#1e1e1e",
                                color: "#fff",
                                borderRadius: 3,
                                border: "1px solid rgba(255,255,255,0.1)",
                                boxShadow: "0 4px 16px rgba(0,0,0,0.6)",
                            }, children: [_jsx(Typography, { variant: "h6", sx: { color: "#9ca3af" }, children: "Onboarding Pending" }), _jsx(Typography, { variant: "h3", sx: { fontWeight: "bold", color: "#f59e0b" }, children: stats?.pending })] }) })] }))] }));
}
export default Dashboard;
