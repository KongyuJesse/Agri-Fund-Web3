import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import Web3 from 'web3';
import detectEthereumProvider from '@metamask/detect-provider';
import { io } from 'socket.io-client';
import axios from 'axios';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

export default function NgoDashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    ngoName: '',
    email: '',
    country: '',
    dateFounded: '',
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
  const [showApplicationDetails, setShowApplicationDetails] = useState(null);
  const [showContractForm, setShowContractForm] = useState(false);
  const [showFundsForm, setShowFundsForm] = useState(null);
  const [newContract, setNewContract] = useState({
    farmerId: '',
    amount: '',
    ipfsHash: '',
    file: null
  });
  const [web3, setWeb3] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [walletConnected, setWalletConnected] = useState(false);
  const [balance, setBalance] = useState(null);
  const [reports, setReports] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [farmers, setFarmers] = useState([]);
  const [contractBalanceError, setContractBalanceError] = useState('');
  const [farmerDetails, setFarmerDetails] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);
  const [signingContract, setSigningContract] = useState(null);
  const [disbursingContract, setDisbursingContract] = useState(null);

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

        // Listen for account changes
        provider.on('accountsChanged', (newAccounts) => {
          setAccounts(newAccounts);
          if (newAccounts.length > 0) {
            fetchBalance(newAccounts[0]);
            updateWalletAddress(newAccounts[0]);
          } else {
            setWalletConnected(false);
            setBalance(null);
          }
        });

        // Listen for chain changes
        provider.on('chainChanged', () => {
          window.location.reload();
        });
      } else {
        alert('Please install MetaMask!');
      }
    } catch (error) {
      console.error('Error connecting to MetaMask:', error);
    }
  };

  const disconnectWallet = async () => {
    if (web3 && web3.currentProvider && web3.currentProvider.removeAllListeners) {
      web3.currentProvider.removeAllListeners();
    }
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
      const res = await fetch('/api/ngos/wallet', {
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

  const handleCreateContract = async (e) => {
    e.preventDefault();
    try {
      if (!newContract.farmerId || !newContract.amount || !newContract.file) {
        throw new Error('Please fill all required fields');
      }

      const formData = new FormData();
      formData.append('file', newContract.file);

      const uploadRes = await fetch('/api/upload/contract', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        throw new Error(errorData.message || 'File upload failed');
      }

      const uploadResult = await uploadRes.json();
      
      const ipfsData = {
        ipfsHash: uploadResult.ipfsHash,
        pinataUrl: uploadResult.pinataUrl
      };

      const contractRes = await fetch('/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          farmerId: newContract.farmerId,
          amount: parseFloat(newContract.amount),
          ipfsHash: ipfsData.ipfsHash
        })
      });

      if (!contractRes.ok) {
        const errorData = await contractRes.json();
        throw new Error(errorData.message || 'Contract creation failed');
      }

      setNewContract({
        farmerId: '',
        amount: '',
        ipfsHash: '',
        file: null
      });
      setShowContractForm(false);
      loadAllData();
      
      alert('Contract created successfully!');
    } catch (err) {
      console.error('Contract creation error:', err);
      alert(`Error: ${err.message}`);
    }
  };

  const handleSignContract = async (contractId) => {
    try {
      if (!signatureFile) {
        throw new Error('Please upload your signature file');
      }

      const formData = new FormData();
      formData.append('signatureFile', signatureFile);
      formData.append('contractId', contractId);
      formData.append('signerRole', 'NGO');

      const res = await fetch('/api/contracts/sign', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Contract signing failed');
      }

      const result = await res.json();
      setSigningContract(null);
      setSignatureFile(null);
      loadAllData();
      alert('Contract signed successfully!');
    } catch (err) {
      console.error('Error signing contract:', err);
      alert(`Error: ${err.message}`);
    }
  };

  // Updated Disbursement Handler
  const handleDisburse = async (contractId) => {
    try {
      setDisbursingContract(contractId);
      
      // Get private key securely (from state or secure storage)
      const privateKey = await getPrivateKey(); // Implement your secure storage method
      
      if (!privateKey || !privateKey.startsWith('0x')) {
        throw new Error('Invalid private key format');
      }

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/contracts/${contractId}/disburse`,
        { privateKey },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      console.log('Disbursement successful:', response.data);
      loadAllData();
      setShowFundsForm(null);
      setDisbursingContract(null);
      alert('Funds disbursed successfully!');
    } catch (error) {
      console.error('Disbursement failed:', error.response?.data || error.message);
      setDisbursingContract(null);
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const [profileRes, statsRes, applicationsRes, contractsRes, transactionsRes, reportsRes, farmersRes] = await Promise.all([
        fetch('/api/ngos/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/ngos/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/ngos/applications', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/contracts', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/transactions/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/ngos/reports', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/ngos/farmers', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (profileRes.ok) setProfile(await profileRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
      if (applicationsRes.ok) setApplications(await applicationsRes.json());
      if (contractsRes.ok) setContracts(await contractsRes.json());
      if (transactionsRes.ok) setTransactions(await transactionsRes.json());
      if (reportsRes.ok) setReports(await reportsRes.json());
      if (farmersRes.ok) setFarmers(await farmersRes.json());

      setLoading(false);
    } catch (err) {
      console.error('Error loading data:', err);
      setLoading(false);
      navigate('/login', { replace: true });
    }
  };

  // WebSocket Connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token || role !== 'NGO') {
      navigate('/login', { replace: true });
      return;
    }

    loadAllData();
    checkWalletConnection();

    // Updated WebSocket connection
    const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      path: '/api/socket.io',
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000
    });

    socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    socket.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err);
    });

    socket.on('newMessage', (message) => {
      if (message.sender === selectedFarmer?._id || message.receiver === selectedFarmer?._id) {
        setMessages(prev => [...prev, message]);
      }
    });

    socket.on('contractUpdate', (data) => {
      console.log('Contract update:', data);
      loadAllData();
    });

    socket.on('applicationUpdate', () => {
      loadAllData();
    });

    return () => {
      socket.off('newMessage');
      socket.off('contractUpdate');
      socket.off('applicationUpdate');
      socket.disconnect();
    };
  }, [navigate, selectedFarmer]);

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
          
          provider.on('accountsChanged', (newAccounts) => {
            setAccounts(newAccounts);
            if (newAccounts.length > 0) {
              fetchBalance(newAccounts[0]);
              updateWalletAddress(newAccounts[0]);
            } else {
              setWalletConnected(false);
              setBalance(null);
            }
          });

          provider.on('chainChanged', () => {
            window.location.reload();
          });
        }
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  };

  const handleLogout = () => {
    if (web3 && web3.currentProvider && web3.currentProvider.removeAllListeners) {
      web3.currentProvider.removeAllListeners();
    }
    localStorage.clear();
    navigate('/login', { replace: true });
  };

  const handleApproveApplication = async (applicationId) => {
    try {
      const res = await fetch(`/api/applications/${applicationId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: 'Approved' })
      });
      
      if (res.ok) {
        loadAllData();
        setShowApplicationDetails(null);
      }
    } catch (err) {
      console.error('Error approving application:', err);
    }
  };

  const handleRejectApplication = async (applicationId) => {
    try {
      const res = await fetch(`/api/applications/${applicationId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: 'Rejected' })
      });
      
      if (res.ok) {
        loadAllData();
        setShowApplicationDetails(null);
      }
    } catch (err) {
      console.error('Error rejecting application:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedFarmer) return;
    
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          receiver: selectedFarmer._id,
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

  const handleContractFileChange = (e) => {
    setNewContract({
      ...newContract,
      file: e.target.files[0]
    });
  };

  const handleSignatureFileChange = (e) => {
    setSignatureFile(e.target.files[0]);
  };

  const checkContractBalance = (amount) => {
    if (!balance) return;
    if (parseFloat(amount) > parseFloat(balance)) {
      setContractBalanceError(`Insufficient balance. Available: ${balance} ETH`);
    } else {
      setContractBalanceError('');
    }
  };

  const viewFarmerDetails = async (farmerId) => {
    try {
      const res = await fetch(`/api/farmers/${farmerId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setFarmerDetails(data);
      }
    } catch (err) {
      console.error('Error fetching farmer details:', err);
    }
  };

  // Helper function to securely get private key (to be implemented)
  const getPrivateKey = async () => {
    // Implement your secure storage method here
    // For demo purposes, we'll prompt the user (not recommended for production)
    const privateKey = prompt('Enter your wallet private key to sign the transaction:');
    return privateKey;
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
        <h2 className="text-2xl font-bold text-blue-400">Welcome, {profile.ngoName}</h2>
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

  const applicationsPanel = (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-blue-400">Applications</h2>
      </div>

      <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Farmer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Project Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {applications.map((app) => (
                <tr key={app._id} className="hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{app.farmer?.name || app.farmer?.user?.email}</div>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => setShowApplicationDetails(app)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      View
                    </button>
                    {app.status === 'Pending' && (
                      <>
                        <button
                          onClick={() => handleApproveApplication(app._id)}
                          className="text-green-400 hover:text-green-300"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectApplication(app._id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          Reject
                        </button>
                      </>
                    )}
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
              <h4 className="text-md font-medium text-gray-300 mb-2">Farmer Information</h4>
              <div className="space-y-2">
                <p><span className="font-medium text-white">Name:</span> {showApplicationDetails.farmer?.name || 'N/A'}</p>
                <p><span className="font-medium text-white">Email:</span> {showApplicationDetails.farmer?.user?.email || 'N/A'}</p>
                <p><span className="font-medium text-white">Country:</span> {showApplicationDetails.farmer?.country || 'N/A'}</p>
                <p><span className="font-medium text-white">Occupation:</span> {showApplicationDetails.farmer?.occupation || 'N/A'}</p>
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
                <p><span className="font-medium text-white">Budget:</span> {showApplicationDetails.budget || 'N/A'}</p>
                <p><span className="font-medium text-white">Timeline:</span> {showApplicationDetails.timeline || 'N/A'}</p>
                {showApplicationDetails.supportingDocs && (
                  <div>
                    <p className="font-medium text-white">Supporting Documents:</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {showApplicationDetails.supportingDocs.map((doc, i) => (
                        <a 
                          key={i} 
                          href={doc} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          Document {i+1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {showApplicationDetails.status === 'Pending' && (
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => handleApproveApplication(showApplicationDetails._id)}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-full"
              >
                Approve
              </button>
              <button
                onClick={() => handleRejectApplication(showApplicationDetails._id)}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-full"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const contractsPanel = (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-blue-400">Contracts</h2>
        <button 
          onClick={() => setShowContractForm(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-full"
        >
          Create Contract
        </button>
      </div>

      {showContractForm && (
        <div className="bg-gray-800 p-6 rounded-xl shadow-md border border-gray-700">
          <h3 className="text-lg font-semibold text-blue-400 mb-4">Create New Contract</h3>
          <form onSubmit={handleCreateContract} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Farmer</label>
                <select
                  value={newContract.farmerId}
                  onChange={(e) => setNewContract({...newContract, farmerId: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                  required
                >
                  <option value="">Select Farmer</option>
                  {farmers.filter(f => f.status === 'Approved').map(farmer => (
                    <option key={farmer._id} value={farmer._id}>
                      {farmer.name || farmer.user?.email}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Amount (ETH)</label>
                <input
                  type="number"
                  placeholder="Amount"
                  value={newContract.amount}
                  onChange={(e) => {
                    setNewContract({...newContract, amount: e.target.value});
                    checkContractBalance(e.target.value);
                  }}
                  className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                  required
                  step="0.0001"
                  min="0"
                />
                {contractBalanceError && (
                  <p className="text-red-500 text-xs mt-1">{contractBalanceError}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-1">Contract Document</label>
                <div className="flex items-center space-x-4">
                  <label className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg cursor-pointer">
                    Upload Document
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={handleContractFileChange}
                      accept=".pdf,.doc,.docx"
                      required
                    />
                  </label>
                  {newContract.file && (
                    <span className="text-green-400 text-sm">Document selected: {newContract.file.name}</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">Upload the contract document (PDF or Word)</p>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowContractForm(false)}
                className="px-4 py-2 border border-gray-600 text-white rounded-full hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!!contractBalanceError || !newContract.file}
                className={`px-4 py-2 text-white rounded-full ${contractBalanceError || !newContract.file ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'}`}
              >
                Create Contract
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Contract ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Farmer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {contracts.length > 0 ? (
                contracts.map((contract) => (
                  <tr key={`${contract._id}-${contract.contractId}`} className="hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{contract.contractId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">
                        {contract.farmer?.name || contract.farmer?.user?.email || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{contract.amount} ETH</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        contract.status === 'Active' ? 'bg-green-500' : 
                        contract.status === 'Completed' ? 'bg-blue-500' : 
                        contract.status === 'Created' ? 'bg-yellow-500' : 'bg-gray-500'
                      } text-white`}>
                        {contract.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => window.open(contract.ipfsHash, '_blank')}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        View
                      </button>
                      {contract.status === 'Active' && (
                        <button
                          onClick={() => handleDisburse(contract._id)}
                          disabled={disbursingContract === contract._id}
                          className={`text-green-400 hover:text-green-300 ${disbursingContract === contract._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {disbursingContract === contract._id ? 'Processing...' : 'Disburse Funds'}
                        </button>
                      )}
                      {contract.status === 'Created' && !contract.signatures.ngoSigned && (
                        <button
                          onClick={() => setSigningContract(contract)}
                          className="text-purple-400 hover:text-purple-300"
                        >
                          Sign Contract
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
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

      {signingContract && (
        <div className="bg-gray-800 p-6 rounded-xl shadow-md border border-gray-700">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-blue-400">
              Sign Contract {signingContract.contractId}
            </h3>
            <button
              onClick={() => setSigningContract(null)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Contract ID</label>
                <input
                  type="text"
                  value={signingContract.contractId}
                  readOnly
                  className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Farmer</label>
                <input
                  type="text"
                  value={signingContract.farmer?.name || signingContract.farmer?.user?.email || 'N/A'}
                  readOnly
                  className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Upload Your Signature</label>
                <div className="flex items-center space-x-4">
                  <label className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg cursor-pointer">
                    Upload Signature
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={handleSignatureFileChange}
                      accept="image/*,.pdf"
                      required
                    />
                  </label>
                  {signatureFile && (
                    <span className="text-green-400 text-sm">File selected: {signatureFile.name}</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">Upload your digital signature (image or PDF)</p>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setSigningContract(null)}
                className="px-4 py-2 border border-gray-600 text-white rounded-full hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSignContract(signingContract.contractId)}
                disabled={!signatureFile}
                className={`px-4 py-2 text-white rounded-full ${!signatureFile ? 'bg-gray-500 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-500'}`}
              >
                Sign Contract
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const transactionsPanel = (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-blue-400">Funding History</h2>
      </div>

      <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Contract</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">TX Hash</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {transactions.map((tx) => (
                <tr key={tx._id} className="hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">
                      {new Date(tx.timestamp).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">{tx.to}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">{tx.amount} ETH</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">
                      {tx.contract?.contractId || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <a 
                      href={`https://etherscan.io/tx/${tx.txHash}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      {tx.txHash.substring(0, 10)}...
                    </a>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-400">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const walletPanel = (
    <div className="space-y-6">
      <div className="bg-gray-800 p-6 rounded-xl shadow-md border border-gray-700">
        <h2 className="text-2xl font-bold text-blue-400">Wallet Connection</h2>
        <p className="text-gray-300">Connect your MetaMask wallet to manage funds</p>
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
            <h4 className="text-md font-medium text-blue-400 mb-2">NGO Information</h4>
            <div className="space-y-2">
              <p><span className="font-medium text-white">Name:</span> {profile.ngoName}</p>
              <p><span className="font-medium text-white">Email:</span> {profile.email || profile.user?.email}</p>
              <p><span className="font-medium text-white">Country:</span> {profile.country}</p>
              <p><span className="font-medium text-white">Date Founded:</span> {profile.dateFounded ? new Date(profile.dateFounded).toLocaleDateString() : 'N/A'}</p>
              <p><span className="font-medium text-white">Wallet Address:</span> {profile.walletAddress || 'Not connected'}</p>
            </div>
          </div>
          
          <div>
            <h4 className="text-md font-medium text-blue-400 mb-2">About</h4>
            <div className="bg-gray-700 p-4 rounded-lg">
              <p className="text-gray-300">{profile.about || 'No description provided'}</p>
            </div>
            
            <h4 className="text-md font-medium text-blue-400 mt-4 mb-2">Mission</h4>
            <div className="bg-gray-700 p-4 rounded-lg">
              <p className="text-gray-300">{profile.mission || 'No mission statement provided'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const reportsPanel = (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-blue-400">Farmer Reports</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-700">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-blue-400 mb-4">Recent Reports</h3>
            <div className="space-y-4">
              {reports.length > 0 ? (
                reports.map(report => (
                  <div key={report._id} className="bg-gray-700 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-white">{report.farmer?.name || 'Unknown Farmer'}</p>
                        <p className="text-sm text-gray-300">{new Date(report.date).toLocaleDateString()}</p>
                      </div>
                      <button 
                        onClick={() => setSelectedFarmer(report.farmer)}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        Chat
                      </button>
                    </div>
                    <p className="mt-2 text-gray-300">{report.summary.substring(0, 100)}...</p>
                    {report.images && report.images.length > 0 && (
                      <div className="mt-2 flex space-x-2">
                        {report.images.slice(0, 3).map((img, i) => (
                          <img 
                            key={i} 
                            src={img} 
                            alt={`Report ${i+1}`} 
                            className="w-16 h-16 object-cover rounded"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">No reports found</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-md border border-gray-700">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-blue-400 mb-4">
              {selectedFarmer ? `Chat with ${selectedFarmer.name}` : 'Select a farmer to chat'}
            </h3>
            
            {selectedFarmer ? (
              <>
                <div className="h-64 overflow-y-auto mb-4 space-y-3">
                  {messages.length > 0 ? (
                    messages.map((msg, i) => (
                      <div 
                        key={i} 
                        className={`p-3 rounded-lg ${msg.sender === selectedFarmer._id ? 'bg-gray-700' : 'bg-blue-600'}`}
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
              <p className="text-gray-400 text-center py-4">Select a farmer from the reports to start chatting</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const farmersPanel = (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-blue-400">Manage Farmers</h2>
      </div>

      <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Country</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {farmers.map((farmer) => (
                <tr key={farmer._id} className="hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{farmer.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">{farmer.user?.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">{farmer.country}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      farmer.status === 'Approved' ? 'bg-green-500' : 
                      farmer.status === 'Rejected' ? 'bg-red-500' : 'bg-yellow-500'
                    } text-white`}>
                      {farmer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => viewFarmerDetails(farmer._id)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      View
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

      {farmerDetails && (
        <div className="bg-gray-800 p-6 rounded-xl shadow-md border border-gray-700">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-blue-400">
              Farmer Details
            </h3>
            <button
              onClick={() => setFarmerDetails(null)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-md font-medium text-gray-300 mb-2">Personal Information</h4>
              <div className="space-y-2">
                <p><span className="font-medium text-white">Name:</span> {farmerDetails.name}</p>
                <p><span className="font-medium text-white">Email:</span> {farmerDetails.user?.email}</p>
                <p><span className="font-medium text-white">Country:</span> {farmerDetails.country}</p>
                <p><span className="font-medium text-white">Occupation:</span> {farmerDetails.occupation}</p>
              </div>
            </div>
            
            <div>
              <h4 className="text-md font-medium text-gray-300 mb-2">Additional Information</h4>
              <div className="space-y-2">
                <p><span className="font-medium text-white">Education:</span> {farmerDetails.education || 'N/A'}</p>
                <p><span className="font-medium text-white">Address:</span> {farmerDetails.address || 'N/A'}</p>
                <p><span className="font-medium text-white">Bio:</span></p>
                <div className="bg-gray-700 p-3 rounded-lg">
                  {farmerDetails.bio || 'No bio provided'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const tabPanelContent = [
    overview, 
    applicationsPanel, 
    contractsPanel, 
    transactionsPanel, 
    walletPanel, 
    profilePanel,
    reportsPanel,
    farmersPanel
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
              'Applications', 
              'Contracts', 
              'Funding History', 
              'Connect Wallet',
              'Profile',
              'Farmer Reports',
              'Manage Farmers'
            ].map((label, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`flex items-center w-full px-4 py-3 text-left ${activeTab === index ? 'bg-gray-700' : 'hover:bg-gray-700'} transition-colors duration-200 border-b border-gray-700`}
              >
                <span className="mr-3 text-blue-400">
                  {index === 0 && '📊'}
                  {index === 1 && '📝'}
                  {index === 2 && '📑'}
                  {index === 3 && '💰'}
                  {index === 4 && '🔗'}
                  {index === 5 && '👤'}
                  {index === 6 && '📋'}
                  {index === 7 && '👨‍🌾'}
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
                  'Applications', 
                  'Contracts', 
                  'Funding History', 
                  'Wallet Connection',
                  'Profile Settings',
                  'Farmer Reports',
                  'Manage Farmers'
                ][activeTab]}
              </h2>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold cursor-pointer">
                    {profile.ngoName.charAt(0)}
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