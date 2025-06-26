import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import Web3 from 'web3';
import detectEthereumProvider from '@metamask/detect-provider';
import io from 'socket.io-client';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
const socket = io(process.env.REACT_APP_API_URL);

export default function FarmerDashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    country: '',
    occupation: '',
    walletAddress: ''
  });
  const [stats, setStats] = useState({
    applications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    contracts: 0,
    activeContracts: 0,
    transactions: 0
  });
  const [applications, setApplications] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [ngos, setNgos] = useState([]);
  const [reports, setReports] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedNgo, setSelectedNgo] = useState(null);
  const [showApplicationDetails, setShowApplicationDetails] = useState(null);
  const [showContractDetails, setShowContractDetails] = useState(null);
  const [showNgoDetails, setShowNgoDetails] = useState(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [newReport, setNewReport] = useState({
    summary: '',
    challenges: '',
    nextSteps: '',
    images: []
  });
  const [newApplication, setNewApplication] = useState({
    ngoId: '',
    projectTitle: '',
    projectDetails: '',
    budget: '',
    timeline: '',
    supportingDocs: []
  });
  const [web3, setWeb3] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [walletConnected, setWalletConnected] = useState(false);
  const [balance, setBalance] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);
  const [selectedContract, setSelectedContract] = useState(null);
  const [signingLoading, setSigningLoading] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);

  // Connect to MetaMask
  const connectWallet = async () => {
    try {
      const provider = await detectEthereumProvider();
      if (provider) {
        const web3Instance = new Web3(provider);
        setWeb3(web3Instance);
        
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        setAccounts(accounts);
        setWalletConnected(true);
        
        await updateWalletAddress(accounts[0]);
        await fetchBalance(accounts[0]);
      } else {
        alert('Please install MetaMask!');
      }
    } catch (error) {
      console.error('Error connecting to MetaMask:', error);
    }
  };

  const disconnectWallet = async () => {
    setWalletConnected(false);
    setAccounts([]);
    setBalance(null);
    setWeb3(null);
    await updateWalletAddress('');
  };

  const fetchBalance = async (address) => {
    if (!web3) return;
    try {
      const balance = await web3.eth.getBalance(address);
      const etherBalance = web3.utils.fromWei(balance, 'ether');
      setBalance(etherBalance);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const updateWalletAddress = async (address) => {
    try {
      const res = await fetch('/api/farmers/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ walletAddress: address })
      });
      
      if (res.ok) {
        const data = await res.json();
        setProfile({...profile, walletAddress: address});
      }
    } catch (err) {
      console.error('Error updating wallet address:', err);
    }
  };

  const handleSignContract = async () => {
    if (!selectedContract || !signatureFile) {
      alert('Please select a contract and upload a signature file');
      return;
    }

    try {
      setSigningLoading(true);
      
      const formData = new FormData();
      formData.append('contractId', selectedContract.contractId);
      formData.append('signerRole', 'Farmer');
      formData.append('signatureFile', signatureFile);

      const res = await fetch('/api/contracts/sign', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to sign contract');
      }

      alert('Contract signed successfully!');
      loadContracts();
      setShowSignModal(false);
      setSignatureFile(null);
    } catch (err) {
      console.error('Error signing contract:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setSigningLoading(false);
    }
  };

  const loadContracts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/farmers/contracts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setContracts(await res.json());
      }
    } catch (err) {
      console.error('Error loading contracts:', err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token || role !== 'Farmer') {
      navigate('/login', { replace: true });
      return;
    }

    loadAllData();
    checkWalletConnection();

    // Setup socket.io listeners
    socket.on('newMessage', (message) => {
      if (message.sender === selectedNgo?._id || message.receiver === selectedNgo?._id) {
        setMessages(prev => [...prev, message]);
      }
    });

    socket.on('contractUpdate', () => {
      loadAllData();
    });

    socket.on('applicationUpdate', () => {
      loadAllData();
    });

    return () => {
      socket.off('newMessage');
      socket.off('contractUpdate');
      socket.off('applicationUpdate');
    };
  }, [navigate, selectedNgo]);

  const checkWalletConnection = async () => {
    try {
      const provider = await detectEthereumProvider();
      if (provider) {
        const web3Instance = new Web3(provider);
        setWeb3(web3Instance);
        
        const accounts = await web3Instance.eth.getAccounts();
        if (accounts.length > 0) {
          setAccounts(accounts);
          setWalletConnected(true);
          await fetchBalance(accounts[0]);
        }
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  };

  const loadAllData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [profileRes, statsRes, applicationsRes, contractsRes, transactionsRes, reportsRes, ngosRes] = await Promise.all([
        fetch('/api/farmers/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/farmers/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/applications/my-applications', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/farmers/contracts', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/transactions/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/reports', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/farmers/available-ngos', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (profileRes.ok) setProfile(await profileRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
      if (applicationsRes.ok) setApplications(await applicationsRes.json());
      if (contractsRes.ok) setContracts(await contractsRes.json());
      if (transactionsRes.ok) setTransactions(await transactionsRes.json());
      if (reportsRes.ok) setReports(await reportsRes.json());
      if (ngosRes.ok) setNgos(await ngosRes.json());

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

  const handleApplyToNGO = async (ngoId) => {
    try {
      const res = await fetch('/api/applications/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newApplication)
      });
      
      if (res.ok) {
        loadAllData();
        setShowApplicationForm(false);
        setShowNgoDetails(null);
        setNewApplication({
          ngoId: '',
          projectTitle: '',
          projectDetails: '',
          budget: '',
          timeline: '',
          supportingDocs: []
        });
      }
    } catch (err) {
      console.error('Error applying to NGO:', err);
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('summary', newReport.summary);
      formData.append('challenges', newReport.challenges);
      formData.append('nextSteps', newReport.nextSteps);
      
      if (showReportForm.contractId) {
        formData.append('contractId', showReportForm.contractId);
      }

      // Append all images
      newReport.images.forEach((file, index) => {
        formData.append(`images`, file);
      });

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      if (res.ok) {
        loadAllData();
        setShowReportForm(false);
        setNewReport({
          summary: '',
          challenges: '',
          nextSteps: '',
          images: []
        });
      }
    } catch (err) {
      console.error('Error submitting report:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedNgo) return;
    
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          receiver: selectedNgo.user._id,
          content: newMessage
        })
      });

      if (res.ok) {
        const message = await res.json();
        setMessages(prev => [...prev, message]);
        setNewMessage('');
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleFileChange = (e, field) => {
    if (field === 'signature') {
      setSignatureFile(e.target.files[0]);
    } else if (field === 'reportImages') {
      setNewReport({
        ...newReport,
        images: [...newReport.images, ...Array.from(e.target.files)]
      });
    } else if (field === 'supportingDocs') {
      setNewApplication({
        ...newApplication,
        supportingDocs: [...newApplication.supportingDocs, ...Array.from(e.target.files)]
      });
    }
  };

  const handleApplicationChange = (e) => {
    const { name, value } = e.target;
    setNewApplication({
      ...newApplication,
      [name]: value
    });
  };

  const barChartData = [
    { name: 'Applications', value: stats.applications },
    { name: 'Pending', value: stats.pendingApplications },
    { name: 'Approved', value: stats.approvedApplications },
    { name: 'Contracts', value: stats.contracts },
    { name: 'Active', value: stats.activeContracts }
  ];

  const pieChartData = [
    { name: 'Applications', value: stats.applications },
    { name: 'Contracts', value: stats.contracts },
    { name: 'Transactions', value: stats.transactions }
  ];

  const overview = (
    <div className="space-y-6">
      <div className="bg-gray-800 p-6 rounded-xl shadow-md border border-gray-700">
        <h2 className="text-2xl font-bold text-blue-400">Welcome, {profile.name}</h2>
        <p className="text-gray-300">Here's an overview of your activities.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Applications', value: stats.applications, color: 'bg-indigo-600' },
          { label: 'Pending Applications', value: stats.pendingApplications, color: 'bg-yellow-500' },
          { label: 'Approved Applications', value: stats.approvedApplications, color: 'bg-green-500' },
          { label: 'Total Contracts', value: stats.contracts, color: 'bg-blue-600' },
          { label: 'Active Contracts', value: stats.activeContracts, color: 'bg-blue-500' },
          { label: 'Transactions', value: stats.transactions, color: 'bg-purple-600' }
        ].map((stat, index) => (
          <div key={index} className={`${stat.color} p-6 rounded-xl shadow-md border border-gray-700 text-white`}>
            <h3 className="text-lg font-semibold">{stat.label}</h3>
            <p className="text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 p-4 rounded-xl shadow-md border border-gray-700">
          <h3 className="text-lg font-semibold text-blue-400 mb-4">Activity Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="name" 
                  stroke="#9CA3AF" 
                  angle={-45} 
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', borderColor: '#4B5563', borderRadius: '0.5rem' }}
                  itemStyle={{ color: '#E5E7EB' }}
                />
                <Legend />
                <Bar dataKey="value" fill="#818CF8" name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-xl shadow-md border border-gray-700">
          <h3 className="text-lg font-semibold text-blue-400 mb-4">Platform Engagement</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', borderColor: '#4B5563', borderRadius: '0.5rem' }}
                  itemStyle={{ color: '#E5E7EB' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  const ngosPanel = (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-blue-400">Available NGOs</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ngos.map(ngo => (
          <div key={ngo._id} className="bg-gray-800 p-6 rounded-xl shadow-md border border-gray-700">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                {ngo.ngoName.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{ngo.ngoName}</h3>
                <p className="text-sm text-gray-400">{ngo.country}</p>
              </div>
            </div>
            <div className="mb-4">
              <h4 className="text-md font-medium text-blue-400 mb-2">Mission</h4>
              <p className="text-gray-300 text-sm">{ngo.mission.substring(0, 100)}...</p>
            </div>
            <div className="flex justify-between items-center">
              <button
                onClick={() => setShowNgoDetails(ngo)}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                View Details
              </button>
              <button
                onClick={() => {
                  setNewApplication({
                    ...newApplication,
                    ngoId: ngo._id
                  });
                  setShowApplicationForm(true);
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-full text-sm"
              >
                Apply
              </button>
            </div>
          </div>
        ))}
        {ngos.length === 0 && (
          <div className="col-span-3 text-center py-8 text-gray-400">
            No NGOs available at the moment
          </div>
        )}
      </div>

      {showNgoDetails && (
        <div className="bg-gray-800 p-6 rounded-xl shadow-md border border-gray-700">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-blue-400">
              {showNgoDetails.ngoName}
            </h3>
            <button
              onClick={() => setShowNgoDetails(null)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-md font-medium text-gray-300 mb-2">Organization Information</h4>
              <div className="space-y-2">
                <p><span className="font-medium text-white">Name:</span> {showNgoDetails.ngoName}</p>
                <p><span className="font-medium text-white">Country:</span> {showNgoDetails.country}</p>
                <p><span className="font-medium text-white">Date Founded:</span> {new Date(showNgoDetails.dateFounded).toLocaleDateString()}</p>
                <p><span className="font-medium text-white">Address:</span> {showNgoDetails.address}</p>
              </div>
            </div>
            
            <div>
              <h4 className="text-md font-medium text-gray-300 mb-2">About</h4>
              <div className="bg-gray-700 p-3 rounded-lg mb-4">
                <p className="text-gray-300">{showNgoDetails.about}</p>
              </div>
              
              <h4 className="text-md font-medium text-gray-300 mb-2">Mission</h4>
              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="text-gray-300">{showNgoDetails.mission}</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={() => {
                setNewApplication({
                  ...newApplication,
                  ngoId: showNgoDetails._id
                });
                setShowApplicationForm(true);
              }}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-full"
            >
              Apply to this NGO
            </button>
          </div>
        </div>
      )}

      {showApplicationForm && (
        <div className="bg-gray-800 p-6 rounded-xl shadow-md border border-gray-700">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-blue-400">
              New Application
            </h3>
            <button
              onClick={() => setShowApplicationForm(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          
          <form className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Project Title</label>
                <input
                  type="text"
                  name="projectTitle"
                  value={newApplication.projectTitle}
                  onChange={handleApplicationChange}
                  className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Project Details</label>
                <textarea
                  name="projectDetails"
                  value={newApplication.projectDetails}
                  onChange={handleApplicationChange}
                  className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                  required
                  rows={4}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Budget (ETH)</label>
                  <input
                    type="number"
                    name="budget"
                    value={newApplication.budget}
                    onChange={handleApplicationChange}
                    className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Timeline</label>
                  <input
                    type="text"
                    name="timeline"
                    value={newApplication.timeline}
                    onChange={handleApplicationChange}
                    className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                    required
                    placeholder="e.g., 6 months"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Supporting Documents</label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => handleFileChange(e, 'supportingDocs')}
                  className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                  accept=".pdf,.doc,.docx,.png,.jpg"
                />
                {newApplication.supportingDocs.length > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    {newApplication.supportingDocs.length} file(s) selected
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowApplicationForm(false)}
                className="px-4 py-2 border border-gray-600 text-white rounded-full hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleApplyToNGO(newApplication.ngoId)}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-full"
              >
                Submit Application
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );

  const applicationsPanel = (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-blue-400">My Applications</h2>
      </div>

      <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">NGO</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {applications.map((app) => (
                <tr key={app._id} className="hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{app.ngo?.ngoName || app.ngo?.user?.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">
                      {new Date(app.applicationDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      app.status === 'Approved' ? 'bg-green-500' : 
                      app.status === 'Rejected' ? 'bg-red-500' : 'bg-yellow-500'
                    } text-white`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">
                      {app.projectTitle}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setShowApplicationDetails(app)}
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

      {showApplicationDetails && (
        <div className="bg-gray-800 p-6 rounded-xl shadow-md border border-gray-700">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-blue-400">
              Application Details
            </h3>
            <button
              onClick={() => setShowApplicationDetails(null)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-md font-medium text-gray-300 mb-2">NGO Information</h4>
              <div className="space-y-2">
                <p><span className="font-medium text-white">Name:</span> {showApplicationDetails.ngo?.ngoName || 'N/A'}</p>
                <p><span className="font-medium text-white">Country:</span> {showApplicationDetails.ngo?.country || 'N/A'}</p>
              </div>
            </div>
            
            <div>
              <h4 className="text-md font-medium text-gray-300 mb-2">Project Details</h4>
              <div className="space-y-2">
                <p><span className="font-medium text-white">Project Title:</span> {showApplicationDetails.projectTitle || 'N/A'}</p>
                <p><span className="font-medium text-white">Project Description:</span></p>
                <div className="bg-gray-700 p-3 rounded-lg">
                  {showApplicationDetails.projectDetails}
                </div>
                <p><span className="font-medium text-white">Budget:</span> {showApplicationDetails.budget || 'N/A'} ETH</p>
                <p><span className="font-medium text-white">Timeline:</span> {showApplicationDetails.timeline || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const contractsPanel = (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-blue-400">My Contracts</h2>
      </div>

      <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Contract ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">NGO</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {contracts.map((contract) => (
                <tr key={contract._id} className="hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{contract.contractId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">{contract.ngo?.ngoName || contract.ngo?.user?.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">{contract.amount} ETH</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      contract.status === 'Active' ? 'bg-green-500' : 
                      contract.status === 'Completed' ? 'bg-blue-500' : 'bg-yellow-500'
                    } text-white`}>
                      {contract.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => {
                        setSelectedContract(contract);
                        setShowContractDetails(contract);
                      }}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      View
                    </button>
                    {contract.status === 'Created' && (
                      <button
                        onClick={() => {
                          setSelectedContract(contract);
                          setShowSignModal(true);
                        }}
                        className="text-green-400 hover:text-green-300"
                      >
                        Sign
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {contracts.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-400">
                    No contracts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showContractDetails && (
        <div className="bg-gray-800 p-6 rounded-xl shadow-md border border-gray-700">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-blue-400">
              Contract {showContractDetails.contractId}
            </h3>
            <button
              onClick={() => setShowContractDetails(null)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-md font-medium text-gray-300 mb-2">Parties</h4>
              <div className="space-y-2">
                <p><span className="font-medium text-white">Farmer:</span> {profile.name}</p>
                <p><span className="font-medium text-white">NGO:</span> {showContractDetails.ngo?.ngoName || showContractDetails.ngo?.user?.email}</p>
              </div>
              
              <h4 className="text-md font-medium text-gray-300 mt-4 mb-2">Terms</h4>
              <div className="space-y-2">
                <p><span className="font-medium text-white">Amount:</span> {showContractDetails.amount} ETH</p>
                <p><span className="font-medium text-white">Status:</span> {showContractDetails.status}</p>
                <p><span className="font-medium text-white">Created:</span> {new Date(showContractDetails.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div>
              <h4 className="text-md font-medium text-gray-300 mb-2">Contract Document</h4>
              <a 
                href={showContractDetails.ipfsHash}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300"
              >
                View Contract Document
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Sign Contract Modal */}
      {showSignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-xl shadow-md border border-gray-700 w-full max-w-md">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-blue-400">
                Sign Contract {selectedContract?.contractId}
              </h3>
              <button
                onClick={() => {
                  setShowSignModal(false);
                  setSignatureFile(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Upload Signed Document</label>
                <input
                  type="file"
                  onChange={(e) => handleFileChange(e, 'signature')}
                  className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                  accept=".pdf,.doc,.docx,.png,.jpg"
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowSignModal(false);
                    setSignatureFile(null);
                  }}
                  className="px-4 py-2 border border-gray-600 text-white rounded-full hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSignContract}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-full flex items-center"
                  disabled={!signatureFile || signingLoading}
                >
                  {signingLoading && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {signingLoading ? 'Signing...' : 'Sign Contract'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const walletPanel = (
    <div className="space-y-6">
      <div className="bg-gray-800 p-6 rounded-xl shadow-md border border-gray-700">
        <h2 className="text-2xl font-bold text-blue-400">Wallet Connection</h2>
        <p className="text-gray-300">Connect your MetaMask wallet to receive funds</p>
      </div>

      <div className="bg-gray-800 p-6 rounded-xl shadow-md border border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-400">MetaMask Wallet</h3>
            <p className="text-gray-300">
              {walletConnected ? 'Connected' : 'Not connected'}
            </p>
            {walletConnected && (
              <p className="text-gray-300 mt-2">
                <span className="font-medium text-white">Address:</span> {accounts[0]}
              </p>
            )}
          </div>
          {walletConnected ? (
            <button
              onClick={disconnectWallet}
              className="px-6 py-3 rounded-full font-semibold bg-red-600 hover:bg-red-500 text-white"
            >
              Disconnect Wallet
            </button>
          ) : (
            <button
              onClick={connectWallet}
              className="px-6 py-3 rounded-full font-semibold bg-blue-600 hover:bg-blue-500 text-white"
            >
              Connect Wallet
            </button>
          )}
        </div>

        {walletConnected && (
          <div className="mt-6">
            <h4 className="text-md font-medium text-blue-400 mb-2">Current Balance</h4>
            <div className="bg-gray-700 p-4 rounded-lg">
              <p className="text-white text-xl font-bold">{balance ? `${balance} ETH` : 'Loading balance...'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const profilePanel = (
    <div className="space-y-6">
      <div className="bg-gray-800 p-6 rounded-xl shadow-md border border-gray-700">
        <h2 className="text-2xl font-bold text-blue-400">Profile Settings</h2>
      </div>

      <div className="bg-gray-800 p-6 rounded-xl shadow-md border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-md font-medium text-blue-400 mb-2">Personal Information</h4>
            <div className="space-y-2">
              <p><span className="font-medium text-white">Name:</span> {profile.name}</p>
              <p><span className="font-medium text-white">Email:</span> {profile.email || profile.user?.email}</p>
              <p><span className="font-medium text-white">Occupation:</span> {profile.occupation}</p>
              <p><span className="font-medium text-white">Country:</span> {profile.country}</p>
              <p><span className="font-medium text-white">Wallet Address:</span> {profile.walletAddress || 'Not connected'}</p>
            </div>
          </div>
          
          <div>
            <h4 className="text-md font-medium text-blue-400 mb-2">About</h4>
            <div className="bg-gray-700 p-4 rounded-lg">
              <p className="text-gray-300">{profile.bio || 'No bio provided'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const reportsPanel = (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-blue-400">Progress Reports</h2>
        <button 
          onClick={() => setShowReportForm({ contractId: null })}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-full"
        >
          New Report
        </button>
      </div>

      {showReportForm && (
        <div className="bg-gray-800 p-6 rounded-xl shadow-md border border-gray-700">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-blue-400">
              {showReportForm.contractId ? 'Contract Report' : 'General Report'}
            </h3>
            <button
              onClick={() => setShowReportForm(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          
          <form onSubmit={handleSubmitReport} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {showReportForm.contractId && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Contract ID</label>
                  <input
                    type="text"
                    value={showReportForm.contractId}
                    readOnly
                    className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 placeholder-gray-400"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Summary</label>
                <textarea
                  placeholder="What progress have you made?"
                  value={newReport.summary}
                  onChange={(e) => setNewReport({...newReport, summary: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                  required
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Challenges</label>
                <textarea
                  placeholder="What challenges are you facing?"
                  value={newReport.challenges}
                  onChange={(e) => setNewReport({...newReport, challenges: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Next Steps</label>
                <textarea
                  placeholder="What are your next steps?"
                  value={newReport.nextSteps}
                  onChange={(e) => setNewReport({...newReport, nextSteps: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Images</label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => handleFileChange(e, 'reportImages')}
                  className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                  accept="image/*"
                />
                {newReport.images.length > 0 && (
                  <p className="text-xs text-gray-400 mt-1">{newReport.images.length} file(s) selected</p>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowReportForm(false)}
                className="px-4 py-2 border border-gray-600 text-white rounded-full hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-full"
              >
                Submit Report
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Contract</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Summary</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {reports.map((report) => (
                <tr key={report._id} className="hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">
                      {new Date(report.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">
                      {report.contract?.contractId || 'General'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-300">
                      {report.summary.substring(0, 50)}...
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      report.status === 'Reviewed' ? 'bg-green-500' : 
                      report.status === 'Completed' ? 'bg-blue-500' : 'bg-yellow-500'
                    } text-white`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedNgo(report.ngo)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      Chat
                    </button>
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-400">
                    No reports found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const messagesPanel = (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-blue-400">
          {selectedNgo ? `Messages with ${selectedNgo.ngoName}` : 'Select an NGO to message'}
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-gray-800 rounded-xl shadow-md border border-gray-700">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-blue-400 mb-4">NGOs</h3>
            <div className="space-y-2">
              {ngos.map(ngo => (
                <div 
                  key={ngo._id} 
                  className={`p-3 rounded-lg cursor-pointer ${selectedNgo?._id === ngo._id ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
                  onClick={() => setSelectedNgo(ngo)}
                >
                  <p className="font-medium text-white">{ngo.ngoName}</p>
                  <p className="text-xs text-gray-400">{ngo.country}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-gray-800 rounded-xl shadow-md border border-gray-700">
          <div className="p-4">
            {selectedNgo ? (
              <>
                <div className="h-96 overflow-y-auto mb-4 space-y-3">
                  {messages.length > 0 ? (
                    messages.map((msg, i) => (
                      <div 
                        key={i} 
                        className={`p-3 rounded-lg ${msg.sender === profile.user?._id ? 'bg-blue-600' : 'bg-gray-700'}`}
                      >
                        <p className="text-white">{msg.content}</p>
                        <p className="text-xs text-gray-300 mt-1">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-center py-4">No messages yet</p>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg"
                  >
                    Send
                  </button>
                </div>
              </>
            ) : (
              <p className="text-gray-400 text-center py-4">Select an NGO from the list to start chatting</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const tabPanelContent = [
    overview, 
    ngosPanel, 
    applicationsPanel, 
    contractsPanel, 
    walletPanel, 
    profilePanel,
    reportsPanel,
    messagesPanel
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
        <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gray-800 transition-all duration-300 ease-in-out border-r border-gray-700`}>
          <div className="p-4 flex items-center justify-between border-b border-gray-700">
            {sidebarOpen ? (
              <h1 className="text-xl font-bold text-blue-400">🌾 AGRI-FUND</h1>
            ) : (
              <h1 className="text-xl font-bold text-blue-400">🌾</h1>
            )}
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-white focus:outline-none"
            >
              {sidebarOpen ? '◄' : '►'}
            </button>
          </div>
          <nav className="mt-6">
            {[
              'Dashboard', 
              'Available NGOs', 
              'My Applications', 
              'My Contracts', 
              'Connect Wallet',
              'Profile',
              'Progress Reports',
              'Messages'
            ].map((label, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`flex items-center w-full px-4 py-3 text-left ${activeTab === index ? 'bg-gray-700' : 'hover:bg-gray-700'} transition-colors duration-200 border-b border-gray-700`}
              >
                <span className="mr-3 text-blue-400">
                  {index === 0 && '📊'}
                  {index === 1 && '🏛️'}
                  {index === 2 && '📝'}
                  {index === 3 && '📑'}
                  {index === 4 && '🔗'}
                  {index === 5 && '👤'}
                  {index === 6 && '📋'}
                  {index === 7 && '💬'}
                </span>
                {sidebarOpen && <span className="text-gray-300">{label}</span>}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-gray-800 shadow-sm border-b border-gray-700">
            <div className="flex items-center justify-between px-6 py-4">
              <h2 className="text-xl font-semibold text-blue-400">
                {[
                  'Dashboard Overview', 
                  'Available NGOs', 
                  'My Applications', 
                  'My Contracts', 
                  'Wallet Connection',
                  'Profile Settings',
                  'Progress Reports',
                  'Messages'
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
                  className="px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-500"
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