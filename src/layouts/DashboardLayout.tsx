import React from "react";
import { Box } from "@mui/material";
import Sidebar from "../components/Sidebar";

function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#0a0a0a" }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          backgroundColor: "#0a0a0a", // 🔥 pure dark background
          color: "#fff",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default DashboardLayout;
