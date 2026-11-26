import 'dotenv/config';
import { createApp } from './app.js';
import { connectToDatabase } from './data/database.js';

const startServer = async (): Promise<void> => {
    const app = createApp();
    await connectToDatabase();

    const port = Number(process.env.PORT ?? 3001);
    app.listen(port, () => {
        console.log(`MongoDB connected; API listening on port ${port}`);
    });
};

startServer().catch((error: unknown) => {
    console.error('Unable to start the API:', error);
    process.exitCode = 1;
});
