import axios from 'axios';
import { logger } from '../utils/logger.js';

const API_BASE_URL = 'http://localhost:3000';

async function testOAuthFlow() {
  try {
    // Step 1: Register a test client
    logger.info('Registering test client...');
    const registerResponse = await axios.post(`${API_BASE_URL}/oauth/register`, {
      name: 'Test Client',
      redirectUris: ['http://localhost:3001/callback']
    });

    const { client_id, client_secret } = registerResponse.data;
    logger.info('Client registered successfully:', { client_id });

    // Step 2: Test invalid client registration
    try {
      await axios.post(`${API_BASE_URL}/oauth/register`, {
        name: 'Invalid Client',
        redirectUris: [] // Empty redirect URIs should fail
      });
      throw new Error('Invalid client registration should have failed');
    } catch (error) {
      if (error.response?.status === 400) {
        logger.info('Invalid client registration test passed');
      } else {
        throw error;
      }
    }

    // Step 3: Test authorization endpoint
    logger.info('Testing authorization endpoint...');
    const authUrl = new URL(`${API_BASE_URL}/oauth/authorize`);
    authUrl.searchParams.append('client_id', client_id);
    authUrl.searchParams.append('redirect_uri', 'http://localhost:3001/callback');
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', 'profile');
    authUrl.searchParams.append('state', 'test_state');

    logger.info('Authorization URL:', authUrl.toString());
    logger.info('Please visit this URL in your browser to complete the authorization');

    // Step 4: Test invalid authorization request
    try {
      await axios.get(`${API_BASE_URL}/oauth/authorize?client_id=invalid`);
      throw new Error('Invalid authorization request should have failed');
    } catch (error) {
      if (error.response?.status === 400) {
        logger.info('Invalid authorization request test passed');
      } else {
        throw error;
      }
    }

    // Step 5: Test token endpoint (this would normally happen after user authorization)
    logger.info('Testing token endpoint...');
    const tokenResponse = await axios.post(`${API_BASE_URL}/oauth/token`, {
      grant_type: 'authorization_code',
      code: 'test_code', // This would be the actual code from the authorization step
      client_id,
      client_secret,
      redirect_uri: 'http://localhost:3001/callback'
    });

    logger.info('Token response:', tokenResponse.data);

    // Step 6: Test invalid token request
    try {
      await axios.post(`${API_BASE_URL}/oauth/token`, {
        grant_type: 'authorization_code',
        code: 'invalid_code',
        client_id,
        client_secret,
        redirect_uri: 'http://localhost:3001/callback'
      });
      throw new Error('Invalid token request should have failed');
    } catch (error) {
      if (error.response?.status === 400) {
        logger.info('Invalid token request test passed');
      } else {
        throw error;
      }
    }

    // Step 7: Test token validation
    logger.info('Testing token validation...');
    const validateResponse = await axios.post(`${API_BASE_URL}/oauth/token/validate`, {
      access_token: tokenResponse.data.access_token
    });

    logger.info('Token validation response:', validateResponse.data);

    // Step 8: Test invalid token validation
    try {
      await axios.post(`${API_BASE_URL}/oauth/token/validate`, {
        access_token: 'invalid_token'
      });
      throw new Error('Invalid token validation should have failed');
    } catch (error) {
      if (error.response?.status === 400) {
        logger.info('Invalid token validation test passed');
      } else {
        throw error;
      }
    }

    logger.info('All OAuth tests completed successfully');
  } catch (error) {
    logger.error('Test failed:', error.response?.data || error.message);
    throw error;
  }
}

testOAuthFlow(); 