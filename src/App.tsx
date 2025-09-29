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
import Scraper from "./pages/Scraper"; // <-- added
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";

function App() {
  return (
    <Routes>
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" />} />

      {/* Public */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/verify"
        element={
          <PublicRoute>
            <VerifyOtp />
          </PublicRoute>
        }
      />

      {/* Protected */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <Users />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users/:id"
        element={
          <ProtectedRoute>
            <UserDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users/:id/edit"
        element={
          <ProtectedRoute>
            <UserEdit />
          </ProtectedRoute>
        }
      />

      {/* News */}
      <Route
        path="/news"
        element={
          <ProtectedRoute>
            <News />
          </ProtectedRoute>
        }
      />
      <Route
        path="/news/:id"
        element={
          <ProtectedRoute>
            <NewsDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/news/:id/edit"
        element={
          <ProtectedRoute>
            <NewsEdit open={false} item={null} onClose={function (): void {
              throw new Error("Function not implemented.");
            } } />
          </ProtectedRoute>
        }
      />

      {/* Scraper */}
      <Route
        path="/scraper"
        element={
          <ProtectedRoute>
            <Scraper />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
