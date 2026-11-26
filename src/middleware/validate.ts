import type { RequestHandler } from 'express';
import Validator from 'validatorjs';

const validateBody = (rules: Validator.Rules): RequestHandler =>
    (req, res, next) => {
        const validation = new Validator(req.body ?? {}, rules);
        if (!validation.check()) {
            res.status(412).send({
                success: false,
                message: 'Validation failed',
                data: validation.errors.all()
            });
            return;
        }
        next();
    };

export const saveStudent = validateBody({
    fname: 'required|string',
    lname: 'required|string',
    email: 'required|email',
    major: 'required|string',
    gender: 'required|string',
    city: 'required|string',
    state: 'required|string',
    birthdate: 'string'
});

export const saveDepartment = validateBody({
    department: 'required|string',
    deptCode: 'required|string'
});

export const saveCourse = validateBody({
    deptCode: 'required|string',
    courseNum: 'required|string',
    courseName: 'required|string'
});
