import { Router } from 'express';
import * as studentsController from '../controllers/students.js';
import asyncHandler from '../middleware/async-handler.js';
import { isAuthenticated } from '../middleware/authenticate.js';
import { saveStudent } from '../middleware/validate.js';

const router = Router();

router.get('/', asyncHandler(studentsController.getAll));
router.get('/:id', asyncHandler(studentsController.getSingle));
router.post('/', isAuthenticated, saveStudent, asyncHandler(studentsController.createStudent));
router.put('/:id', isAuthenticated, saveStudent, asyncHandler(studentsController.updateStudent));
router.delete('/:id', isAuthenticated, asyncHandler(studentsController.deleteStudent));

export default router;
