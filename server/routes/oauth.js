import express from 'express';
import { prisma } from '../utils/prisma.js';
import { logger } from '../utils/logger.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import redisClient from '../utils/redis.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Store authorization codes in Redis
const storeAuthorizationCode = async (code, data) => {
  await redisClient.setEx(`auth_code:${code}`, 600, JSON.stringify(data)); // 10 minutes
};

const getAuthorizationCode = async (code) => {
  const data = await redisClient.get(`auth_code:${code}`);
  return data ? JSON.parse(data) : null;
};

const deleteAuthorizationCode = async (code) => {
  await redisClient.del(`auth_code:${code}`);
};

// Store refresh tokens in Redis
const storeRefreshToken = async (token, data) => {
  await redisClient.setEx(`refresh_token:${token}`, 30 * 24 * 60 * 60, JSON.stringify(data)); // 30 days
};

const getRefreshToken = async (token) => {
  const data = await redisClient.get(`refresh_token:${token}`);
  return data ? JSON.parse(data) : null;
};

const deleteRefreshToken = async (token) => {
  await redisClient.del(`refresh_token:${token}`);
};

// Generate a random string for authorization codes and tokens
const generateRandomString = (length) => {
  return crypto.randomBytes(length).toString('hex');
};

// Rate limiting middleware
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});

const tokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: { error: 'Too many token requests, please try again later.' }
});

// Authorization endpoint
router.get('/authorize', authLimiter, async (req, res) => {
  const { client_id, redirect_uri, response_type, scope, state } = req.query;

  // Validate required parameters
  if (!client_id || !redirect_uri || !response_type) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  // Validate client
  const client = await prisma.oauthClient.findUnique({
    where: { clientId: client_id }
  });

  if (!client) {
    return res.status(400).json({ error: 'Invalid client' });
  }

  // Validate redirect URI
  if (!client.redirectUris.includes(redirect_uri)) {
    return res.status(400).json({ error: 'Invalid redirect URI' });
  }

  // Generate authorization code
  const code = generateRandomString(32);
  await storeAuthorizationCode(code, {
    client_id,
    redirect_uri,
    scope,
    expires_at: Date.now() + 600000 // 10 minutes
  });

  // Redirect with authorization code
  const redirectUrl = new URL(redirect_uri);
  redirectUrl.searchParams.set('code', code);
  if (state) redirectUrl.searchParams.set('state', state);
  
  res.redirect(redirectUrl.toString());
});

// Token endpoint
router.post('/token', tokenLimiter, async (req, res) => {
  const { grant_type, code, client_id, client_secret, redirect_uri } = req.body;

  // Validate required parameters
  if (!grant_type || !code || !client_id || !client_secret) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  // Validate client
  const client = await prisma.oauthClient.findUnique({
    where: { clientId: client_id }
  });

  if (!client || client.clientSecret !== client_secret) {
    return res.status(400).json({ error: 'Invalid client credentials' });
  }

  // Validate authorization code
  const authCode = await getAuthorizationCode(code);
  if (!authCode) {
    return res.status(400).json({ error: 'Invalid authorization code' });
  }

  // Check if code has expired
  if (authCode.expires_at < Date.now()) {
    await deleteAuthorizationCode(code);
    return res.status(400).json({ error: 'Authorization code expired' });
  }

  // Generate access token
  const accessToken = jwt.sign(
    {
      sub: authCode.client_id,
      scope: authCode.scope,
      exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour
    },
    process.env.JWT_SECRET
  );

  // Generate refresh token
  const refreshToken = generateRandomString(32);
  await storeRefreshToken(refreshToken, {
    client_id,
    scope: authCode.scope
  });

  // Clean up used authorization code
  await deleteAuthorizationCode(code);

  // Return tokens
  res.json({
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: 3600,
    refresh_token: refreshToken,
    scope: authCode.scope
  });
});

// Token validation endpoint
router.post('/token/validate', async (req, res) => {
  const { access_token } = req.body;

  if (!access_token) {
    return res.status(400).json({ error: 'Missing access token' });
  }

  try {
    const decoded = jwt.verify(access_token, process.env.JWT_SECRET);
    res.json({
      active: true,
      scope: decoded.scope,
      client_id: decoded.sub,
      exp: decoded.exp
    });
  } catch (error) {
    res.json({ active: false });
  }
});

// Client registration endpoint
router.post('/register', async (req, res) => {
  const { name, redirectUris } = req.body;

  // Validate required parameters
  if (!name || !redirectUris || !Array.isArray(redirectUris) || redirectUris.length === 0) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    // Generate client credentials
    const clientId = generateRandomString(32);
    const clientSecret = generateRandomString(64);

    // Create new client
    const client = await prisma.oauthClient.create({
      data: {
        clientId,
        clientSecret,
        name,
        redirectUris
      }
    });

    // Return client credentials
    res.status(201).json({
      client_id: client.clientId,
      client_secret: client.clientSecret,
      name: client.name,
      redirect_uris: client.redirectUris,
      created_at: client.createdAt
    });

    logger.info('New OAuth client registered:', { clientId: client.clientId });
  } catch (error) {
    logger.error('Error registering OAuth client:', error);
    res.status(500).json({ error: 'Failed to register client' });
  }
});

// Error handling middleware
const handleError = (error, req, res, next) => {
  logger.error('OAuth error:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    query: req.query,
    body: req.body,
    client_id: req.body?.client_id || req.query?.client_id
  });

  if (error.name === 'ValidationError') {
    return res.status(400).json({ 
      error: 'invalid_request',
      error_description: error.message 
    });
  }

  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({ 
      error: 'invalid_client',
      error_description: 'Invalid client credentials' 
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({ 
      error: 'invalid_token',
      error_description: 'Token has expired' 
    });
  }

  res.status(500).json({ 
    error: 'server_error',
    error_description: 'An unexpected error occurred' 
  });
};

// Logging middleware
const logRequest = (req, res, next) => {
  const logData = {
    path: req.path,
    method: req.method,
    query: req.query,
    body: req.body,
    client_id: req.body?.client_id || req.query?.client_id,
    ip: req.ip
  };

  // Don't log sensitive data
  if (logData.body?.client_secret) {
    logData.body.client_secret = '[REDACTED]';
  }
  if (logData.body?.password) {
    logData.body.password = '[REDACTED]';
  }

  logger.info('OAuth request:', logData);
  next();
};

// Apply middleware
router.use(logRequest);
router.use(handleError);

export default router; 