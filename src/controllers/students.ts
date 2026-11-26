import { ObjectId } from 'mongodb';
import type { AsyncRouteHandler } from '../middleware/async-handler.js';
import { getDatabase } from '../data/database.js';
import type { Student, StudentInput } from '../models/student.js';

const getAll: AsyncRouteHandler = async (_req, res) => {
    const students = await getDatabase()
        .collection<Student>('students')
        .find()
        .toArray();
    res.status(200).json(students);
};

const getSingle: AsyncRouteHandler = async (req, res) => {
    const id = req.params.id;
    if (typeof id !== 'string' || !ObjectId.isValid(id)) {
        res.status(400).json('Must use a valid student id to find a student.');
        return;
    }

    const student = await getDatabase()
        .collection<Student>('students')
        .findOne({ _id: new ObjectId(id) });
    if (!student) {
        res.status(404).json('Student not found.');
        return;
    }
    res.status(200).json(student);
};

const createStudent: AsyncRouteHandler = async (req, res) => {
    const body = req.body as StudentInput;
    const student: StudentInput = {
        fname: body.fname,
        lname: body.lname,
        email: body.email,
        major: body.major,
        gender: body.gender,
        city: body.city,
        state: body.state,
        birthdate: body.birthdate
    };
    const result = await getDatabase()
        .collection<Student>('students')
        .insertOne(student);
    if (!result.acknowledged) {
        throw new Error('Failed to create student.');
    }
    res.status(204).end();
};

const updateStudent: AsyncRouteHandler = async (req, res) => {
    const id = req.params.id;
    if (typeof id !== 'string' || !ObjectId.isValid(id)) {
        res.status(400).json('Must use a valid student id to update a student.');
        return;
    }

    const body = req.body as StudentInput;
    const student: StudentInput = {
        fname: body.fname,
        lname: body.lname,
        email: body.email,
        major: body.major,
        gender: body.gender,
        city: body.city,
        state: body.state,
        birthdate: body.birthdate
    };
    const result = await getDatabase()
        .collection<Student>('students')
        .replaceOne({ _id: new ObjectId(id) }, student);
    if (result.matchedCount === 0) {
        res.status(404).json('Student not found.');
        return;
    }
    res.status(204).end();
};

const deleteStudent: AsyncRouteHandler = async (req, res) => {
    const id = req.params.id;
    if (typeof id !== 'string' || !ObjectId.isValid(id)) {
        res.status(400).json('Must use a valid student id to delete a student.');
        return;
    }

    const result = await getDatabase()
        .collection<Student>('students')
        .deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
        res.status(404).json('Student not found.');
        return;
    }
    res.status(204).end();
};

export {
    createStudent,
    deleteStudent,
    getAll,
    getSingle,
    updateStudent
};
