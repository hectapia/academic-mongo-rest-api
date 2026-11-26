import { Router } from 'express';
import * as departmentsController from '../controllers/departments.js';
import asyncHandler from '../middleware/async-handler.js';
import { isAuthenticated } from '../middleware/authenticate.js';
import { saveDepartment } from '../middleware/validate.js';

const router = Router();

router.get('/', asyncHandler(departmentsController.getAll));
router.get('/:id', asyncHandler(departmentsController.getSingle));
router.post('/', isAuthenticated, saveDepartment, asyncHandler(departmentsController.createDepartment));
router.put('/:id', isAuthenticated, saveDepartment, asyncHandler(departmentsController.updateDepartment));
router.delete('/:id', isAuthenticated, asyncHandler(departmentsController.deleteDepartment));

export default router;
