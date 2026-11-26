import type { Document } from 'mongodb';

export interface Course extends Document {
    deptCode: string;
    courseNum: string;
    courseName: string;
}

export interface CourseInput {
    deptCode: string;
    courseNum: string;
    courseName: string;
}
