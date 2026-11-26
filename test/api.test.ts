import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test, type TestContext } from 'node:test';
import { ObjectId, type Db, type Document } from 'mongodb';
import * as database from '../src/data/database.js';
import { createApp } from '../src/app.js';

const makeDatabase = () => {
    const studentId = new ObjectId();
    const records: Record<string, Document[]> = {
        students: [{
            _id: studentId,
            fname: 'Ada',
            lname: 'Lovelace',
            email: 'ada@example.com',
            major: 'Mathematics',
            gender: 'F',
            city: 'London',
            state: 'UK',
            birthdate: '1815-12-10'
        }],
        departments: [{ department: 'Mathematics', deptCode: 'MA' }],
        courses: [{ deptCode: 'MA', courseNum: '101', courseName: 'Algebra' }]
    };
    let collectionLookups = 0;
    const fakeDatabase = {
        collection(name: string) {
            collectionLookups += 1;
            const documents = records[name] ?? [];
            return {
                find: () => ({ toArray: async () => documents }),
                findOne: async (filter: { _id?: ObjectId }) =>
                    documents.find((document) =>
                        filter._id && document._id?.equals(filter._id)
                    ) ?? null
            };
        }
    };

    return {
        database: fakeDatabase as unknown as Db,
        studentId,
        getCollectionLookups: () => collectionLookups
    };
};

const withApi = async (
    context: TestContext,
    fakeDatabase: Db,
    run: (baseUrl: string) => Promise<void>
): Promise<void> => {
    context.mock.method(database, 'getDatabase', () => fakeDatabase);

    const server = createApp('integration-test-secret').listen(0);
    await once(server, 'listening');
    const address = server.address();
    if (!address || typeof address === 'string') {
        throw new Error('Test server did not bind to a TCP port.');
    }

    try {
        await run(`http://127.0.0.1:${address.port}`);
    } finally {
        await new Promise<void>((resolve, reject) => {
            server.close((error) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve();
            });
        });
    }
};

test('GET collection routes return records from MongoDB', async (context) => {
    const fake = makeDatabase();
    await withApi(context, fake.database, async (baseUrl) => {
        for (const resource of ['students', 'departments', 'courses']) {
            const response = await fetch(`${baseUrl}/${resource}`);
            assert.equal(response.status, 200);
            assert.ok(Array.isArray(await response.json()));
        }
    });
});

test('GET item route returns the matching record', async (context) => {
    const fake = makeDatabase();
    await withApi(context, fake.database, async (baseUrl) => {
        const response = await fetch(`${baseUrl}/students/${fake.studentId}`);
        const student = await response.json() as { fname: string };

        assert.equal(response.status, 200);
        assert.equal(student.fname, 'Ada');
    });
});

test('invalid IDs return 400 before accessing MongoDB', async (context) => {
    const fake = makeDatabase();
    await withApi(context, fake.database, async (baseUrl) => {
        const response = await fetch(`${baseUrl}/students/not-an-object-id`);

        assert.equal(response.status, 400);
        assert.equal(fake.getCollectionLookups(), 0);
    });
});

test('valid but unknown IDs return 404', async (context) => {
    const fake = makeDatabase();
    await withApi(context, fake.database, async (baseUrl) => {
        const response = await fetch(`${baseUrl}/students/${new ObjectId()}`);

        assert.equal(response.status, 404);
    });
});

test('write routes reject requests without an authenticated session', async (context) => {
    const fake = makeDatabase();
    await withApi(context, fake.database, async (baseUrl) => {
        const response = await fetch(`${baseUrl}/students`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });

        assert.equal(response.status, 401);
        assert.equal(fake.getCollectionLookups(), 0);
    });
});

test('auth status reports an unauthenticated session', async (context) => {
    const fake = makeDatabase();
    await withApi(context, fake.database, async (baseUrl) => {
        const response = await fetch(`${baseUrl}/auth/status`);
        const status = await response.json() as { authenticated: boolean; user: unknown };

        assert.equal(response.status, 200);
        assert.equal(status.authenticated, false);
        assert.equal(status.user, null);
    });
});

test('CORS allows credentialed requests from the frontend origin', async (context) => {
    const fake = makeDatabase();
    await withApi(context, fake.database, async (baseUrl) => {
        const response = await fetch(`${baseUrl}/students`, {
            method: 'OPTIONS',
            headers: {
                Origin: 'http://localhost:5173',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'content-type'
            }
        });

        assert.equal(response.status, 204);
        assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:5173');
        assert.equal(response.headers.get('access-control-allow-credentials'), 'true');
    });
});
