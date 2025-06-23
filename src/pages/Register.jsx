import { X } from 'lucide-react'
import { useEffect, useState } from 'react';
import { verifyAuth } from '@/middlewares/User';
import Link from 'next/link';

export default function Register({ session }) {
  useEffect(() => {
    if (session) {
      window.location.href = "/Chat";
    }
  }, [session]);

  const [hidden, setHidden] = useState('hidden')
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError(`Passwords dont match`)
      setHidden('')
      setTimeout(() => {
        setHidden('hidden')
      }, 2000);
      return;
    }

    try {
      const response = await fetch('/api/_auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('User ID:', data.userID);
        window.location.href = `/Chat?id=${data.userID}`;
      } else {
        const errorData = await response.json();
        setError(`Error: ${errorData.message}`)
        setHidden('')
        setTimeout(() => {
          setHidden('hidden')
        }, 2000);
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error # ' + error)
      setHidden('')
      setTimeout(() => {
        setHidden('hidden')
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className={`fixed top-0 right-0 z-50 m-2 px-4 py-2 w-fit h-12 font-bold rounded-xl bg-pink-600 ${hidden} flex flex-row gap-2 justify-center items-center`}>
        <X></X>
        <span>{error}</span>
      </div>
      <img src="/robot.png" alt="slm hh AI" className='w-36 fixed top-2 md:top-12' />

      <div className="bg-black p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium mb-2">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border-2 border-white rounded bg-pink-500"
              placeholder='Slm hh'
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-2 border-2 border-white rounded bg-pink-500"
              placeholder='example@gmail.com'
              required
            />
          </div>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full p-2 border-2 border-white rounded bg-pink-500"
                placeholder='*************'
                required
              />
            </div>
            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full p-2 border-2 border-white rounded bg-pink-500"
                placeholder='*************'
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-500 text-white font-bold py-2 px-4 rounded hover:bg-indigo-600"
          >
            Register
          </button>
        </form>
        <Link href="/Login" className='text-pink-400 hover:underline'>You already have an account ?</Link>
      </div>
    </div>
  );
}

export async function getServerSideProps({ req, res }) {
  const user = verifyAuth(req, res);

  if (user) {
    return {
      props: {
        session: {
          _id: user._id,
          name: user.name,
          email: user.email,
        },
      },
    };
  }

  return { props: { session: null } };
}