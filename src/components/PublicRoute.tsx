import React from "react";
import { Navigate } from "react-router-dom";
import { isLoggedIn } from "../utils/auth";

interface Props {
  children: React.ReactNode;
}

function PublicRoute({ children }: Props) {
  if (isLoggedIn()) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

export default PublicRoute;
