import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Container, Typography, Paper, CircularProgress, Chip, Divider, Button, Box, } from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { API } from "../api";
import DashboardLayout from "../layouts/DashboardLayout";
function UserDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (!id)
            return;
        API.get(`/admin/users/${id}`)
            .then((res) => {
            setUser(res.data.data);
            setLoading(false);
        })
            .catch((err) => {
            console.error("❌ Fetch user details failed:", err.response?.data || err.message);
            setLoading(false);
        });
    }, [id]);
    const renderField = (label, value) => (_jsxs(Box, { sx: { mb: 3 }, children: [_jsx(Typography, { variant: "subtitle2", sx: { color: "#9ca3af", mb: 0.5 }, children: label }), _jsx(Typography, { children: value })] }));
    return (_jsx(DashboardLayout, { children: _jsxs(Container, { sx: { mt: 4 }, children: [_jsx(Button, { variant: "outlined", onClick: () => navigate(-1), sx: {
                        mb: 2,
                        color: "#9ca3af",
                        borderColor: "rgba(255,255,255,0.2)",
                        "&:hover": { borderColor: "#fff", color: "#fff" },
                    }, children: "\u2190 Back" }), loading ? (_jsx(CircularProgress, { sx: { mt: 4, color: "#3b82f6" } })) : user ? (_jsxs(Paper, { sx: {
                        p: 4,
                        mt: 2,
                        borderRadius: 3,
                        backgroundColor: "#0f0f0f",
                        color: "#fff",
                        border: "1px solid rgba(255,255,255,0.1)",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.7)",
                    }, children: [_jsxs(Box, { sx: {
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                mb: 3,
                            }, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "h5", sx: { fontWeight: "bold" }, children: user.name }), _jsx(Typography, { variant: "subtitle1", sx: { color: "#9ca3af" }, children: user.email })] }), _jsx(Button, { variant: "contained", sx: {
                                        backgroundColor: "#3b82f6",
                                        fontWeight: "bold",
                                        textTransform: "none",
                                        "&:hover": { backgroundColor: "#2563eb" },
                                    }, onClick: () => navigate(`/users/${user.id}/edit`), children: "\u270F\uFE0F Edit" })] }), _jsx(Divider, { sx: { my: 2, borderColor: "rgba(255,255,255,0.1)" } }), _jsxs(Box, { sx: {
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 4,
                            }, children: [_jsxs(Box, { sx: { flex: "1 1 300px", minWidth: "300px" }, children: [renderField("User ID", user.id), renderField("Phone", user.phone || "N/A"), renderField("Experience", user.experience_level
                                            ? user.experience_level.charAt(0).toUpperCase() +
                                                user.experience_level.slice(1)
                                            : "N/A"), renderField("Onboarding", user.onboarding_completed ? (_jsx(Chip, { label: "Completed", sx: {
                                                backgroundColor: "#22c55e20",
                                                color: "#22c55e",
                                                fontWeight: "bold",
                                            }, size: "small" })) : (_jsx(Chip, { label: "Pending", sx: {
                                                backgroundColor: "#f59e0b20",
                                                color: "#f59e0b",
                                                fontWeight: "bold",
                                            }, size: "small" })))] }), _jsxs(Box, { sx: { flex: "1 1 300px", minWidth: "300px" }, children: [renderField("Status", user.is_disabled ? (_jsx(Chip, { label: "Disabled", sx: {
                                                backgroundColor: "#ef444420",
                                                color: "#ef4444",
                                                fontWeight: "bold",
                                            }, size: "small" })) : (_jsx(Chip, { label: "Active", sx: {
                                                backgroundColor: "#3b82f620",
                                                color: "#3b82f6",
                                                fontWeight: "bold",
                                            }, size: "small" }))), renderField("Version", user.version
                                            ? user.version.charAt(0).toUpperCase() + user.version.slice(1)
                                            : "N/A"), renderField("Interests", _jsx(Box, { sx: { mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }, children: user.interests && user.interests.length > 0 ? (user.interests.map((interest, i) => (_jsx(Chip, { label: interest, sx: {
                                                    backgroundColor: "#3b82f620",
                                                    color: "#3b82f6",
                                                    border: "1px solid #3b82f6",
                                                }, size: "small" }, i)))) : (_jsx(Typography, { children: "N/A" })) })), renderField("Created At", new Date(user.created_at).toLocaleString())] })] })] })) : (_jsx(Typography, { variant: "h6", sx: { mt: 4, color: "#9ca3af" }, children: "User not found" }))] }) }));
}
export default UserDetails;
