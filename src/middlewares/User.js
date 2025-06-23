import jwt from "jsonwebtoken";

const JWT_SECRET = '1111';

export function verifyAuth(req, res) {
  const token = req.cookies?.userToken;

  if (!token) {
    return null;
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      created_At: user.created_At,
    };
  } catch (error) {
    console.error("Invalid token", error);
    return null;
  }
}