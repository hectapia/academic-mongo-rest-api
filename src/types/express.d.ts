import 'express-session';

declare module 'express-session' {
    interface SessionData {
        user?: {
            displayName?: string;
        };
    }
}

declare global {
    namespace Express {
        interface User {
            displayName?: string;
        }
    }
}
