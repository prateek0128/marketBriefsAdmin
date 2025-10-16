// src/theme.ts
import { createTheme } from "@mui/material/styles";
const theme = createTheme({
    palette: {
        mode: "dark",
        background: {
            // page background (the area outside Paper / containers)
            default: "#0f1724", // matches the wrapper we used earlier
            // Paper / Card background
            paper: "#0f0f0f", // matches your card color used in Users/NewsDetails
        },
        text: {
            primary: "#e5e7eb",
            secondary: "#9ca3af",
        },
        // keep your primary/secondary colors if you have them — example:
        primary: {
            main: "#3b82f6",
            contrastText: "#fff",
        },
        secondary: {
            main: "#9ca3af",
        },
    },
    components: {
        MuiPaper: {
            styleOverrides: {
                root: {
                    // subtle default paper border/shadow to match your existing look
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 12,
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
    },
});
export default theme;
