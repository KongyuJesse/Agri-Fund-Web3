import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    country: '',
    dob: '',
    sex: 'Other'
  });
  const [stats, setStats] = useState({
    farmers: 0,
    ngos: 0,
    pendingFarmers: 0,
    pendingNGOs: 0,
    applications: 0,
    contracts: 0
  });
  const [farmers, setFarmers] = useState([]);
  const [ngos, setNgos] = useState([]);
  const [pendingFarmers, setPendingFarmers] = useState([]);
  const [pendingNGOs, setPendingNGOs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [showUserDetails, setShowUserDetails] = useState(null);
  const [currentView, setCurrentView] = useState('farmers');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token || role !== 'Admin') {
      navigate('/login', { replace: true });
      return;
    }

    loadAllData();
  }, [navigate]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const [
        profileRes, 
        statsRes, 
        farmersRes, 
        pendingFarmersRes, 
        ngosRes, 
        pendingNGOsRes, 
        applicationsRes, 
        contractsRes, 
        logsRes
      ] = await Promise.all([
        fetch('/api/admins/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admins/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admins/farmers', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admins/pending/farmers', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admins/ngos', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admins/pending/ngos', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admins/applications', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admins/contracts', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admins/logs', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (profileRes.ok) setProfile(await profileRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
      if (farmersRes.ok) setFarmers(await farmersRes.json());
      if (pendingFarmersRes.ok) setPendingFarmers(await pendingFarmersRes.json());
      if (ngosRes.ok) setNgos(await ngosRes.json());
      if (pendingNGOsRes.ok) setPendingNGOs(await pendingNGOsRes.json());
      if (applicationsRes.ok) setApplications(await applicationsRes.json());
      if (contractsRes.ok) setContracts(await contractsRes.json());
      if (logsRes.ok) setLogs(await logsRes.json());

      setLoading(false);
    } catch (err) {
      console.error('Error loading data:', err);
      navigate('/login', { replace: true });
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login', { replace: true });
  };

  const handleApprove = async (id, type) => {
    try {
      const endpoint = type === 'farmers' 
        ? `/api/admins/farmers/${id}/approve` 
        : `/api/admins/ngos/${id}/approve`;
      
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (res.ok) {
        loadAllData();
      }
    } catch (err) {
      console.error(`Error approving ${type}:`, err);
    }
  };

  const handleReject = async (id, type) => {
    if (window.confirm(`Are you sure you want to reject this ${type}? This action cannot be undone.`)) {
      try {
        const endpoint = type === 'farmers' 
          ? `/api/admins/farmers/${id}/reject` 
          : `/api/admins/ngos/${id}/reject`;
        
        const res = await fetch(endpoint, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (res.ok) {
          loadAllData();
        }
      } catch (err) {
        console.error(`Error rejecting ${type}:`, err);
      }
    }
  };

  const handleDeleteFarmer = async (id) => {
    if (window.confirm('Are you sure you want to delete this farmer? This action cannot be undone.')) {
      try {
        const res = await fetch(`/api/admins/farmers/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (res.ok) {
          loadAllData();
        }
      } catch (err) {
        console.error('Error deleting farmer:', err);
      }
    }
  };

  const handleDeleteNGO = async (id) => {
    if (window.confirm('Are you sure you want to delete this NGO? This action cannot be undone.')) {
      try {
        const res = await fetch(`/api/admins/ngos/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (res.ok) {
          loadAllData();
        }
      } catch (err) {
        console.error('Error deleting NGO:', err);
      }
    }
  };

  const viewUserDetails = (user, type) => {
    setShowUserDetails({ ...user, type });
  };

  const barChartData = [
    { name: 'Farmers', value: stats.farmers },
    { name: 'NGOs', value: stats.ngos },
    { name: 'Pending Farmers', value: stats.pendingFarmers },
    { name: 'Pending NGOs', value: stats.pendingNGOs },
    { name: 'Applications', value: stats.applications },
    { name: 'Contracts', value: stats.contracts }
  ];

  const overview = (
    <div className="space-y-6">
      <div className="bg-gray-800 p-6 rounded-xl shadow-md border border-blue-700">
        <h2 className="text-2xl font-bold text-blue-400">Welcome, Admin {profile.name}</h2>
        <p className="text-gray-400">Here's an overview of your platform statistics.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Total Farmers', value: stats.farmers, color: 'bg-blue-600' },
          { label: 'Total NGOs', value: stats.ngos, color: 'bg-blue-500' },
          { label: 'Pending Farmers', value: stats.pendingFarmers, color: 'bg-yellow-600' },
          { label: 'Pending NGOs', value: stats.pendingNGOs, color: 'bg-yellow-500' },
          { label: 'Applications', value: stats.applications, color: 'bg-green-600' },
          { label: 'Contracts', value: stats.contracts, color: 'bg-purple-600' }
        ].map((stat, index) => (
          <div key={index} className={`${stat.color} p-6 rounded-xl shadow-md text-white border border-blue-700`}>
            <h3 className="text-lg font-semibold">{stat.label}</h3>
            <p className="text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-gray-800 p-4 rounded-xl shadow-md border border-blue-700">
        <h3 className="text-lg font-semibold text-blue-400 mb-4">Platform Statistics</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
              <XAxis 
                dataKey="name" 
                stroke="#9CA3AF" 
                angle={-45} 
                textAnchor="end"
                height={60}
              />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', borderColor: '#3B82F6' }}
                itemStyle={{ color: '#E5E7EB' }}
              />
              <Legend />
              <Bar dataKey="value" fill="#3B82F6" name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-xl shadow-md border border-blue-700">
        <h3 className="text-lg font-semibold text-blue-400 mb-4">Recent Activity</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {logs.slice(0, 5).map((log, index) => (
            <div key={index} className="p-3 border-b border-gray-700 last:border-b-0 hover:bg-gray-700 rounded">
              <div className="flex justify-between">
                <span className="font-medium text-white">{log.action}</span>
                <span className="text-sm text-gray-400">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-400">Details: {log.details}</p>
            </div>
          ))}
          {logs.length === 0 && (
            <p className="text-gray-400 text-center py-4">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );

  const profilePanel = (
    <div className="bg-gray-800 p-6 rounded-xl shadow-md border border-blue-700">
      <h2 className="text-2xl font-bold text-blue-400 mb-6">Profile Settings</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-md font-medium text-gray-300 mb-2">Basic Information</h4>
          <div className="space-y-2">
            <p><span className="font-medium text-white">Name:</span> {profile.name}</p>
            <p><span className="font-medium text-white">Email:</span> {profile.email}</p>
            <p><span className="font-medium text-white">Role:</span> Admin</p>
            <p><span className="font-medium text-white">Country:</span> {profile.country || 'N/A'}</p>
            <p><span className="font-medium text-white">Gender:</span> {profile.sex || 'N/A'}</p>
            <p><span className="font-medium text-white">Date of Birth:</span> {profile.dob ? new Date(profile.dob).toLocaleDateString() : 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const manageFarmersPanel = (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-blue-400">Manage Farmers</h2>
      </div>

      <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden border border-blue-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Country</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Occupation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {farmers.map((farmer) => (
                <tr key={farmer._id} className="hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{farmer.name || farmer.user?.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">{farmer.user?.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">{farmer.country}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">{farmer.occupation || 'Farmer'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => viewUserDetails(farmer, 'farmer')}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDeleteFarmer(farmer._id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {farmers.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-400">
                    No farmers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showUserDetails && showUserDetails.type === 'farmer' && (
        <div className="bg-gray-800 p-6 rounded-xl shadow-md border border-blue-700">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-blue-400">
              Farmer Details
            </h3>
            <button
              onClick={() => setShowUserDetails(null)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-md font-medium text-gray-300 mb-2">Basic Information</h4>
              <div className="space-y-2">
                <p><span className="font-medium text-white">ID:</span> {showUserDetails._id}</p>
                <p><span className="font-medium text-white">Name:</span> {showUserDetails.name}</p>
                <p><span className="font-medium text-white">Email:</span> {showUserDetails.user?.email}</p>
                <p><span className="font-medium text-white">Country:</span> {showUserDetails.country || 'N/A'}</p>
                <p><span className="font-medium text-white">Gender:</span> {showUserDetails.sex || 'N/A'}</p>
                <p><span className="font-medium text-white">Registered:</span> {new Date(showUserDetails.createdAt).toLocaleString()}</p>
              </div>
            </div>
            
            <div>
              <h4 className="text-md font-medium text-gray-300 mb-2">Farmer Information</h4>
              <div className="space-y-2">
                <p><span className="font-medium text-white">Occupation:</span> {showUserDetails.occupation || 'N/A'}</p>
                <p><span className="font-medium text-white">Education:</span> {showUserDetails.education || 'N/A'}</p>
                <p><span className="font-medium text-white">Address:</span> {showUserDetails.address || 'N/A'}</p>
                <p><span className="font-medium text-white">Bio:</span> {showUserDetails.bio || 'N/A'}</p>
                {showUserDetails.groupName && (
                  <p><span className="font-medium text-white">Group Name:</span> {showUserDetails.groupName}</p>
                )}
                {showUserDetails.photoUrl && (
                  <p>
                    <span className="font-medium text-white">Photo:</span> 
                    <a href={showUserDetails.photoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline ml-2">View</a>
                  </p>
                )}
                {showUserDetails.idDocUrl && (
                  <p>
                    <span className="font-medium text-white">ID Document:</span> 
                    <a href={showUserDetails.idDocUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline ml-2">View</a>
                  </p>
                )}
                {showUserDetails.supportingDocsUrls && showUserDetails.supportingDocsUrls.length > 0 && (
                  <div>
                    <span className="font-medium text-white">Supporting Documents:</span>
                    <div className="mt-1 space-y-1">
                      {showUserDetails.supportingDocsUrls.map((doc, index) => {
                        // Handle both formats of IPFS URLs
                        let ipfsUrl;
                        try {
                          const url = new URL(doc);
                          if (url.pathname.includes('/ipfs/')) {
                            // Handle direct IPFS links
                            ipfsUrl = `https://gateway.pinata.cloud${url.pathname}`;
                          } else {
                            // Handle other URLs
                            ipfsUrl = doc;
                          }
                        } catch {
                          // If it's not a valid URL, assume it's a CID and construct the URL
                          ipfsUrl = `https://gateway.pinata.cloud/ipfs/${doc}`;
                        }
                        
                        // Extract filename for display
                        let filename = `Document ${index + 1}`;
                        try {
                          const url = new URL(doc);
                          const pathParts = url.pathname.split('/');
                          filename = decodeURIComponent(pathParts[pathParts.length - 1]);
                        } catch {
                          // If URL parsing fails, use default filename
                        }
                        
                        return (
                          <div key={index}>
                            <a 
                              href={ipfsUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-blue-400 hover:underline"
                            >
                              {filename}
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const manageNGOsPanel = (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-blue-400">Manage NGOs</h2>
      </div>

      <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden border border-blue-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">NGO Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Country</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date Founded</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {ngos.map((ngo) => (
                <tr key={ngo._id} className="hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{ngo.ngoName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">{ngo.user?.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">{ngo.country}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">
                      {ngo.dateFounded ? new Date(ngo.dateFounded).toLocaleDateString() : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => viewUserDetails(ngo, 'ngo')}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDeleteNGO(ngo._id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {ngos.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-400">
                    No NGOs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showUserDetails && showUserDetails.type === 'ngo' && (
        <div className="bg-gray-800 p-6 rounded-xl shadow-md border border-blue-700">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-blue-400">
              NGO Details
            </h3>
            <button
              onClick={() => setShowUserDetails(null)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-md font-medium text-gray-300 mb-2">Basic Information</h4>
              <div className="space-y-2">
                <p><span className="font-medium text-white">ID:</span> {showUserDetails._id}</p>
                <p><span className="font-medium text-white">NGO Name:</span> {showUserDetails.ngoName}</p>
                <p><span className="font-medium text-white">Email:</span> {showUserDetails.user?.email}</p>
                <p><span className="font-medium text-white">Country:</span> {showUserDetails.country || 'N/A'}</p>
                <p><span className="font-medium text-white">Registered:</span> {new Date(showUserDetails.createdAt).toLocaleString()}</p>
              </div>
            </div>
            
            <div>
              <h4 className="text-md font-medium text-gray-300 mb-2">NGO Information</h4>
              <div className="space-y-2">
                <p><span className="font-medium text-white">Date Founded:</span> {showUserDetails.dateFounded ? new Date(showUserDetails.dateFounded).toLocaleDateString() : 'N/A'}</p>
                <p><span className="font-medium text-white">Address:</span> {showUserDetails.address || 'N/A'}</p>
                <p><span className="font-medium text-white">About:</span> {showUserDetails.about || 'N/A'}</p>
                <p><span className="font-medium text-white">Mission:</span> {showUserDetails.mission || 'N/A'}</p>
                {showUserDetails.legalDocsUrl && (
                  <p>
                    <span className="font-medium text-white">Legal Documents:</span> 
                    <a href={showUserDetails.legalDocsUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline ml-2">View</a>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const manageApprovalsPanel = (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-blue-400">Manage Pending Approvals</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentView('farmers')}
            className={`px-4 py-2 rounded-full ${currentView === 'farmers' ? 'bg-blue-600' : 'bg-gray-700'} text-white border border-blue-700`}
          >
            Farmers ({pendingFarmers.length})
          </button>
          <button
            onClick={() => setCurrentView('ngos')}
            className={`px-4 py-2 rounded-full ${currentView === 'ngos' ? 'bg-blue-600' : 'bg-gray-700'} text-white border border-blue-700`}
          >
            NGOs ({pendingNGOs.length})
          </button>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden border border-blue-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Country</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {(currentView === 'farmers' ? pendingFarmers : pendingNGOs).map((user) => (
                <tr key={user._id} className="hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">
                      {currentView === 'farmers' ? user.name || user.user?.email : user.ngoName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">{user.user?.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">{user.country}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">
                      {currentView === 'farmers' 
                        ? user.occupation || 'Farmer' 
                        : user.mission?.substring(0, 50) + (user.mission?.length > 50 ? '...' : '')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => viewUserDetails(user, currentView)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleApprove(user._id, currentView)}
                      className="text-green-400 hover:text-green-300"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(user._id, currentView)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
              {(currentView === 'farmers' ? pendingFarmers : pendingNGOs).length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-400">
                    No {currentView === 'farmers' ? 'farmers' : 'NGOs'} pending approval
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showUserDetails && (
        <div className="bg-gray-800 p-6 rounded-xl shadow-md border border-blue-700">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-blue-400">
              {showUserDetails.type === 'farmers' ? 'Farmer' : 'NGO'} Details
            </h3>
            <button
              onClick={() => setShowUserDetails(null)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-md font-medium text-gray-300 mb-2">Basic Information</h4>
              <div className="space-y-2">
                <p><span className="font-medium text-white">ID:</span> {showUserDetails._id}</p>
                <p><span className="font-medium text-white">Name:</span> {showUserDetails.type === 'farmers' ? showUserDetails.name : showUserDetails.ngoName}</p>
                <p><span className="font-medium text-white">Email:</span> {showUserDetails.user?.email}</p>
                <p><span className="font-medium text-white">Country:</span> {showUserDetails.country || 'N/A'}</p>
                <p><span className="font-medium text-white">Status:</span> Pending Approval</p>
                <p><span className="font-medium text-white">Registered:</span> {new Date(showUserDetails.createdAt).toLocaleString()}</p>
              </div>
            </div>
            
            <div>
              <h4 className="text-md font-medium text-gray-300 mb-2">
                {showUserDetails.type === 'farmers' ? 'Farmer' : 'NGO'} Information
              </h4>
              {showUserDetails.type === 'farmers' ? (
                <div className="space-y-2">
                  <p><span className="font-medium text-white">Occupation:</span> {showUserDetails.occupation || 'N/A'}</p>
                  <p><span className="font-medium text-white">Education:</span> {showUserDetails.education || 'N/A'}</p>
                  <p><span className="font-medium text-white">Address:</span> {showUserDetails.address || 'N/A'}</p>
                  <p><span className="font-medium text-white">Bio:</span> {showUserDetails.bio || 'N/A'}</p>
                  {showUserDetails.groupName && (
                    <p><span className="font-medium text-white">Group Name:</span> {showUserDetails.groupName}</p>
                  )}
                  {showUserDetails.photoUrl && (
                    <p>
                      <span className="font-medium text-white">Photo:</span> 
                      <a href={showUserDetails.photoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline ml-2">View</a>
                    </p>
                  )}
                  {showUserDetails.idDocUrl && (
                    <p>
                      <span className="font-medium text-white">ID Document:</span> 
                      <a href={showUserDetails.idDocUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline ml-2">View</a>
                    </p>
                  )}
                  {showUserDetails.supportingDocsUrls && showUserDetails.supportingDocsUrls.length > 0 && (
                    <div>
                      <span className="font-medium text-white">Supporting Documents:</span>
                      <div className="mt-1 space-y-1">
                        {showUserDetails.supportingDocsUrls.map((doc, index) => {
                          // Handle both formats of IPFS URLs
                          let ipfsUrl;
                          try {
                            const url = new URL(doc);
                            if (url.pathname.includes('/ipfs/')) {
                              // Handle direct IPFS links
                              ipfsUrl = `https://gateway.pinata.cloud${url.pathname}`;
                            } else {
                              // Handle other URLs
                              ipfsUrl = doc;
                            }
                          } catch {
                            // If it's not a valid URL, assume it's a CID and construct the URL
                            ipfsUrl = `https://gateway.pinata.cloud/ipfs/${doc}`;
                          }
                          
                          // Extract filename for display
                          let filename = `Document ${index + 1}`;
                          try {
                            const url = new URL(doc);
                            const pathParts = url.pathname.split('/');
                            filename = decodeURIComponent(pathParts[pathParts.length - 1]);
                          } catch {
                            // If URL parsing fails, use default filename
                          }
                          
                          return (
                            <div key={index}>
                              <a 
                                href={ipfsUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-blue-400 hover:underline"
                              >
                                {filename}
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <p><span className="font-medium text-white">Date Founded:</span> {showUserDetails.dateFounded ? new Date(showUserDetails.dateFounded).toLocaleDateString() : 'N/A'}</p>
                  <p><span className="font-medium text-white">Address:</span> {showUserDetails.address || 'N/A'}</p>
                  <p><span className="font-medium text-white">About:</span> {showUserDetails.about || 'N/A'}</p>
                  <p><span className="font-medium text-white">Mission:</span> {showUserDetails.mission || 'N/A'}</p>
                  {showUserDetails.legalDocsUrl && (
                    <p>
                      <span className="font-medium text-white">Legal Documents:</span> 
                      <a href={showUserDetails.legalDocsUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline ml-2">View</a>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={() => {
                handleApprove(showUserDetails._id, showUserDetails.type);
                setShowUserDetails(null);
              }}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-full border border-green-700"
            >
              Approve
            </button>
            <button
              onClick={() => {
                handleReject(showUserDetails._id, showUserDetails.type);
                setShowUserDetails(null);
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-full border border-red-700"
            >
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const viewApplicationsPanel = (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-blue-400">View Applications</h2>
      </div>

      <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden border border-blue-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Farmer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">NGO</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {applications.map((app) => (
                <tr key={app._id} className="hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">
                      {app.farmer?.name || app.farmer?.user?.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">
                      {app.ngo?.ngoName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${
                      app.status === 'approved' ? 'text-green-400' : 
                      app.status === 'rejected' ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {app.status}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">
                      {new Date(app.applicationDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => navigate(`/dashboard/admin/applications/${app._id}`)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {applications.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-400">
                    No applications found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const viewContractsPanel = (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-blue-400">View Contracts</h2>
      </div>

      <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden border border-blue-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Farmer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">NGO</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {contracts.map((contract) => (
                <tr key={contract._id} className="hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">
                      {contract.farmer?.name || contract.farmer?.user?.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">
                      {contract.ngo?.ngoName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">
                      ${contract.amount}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${
                      contract.status === 'completed' ? 'text-green-400' : 
                      contract.status === 'terminated' ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {contract.status}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">
                      {new Date(contract.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => navigate(`/dashboard/admin/contracts/${contract._id}`)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {contracts.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-400">
                    No contracts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const auditLogsPanel = (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-blue-400">Audit Logs</h2>
      </div>

      <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden border border-blue-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Target</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">{log.action}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">{log.target}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">{log.details}</div>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-400">
                    No audit logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const tabPanelContent = [
    overview, 
    profilePanel, 
    manageFarmersPanel, 
    manageNGOsPanel, 
    manageApprovalsPanel, 
    viewApplicationsPanel,
    viewContractsPanel,
    auditLogsPanel
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg text-white">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="flex">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gray-800 transition-all duration-300 ease-in-out border-r border-blue-700`}>
          <div className="p-4 flex items-center justify-between">
            {sidebarOpen ? (
              <h1 className="text-xl font-bold text-white">
                <span className="text-blue-400">🌾</span> AGRI-FUND
              </h1>
            ) : (
              <h1 className="text-xl font-bold text-white">🌾</h1>
            )}
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white focus:outline-none hover:text-blue-400"
            >
              {sidebarOpen ? '◄' : '►'}
            </button>
          </div>
          <nav className="mt-6">
            {[
              'Dashboard', 
              'Profile', 
              'Manage Farmers',
              'Manage NGOs', 
              'Manage Approvals',
              'View Applications',
              'View Contracts',
              'Audit Logs'
            ].map((label, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`flex items-center w-full px-4 py-3 text-left ${activeTab === index ? 'bg-gray-700' : 'hover:bg-gray-700'} transition-colors duration-200 border-b border-gray-700`}
              >
                <span className="mr-3">
                  {index === 0 && '📊'}
                  {index === 1 && '👤'}
                  {index === 2 && '👨‍🌾'}
                  {index === 3 && '🏢'}
                  {index === 4 && '✅'}
                  {index === 5 && '📄'}
                  {index === 6 && '📑'}
                  {index === 7 && '📝'}
                </span>
                {sidebarOpen && <span className="text-white">{label}</span>}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-gray-800 shadow-sm border-b border-blue-700">
            <div className="flex items-center justify-between px-6 py-4">
              <h2 className="text-xl font-semibold text-blue-400">
                {[
                  'Dashboard Overview', 
                  'Profile Settings', 
                  'Manage Farmers',
                  'Manage NGOs', 
                  'Manage Pending Approvals',
                  'View Applications',
                  'View Contracts',
                  'Audit Logs'
                ][activeTab]}
              </h2>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold cursor-pointer">
                    {profile.name.charAt(0)}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-500 border border-red-700"
                >
                  Logout
                </button>
              </div>
            </div>
          </header>
          
          {/* Main Content Area */}
          <main className="flex-1 p-6 overflow-auto">
            {tabPanelContent[activeTab]}
          </main>
        </div>
      </div>
    </div>
  );
}