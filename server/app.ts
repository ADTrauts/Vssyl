import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import messagesRouter from './routes/messages';
import threadsRouter from './routes/threads';
import categoriesRouter from './routes/categories';
import { errorHandler } from './middleware/error';
import { apiLimiter, authLimiter, uploadLimiter, dynamicLimiter } from './middleware/rate-limit';

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiters
app.use('/api/auth', authLimiter);
app.use('/api/upload', uploadLimiter);
app.use('/api', apiLimiter);
app.use('/api/protected', dynamicLimiter);

// Routes
app.use('/api/messages', messagesRouter);
app.use('/api/threads', threadsRouter);
app.use('/api/categories', categoriesRouter);

// Error handling
app.use(errorHandler);

export default app; 