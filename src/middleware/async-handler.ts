import type {
    NextFunction,
    Request,
    RequestHandler,
    Response
} from 'express';
import type { ParamsDictionary } from 'express-serve-static-core';

export type AsyncRouteHandler = (
    req: Request<ParamsDictionary>,
    res: Response,
    next: NextFunction
) => Promise<void>;

const asyncHandler = (handler: AsyncRouteHandler): RequestHandler =>
    (req, res, next) => {
        void handler(req, res, next).catch(next);
    };

export default asyncHandler;
