import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Paper,
  CircularProgress,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Chip,
  Box,
  FormControlLabel,
  Switch,
  Snackbar,
  Alert,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { API } from "../api";
import DashboardLayout from "../layouts/DashboardLayout";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  experience_level: string;
  onboarding_completed: boolean;
  created_at: string;
  is_disabled: boolean;
  interests: string[];
  version: string;
}

const INTEREST_OPTIONS = ["Stocks", "Startups", "Mutual Funds", "Crypto", "Economy"];
const VERSION_OPTIONS = ["Free", "Premium"];
const EXPERIENCE_OPTIONS = ["novice", "beginner", "intermediate", "expert"];

function UserEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  useEffect(() => {
    if (!id) return;

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
    if (!user) return;
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
    } catch (err: any) {
      console.error("❌ Update user failed:", err.response?.data || err.message);
      setSnackbar({ open: true, message: "Failed to update user", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <Container sx={{ mt: 4 }}>
        <Button
          variant="outlined"
          onClick={() => navigate(-1)}
          sx={{
            mb: 2,
            color: "#9ca3af",
            borderColor: "rgba(255,255,255,0.2)",
            "&:hover": { borderColor: "#fff", color: "#fff" },
          }}
        >
          ← Back
        </Button>

        {loading ? (
          <CircularProgress sx={{ mt: 4, color: "#3b82f6" }} />
        ) : user ? (
          <Paper
            sx={{
              p: 4,
              mt: 2,
              borderRadius: 3,
              backgroundColor: "#0f0f0f",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.7)",
            }}
          >
            <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold" }}>
              ✏️ Edit User
            </Typography>

            {/* Name */}
            <TextField
              fullWidth
              margin="normal"
              label="Name"
              value={user.name}
              onChange={(e) => setUser({ ...user, name: e.target.value })}
              sx={{
                input: { color: "#fff" },
                label: { color: "#9ca3af" },
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                  "&:hover fieldset": { borderColor: "#3b82f6" },
                },
              }}
            />

            {/* Email */}
            <TextField
              fullWidth
              margin="normal"
              label="Email"
              value={user.email}
              onChange={(e) => setUser({ ...user, email: e.target.value })}
              sx={{
                input: { color: "#fff" },
                label: { color: "#9ca3af" },
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                  "&:hover fieldset": { borderColor: "#3b82f6" },
                },
              }}
            />

            {/* Phone */}
            <TextField
              fullWidth
              margin="normal"
              label="Phone"
              value={user.phone}
              onChange={(e) => setUser({ ...user, phone: e.target.value })}
              sx={{
                input: { color: "#fff" },
                label: { color: "#9ca3af" },
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                  "&:hover fieldset": { borderColor: "#3b82f6" },
                },
              }}
            />

            {/* Experience Level */}
            <FormControl fullWidth margin="normal">
              <InputLabel sx={{ color: "#9ca3af" }}>Experience Level</InputLabel>
              <Select
                value={user.experience_level || ""}
                onChange={(e) => setUser({ ...user, experience_level: e.target.value.toLowerCase() })}
                input={<OutlinedInput label="Experience Level" />}
                sx={{
                  color: "#fff",
                  ".MuiSvgIcon-root": { color: "#9ca3af" },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(255,255,255,0.2)",
                  },
                }}
              >
                {EXPERIENCE_OPTIONS.map((level) => (
                  <MenuItem key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Interests */}
            <FormControl fullWidth margin="normal">
              <InputLabel sx={{ color: "#9ca3af" }}>Interests</InputLabel>
              <Select
                multiple
                value={user.interests || []}
                onChange={(e) =>
                  setUser({
                    ...user,
                    interests:
                      typeof e.target.value === "string"
                        ? e.target.value.split(",")
                        : e.target.value,
                  })
                }
                input={<OutlinedInput label="Interests" />}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {(selected as string[]).map((value) => (
                      <Chip
                        key={value}
                        label={value}
                        sx={{
                          backgroundColor: "#3b82f620",
                          color: "#3b82f6",
                          border: "1px solid #3b82f6",
                        }}
                      />
                    ))}
                  </Box>
                )}
                sx={{
                  color: "#fff",
                  ".MuiSvgIcon-root": { color: "#9ca3af" },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(255,255,255,0.2)",
                  },
                }}
              >
                {INTEREST_OPTIONS.map((interest) => (
                  <MenuItem key={interest} value={interest}>
                    {interest}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Version */}
            <FormControl fullWidth margin="normal">
              <InputLabel sx={{ color: "#9ca3af" }}>Version</InputLabel>
              <Select
                value={user.version ? user.version.charAt(0).toUpperCase() + user.version.slice(1) : ""}
                onChange={(e) => setUser({ ...user, version: e.target.value.toLowerCase() })}
                input={<OutlinedInput label="Version" />}
                sx={{
                  color: "#fff",
                  ".MuiSvgIcon-root": { color: "#9ca3af" },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(255,255,255,0.2)",
                  },
                }}
              >
                {VERSION_OPTIONS.map((ver) => (
                  <MenuItem key={ver} value={ver}>
                    {ver}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Switches */}
            <FormControlLabel
              control={
                <Switch
                  checked={user.onboarding_completed}
                  onChange={(e) => setUser({ ...user, onboarding_completed: e.target.checked })}
                  sx={{ color: "#3b82f6" }}
                />
              }
              label="Onboarding Completed"
              sx={{ color: "#fff" }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={user.is_disabled}
                  onChange={(e) => setUser({ ...user, is_disabled: e.target.checked })}
                  sx={{ color: "#ef4444" }}
                />
              }
              label="Disabled"
              sx={{ color: "#fff" }}
            />

            {/* Save Button */}
            <Button
              variant="contained"
              sx={{
                mt: 3,
                backgroundColor: "#3b82f6",
                fontWeight: "bold",
                textTransform: "none",
                "&:hover": { backgroundColor: "#2563eb" },
              }}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </Paper>
        ) : (
          <Typography variant="h6" sx={{ mt: 4, color: "#9ca3af" }}>
            User not found
          </Typography>
        )}

        <Snackbar
          open={snackbar.open}
          autoHideDuration={2000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </DashboardLayout>
  );
}

export default UserEdit;
