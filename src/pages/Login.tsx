// src/pages/Login.tsx
import React, { useState } from "react";
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  Snackbar,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { API } from "../api";

function Login() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const navigate = useNavigate();

  const isValidEmail = (e: string) => /\S+@\S+\.\S+/.test(e);

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
    } catch (err: any) {
      console.error("Send OTP failed:", err?.response?.data || err?.message || err);
      setSnack({
        open: true,
        message: err?.response?.data?.message || "Failed to send OTP",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    // Full viewport wrapper that forces the page background to match your Users/NewsDetails pattern
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#0f1724", // page background — change if you want exact navy/other
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        pt: { xs: 8, md: 12 },
      }}
    >
      <Container maxWidth="sm">
        <Paper
          sx={{
            p: 2,
            backgroundColor: "#0f0f0f", // card background — same as Users component
            color: "#fff",
            borderRadius: 3,
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.7)",
            overflow: "hidden",
          }}
        >
          <Typography variant="h5" sx={{ color: "#fff", fontWeight: 700, mb: 0.5 }}>
            Login
          </Typography>
          <Typography variant="body2" sx={{ color: "#9ca3af", mb: 2 }}>
            Enter your email and we'll send a one-time code to sign you in.
          </Typography>

          <TextField
            fullWidth
            label="Email"
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendOtp();
            }}
            InputLabelProps={{
              sx: { color: "#9ca3af" },
            }}
            inputProps={{
              "aria-label": "email",
              style: { color: "#e5e7eb" },
            }}
            variant="outlined"
            sx={{
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
            }}
          />

          <Button
            fullWidth
            variant="contained"
            onClick={sendOtp}
            disabled={loading || !email}
            sx={{
              mt: 2,
              py: 1.25,
              textTransform: "none",
              borderRadius: 2,
              backgroundColor: "#111827",
              "&:hover": { backgroundColor: "#0b1220" },
            }}
          >
            {loading ? "Sending..." : "Send OTP"}
          </Button>

          <Box sx={{ mt: 3, display: "flex", gap: 1, justifyContent: "space-between", color: "#9ca3af" }}>
            <Typography variant="caption">Trouble logging in? Contact support.</Typography>
            <Typography variant="caption">We will never share your email.</Typography>
          </Box>
        </Paper>

        <Snackbar
          open={snack.open}
          autoHideDuration={4000}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert onClose={() => setSnack((s) => ({ ...s, open: false }))} severity={snack.severity} sx={{ width: "100%" }}>
            {snack.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}

export default Login;
