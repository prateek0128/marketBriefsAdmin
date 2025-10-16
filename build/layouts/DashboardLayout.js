import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box } from "@mui/material";
import Sidebar from "../components/Sidebar";
function DashboardLayout({ children }) {
    return (_jsxs(Box, { sx: { display: "flex", minHeight: "100vh", backgroundColor: "#0a0a0a" }, children: [_jsx(Sidebar, {}), _jsx(Box, { component: "main", sx: {
                    flexGrow: 1,
                    p: 3,
                    backgroundColor: "#0a0a0a", // 🔥 pure dark background
                    color: "#fff",
                }, children: children })] }));
}
export default DashboardLayout;
