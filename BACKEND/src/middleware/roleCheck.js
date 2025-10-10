import { ApiError } from "../utils/ApiError.js";

export const isAdmin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        throw new ApiError(403, "Access denied. Admin privileges required.");
    }
};

export const isStaff = (req, res, next) => {
    if (req.user && (req.user.isStaff || req.user.isAdmin)) {
        next();
    } else {
        throw new ApiError(403, "Access denied. Staff privileges required.");
    }
};

export const isUser = (req, res, next) => {
    if (req.user && !req.user.isStaff && !req.user.isAdmin) {
        next();
    } else {
        throw new ApiError(403, "Access denied. User access only.");
    }
};