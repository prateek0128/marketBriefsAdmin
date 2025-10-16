import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/pages/Login.tsx
import { useState } from "react";
import { Box, Container, TextField, Button, Typography, Paper, Snackbar, Alert, } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { API } from "../api";
function Login() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [snack, setSnack] = useState({
        open: false,
        message: "",
        severity: "success",
    });
    const navigate = useNavigate();
    const isValidEmail = (e) => /\S+@\S+\.\S+/.test(e);
    const sendOtp = async () => {
        if (!email) {
            setSnack({ open: true, message: "Please enter an email", severity: "error" });
            return;
        }
        if (!isValidEmail(email)) {
            setSnack({ open: true, message: "Please enter a valid email", severity: "error" });
            return;
        }
        setLoading(true);
        try {
            const res = await API.post("/auth/send-otp", {
                identifier: email,
                identifier_type: "email",
            });
            console.log("Send OTP Response:", res.data);
            setSnack({ open: true, message: "OTP sent — check your email", severity: "success" });
            navigate("/verify", { state: { email } });
        }
        catch (err) {
            console.error("Send OTP failed:", err?.response?.data || err?.message || err);
            setSnack({
                open: true,
                message: err?.response?.data?.message || "Failed to send OTP",
                severity: "error",
            });
        }
        finally {
            setLoading(false);
        }
    };
    return (
    // Full viewport wrapper that forces the page background to match your Users/NewsDetails pattern
    _jsx(Box, { sx: {
            minHeight: "100vh",
            backgroundColor: "#0f1724", // page background — change if you want exact navy/other
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            pt: { xs: 8, md: 12 },
        }, children: _jsxs(Container, { maxWidth: "sm", children: [_jsxs(Paper, { sx: {
                        p: 2,
                        backgroundColor: "#0f0f0f", // card background — same as Users component
                        color: "#fff",
                        borderRadius: 3,
                        border: "1px solid rgba(255,255,255,0.1)",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.7)",
                        overflow: "hidden",
                    }, children: [_jsx(Typography, { variant: "h5", sx: { color: "#fff", fontWeight: 700, mb: 0.5 }, children: "Login" }), _jsx(Typography, { variant: "body2", sx: { color: "#9ca3af", mb: 2 }, children: "Enter your email and we'll send a one-time code to sign you in." }), _jsx(TextField, { fullWidth: true, label: "Email", margin: "normal", value: email, onChange: (e) => setEmail(e.target.value), onKeyDown: (e) => {
                                if (e.key === "Enter")
                                    sendOtp();
                            }, InputLabelProps: {
                                sx: { color: "#9ca3af" },
                            }, inputProps: {
                                "aria-label": "email",
                                style: { color: "#e5e7eb" },
                            }, variant: "outlined", sx: {
                                "& .MuiOutlinedInput-root": {
                                    backgroundColor: "#080808",
                                    borderRadius: 1,
                                    "& fieldset": {
                                        borderColor: "rgba(255,255,255,0.1)",
                                    },
                                    "&:hover fieldset": {
                                        borderColor: "rgba(255,255,255,0.14)",
                                    },
                                },
                                "& .MuiFormHelperText-root": { color: "#9ca3af" },
                                mt: 1,
                            } }), _jsx(Button, { fullWidth: true, variant: "contained", onClick: sendOtp, disabled: loading || !email, sx: {
                                mt: 2,
                                py: 1.25,
                                textTransform: "none",
                                borderRadius: 2,
                                backgroundColor: "#111827",
                                "&:hover": { backgroundColor: "#0b1220" },
                            }, children: loading ? "Sending..." : "Send OTP" }), _jsxs(Box, { sx: { mt: 3, display: "flex", gap: 1, justifyContent: "space-between", color: "#9ca3af" }, children: [_jsx(Typography, { variant: "caption", children: "Trouble logging in? Contact support." }), _jsx(Typography, { variant: "caption", children: "We will never share your email." })] })] }), _jsx(Snackbar, { open: snack.open, autoHideDuration: 4000, onClose: () => setSnack((s) => ({ ...s, open: false })), anchorOrigin: { vertical: "bottom", horizontal: "center" }, children: _jsx(Alert, { onClose: () => setSnack((s) => ({ ...s, open: false })), severity: snack.severity, sx: { width: "100%" }, children: snack.message }) })] }) }));
}
export default Login;
