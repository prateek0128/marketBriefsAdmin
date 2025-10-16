import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Container, Typography, Paper, CircularProgress, TextField, Button, FormControl, InputLabel, Select, MenuItem, OutlinedInput, Chip, Box, FormControlLabel, Switch, Snackbar, Alert, } from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { API } from "../api";
import DashboardLayout from "../layouts/DashboardLayout";
const INTEREST_OPTIONS = ["Stocks", "Startups", "Mutual Funds", "Crypto", "Economy"];
const VERSION_OPTIONS = ["Free", "Premium"];
const EXPERIENCE_OPTIONS = ["novice", "beginner", "intermediate", "expert"];
function UserEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
    useEffect(() => {
        if (!id)
            return;
        API.get(`/admin/users/${id}`)
            .then((res) => {
            setUser(res.data.data);
            setLoading(false);
        })
            .catch((err) => {
            console.error("❌ Fetch user failed:", err.response?.data || err.message);
            setLoading(false);
        });
    }, [id]);
    const handleSave = async () => {
        if (!user)
            return;
        setSaving(true);
        try {
            await API.put(`/admin/users/${user.id}`, {
                name: user.name,
                email: user.email,
                phone: user.phone,
                experience_level: user.experience_level.toLowerCase(),
                interests: user.interests,
                onboarding_completed: user.onboarding_completed,
                version: user.version.toLowerCase(),
                is_disabled: user.is_disabled,
            });
            setSnackbar({ open: true, message: "User updated successfully", severity: "success" });
            setTimeout(() => navigate(`/users/${user.id}`), 1200);
        }
        catch (err) {
            console.error("❌ Update user failed:", err.response?.data || err.message);
            setSnackbar({ open: true, message: "Failed to update user", severity: "error" });
        }
        finally {
            setSaving(false);
        }
    };
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
                    }, children: [_jsx(Typography, { variant: "h5", gutterBottom: true, sx: { fontWeight: "bold" }, children: "\u270F\uFE0F Edit User" }), _jsx(TextField, { fullWidth: true, margin: "normal", label: "Name", value: user.name, onChange: (e) => setUser({ ...user, name: e.target.value }), sx: {
                                input: { color: "#fff" },
                                label: { color: "#9ca3af" },
                                "& .MuiOutlinedInput-root": {
                                    "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                                    "&:hover fieldset": { borderColor: "#3b82f6" },
                                },
                            } }), _jsx(TextField, { fullWidth: true, margin: "normal", label: "Email", value: user.email, onChange: (e) => setUser({ ...user, email: e.target.value }), sx: {
                                input: { color: "#fff" },
                                label: { color: "#9ca3af" },
                                "& .MuiOutlinedInput-root": {
                                    "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                                    "&:hover fieldset": { borderColor: "#3b82f6" },
                                },
                            } }), _jsx(TextField, { fullWidth: true, margin: "normal", label: "Phone", value: user.phone, onChange: (e) => setUser({ ...user, phone: e.target.value }), sx: {
                                input: { color: "#fff" },
                                label: { color: "#9ca3af" },
                                "& .MuiOutlinedInput-root": {
                                    "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                                    "&:hover fieldset": { borderColor: "#3b82f6" },
                                },
                            } }), _jsxs(FormControl, { fullWidth: true, margin: "normal", children: [_jsx(InputLabel, { sx: { color: "#9ca3af" }, children: "Experience Level" }), _jsx(Select, { value: user.experience_level || "", onChange: (e) => setUser({ ...user, experience_level: e.target.value.toLowerCase() }), input: _jsx(OutlinedInput, { label: "Experience Level" }), sx: {
                                        color: "#fff",
                                        ".MuiSvgIcon-root": { color: "#9ca3af" },
                                        "& .MuiOutlinedInput-notchedOutline": {
                                            borderColor: "rgba(255,255,255,0.2)",
                                        },
                                    }, children: EXPERIENCE_OPTIONS.map((level) => (_jsx(MenuItem, { value: level, children: level.charAt(0).toUpperCase() + level.slice(1) }, level))) })] }), _jsxs(FormControl, { fullWidth: true, margin: "normal", children: [_jsx(InputLabel, { sx: { color: "#9ca3af" }, children: "Interests" }), _jsx(Select, { multiple: true, value: user.interests || [], onChange: (e) => setUser({
                                        ...user,
                                        interests: typeof e.target.value === "string"
                                            ? e.target.value.split(",")
                                            : e.target.value,
                                    }), input: _jsx(OutlinedInput, { label: "Interests" }), renderValue: (selected) => (_jsx(Box, { sx: { display: "flex", flexWrap: "wrap", gap: 1 }, children: selected.map((value) => (_jsx(Chip, { label: value, sx: {
                                                backgroundColor: "#3b82f620",
                                                color: "#3b82f6",
                                                border: "1px solid #3b82f6",
                                            } }, value))) })), sx: {
                                        color: "#fff",
                                        ".MuiSvgIcon-root": { color: "#9ca3af" },
                                        "& .MuiOutlinedInput-notchedOutline": {
                                            borderColor: "rgba(255,255,255,0.2)",
                                        },
                                    }, children: INTEREST_OPTIONS.map((interest) => (_jsx(MenuItem, { value: interest, children: interest }, interest))) })] }), _jsxs(FormControl, { fullWidth: true, margin: "normal", children: [_jsx(InputLabel, { sx: { color: "#9ca3af" }, children: "Version" }), _jsx(Select, { value: user.version ? user.version.charAt(0).toUpperCase() + user.version.slice(1) : "", onChange: (e) => setUser({ ...user, version: e.target.value.toLowerCase() }), input: _jsx(OutlinedInput, { label: "Version" }), sx: {
                                        color: "#fff",
                                        ".MuiSvgIcon-root": { color: "#9ca3af" },
                                        "& .MuiOutlinedInput-notchedOutline": {
                                            borderColor: "rgba(255,255,255,0.2)",
                                        },
                                    }, children: VERSION_OPTIONS.map((ver) => (_jsx(MenuItem, { value: ver, children: ver }, ver))) })] }), _jsx(FormControlLabel, { control: _jsx(Switch, { checked: user.onboarding_completed, onChange: (e) => setUser({ ...user, onboarding_completed: e.target.checked }), sx: { color: "#3b82f6" } }), label: "Onboarding Completed", sx: { color: "#fff" } }), _jsx(FormControlLabel, { control: _jsx(Switch, { checked: user.is_disabled, onChange: (e) => setUser({ ...user, is_disabled: e.target.checked }), sx: { color: "#ef4444" } }), label: "Disabled", sx: { color: "#fff" } }), _jsx(Button, { variant: "contained", sx: {
                                mt: 3,
                                backgroundColor: "#3b82f6",
                                fontWeight: "bold",
                                textTransform: "none",
                                "&:hover": { backgroundColor: "#2563eb" },
                            }, onClick: handleSave, disabled: saving, children: saving ? "Saving..." : "Save Changes" })] })) : (_jsx(Typography, { variant: "h6", sx: { mt: 4, color: "#9ca3af" }, children: "User not found" })), _jsx(Snackbar, { open: snackbar.open, autoHideDuration: 2000, onClose: () => setSnackbar({ ...snackbar, open: false }), children: _jsx(Alert, { severity: snackbar.severity, sx: { width: "100%" }, children: snackbar.message }) })] }) }));
}
export default UserEdit;
