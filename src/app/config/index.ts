import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
  node_env: process.env.NODE_ENV,
  port: process.env.PORT,

  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,

  jwt_access_token_secret: process.env.JWT_ACCESS_TOKEN_SECRET,
  jwt_access_token_expires_in: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN,

  frontend_base_url: process.env.FRONTEND_BASE_URL,
  backend_base_url: process.env.BACKEND_BASE_URL,

  stripe_secret_key: process.env.STRIPE_SECRET_KEY,
  stripe_webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,

  digitalocean: {
    spaces_endpoint: process.env.DO_SPACES_ENDPOINT,
    spaces_bucket: process.env.DO_SPACES_BUCKET,
    spaces_access_key: process.env.DO_SPACES_ACCESS_KEY,
    spaces_secret_key: process.env.DO_SPACES_SECRET_KEY,
    spaces_region: process.env.DO_SPACES_REGION,
  },

  emailSender: {
    email: process.env.EMAIL_SENDER,
    app_pass: process.env.EMAIL_SENDER_PASS,
  },

  google: {
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
  },
};
