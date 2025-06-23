import { Trash2, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users/get');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleUserClick = (userId) => {
    router.push(`/Chat?id=${userId}`);
  };

  const handleDelete = async (userID) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    const res = await fetch(`/api/users/delete?userID=${userID}`);
    if (res.ok) fetchUsers();
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Liste des Utilisateurs</h1>
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            className="w-full p-2 pl-10 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" />
        </div>
      </div>
      <ul className="space-y-2">
        {filteredUsers.map((user) => (
          <li
            key={user._id}
            onClick={() => handleUserClick(user._id)}
            className="cursor-pointer p-4 bg-pink-800 rounded-lg hover:bg-purple-700 transition-colors flex flex-col relative"
          >
            <Trash2
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(user._id);
              }}
              className="bg-black hover:bg-pink-700 text-white p-2 rounded-full w-10 h-10 self-end absolute top-2 right-2"
            />
            <div className="font-semibold">{user.name}</div>
            <div className="text-gray-300">{user.email}</div>
            <div className="text-gray-400">{user.password}</div>
            <div className="text-gray-400">
              {new Date(user.createdAt).toLocaleDateString('fr-FR')}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
