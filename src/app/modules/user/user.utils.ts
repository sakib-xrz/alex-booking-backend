const generateRandomPassword = (): string => {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';

  // Ensure password has at least one uppercase, one lowercase, one number, and one special char
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*';

  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest with random characters (8 more characters for total 12)
  for (let i = 4; i < 12; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
};

const createCounselorEmailTemplate = (
  name: string,
  email: string,
  password: string,
): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Welcome to Alexander Rodriguez Counseling</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .credentials { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .password { font-size: 18px; font-weight: bold; color: #007bff; text-align: center; letter-spacing: 2px; margin: 15px 0; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>Welcome to Alexander Rodriguez Counseling</h2>
            </div>
            <p>Hello ${name},</p>
            <p>Your counselor account has been created successfully. Please use the following credentials to access the platform:</p>
            <div class="credentials">
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Password:</strong> ${password}</p>
            </div>
            <p><strong>Please change your password immediately after your first login for security purposes.</strong></p>
            <p>If you have any questions or need assistance, please don't hesitate to contact the administrator.</p>
            <div class="footer">
                <p>This is an automated message, please do not reply to this email.</p>
                <p>&copy; Alexander Rodriguez Booking System</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

const UserUtils = {
  generateRandomPassword,
  createCounselorEmailTemplate,
};

export default UserUtils;
