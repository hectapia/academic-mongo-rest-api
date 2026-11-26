import type { RequestHandler } from 'express';

export const isAuthenticated: RequestHandler = (req, res, next) => {
    if (req.session.user === undefined) {
        res.status(401).json('You do not have access.');
        return;
    }
    next();
};
