import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate } from "react-router-dom";
import { isLoggedIn } from "../utils/auth";
function PublicRoute({ children }) {
    if (isLoggedIn()) {
        return _jsx(Navigate, { to: "/dashboard", replace: true });
    }
    return _jsx(_Fragment, { children: children });
}
export default PublicRoute;
