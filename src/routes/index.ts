import { Router } from 'express';
import passport from 'passport';
import { getFrontendUrl } from '../config/frontend.js';
import { isGithubOAuthConfigured } from '../config/github-oauth.js';
import courses from './courses.js';
import departments from './departments.js';
import students from './students.js';
import swagger from './swagger.js';

const router = Router();

router.use('/', swagger);
router.use('/students', students);
router.use('/departments', departments);
router.use('/courses', courses);

router.get('/auth/status', (req, res) => {
    res.status(200).json({
        authenticated: Boolean(req.session.user),
        user: req.session.user ?? null,
        githubOAuthConfigured: isGithubOAuthConfigured()
    });
});

router.get('/login', (req, res, next) => {
    if (!isGithubOAuthConfigured()) {
        res.status(503).json({ error: 'GitHub OAuth is not configured.' });
        return;
    }
    passport.authenticate('github')(req, res, next);
});

router.get('/logout', (req, res, next) => {
    req.session.destroy((error) => {
        if (error) {
            next(error);
            return;
        }
        res.clearCookie('connect.sid');
        res.redirect(getFrontendUrl());
    });
});

export default router;
