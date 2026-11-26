export const getFrontendUrl = (): string =>
    process.env.FRONTEND_URL ?? 'http://localhost:5173';

export const getFrontendOrigin = (): string =>
    new URL(getFrontendUrl()).origin;
