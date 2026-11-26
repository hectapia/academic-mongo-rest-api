import { ObjectId } from 'mongodb';
import type { AsyncRouteHandler } from '../middleware/async-handler.js';
import { getDatabase } from '../data/database.js';
import type { Course, CourseInput } from '../models/course.js';

const getAll: AsyncRouteHandler = async (_req, res) => {
    const courses = await getDatabase()
        .collection<Course>('courses')
        .find()
        .toArray();
    res.status(200).json(courses);
};

const getSingle: AsyncRouteHandler = async (req, res) => {
    const id = req.params.id;
    if (typeof id !== 'string' || !ObjectId.isValid(id)) {
        res.status(400).json('Must use a valid course id to find a course.');
        return;
    }

    const course = await getDatabase()
        .collection<Course>('courses')
        .findOne({ _id: new ObjectId(id) });
    if (!course) {
        res.status(404).json('Course not found.');
        return;
    }
    res.status(200).json(course);
};

const createCourse: AsyncRouteHandler = async (req, res) => {
    const body = req.body as CourseInput;
    const course: CourseInput = {
        deptCode: body.deptCode,
        courseNum: body.courseNum,
        courseName: body.courseName
    };
    const result = await getDatabase()
        .collection<Course>('courses')
        .insertOne(course);
    if (!result.acknowledged) {
        throw new Error('Failed to create course.');
    }
    res.status(204).end();
};

const updateCourse: AsyncRouteHandler = async (req, res) => {
    const id = req.params.id;
    if (typeof id !== 'string' || !ObjectId.isValid(id)) {
        res.status(400).json('Must use a valid course id to update a course.');
        return;
    }

    const body = req.body as CourseInput;
    const course: CourseInput = {
        deptCode: body.deptCode,
        courseNum: body.courseNum,
        courseName: body.courseName
    };
    const result = await getDatabase()
        .collection<Course>('courses')
        .replaceOne({ _id: new ObjectId(id) }, course);
    if (result.matchedCount === 0) {
        res.status(404).json('Course not found.');
        return;
    }
    res.status(204).end();
};

const deleteCourse: AsyncRouteHandler = async (req, res) => {
    const id = req.params.id;
    if (typeof id !== 'string' || !ObjectId.isValid(id)) {
        res.status(400).json('Must use a valid course id to delete a course.');
        return;
    }

    const result = await getDatabase()
        .collection<Course>('courses')
        .deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
        res.status(404).json('Course not found.');
        return;
    }
    res.status(204).end();
};

export {
    createCourse,
    deleteCourse,
    getAll,
    getSingle,
    updateCourse
};
