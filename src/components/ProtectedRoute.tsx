import React from "react";
import { Navigate } from "react-router-dom";
import { isLoggedIn } from "../utils/auth";

interface Props {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: Props) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default ProtectedRoute;
