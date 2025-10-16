import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import VerifyOtp from "./pages/VerifyOtp";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import UserDetails from "./pages/UserDetails";
import UserEdit from "./pages/UserEdit";
import News from "./pages/News";
import NewsDetails from "./pages/NewsDetails";
import NewsEdit from "./pages/NewsEdit";
import Scraper from "./pages/Scraper";
import Logs from "./pages/Logs"; // <-- added
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
function App() {
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Navigate, { to: "/login" }) }), _jsx(Route, { path: "/login", element: _jsx(PublicRoute, { children: _jsx(Login, {}) }) }), _jsx(Route, { path: "/verify", element: _jsx(PublicRoute, { children: _jsx(VerifyOtp, {}) }) }), _jsx(Route, { path: "/dashboard", element: _jsx(ProtectedRoute, { children: _jsx(Dashboard, {}) }) }), _jsx(Route, { path: "/users", element: _jsx(ProtectedRoute, { children: _jsx(Users, {}) }) }), _jsx(Route, { path: "/users/:id", element: _jsx(ProtectedRoute, { children: _jsx(UserDetails, {}) }) }), _jsx(Route, { path: "/users/:id/edit", element: _jsx(ProtectedRoute, { children: _jsx(UserEdit, {}) }) }), _jsx(Route, { path: "/news", element: _jsx(ProtectedRoute, { children: _jsx(News, {}) }) }), _jsx(Route, { path: "/news/:id", element: _jsx(ProtectedRoute, { children: _jsx(NewsDetails, {}) }) }), _jsx(Route, { path: "/news/:id/edit", element: _jsx(ProtectedRoute, { children: _jsx(NewsEdit, { open: false, item: null, onClose: function () {
                            throw new Error("Function not implemented.");
                        } }) }) }), _jsx(Route, { path: "/scraper", element: _jsx(ProtectedRoute, { children: _jsx(Scraper, {}) }) }), _jsx(Route, { path: "/logs", element: _jsx(ProtectedRoute, { children: _jsx(Logs, {}) }) })] }));
}
export default App;
