import { X } from 'lucide-react'
import { useEffect, useState } from 'react';
import { verifyAuth } from '@/middlewares/User'
import Link from 'next/link';

export default function Login({ session }) {
  useEffect(() => { if (session) window.location.href = "/Chat" })

  const [hidden, setHidden] = useState('hidden')
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    email: '',
    password: '',
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

    try {
      const response = await fetch('/api/_auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('User ID:', data.userID);
        window.location.href = `/Chat?id=${data.userID}`
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
      setError('Error server # ' + error)
      setHidden('')
      setTimeout(() => {
        setHidden('hidden')
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className={`fixed top-0 right-0 z-50  m-2 px-4 py-2 w-fit h-12 font-bold rounded-xl bg-pink-600 ${hidden} flex flex-row gap-2 justify-center items-center`}>
        <X></X>
        <span>{error}</span>
      </div>
      <img src="/robot.png" alt="slm hh AI" className='w-36 fixed top-24' />

      <div className="bg-black p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-2 border-2 border-white rounded bg-pink-500"
              placeholder='exemple@gmail.com'
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium mb-2">Mot de passe</label>
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
          <button
            type="submit"
            className="w-full bg-indigo-500 text-white py-2 px-4 rounded hover:bg-indigo-600"
          >
            Login
          </button>
        </form>
        <Link href="/Register" className='text-pink-400 hover:underline'>You don't have an account ?</Link>
      </div>
    </div>
  );
}

export async function getServerSideProps({ req, res }) {
  const user = verifyAuth(req, res)

  if (user) {
    return {
      props: {
        session: {
          _id: user._id,
          name: user.name,
          email: user.email,
        }
      },
    }
  }

  return { props: { session: null } }
}