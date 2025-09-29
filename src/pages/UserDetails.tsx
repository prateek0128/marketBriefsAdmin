import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Paper,
  CircularProgress,
  Chip,
  Divider,
  Button,
  Box,
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
  interests: string[] | null;
  version: string;
}

function UserDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

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

  const renderField = (label: string, value: React.ReactNode) => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" sx={{ color: "#9ca3af", mb: 0.5 }}>
        {label}
      </Typography>
      <Typography>{value}</Typography>
    </Box>
  );

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
            {/* Header Row */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Box>
                <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                  {user.name}
                </Typography>
                <Typography variant="subtitle1" sx={{ color: "#9ca3af" }}>
                  {user.email}
                </Typography>
              </Box>

              <Button
                variant="contained"
                sx={{
                  backgroundColor: "#3b82f6",
                  fontWeight: "bold",
                  textTransform: "none",
                  "&:hover": { backgroundColor: "#2563eb" },
                }}
                onClick={() => navigate(`/users/${user.id}/edit`)}
              >
                ✏️ Edit
              </Button>
            </Box>

            <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.1)" }} />

            {/* Two Column Layout without Grid */}
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 4,
              }}
            >
              {/* Left Column */}
              <Box sx={{ flex: "1 1 300px", minWidth: "300px" }}>
                {renderField("User ID", user.id)}
                {renderField("Phone", user.phone || "N/A")}
                {renderField(
                  "Experience",
                  user.experience_level
                    ? user.experience_level.charAt(0).toUpperCase() +
                        user.experience_level.slice(1)
                    : "N/A"
                )}
                {renderField(
                  "Onboarding",
                  user.onboarding_completed ? (
                    <Chip
                      label="Completed"
                      sx={{
                        backgroundColor: "#22c55e20",
                        color: "#22c55e",
                        fontWeight: "bold",
                      }}
                      size="small"
                    />
                  ) : (
                    <Chip
                      label="Pending"
                      sx={{
                        backgroundColor: "#f59e0b20",
                        color: "#f59e0b",
                        fontWeight: "bold",
                      }}
                      size="small"
                    />
                  )
                )}
              </Box>

              {/* Right Column */}
              <Box sx={{ flex: "1 1 300px", minWidth: "300px" }}>
                {renderField(
                  "Status",
                  user.is_disabled ? (
                    <Chip
                      label="Disabled"
                      sx={{
                        backgroundColor: "#ef444420",
                        color: "#ef4444",
                        fontWeight: "bold",
                      }}
                      size="small"
                    />
                  ) : (
                    <Chip
                      label="Active"
                      sx={{
                        backgroundColor: "#3b82f620",
                        color: "#3b82f6",
                        fontWeight: "bold",
                      }}
                      size="small"
                    />
                  )
                )}
                {renderField(
                  "Version",
                  user.version
                    ? user.version.charAt(0).toUpperCase() + user.version.slice(1)
                    : "N/A"
                )}
                {renderField(
                  "Interests",
                  <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {user.interests && user.interests.length > 0 ? (
                      user.interests.map((interest, i) => (
                        <Chip
                          key={i}
                          label={interest}
                          sx={{
                            backgroundColor: "#3b82f620",
                            color: "#3b82f6",
                            border: "1px solid #3b82f6",
                          }}
                          size="small"
                        />
                      ))
                    ) : (
                      <Typography>N/A</Typography>
                    )}
                  </Box>
                )}
                {renderField("Created At", new Date(user.created_at).toLocaleString())}
              </Box>
            </Box>
          </Paper>
        ) : (
          <Typography variant="h6" sx={{ mt: 4, color: "#9ca3af" }}>
            User not found
          </Typography>
        )}
      </Container>
    </DashboardLayout>
  );
}

export default UserDetails;
