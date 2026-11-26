import type { Document } from 'mongodb';

export interface Student extends Document {
    fname: string;
    lname: string;
    email: string;
    major: string;
    gender: string;
    city: string;
    state: string;
    birthdate?: string;
}

export interface StudentInput {
    fname: string;
    lname: string;
    email: string;
    major: string;
    gender: string;
    city: string;
    state: string;
    birthdate?: string;
}
