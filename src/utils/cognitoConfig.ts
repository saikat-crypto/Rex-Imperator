import { Amplify } from 'aws-amplify';

export const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID || '';
export const userPoolClientId = import.meta.env.VITE_COGNITO_CLIENT_ID || '';
export const identityPoolId = import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID || '';
export const cognitoRegion = import.meta.env.VITE_AWS_REGION || 'us-east-1';

export const isCognitoConfigured = Boolean(userPoolId && userPoolClientId);

// Configure AWS Amplify Auth v6
if (isCognitoConfigured) {
  try {
    Amplify.configure({
      Auth: {
        Cognito: {
          userPoolId,
          userPoolClientId,
          identityPoolId: identityPoolId || undefined,
          signUpVerificationMethod: 'code',
          loginWith: {
            email: true,
          },
        },
      },
    });
    console.log('[Auth] AWS Amplify Cognito configured successfully.');
  } catch (err) {
    console.error('[Auth] Failed to configure AWS Amplify Cognito:', err);
  }
} else {
  console.info('[Auth] Cognito credentials not yet provided in .env (running in local sandbox mode).');
}
