import oauthRouter from './routes/oauth.js';
import oauthConsentRouter from './routes/oauth-consent.js';

// Add OAuth routes
app.use('/oauth', oauthRouter);

// Add OAuth consent screen routes
app.use('/oauth', oauthConsentRouter); 