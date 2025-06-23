import dbConnect from '../_lib/connect';
import User from '../_models/User';

export default async function handler(req, res) {
    await dbConnect();
    const { userID } = req.query
    console.log(userID)

    try {
        const users = await User.findByIdAndDelete(userID);
        res.status(200).json({ message: 'deleted !' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Something went wrong' });
    }
}