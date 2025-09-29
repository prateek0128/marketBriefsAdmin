import { useEffect, useState } from "react";
import { Typography, Paper, CircularProgress, Box } from "@mui/material";
import { API } from "../api";
import DashboardLayout from "../layouts/DashboardLayout";

interface User {
  id: string;
  name: string;
  email: string;
  onboarding_completed: boolean;
}

function Dashboard() {
  const [stats, setStats] = useState<{
    total: number;
    completed: number;
    pending: number;
  } | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/admin/users")
      .then((res) => {
        const users: User[] = res.data.data.users || [];
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

  return (
    <DashboardLayout>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ color: "#fff", fontWeight: "bold", mb: 3 }}
      >
        Dashboard
      </Typography>

      {loading ? (
        <CircularProgress sx={{ color: "#10a37f" }} />
      ) : (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 3,
            mt: 2,
          }}
        >
          {/* Total Users */}
          <Box sx={{ flex: "1 1 300px", minWidth: "300px" }}>
            <Paper
              sx={{
                p: 3,
                textAlign: "center",
                backgroundColor: "#1e1e1e", // GPT dark gray
                color: "#fff",
                borderRadius: 3,
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.6)",
              }}
            >
              <Typography variant="h6" sx={{ color: "#9ca3af" }}>
                Total Users
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: "bold", color: "#10a37f" }}>
                {stats?.total}
              </Typography>
            </Paper>
          </Box>

          {/* Completed */}
          <Box sx={{ flex: "1 1 300px", minWidth: "300px" }}>
            <Paper
              sx={{
                p: 3,
                textAlign: "center",
                backgroundColor: "#1e1e1e",
                color: "#fff",
                borderRadius: 3,
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.6)",
              }}
            >
              <Typography variant="h6" sx={{ color: "#9ca3af" }}>
                Onboarding Completed
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: "bold", color: "#22c55e" }}>
                {stats?.completed}
              </Typography>
            </Paper>
          </Box>

          {/* Pending */}
          <Box sx={{ flex: "1 1 300px", minWidth: "300px" }}>
            <Paper
              sx={{
                p: 3,
                textAlign: "center",
                backgroundColor: "#1e1e1e",
                color: "#fff",
                borderRadius: 3,
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.6)",
              }}
            >
              <Typography variant="h6" sx={{ color: "#9ca3af" }}>
                Onboarding Pending
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: "bold", color: "#f59e0b" }}>
                {stats?.pending}
              </Typography>
            </Paper>
          </Box>
        </Box>
      )}
    </DashboardLayout>
  );
}

export default Dashboard;
