import { Phone } from 'lucide-react'
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { verifyAuth } from '@/middlewares/User';
import Link from 'next/link';
import gsap from 'gsap';

export default function Chat({ session }) {
  const router = useRouter();
  const { id, admin } = router.query;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  const messagesEndRef = useRef(null);
  const parentRef = useRef(null)
  const sendMsgRef = useRef(null)
  const headerRef = useRef(null)

  useEffect(() => {
    if (!session && (!admin || admin != 'slmhh')) {
      window.location.href = "/Login";
    }
  }, [session]);

  useEffect(() => {
    if (id) {
      const fetchMessages = async () => {
        try {
          const response = await fetch(`/api/msgs/get?id=${id}`);
          if (response.ok) {
            const data = await response.json();
            setMessages(data.msgs || []);
          } else {
            console.error('Failed to fetch messages');
          }
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
      };

      fetchMessages();
    } else {
      window.location.href = `/Chat?id=${session._id}`;
    }
  }, [id]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (sender, userID, content) => {
    if (!newMessage.trim()) return;

    try {
      const response = await fetch('/api/msgs/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender, userID, content
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prevMessages => [...prevMessages, data.newMessage]);
        getGeminiResponse(newMessage);
      } else {
        console.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/_auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        window.location.href = '/Login';
      } else {
        console.error('Failed to logout');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const getGeminiResponse = async (msg) => {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyDwVqL80ycP0sMykaPmeq_u7OdCJw35Otc`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: msg }],
            },
          ],
        }),
      }
    );

    const gemini = await res.json();

    try {
      const rawText = gemini?.candidates?.[0]?.content?.parts?.[0]?.text;
      await fetch('/api/msgs/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: 'gemini', userID: id, content: rawText
        }),
      });

      const geminiResponse = {
        sender: 'gemini',
        content: rawText,
        created_At: new Date().toISOString(),
      };

      setMessages(prevMessages => [...prevMessages, geminiResponse]);
      setNewMessage('');
    } catch (err) {
      console.error('Error extracting recommendations:', err);
      alert(['Error reading recommendations.']);
    }
  };

  const handleGoToVoice = () => {
    gsap.to(parentRef.current, {
      x: '100%',
      duration: 0.5,
      ease: 'sine.in'
    })
    setTimeout(() => {
      window.location.href = `/Voice?id=${id}`
    }, 500);
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col" ref={parentRef}>
      <header className="bg-black/60 backdrop-blur-3xl p-4 flex justify-between items-center fixed w-full" ref={headerRef}>
        <h1 className="text-xl font-bold">slm hh chat</h1>
        <button onClick={handleGoToVoice}>
          <Phone className='w-8 h-8 cursor-pointer hover:animate-spin' />
        </button>
        <button
          onClick={handleLogout}
          className="duration-200 bg-gradient-to-l hover:from-pink-900 hover:to-rose-900 text-white px-4 py-2 rounded-xl"
        >
          Logout
        </button>
      </header>
      <div className="flex-grow overflow-y-auto p-4 space-y-4 my-16">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.sender === 'gemini' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-gradient-to-l ${msg.sender === 'gemini' ? 'from-pink-900 to-pink-700' : 'from-blue-500 to-purple-600'
                }`}
            >
              <p>{msg.content}</p>
              <p className="text-xs text-gray-300 mt-1">
                {new Date(msg.created_At).toLocaleString()}
              </p>
            </div>
            {msg.sender === 'gemini' && messages[index - 1]?.sender !== 'gemini' && <img src='/robot.png' className='w-10 h-10' />}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 fixed w-full bottom-0 bg-black/60 backdrop-blur-3xl" ref={sendMsgRef}>
        <div className="flex">
          <input
            type="text"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            className="flex-grow px-4 py-3 rounded-l-3xl bg-black text-white"
            placeholder="Type a message..."
            onKeyPress={e => e.key === 'Enter' && handleSendMessage('user', id, newMessage)}
          />
          <button
            onClick={() => handleSendMessage('user', id, newMessage)}
            className="bg-black duration-200 hover:bg-rose-600 text-white px-4 py-2 rounded-r-3xl"
          >
            Send
          </button>
        </div>
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