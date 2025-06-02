
import React from 'react';

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLogin: string;
  created: string;
}

interface UserStatsProps {
  users: UserData[];
}

const UserStats: React.FC<UserStatsProps> = ({ users }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="card-hover p-4 text-center">
        <div className="text-2xl font-bold text-gray-800">{users.length}</div>
        <div className="text-sm text-gray-600">Total Users</div>
      </div>
      <div className="card-hover p-4 text-center">
        <div className="text-2xl font-bold text-red-600">
          {users.filter(u => u.role === 'Admin').length}
        </div>
        <div className="text-sm text-gray-600">Admin Users</div>
      </div>
      <div className="card-hover p-4 text-center">
        <div className="text-2xl font-bold text-blue-600">
          {users.filter(u => u.role === 'Reader').length}
        </div>
        <div className="text-sm text-gray-600">Reader Users</div>
      </div>
      <div className="card-hover p-4 text-center">
        <div className="text-2xl font-bold text-green-600">
          {users.filter(u => u.status === 'Active').length}
        </div>
        <div className="text-sm text-gray-600">Active Users</div>
      </div>
    </div>
  );
};

export default UserStats;
