
import React, { useState } from 'react';
import { Search, Filter, Download, Eye, Edit, Trash2 } from 'lucide-react';

const UserRecords = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Sample data
  const records = [
    {
      id: 1,
      fullName: 'John Doe',
      userType: 'LPU Student',
      studentNumber: '12345678',
      campus: 'Manila',
      program: 'Computer Science',
      thesisTitle: 'AI-Powered Learning Management System',
      submissionDate: '2024-01-15'
    },
    {
      id: 2,
      fullName: 'Jane Smith',
      userType: 'Non-LPU Student',
      school: 'University of Manila',
      campus: 'Manila',
      thesisTitle: 'Blockchain Technology in Education',
      submissionDate: '2024-01-14'
    },
    {
      id: 3,
      fullName: 'Mike Johnson',
      userType: 'LPU Student',
      studentNumber: '87654321',
      campus: 'Batangas',
      program: 'Engineering',
      thesisTitle: 'Sustainable Energy Solutions',
      submissionDate: '2024-01-13'
    },
    {
      id: 4,
      fullName: 'Sarah Wilson',
      userType: 'LPU Student',
      studentNumber: '11223344',
      campus: 'Cavite',
      program: 'Psychology',
      thesisTitle: 'Mental Health in Digital Age',
      submissionDate: '2024-01-12'
    },
    {
      id: 5,
      fullName: 'David Brown',
      userType: 'Non-LPU Student',
      school: 'Ateneo de Manila',
      campus: 'Makati',
      thesisTitle: 'Social Media Impact on Youth',
      submissionDate: '2024-01-11'
    },
  ];

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.thesisTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'lpu' && record.userType === 'LPU Student') ||
                         (filterType === 'non-lpu' && record.userType === 'Non-LPU Student');
    return matchesSearch && matchesFilter;
  });

  const handleExport = () => {
    console.log('Exporting records...');
    // Implementation for CSV export
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">User Records</h2>
          <p className="text-gray-600">Manage and export submission data</p>
        </div>
        <button 
          onClick={handleExport}
          className="btn-primary flex items-center space-x-2"
        >
          <Download size={16} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or thesis title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="select-field w-auto min-w-[150px]"
          >
            <option value="all">All Users</option>
            <option value="lpu">LPU Students</option>
            <option value="non-lpu">Non-LPU Students</option>
          </select>
        </div>
      </div>

      {/* Records Table */}
      <div className="card-hover overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID/School
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Campus
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thesis Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {record.fullName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      record.userType === 'LPU Student' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {record.userType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.studentNumber || record.school}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.campus}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {record.thesisTitle}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.submissionDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Eye size={16} />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        <Edit size={16} />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Showing {filteredRecords.length} of {records.length} records
        </div>
        <div className="flex space-x-2">
          <button 
            className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <button 
            className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserRecords;
