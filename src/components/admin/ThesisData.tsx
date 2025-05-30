
import React, { useState } from 'react';
import { Upload, FileText, Search, Plus, Edit, Trash2, Download } from 'lucide-react';

const ThesisData = () => {
  const [activeView, setActiveView] = useState<'upload' | 'manage'>('upload');
  const [searchTerm, setSearchTerm] = useState('');

  // Sample thesis data
  const thesesData = [
    {
      id: 1,
      title: 'AI-Powered Learning Management System',
      author: 'John Doe',
      year: 2024,
      program: 'Computer Science',
      advisor: 'Dr. Smith',
      keywords: 'AI, Education, LMS',
      status: 'Published'
    },
    {
      id: 2,
      title: 'Blockchain Technology in Education',
      author: 'Jane Smith',
      year: 2024,
      program: 'Computer Science',
      advisor: 'Dr. Johnson',
      keywords: 'Blockchain, Education, Security',
      status: 'Under Review'
    },
    {
      id: 3,
      title: 'Sustainable Energy Solutions',
      author: 'Mike Johnson',
      year: 2023,
      program: 'Engineering',
      advisor: 'Dr. Brown',
      keywords: 'Energy, Sustainability, Environment',
      status: 'Published'
    },
  ];

  const filteredTheses = thesesData.filter(thesis =>
    thesis.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    thesis.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    thesis.keywords.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Thesis Data Management</h2>
          <p className="text-gray-600">Upload and manage thesis records</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setActiveView('upload')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeView === 'upload'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            CSV Upload
          </button>
          <button
            onClick={() => setActiveView('manage')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeView === 'manage'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Manage Data
          </button>
        </div>
      </div>

      {activeView === 'upload' ? (
        // CSV Upload Section
        <div className="card-hover p-8">
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Upload Thesis Data
            </h3>
            <p className="text-gray-600 mb-6">
              Upload a CSV file containing thesis records to bulk import data
            </p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-red-400 transition-colors cursor-pointer">
              <input
                type="file"
                accept=".csv"
                className="hidden"
                id="csv-upload"
                onChange={(e) => {
                  console.log('File selected:', e.target.files?.[0]);
                }}
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <div className="space-y-3">
                  <FileText className="mx-auto h-8 w-8 text-gray-400" />
                  <div>
                    <span className="text-red-600 font-medium">Click to upload</span>
                    <span className="text-gray-600"> or drag and drop</span>
                  </div>
                  <p className="text-sm text-gray-500">CSV files only</p>
                </div>
              </label>
            </div>

            <div className="mt-6 flex justify-center space-x-3">
              <button className="btn-primary">
                Process Upload
              </button>
              <button className="btn-secondary flex items-center space-x-2">
                <Download size={16} />
                <span>Download Template</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Manage Data Section
        <div className="space-y-6">
          {/* Search and Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search thesis records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <button className="btn-primary flex items-center space-x-2">
              <Plus size={16} />
              <span>Add New Thesis</span>
            </button>
          </div>

          {/* Thesis Records Table */}
          <div className="card-hover overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Author
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Program
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Year
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTheses.map((thesis) => (
                    <tr key={thesis.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 max-w-xs">
                          {thesis.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          Advisor: {thesis.advisor}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {thesis.author}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {thesis.program}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {thesis.year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          thesis.status === 'Published' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {thesis.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
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
        </div>
      )}
    </div>
  );
};

export default ThesisData;
