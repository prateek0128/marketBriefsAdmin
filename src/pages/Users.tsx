import React, { useEffect, useState } from "react";
import {
  Container,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Typography,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Snackbar,
  Alert,
  Skeleton,
  Box,
} from "@mui/material";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useNavigate } from "react-router-dom";
import { API } from "../api";
import DashboardLayout from "../layouts/DashboardLayout";

interface User {
  id: string;
  name: string;
  email: string;
  onboarding_completed: boolean;
  created_at: string;
  is_disabled: boolean;
}

function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmUser, setConfirmUser] = useState<User | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

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

  const handleToggle = async (user: User) => {
    try {
      const payload = { disable: !user.is_disabled };
      const res = await API.put(`/admin/users/${user.id}/disable`, payload);
      const updatedStatus = res.data.data.is_disabled;

      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, is_disabled: updatedStatus } : u
        )
      );

      setSnackbar({
        open: true,
        message: `User ${updatedStatus ? "disabled" : "enabled"} successfully`,
        severity: "success",
      });
    } catch (err: any) {
      console.error("❌ Toggle user failed:", err.response?.data || err.message);
      setSnackbar({
        open: true,
        message: "Failed to update user",
        severity: "error",
      });
    } finally {
      setConfirmUser(null);
    }
  };

  const TableShell: React.FC = () => (
    <Paper
      sx={{
        p: 2,
        backgroundColor: "#0f0f0f",
        color: "#fff",
        borderRadius: 3,
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.7)",
        overflow: "hidden",
      }}
    >
      <Table
        sx={{
          backgroundColor: "#0f0f0f",
          "& th, & td": { borderColor: "rgba(255,255,255,0.1)" },
        }}
      >
        <TableHead>
          <TableRow>
            {["Name", "Email", "Onboarding", "Status", "Created", "Actions"].map(
              (head) => (
                <TableCell key={head} sx={{ color: "#9ca3af", fontWeight: "bold" }}>
                  {head}
                </TableCell>
              )
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.from({ length: 6 }).map((_, idx) => (
            <TableRow key={idx}>
              <TableCell>
                <Skeleton
                  variant="text"
                  width="60%"
                  sx={{ bgcolor: "rgba(255,255,255,0.08)" }}
                />
              </TableCell>
              <TableCell>
                <Skeleton
                  variant="text"
                  width="80%"
                  sx={{ bgcolor: "rgba(255,255,255,0.08)" }}
                />
              </TableCell>
              <TableCell>
                <Box sx={{ display: "inline-block", minWidth: 90 }}>
                  <Skeleton
                    variant="rounded"
                    height={26}
                    sx={{ borderRadius: 999, bgcolor: "rgba(255,255,255,0.08)" }}
                  />
                </Box>
              </TableCell>
              <TableCell>
                <Box sx={{ display: "inline-block", minWidth: 80 }}>
                  <Skeleton
                    variant="rounded"
                    height={26}
                    sx={{ borderRadius: 999, bgcolor: "rgba(255,255,255,0.08)" }}
                  />
                </Box>
              </TableCell>
              <TableCell>
                <Skeleton
                  variant="text"
                  width="70%"
                  sx={{ bgcolor: "rgba(255,255,255,0.08)" }}
                />
              </TableCell>
              <TableCell align="center">
                <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                  <Skeleton
                    variant="circular"
                    width={28}
                    height={28}
                    sx={{ bgcolor: "rgba(255,255,255,0.08)" }}
                  />
                  <Skeleton
                    variant="circular"
                    width={28}
                    height={28}
                    sx={{ bgcolor: "rgba(255,255,255,0.08)" }}
                  />
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );

  return (
    <DashboardLayout>
      <Container sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ color: "#fff" }}>
          Users
        </Typography>

        {loading ? (
          <TableShell />
        ) : (
          <Paper
            sx={{
              p: 2,
              backgroundColor: "#0f0f0f", // pure black
              color: "#fff",
              borderRadius: 3,
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.7)",
              overflow: "hidden", // ensure table respects rounded corners
            }}
          >
            <Table
              sx={{
                backgroundColor: "#0f0f0f",
                "& th, & td": { borderColor: "rgba(255,255,255,0.1)" },
              }}
            >
              <TableHead>
                <TableRow>
                  {["Name", "Email", "Onboarding", "Status", "Created", "Actions"].map(
                    (head) => (
                      <TableCell
                        key={head}
                        sx={{ color: "#9ca3af", fontWeight: "bold" }}
                      >
                        {head}
                      </TableCell>
                    )
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => (
                  <TableRow
                    key={u.id}
                    sx={{
                      backgroundColor: u.is_disabled
                        ? "rgba(239,68,68,0.08)"
                        : "transparent",
                      "&:hover": { backgroundColor: "rgba(255,255,255,0.05)" },
                      transition: "background-color 0.2s ease",
                    }}
                  >
                    <TableCell sx={{ color: "#fff" }}>{u.name}</TableCell>
                    <TableCell sx={{ color: "#9ca3af" }}>{u.email}</TableCell>
                    <TableCell>
                      {u.onboarding_completed ? (
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
                      )}
                    </TableCell>
                    <TableCell>
                      {u.is_disabled ? (
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
                      )}
                    </TableCell>
                    <TableCell sx={{ color: "#9ca3af" }}>
                      {new Date(u.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        sx={{ color: "#3b82f6" }}
                        onClick={() => navigate(`/users/${u.id}`)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton
                        sx={{ color: u.is_disabled ? "#22c55e" : "#ef4444" }}
                        onClick={() => setConfirmUser(u)}
                      >
                        {u.is_disabled ? <CheckCircleIcon /> : <BlockIcon />}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}

        {/* Confirm Dialog */}
        <Dialog
          open={!!confirmUser}
          onClose={() => setConfirmUser(null)}
          PaperProps={{
            sx: {
              backgroundColor: "#0f0f0f",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 2,
            },
          }}
        >
          <DialogTitle>
            {confirmUser?.is_disabled ? "Enable User" : "Disable User"}
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ color: "#9ca3af" }}>
              Are you sure you want to{" "}
              {confirmUser?.is_disabled ? "enable" : "disable"}{" "}
              <strong>{confirmUser?.email}</strong>?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmUser(null)} sx={{ color: "#9ca3af" }}>
              Cancel
            </Button>
            <Button
              sx={{
                color: "#fff",
                backgroundColor: confirmUser?.is_disabled ? "#22c55e" : "#ef4444",
                "&:hover": {
                  backgroundColor: confirmUser?.is_disabled ? "#16a34a" : "#dc2626",
                },
              }}
              onClick={() => confirmUser && handleToggle(confirmUser)}
            >
              {confirmUser?.is_disabled ? "Enable" : "Disable"}
            </Button>
          </DialogActions>
        </Dialog>

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

export default Users;
