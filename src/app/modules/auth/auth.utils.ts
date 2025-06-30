import jwt from 'jsonwebtoken';

const CreateToken = (
  jwtPayload: { id: string; email: string },
  secret: string,
  expiresIn: string,
) => {
  // @ts-expect-error - jwt.sign is not typed
  return jwt.sign(jwtPayload, secret, {
    expiresIn,
  });
};

const VerifyToken = (token: string, secret: string) => {
  return jwt.verify(token, secret);
};

const AuthUtils = { CreateToken, VerifyToken };

export default AuthUtils;
