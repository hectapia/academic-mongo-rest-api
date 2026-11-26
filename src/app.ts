import cors from 'cors';
import express, {
    type ErrorRequestHandler,
    type Express
} from 'express';
import session from 'express-session';
import {
    Strategy as GitHubStrategy,
    type Profile
} from 'passport-github2';
import type OAuth2Strategy from 'passport-oauth2';
import passport from 'passport';
import { isGithubOAuthConfigured } from './config/github-oauth.js';
import { getFrontendOrigin, getFrontendUrl } from './config/frontend.js';
import routes from './routes/index.js';

const verifyGithubUser: OAuth2Strategy.VerifyFunction<Profile> = (
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: OAuth2Strategy.VerifyCallback
) => done(null, profile);

const configurePassport = (): void => {
    if (isGithubOAuthConfigured()) {
        passport.use('github', new GitHubStrategy({
            clientID: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
            callbackURL: process.env.CALLBACK_URL!
        }, verifyGithubUser));
    }

    passport.serializeUser((user, done) => done(null, user));
    passport.deserializeUser<Express.User>((user, done) => done(null, user));
};

export const createApp = (
    sessionSecret = process.env.SESSION_SECRET
): Express => {
    if (!sessionSecret) {
        throw new Error('SESSION_SECRET must be set in the environment.');
    }

    configurePassport();
    const app = express();

    app.use(express.json());
    app.use(session({
        secret: sessionSecret,
        resave: false,
        saveUninitialized: false
    }));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(cors({
        origin: getFrontendOrigin(),
        credentials: true,
        methods: ['POST', 'GET', 'PUT', 'PATCH', 'OPTIONS', 'DELETE'],
        allowedHeaders: [
            'Origin',
            'X-Requested-With',
            'Content-Type',
            'Accept',
            'Z-key',
            'Authorization'
        ]
    }));
    app.use('/', routes);
    app.get('/', (req, res) => {
        const displayName = req.session.user?.displayName;
        res.send(displayName ? `Logged in as ${displayName}` : 'Logged Out');
    });

    if (isGithubOAuthConfigured()) {
        app.get('/github/callback', passport.authenticate('github', {
            failureRedirect: '/api-docs',
            session: false
        }), (req, res) => {
            if (!req.user) {
                res.sendStatus(401);
                return;
            }
            req.session.user = req.user;
            res.redirect(getFrontendUrl());
        });
    }

    const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
        console.error(error);
        if (res.headersSent) {
            next(error);
            return;
        }
        res.status(500).json({ error: 'Internal server error' });
    };
    app.use(errorHandler);

    return app;
};
