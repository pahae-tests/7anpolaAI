import dbConnect from '../_lib/connect';
import User from '../_models/User';
import jwt from "jsonwebtoken";
import { serialize } from "cookie";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid infos' });
    }

    const isMatch = password === user.password;
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid infos' });
    }
    
    const token = jwt.sign({
      _id: user._id,
      name: user.name,
      email: user.email,
      created_At: user.created_At,
    }, process.env.JWT_SECRET || "1111", {
      expiresIn: "7d",
    });

    const serialized = serialize("userToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    res.setHeader("Set-Cookie", serialized);

    console.log('Session started for user:', user._id);
    res.status(200).json({ userID: user._id });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Something went wrong' });
  }
}
