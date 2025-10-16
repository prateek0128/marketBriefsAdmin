import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Container, TextField, Button, Typography, Paper, Snackbar, Alert, } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { API } from "../api";
import { login } from "../utils/auth"; // central auth utils
function VerifyOtp() {
    const location = useLocation();
    const navigate = useNavigate();
    // Require email from state; if missing, kick back to login
    const email = location.state?.email;
    useEffect(() => {
        if (!email) {
            navigate("/login");
        }
    }, [email, navigate]);
    const [otp, setOtp] = useState("");
    const [timeLeft, setTimeLeft] = useState(600); // 10 min window
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });
    // countdown timer
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);
    const verifyOtp = async () => {
        if (!otp || !email)
            return;
        setLoading(true);
        try {
            const payload = {
                identifier: email,
                identifier_type: "email",
                otp,
                name: "Admin", // static, backend should verify real user anyway
            };
            console.log("➡️ Verify OTP request payload:", payload);
            const res = await API.post("/auth/verify-otp", payload);
            const { access_token, refresh_token, expires_in } = res.data.data;
            if (!access_token) {
                throw new Error("No access token returned from server");
            }
            // Save tokens + expiry centrally
            login(access_token, expires_in);
            if (refresh_token) {
                localStorage.setItem("refresh_token", refresh_token);
            }
            console.log("📦 Stored tokens securely");
            setSnackbar({
                open: true,
                message: "Login successful",
                severity: "success",
            });
            setTimeout(() => navigate("/dashboard"), 800);
        }
        catch (err) {
            console.error("❌ Verify OTP error:", err.response?.data || err.message);
            setSnackbar({
                open: true,
                message: "Invalid or expired OTP",
                severity: "error",
            });
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs(Container, { maxWidth: "sm", sx: { mt: 10 }, children: [_jsxs(Paper, { sx: { p: 4 }, children: [_jsx(Typography, { variant: "h5", gutterBottom: true, children: "Verify OTP" }), _jsxs(Typography, { children: ["Email: ", email] }), _jsx(Typography, { children: "Name: Admin" }), _jsx(TextField, { fullWidth: true, type: "number", inputProps: { maxLength: 6 }, label: "Enter OTP", margin: "normal", value: otp, onChange: (e) => setOtp(e.target.value.trim()) }), _jsxs(Typography, { children: ["Time left: ", Math.floor(timeLeft / 60), ":", String(timeLeft % 60).padStart(2, "0")] }), _jsx(Button, { fullWidth: true, variant: "contained", color: "primary", onClick: verifyOtp, disabled: loading || !otp || timeLeft === 0, children: loading ? "Verifying..." : "Verify OTP" })] }), _jsx(Snackbar, { open: snackbar.open, autoHideDuration: 2000, onClose: () => setSnackbar({ ...snackbar, open: false }), children: _jsx(Alert, { severity: snackbar.severity, sx: { width: "100%" }, children: snackbar.message }) })] }));
}
export default VerifyOtp;
