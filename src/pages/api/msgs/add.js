import dbConnect from '../_lib/connect';
import User from '../_models/User';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  const { userID, content, sender } = req.body;

  try {
    const user = await User.findById(userID);
    console.log(user)
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newMessage = {
      sender,
      content,
      created_At: new Date(),
    };

    user.msgs.push(newMessage);
    await user.save();

    res.status(201).json({ newMessage });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Something went wrong' });
  }
}
