import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Container, Table, TableHead, TableRow, TableCell, TableBody, Chip, Typography, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Snackbar, Alert, Skeleton, Box, } from "@mui/material";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useNavigate } from "react-router-dom";
import { API } from "../api";
import DashboardLayout from "../layouts/DashboardLayout";
function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmUser, setConfirmUser] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
    const navigate = useNavigate();
    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            navigate("/login");
            return;
        }
        API.get("/admin/users?email=&phone=&role=&version=&skip=0&limit=20")
            .then((res) => {
            setUsers(res.data.data.users);
            setLoading(false);
        })
            .catch((err) => {
            console.error("❌ Users fetch failed:", err.response?.data || err.message);
            navigate("/login");
        });
    }, [navigate]);
    const handleToggle = async (user) => {
        try {
            const payload = { disable: !user.is_disabled };
            const res = await API.put(`/admin/users/${user.id}/disable`, payload);
            const updatedStatus = res.data.data.is_disabled;
            setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_disabled: updatedStatus } : u));
            setSnackbar({
                open: true,
                message: `User ${updatedStatus ? "disabled" : "enabled"} successfully`,
                severity: "success",
            });
        }
        catch (err) {
            console.error("❌ Toggle user failed:", err.response?.data || err.message);
            setSnackbar({
                open: true,
                message: "Failed to update user",
                severity: "error",
            });
        }
        finally {
            setConfirmUser(null);
        }
    };
    const TableShell = () => (_jsx(Paper, { sx: {
            p: 2,
            backgroundColor: "#0f0f0f",
            color: "#fff",
            borderRadius: 3,
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.7)",
            overflow: "hidden",
        }, children: _jsxs(Table, { sx: {
                backgroundColor: "#0f0f0f",
                "& th, & td": { borderColor: "rgba(255,255,255,0.1)" },
            }, children: [_jsx(TableHead, { children: _jsx(TableRow, { children: ["Name", "Email", "Onboarding", "Status", "Created", "Actions"].map((head) => (_jsx(TableCell, { sx: { color: "#9ca3af", fontWeight: "bold" }, children: head }, head))) }) }), _jsx(TableBody, { children: Array.from({ length: 6 }).map((_, idx) => (_jsxs(TableRow, { children: [_jsx(TableCell, { children: _jsx(Skeleton, { variant: "text", width: "60%", sx: { bgcolor: "rgba(255,255,255,0.08)" } }) }), _jsx(TableCell, { children: _jsx(Skeleton, { variant: "text", width: "80%", sx: { bgcolor: "rgba(255,255,255,0.08)" } }) }), _jsx(TableCell, { children: _jsx(Box, { sx: { display: "inline-block", minWidth: 90 }, children: _jsx(Skeleton, { variant: "rounded", height: 26, sx: { borderRadius: 999, bgcolor: "rgba(255,255,255,0.08)" } }) }) }), _jsx(TableCell, { children: _jsx(Box, { sx: { display: "inline-block", minWidth: 80 }, children: _jsx(Skeleton, { variant: "rounded", height: 26, sx: { borderRadius: 999, bgcolor: "rgba(255,255,255,0.08)" } }) }) }), _jsx(TableCell, { children: _jsx(Skeleton, { variant: "text", width: "70%", sx: { bgcolor: "rgba(255,255,255,0.08)" } }) }), _jsx(TableCell, { align: "center", children: _jsxs(Box, { sx: { display: "flex", gap: 1, justifyContent: "center" }, children: [_jsx(Skeleton, { variant: "circular", width: 28, height: 28, sx: { bgcolor: "rgba(255,255,255,0.08)" } }), _jsx(Skeleton, { variant: "circular", width: 28, height: 28, sx: { bgcolor: "rgba(255,255,255,0.08)" } })] }) })] }, idx))) })] }) }));
    return (_jsx(DashboardLayout, { children: _jsxs(Container, { sx: { mt: 4 }, children: [_jsx(Typography, { variant: "h4", gutterBottom: true, sx: { color: "#fff" }, children: "Users" }), loading ? (_jsx(TableShell, {})) : (_jsx(Paper, { sx: {
                        p: 2,
                        backgroundColor: "#0f0f0f", // pure black
                        color: "#fff",
                        borderRadius: 3,
                        border: "1px solid rgba(255,255,255,0.1)",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.7)",
                        overflow: "hidden", // ensure table respects rounded corners
                    }, children: _jsxs(Table, { sx: {
                            backgroundColor: "#0f0f0f",
                            "& th, & td": { borderColor: "rgba(255,255,255,0.1)" },
                        }, children: [_jsx(TableHead, { children: _jsx(TableRow, { children: ["Name", "Email", "Onboarding", "Status", "Created", "Actions"].map((head) => (_jsx(TableCell, { sx: { color: "#9ca3af", fontWeight: "bold" }, children: head }, head))) }) }), _jsx(TableBody, { children: users.map((u) => (_jsxs(TableRow, { sx: {
                                        backgroundColor: u.is_disabled
                                            ? "rgba(239,68,68,0.08)"
                                            : "transparent",
                                        "&:hover": { backgroundColor: "rgba(255,255,255,0.05)" },
                                        transition: "background-color 0.2s ease",
                                    }, children: [_jsx(TableCell, { sx: { color: "#fff" }, children: u.name }), _jsx(TableCell, { sx: { color: "#9ca3af" }, children: u.email }), _jsx(TableCell, { children: u.onboarding_completed ? (_jsx(Chip, { label: "Completed", sx: {
                                                    backgroundColor: "#22c55e20",
                                                    color: "#22c55e",
                                                    fontWeight: "bold",
                                                }, size: "small" })) : (_jsx(Chip, { label: "Pending", sx: {
                                                    backgroundColor: "#f59e0b20",
                                                    color: "#f59e0b",
                                                    fontWeight: "bold",
                                                }, size: "small" })) }), _jsx(TableCell, { children: u.is_disabled ? (_jsx(Chip, { label: "Disabled", sx: {
                                                    backgroundColor: "#ef444420",
                                                    color: "#ef4444",
                                                    fontWeight: "bold",
                                                }, size: "small" })) : (_jsx(Chip, { label: "Active", sx: {
                                                    backgroundColor: "#3b82f620",
                                                    color: "#3b82f6",
                                                    fontWeight: "bold",
                                                }, size: "small" })) }), _jsx(TableCell, { sx: { color: "#9ca3af" }, children: new Date(u.created_at).toLocaleString() }), _jsxs(TableCell, { align: "center", children: [_jsx(IconButton, { sx: { color: "#3b82f6" }, onClick: () => navigate(`/users/${u.id}`), children: _jsx(VisibilityIcon, {}) }), _jsx(IconButton, { sx: { color: u.is_disabled ? "#22c55e" : "#ef4444" }, onClick: () => setConfirmUser(u), children: u.is_disabled ? _jsx(CheckCircleIcon, {}) : _jsx(BlockIcon, {}) })] })] }, u.id))) })] }) })), _jsxs(Dialog, { open: !!confirmUser, onClose: () => setConfirmUser(null), PaperProps: {
                        sx: {
                            backgroundColor: "#0f0f0f",
                            color: "#fff",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 2,
                        },
                    }, children: [_jsx(DialogTitle, { children: confirmUser?.is_disabled ? "Enable User" : "Disable User" }), _jsx(DialogContent, { children: _jsxs(DialogContentText, { sx: { color: "#9ca3af" }, children: ["Are you sure you want to", " ", confirmUser?.is_disabled ? "enable" : "disable", " ", _jsx("strong", { children: confirmUser?.email }), "?"] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setConfirmUser(null), sx: { color: "#9ca3af" }, children: "Cancel" }), _jsx(Button, { sx: {
                                        color: "#fff",
                                        backgroundColor: confirmUser?.is_disabled ? "#22c55e" : "#ef4444",
                                        "&:hover": {
                                            backgroundColor: confirmUser?.is_disabled ? "#16a34a" : "#dc2626",
                                        },
                                    }, onClick: () => confirmUser && handleToggle(confirmUser), children: confirmUser?.is_disabled ? "Enable" : "Disable" })] })] }), _jsx(Snackbar, { open: snackbar.open, autoHideDuration: 2000, onClose: () => setSnackbar({ ...snackbar, open: false }), children: _jsx(Alert, { severity: snackbar.severity, sx: { width: "100%" }, children: snackbar.message }) })] }) }));
}
export default Users;
