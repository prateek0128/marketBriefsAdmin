// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  GlobalStyles,
} from "@mui/material";
import { BrowserRouter } from "react-router-dom";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#0f1724", // page background (outside cards)
      paper: "#0f0f0f", // card background (Papers)
    },
    primary: { main: "#3b82f6" },
    secondary: { main: "#f59e0b" },
    text: { primary: "#e5e7eb", secondary: "#9ca3af" },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#0f0f0f",
          color: "#fff",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 12,
          boxShadow: "0 4px 16px rgba(0,0,0,0.7)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 10,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: "rgba(255,255,255,0.1)",
        },
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ThemeProvider theme={darkTheme}>
    {/* CssBaseline sets basic resets and uses theme.palette.background.default for body,
        but GlobalStyles here ensures body background is forced even if app CSS tries to override it. */}
    <CssBaseline />
    <GlobalStyles
      styles={(theme) => ({
        "html, body, #root": {
          height: "100%",
          backgroundColor: theme.palette.background.default,
        },
        body: {
          margin: 0,
          // ensure no background-image / background-color from external CSS wins
          backgroundImage: "none !important",
          backgroundRepeat: "no-repeat !important",
          backgroundAttachment: "fixed !important",
        },
      })}
    />
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ThemeProvider>
);
