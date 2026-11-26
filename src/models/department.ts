import type { Document } from 'mongodb';

export interface Department extends Document {
    department: string;
    deptCode: string;
}

export interface DepartmentInput {
    department: string;
    deptCode: string;
}
