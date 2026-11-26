import { MongoClient, type Db } from 'mongodb';

let client: MongoClient | undefined;
let database: Db | undefined;

export const connectToDatabase = async (
    url = process.env.MONGODB_URL,
    databaseName = process.env.MONGODB_DATABASE
): Promise<Db> => {
    if (database) {
        return database;
    }
    if (!url) {
        throw new Error('MONGODB_URL must be set in the environment.');
    }

    client = new MongoClient(url);
    await client.connect();
    database = databaseName ? client.db(databaseName) : client.db();
    return database;
};

export const getDatabase = (): Db => {
    if (!database) {
        throw new Error('Database not initialized');
    }
    return database;
};

export const closeDatabase = async (): Promise<void> => {
    await client?.close();
    client = undefined;
    database = undefined;
};
