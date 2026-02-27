import { sendError } from "../utils/responseHandler.js";

const authorizeRoles = (...allowedRoles) => {
  const normalizedRoles = allowedRoles.map((role) => role.toLowerCase());

  return (req, res, next) => {
    const userRole = String(req.user?.role || "").toLowerCase();

    if (!userRole || !normalizedRoles.includes(userRole)) {
      return sendError(res, "Forbidden: insufficient permissions", 403);
    }

    return next();
  };
};

export default authorizeRoles;
