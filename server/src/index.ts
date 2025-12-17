import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth.js';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Middleware
const allowedOrigins: (string | RegExp)[] = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://botbyte-cli-client.vercel.app",
    ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
    ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, Postman, or server-to-server requests)
        if (!origin || allowedOrigins.some(allowedOrigin => {
            if (typeof allowedOrigin === 'string') {
                return allowedOrigin === origin;
            }
            return allowedOrigin.test(origin);
        })) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
}));

app.all("/api/auth/*splat", toNodeHandler(auth)); 

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auth middleware - dynamically import better-auth to handle ESM
// app.use('/api/auth', async (req, res) => {
//     try {
//         const { toNodeHandler } = await import("better-auth/node");
//         const { auth } = await import('./lib/auth.js');
//         const handler = toNodeHandler(auth);
//         handler(req, res);
//     } catch (error) {
//         console.error('Auth middleware error:', error);
//         res.status(500).json({ error: 'Auth initialization failed' });
//     }
// });


// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Device authorization validation endpoint
app.get("/api/device", async (req, res) => {
  try {
    const { user_code } = req.query;
    
    if (!user_code || typeof user_code !== 'string') {
      return res.status(400).json({ error: 'user_code is required' });
    }

    // Validate the device code format (should be alphanumeric)
    const formattedCode = user_code.trim().replace(/-/g, "").toUpperCase();
    
    if (formattedCode.length !== 8) {
      return res.status(400).json({ error: 'Invalid code format' });
    }

    // Return success - device code is valid
    // The actual device authorization flow is handled by better-auth internally
    res.status(200).json({ 
      success: true, 
      user_code: formattedCode 
    });
  } catch (error) {
    console.error('Device validation error:', error);
    res.status(500).json({ error: 'Device validation failed' });
  }
});

// Root route
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to Orbital CLI AI API' });
});


// Export app for testing and Vercel
export { app };
export default app;

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
  });
}
