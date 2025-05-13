import express from 'express';
import { prisma } from '../utils/prisma.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Consent screen route
router.get('/consent', async (req, res) => {
  const { client_id, redirect_uri, scope, state } = req.query;

  // Validate required parameters
  if (!client_id || !redirect_uri) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    // Get client information
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

    // Render consent screen
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authorize Application</title>
          <style>
            body {
              font-family: var(--font-geist-sans), Arial, sans-serif;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9fafb;
            }
            .container {
              background: white;
              padding: 32px;
              border-radius: 12px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              margin-top: 40px;
            }
            h1 {
              color: #111827;
              font-size: 24px;
              font-weight: 600;
              margin-bottom: 24px;
            }
            .client-info {
              margin-bottom: 24px;
              padding: 16px;
              background-color: #f3f4f6;
              border-radius: 8px;
            }
            .scope-list {
              margin: 16px 0;
              padding-left: 20px;
            }
            .scope-list li {
              margin-bottom: 8px;
              color: #4b5563;
            }
            .buttons {
              display: flex;
              gap: 12px;
              margin-top: 24px;
            }
            button {
              padding: 12px 24px;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-size: 16px;
              font-weight: 500;
              transition: all 0.2s;
            }
            .approve {
              background: #10b981;
              color: white;
            }
            .approve:hover {
              background: #059669;
            }
            .deny {
              background: #ef4444;
              color: white;
            }
            .deny:hover {
              background: #dc2626;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Authorize Application</h1>
            <div class="client-info">
              <p><strong>Application:</strong> ${client.name}</p>
              <p><strong>Requesting access to:</strong></p>
              <ul class="scope-list">
                ${scope ? scope.split(' ').map(s => `<li>${s}</li>`).join('') : '<li>Basic profile information</li>'}
              </ul>
            </div>
            <div class="buttons">
              <form action="/oauth/authorize" method="GET">
                <input type="hidden" name="client_id" value="${client_id}">
                <input type="hidden" name="redirect_uri" value="${redirect_uri}">
                <input type="hidden" name="response_type" value="code">
                <input type="hidden" name="scope" value="${scope || ''}">
                <input type="hidden" name="state" value="${state || ''}">
                <button type="submit" class="approve">Approve</button>
              </form>
              <form action="${redirect_uri}" method="GET">
                <input type="hidden" name="error" value="access_denied">
                ${state ? `<input type="hidden" name="state" value="${state}">` : ''}
                <button type="submit" class="deny">Deny</button>
              </form>
            </div>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    logger.error('Error rendering consent screen:', error);
    res.status(500).json({ error: 'Failed to render consent screen' });
  }
});

export default router; 