import { ObjectId } from 'mongodb';
import type { AsyncRouteHandler } from '../middleware/async-handler.js';
import { getDatabase } from '../data/database.js';
import type { Department, DepartmentInput } from '../models/department.js';

const getAll: AsyncRouteHandler = async (_req, res) => {
    const departments = await getDatabase()
        .collection<Department>('departments')
        .find()
        .toArray();
    res.status(200).json(departments);
};

const getSingle: AsyncRouteHandler = async (req, res) => {
    const id = req.params.id;
    if (typeof id !== 'string' || !ObjectId.isValid(id)) {
        res.status(400).json('Must use a valid department id to find a department.');
        return;
    }

    const department = await getDatabase()
        .collection<Department>('departments')
        .findOne({ _id: new ObjectId(id) });
    if (!department) {
        res.status(404).json('Department not found.');
        return;
    }
    res.status(200).json(department);
};

const createDepartment: AsyncRouteHandler = async (req, res) => {
    const body = req.body as DepartmentInput;
    const department: DepartmentInput = {
        department: body.department,
        deptCode: body.deptCode
    };
    const result = await getDatabase()
        .collection<Department>('departments')
        .insertOne(department);
    if (!result.acknowledged) {
        throw new Error('Failed to create department.');
    }
    res.status(204).end();
};

const updateDepartment: AsyncRouteHandler = async (req, res) => {
    const id = req.params.id;
    if (typeof id !== 'string' || !ObjectId.isValid(id)) {
        res.status(400).json('Must use a valid department id to update a department.');
        return;
    }

    const body = req.body as DepartmentInput;
    const department: DepartmentInput = {
        department: body.department,
        deptCode: body.deptCode
    };
    const result = await getDatabase()
        .collection<Department>('departments')
        .replaceOne({ _id: new ObjectId(id) }, department);
    if (result.matchedCount === 0) {
        res.status(404).json('Department not found.');
        return;
    }
    res.status(204).end();
};

const deleteDepartment: AsyncRouteHandler = async (req, res) => {
    const id = req.params.id;
    if (typeof id !== 'string' || !ObjectId.isValid(id)) {
        res.status(400).json('Must use a valid department id to delete a department.');
        return;
    }

    const result = await getDatabase()
        .collection<Department>('departments')
        .deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
        res.status(404).json('Department not found.');
        return;
    }
    res.status(204).end();
};

export {
    createDepartment,
    deleteDepartment,
    getAll,
    getSingle,
    updateDepartment
};
