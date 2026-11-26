export const isGithubOAuthConfigured = (): boolean =>
    Boolean(
        process.env.GITHUB_CLIENT_ID &&
        process.env.GITHUB_CLIENT_SECRET &&
        process.env.CALLBACK_URL
    );
