import dbConnect from '../_lib/connect';
import User from '../_models/User';
import jwt from "jsonwebtoken";
import { serialize } from "cookie";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  const { name, email, password } = req.body;

  // Validation des champs
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please fill all fields' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  try {
    // Vérification existence utilisateur
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Création utilisateur
    const newUser = new User({
      name,
      email,
      password,
      msgs: [],
    });

    // Sauvegarde en base
    await newUser.save();

    const user = await User.findOne({ email });

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

    res.status(201).json({
      userID: newUser._id,
    });

  } catch (error) {
    console.error('Registration error:', error);

    // Gestion spécifique duplication email
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    res.status(500).json({ message: 'Something went wrong', error });
  }
}