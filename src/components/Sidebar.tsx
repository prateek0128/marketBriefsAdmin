import React, { useState } from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Toolbar,
  Typography,
  Box,
  Tooltip,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import ListAltIcon from "@mui/icons-material/ListAlt";
import BugReportIcon from "@mui/icons-material/BugReport";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import NewspaperIcon from "@mui/icons-material/Newspaper";
import { useNavigate, useLocation } from "react-router-dom";
import { logout } from "../utils/auth";

const drawerWidth = 220;

const COLORS = {
  bg: "#0f0f0f",
  border: "rgba(255,255,255,0.08)",
  text: "#E5E7EB",
  dim: "#A1A1AA",
  activeBg: "rgba(255,255,255,0.08)", // rectangle (not pill) background
  hoverBg: "rgba(255,255,255,0.06)",
};

function Sidebar() {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleDrawer = () => setOpen((v) => !v);

  const items = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    { text: "Users", icon: <PeopleIcon />, path: "/users" },
    { text: "News", icon: <NewspaperIcon />, path: "/news" },
    { text: "Logs", icon: <ListAltIcon />, path: "/logs" },
    { text: "Scraper", icon: <BugReportIcon />, path: "/scraper" },
  ];

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? drawerWidth : 72,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: open ? drawerWidth : 72,
          boxSizing: "border-box",
          backgroundColor: COLORS.bg,
          color: COLORS.text,
          borderRight: `1px solid ${COLORS.border}`,
          transition: "width 0.25s ease",
          display: "flex",
          flexDirection: "column",
          p: 1,
          gap: 1,
        },
      }}
    >
      {/* Header */}
      <Toolbar
        disableGutters
        sx={{
          px: 1,
          minHeight: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: open ? "space-between" : "center",
        }}
      >
        {open ? (
          <Box
            onClick={() => navigate("/dashboard")}
            sx={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer" }}
          >
            <Box
              sx={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                background:
                  "conic-gradient(from 180deg, #10B981, #22C55E, #A7F3D0, #10B981)",
                boxShadow: "0 0 14px rgba(16,185,129,0.35)",
              }}
            />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              MyAdmin
            </Typography>
          </Box>
        ) : (
          <Box
            onClick={() => navigate("/dashboard")}
            sx={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              background:
                "conic-gradient(from 180deg, #10B981, #22C55E, #A7F3D0, #10B981)",
              boxShadow: "0 0 14px rgba(16,185,129,0.35)",
              cursor: "pointer",
            }}
          />
        )}
        <IconButton onClick={toggleDrawer} sx={{ color: COLORS.dim }}>
          <MenuIcon />
        </IconButton>
      </Toolbar>

      {/* Nav */}
      <List sx={{ px: 0.5 }}>
        {items.map((item) => {
          const active = isActive(item.path);
          const Button = (
            <ListItemButton
              onClick={() => navigate(item.path)}
              sx={{
                width: "100%",              // full width => no circle background
                borderRadius: 1.5,          // rectangular with rounded corners
                px: open ? 1 : 0.5,
                py: 1,
                "&:hover": { backgroundColor: COLORS.hoverBg },
                backgroundColor: active ? COLORS.activeBg : "transparent",
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color: active ? COLORS.text : COLORS.dim,
                }}
              >
                {item.icon}
              </ListItemIcon>
              {open && (
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    sx: { color: active ? COLORS.text : COLORS.dim, fontWeight: active ? 600 : 500 },
                  }}
                />
              )}
            </ListItemButton>
          );

          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              {open ? (
                Button
              ) : (
                <Tooltip title={item.text} placement="right">
                  {Button}
                </Tooltip>
              )}
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ flexGrow: 1 }} />

      {/* Logout pinned bottom */}
      <List sx={{ px: 0.5, pb: 1 }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={logoutAndGo}
            sx={{
              width: "100%",
              borderRadius: 1.5,
              "&:hover": { backgroundColor: "rgba(239,68,68,0.10)" },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: "#ef4444" }}>
              <ExitToAppIcon />
            </ListItemIcon>
            {open && (
              <ListItemText
                primary="Logout"
                primaryTypographyProps={{ sx: { color: "#ef4444", fontWeight: 600 } }}
              />
            )}
          </ListItemButton>
        </ListItem>
      </List>
    </Drawer>
  );

  function logoutAndGo() {
    logout();
    navigate("/login");
  }
}

export default Sidebar;
