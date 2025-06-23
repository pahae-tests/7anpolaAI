import { serialize } from 'cookie';

export default function handler(req, res) {
  if (req.method === 'POST') {
    res.setHeader('Set-Cookie', serialize('userToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      expires: new Date(0),
    }));

    return res.status(200).json({ message: 'Logout successful' });
  }

  res.setHeader('Allow', ['POST']);
  res.status(405).json({ error: `Method ${req.method} not allowed` });
}