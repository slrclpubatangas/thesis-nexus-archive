
import React from 'react';
import { Search } from 'lucide-react';

interface UserSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const UserSearch: React.FC<UserSearchProps> = ({ searchTerm, onSearchChange }) => {
  return (
    <div className="relative max-w-md">
      <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
      <input
        type="text"
        placeholder="Search users..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="input-field pl-10"
      />
    </div>
  );
};

export default UserSearch;
