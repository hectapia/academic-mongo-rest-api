import { Router } from 'express';
import * as coursesController from '../controllers/courses.js';
import asyncHandler from '../middleware/async-handler.js';
import { isAuthenticated } from '../middleware/authenticate.js';
import { saveCourse } from '../middleware/validate.js';

const router = Router();

router.get('/', asyncHandler(coursesController.getAll));
router.get('/:id', asyncHandler(coursesController.getSingle));
router.post('/', isAuthenticated, saveCourse, asyncHandler(coursesController.createCourse));
router.put('/:id', isAuthenticated, saveCourse, asyncHandler(coursesController.updateCourse));
router.delete('/:id', isAuthenticated, asyncHandler(coursesController.deleteCourse));

export default router;
