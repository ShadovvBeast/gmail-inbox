import { Credentials, OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';

import { readFileSync, writeFileSync } from 'fs';

interface ClientCredentials {
  client_id: string;
  client_secret: string;
  redirect_uris: string[];
}

// If modifying these scopes, delete token.json.
const scopes = ['https://www.googleapis.com/auth/gmail.readonly'];

export const getOAuthClient = (credentialsJsonPath: string) => {
  const credentials = getCredentials(credentialsJsonPath);

  const oAuth2Client = new google.auth.OAuth2({
    // more info on the interface "OAuth2ClientOptions" in 'googleapis' package
    clientId: credentials.client_id,
    clientSecret: credentials.client_secret,
    redirectUri: credentials.redirect_uris[0],
  });
  return oAuth2Client;
}

export const getAuthUrl = (credentialsJsonPath: string) => {
  const oAuth2Client = getOAuthClient(credentialsJsonPath);
  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes,
  });
}

export const getToken = async (credentialsJsonPath: string, code: string) => {
  const oAuth2Client = getOAuthClient(credentialsJsonPath);
  return getNewToken(oAuth2Client, code);
}

export const authorizeAccount = async (credentialsJsonPath: string, token: Credentials): Promise<OAuth2Client> => {
  const oAuth2Client = getOAuthClient(credentialsJsonPath);

    if (token) {
      oAuth2Client.setCredentials(token);
    }

  return oAuth2Client;
};

const getCredentials = (credentialsJsonPath: string): ClientCredentials => {
  let allCredentials: any;
  try {
    const credentialsString = readFileSync(credentialsJsonPath, { encoding: 'utf8' });
    allCredentials = JSON.parse(credentialsString);
  } catch (e) {
    log('Unable to find or parse credentials json file:', e.message);
  }
  const credentialsDataKey: string = Object.keys(allCredentials)[0];
  if (!credentialsDataKey) {
    log('credentials json file contains no data, expected object with credentials');
  }
  const credentials = allCredentials[credentialsDataKey];
  if (
    !credentials ||
    !credentials.client_id ||
    !credentials.client_secret ||
    !credentials.redirect_uris ||
    !credentials.redirect_uris[0]
  ) {
    log('Credentials do not contain required attributes client_id, client_secret and at least one redirect_uris item');
  }

  return credentials;
};

const getNewToken = async (oAuth2Client: OAuth2Client, code: string): Promise<any> => {
  return new Promise((resolve, reject) => {
      oAuth2Client.getToken(code, (err, token) => {
        if (err) {
          reject(err);
        } else {
          //writeFileSync(tokenPath, JSON.stringify(token));
          resolve(token);
        }
      });
    });
};

const log = (...messages: string[]) => {
  messages.unshift('Gmail-inbox:');
  console.log.apply(console, messages as any);
  // throw new Error(...messages);
};
