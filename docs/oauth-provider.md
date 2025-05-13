# OAuth Provider Documentation

This document provides guidelines for third-party developers on how to integrate with our OAuth 2.0 provider.

## Overview

Our OAuth 2.0 provider allows third-party applications to authenticate users and access their data securely. The provider supports the Authorization Code Flow, which is the recommended flow for most applications.

## Registration

To use our OAuth provider, you need to register your application. Follow these steps:

1. **Register Your Application**: Send a POST request to `/oauth/register` with the following parameters:
   - `name`: The name of your application.
   - `redirectUris`: An array of redirect URIs where users will be redirected after authorization.

   Example request:
   ```json
   {
     "name": "My Application",
     "redirectUris": ["https://myapp.com/callback"]
   }
   ```

   Example response:
   ```json
   {
     "client_id": "your_client_id",
     "client_secret": "your_client_secret",
     "name": "My Application",
     "redirect_uris": ["https://myapp.com/callback"],
     "created_at": "2023-01-01T00:00:00Z"
   }
   ```

2. **Store Credentials**: Securely store the `client_id` and `client_secret` provided in the response.

## Authorization Flow

### Step 1: Redirect to Authorization Endpoint

Redirect the user to the authorization endpoint with the following parameters:

- `client_id`: Your client ID.
- `redirect_uri`: The redirect URI registered for your application.
- `response_type`: Set to `code`.
- `scope`: The permissions your application is requesting.
- `state`: A random string to prevent CSRF attacks.

Example URL:
```
https://yourapp.com/oauth/authorize?client_id=your_client_id&redirect_uri=https://myapp.com/callback&response_type=code&scope=profile&state=random_state
```

### Step 2: User Authorization

The user will be prompted to authorize your application. Upon approval, they will be redirected back to your specified `redirect_uri` with an authorization code and the original `state` parameter.

Example redirect:
```
https://myapp.com/callback?code=authorization_code&state=random_state
```

### Step 3: Exchange Authorization Code for Access Token

Send a POST request to the token endpoint with the following parameters:

- `grant_type`: Set to `authorization_code`.
- `code`: The authorization code received in the redirect.
- `client_id`: Your client ID.
- `client_secret`: Your client secret.
- `redirect_uri`: The same redirect URI used in the authorization request.

Example request:
```json
{
  "grant_type": "authorization_code",
  "code": "authorization_code",
  "client_id": "your_client_id",
  "client_secret": "your_client_secret",
  "redirect_uri": "https://myapp.com/callback"
}
```

Example response:
```json
{
  "access_token": "your_access_token",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "your_refresh_token",
  "scope": "profile"
}
```

## Using the Access Token

Include the access token in the `Authorization` header of your API requests:

```
Authorization: Bearer your_access_token
```

## Error Handling

The OAuth provider may return the following error responses:

- `400 Bad Request`: Missing or invalid parameters.
- `401 Unauthorized`: Invalid client credentials or expired tokens.
- `429 Too Many Requests`: Rate limit exceeded.

Example error response:
```json
{
  "error": "error_description"
}
```

## Rate Limiting

To protect against abuse, the OAuth provider implements rate limiting:

- Authorization endpoint: 5 requests per 15 minutes per IP.
- Token endpoint: 10 requests per 15 minutes per IP.

## Security Considerations

- Always use HTTPS for all OAuth-related requests.
- Securely store client credentials and tokens.
- Validate the `state` parameter to prevent CSRF attacks.
- Implement proper error handling and logging in your application.

## Support

For additional support or questions, please contact our support team at support@yourapp.com. 