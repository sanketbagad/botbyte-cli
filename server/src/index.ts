import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Middleware
const allowedOrigins: (string | RegExp)[] = [
    "http://localhost:3000",
    "http://localhost:3001",
    ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
    ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
];

app.use(cors({
    origin: allowedOrigins as any,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auth middleware - dynamically import better-auth to handle ESM
app.use('/api/auth', async (req, res) => {
    try {
        const { toNodeHandler } = await import("better-auth/node");
        const { auth } = await import('./lib/auth');
        const handler = toNodeHandler(auth);
        handler(req, res);
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ error: 'Auth initialization failed' });
    }
});


// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Root route
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to Orbital CLI AI API' });
});

// Export app for testing
export { app };

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
  });
}
