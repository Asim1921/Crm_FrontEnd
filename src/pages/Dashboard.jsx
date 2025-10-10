import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';
import { useNavigate } from 'react-router-dom';
import { reportsAPI, clientAPI, communicationAPI } from '../utils/api';
import { canViewPhoneNumbers, canViewEmailAddresses } from '../utils/roleUtils';
import { 
  Users, 
  Settings, 
  ClipboardList, 
  DollarSign,
  TrendingUp,
  Phone,
  MessageCircle,
  MoreHorizontal,
  Mail,
  Edit,
  Trash2,
  Download,
  Plus,
  FileText,
  BarChart3,
  X,
  User,
  Calendar,
  MapPin,
  Tag,
  Search
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { dashboardSearchQuery, updateDashboardSearch } = useSearch();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalClients: { value: 0, change: '0%' },
    activeAgents: { value: 0, change: '0' },
    pendingTasks: { value: 0, overdue: 0 },
    ftdThisMonth: { value: 0, change: '0%' },
    ftdRetention: { value: 0, change: 'Retention clients' }
  });
  const [recentClients, setRecentClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [agentFilter, setAgentFilter] = useState('all');
  const [showMenu, setShowMenu] = useState(null);
  
  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [availableAgents, setAvailableAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [editForm, setEditForm] = useState({});
  const [selectedStatus, setSelectedStatus] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await reportsAPI.getDashboardStats();
        setStats(data);
        setRecentClients(data.recentClients || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Filter clients based on status, campaign, agent assignment, and search query
  const filteredClients = recentClients.filter(client => {
    // If user is not admin, only show clients assigned to them
    if (user?.role !== 'admin') {
      const isAssignedToUser = client.assignedAgent?._id === user?._id || 
                              client.assignedAgent?.email === user?.email;
      if (!isAssignedToUser) return false;
    }
    
    // Apply status filter
    if (statusFilter !== 'all' && statusFilter !== client.status) {
      return false;
    }
    
    // Apply campaign filter
    if (campaignFilter !== 'all' && campaignFilter !== client.campaign) {
      return false;
    }
    
    // Apply agent filter
    if (agentFilter !== 'all') {
      if (agentFilter === 'unassigned' && client.assignedAgent) {
        return false;
      } else if (agentFilter !== 'unassigned' && client.assignedAgent?._id !== agentFilter) {
        return false;
      }
    }
    
    // Apply search filter
    if (dashboardSearchQuery.trim()) {
      const query = dashboardSearchQuery.toLowerCase();
      const matchesSearch = 
        client.firstName?.toLowerCase().includes(query) ||
        client.lastName?.toLowerCase().includes(query) ||
        client.phone?.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query) ||
        client.country?.toLowerCase().includes(query) ||
        client.status?.toLowerCase().includes(query);
      
      if (!matchesSearch) return false;
    }
    
    return true;
  });

  // Get unique campaigns from clients
  const getUniqueCampaigns = () => {
    const campaigns = [...new Set(recentClients.map(client => client.campaign).filter(Boolean))];
    return campaigns.sort();
  };

  // Get unique agents from clients
  const getUniqueAgents = () => {
    const agents = recentClients
      .map(client => client.assignedAgent)
      .filter(Boolean)
      .filter((agent, index, self) => 
        index === self.findIndex(a => a._id === agent._id)
      );
    return agents;
  };

  // Debug logging for agent users
  useEffect(() => {
    if (user?.role === 'agent') {
      console.log('Agent User:', user);
      console.log('Recent Clients:', recentClients);
      console.log('Filtered Clients:', filteredClients);
      console.log('User ID:', user._id);
      console.log('User Email:', user.email);
    }
  }, [user, recentClients, filteredClients]);

  // Debug logging for all users to check campaign data
  useEffect(() => {
    console.log('Dashboard Stats:', stats);
    console.log('Recent Clients with Campaign:', recentClients.map(client => ({
      name: `${client.firstName} ${client.lastName}`,
      campaign: client.campaign,
      status: client.status
    })));
    console.log('Status Filter:', statusFilter);
  }, [stats, recentClients, statusFilter]);

  // Handle status card clicks
  const handleStatusCardClick = (status) => {
    setStatusFilter(status);
  };

  // Handle lead status overview clicks
  const handleLeadStatusClick = (status) => {
    setStatusFilter(status);
  };

  // Handle call action
  const handleCall = (client) => {
    if (client.phone) {
      window.open(`tel:${client.phone}`, '_self');
    } else {
      alert('No phone number available for this client');
    }
  };

  // Handle message action - Fixed to use email
  const handleMessage = (client) => {
    if (!client.email) {
      alert('No email address available for this client');
      return;
    }
    
    // Detect email provider and open appropriate client
    const email = client.email.toLowerCase();
    let provider = 'Email Client';
    
    if (email.includes('@gmail.com')) {
      // Gmail Web
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(client.email)}&su=${encodeURIComponent('CRM Follow-up')}&body=${encodeURIComponent(`Hi ${client.firstName},\n\nI hope you're doing well. I wanted to follow up on our previous conversation.\n\nBest regards,\nYour Team`)}`;
      window.open(gmailUrl, '_blank');
      provider = 'Gmail';
    } else if (email.includes('@outlook.com') || email.includes('@hotmail.com') || email.includes('@live.com')) {
      // Outlook Web
      const outlookUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(client.email)}&subject=${encodeURIComponent('CRM Follow-up')}&body=${encodeURIComponent(`Hi ${client.firstName},\n\nI hope you're doing well. I wanted to follow up on our previous conversation.\n\nBest regards,\nYour Team`)}`;
      window.open(outlookUrl, '_blank');
      provider = 'Outlook';
    } else if (email.includes('@yahoo.com')) {
      // Yahoo Mail Web
      const yahooUrl = `https://compose.mail.yahoo.com/?to=${encodeURIComponent(client.email)}&subject=${encodeURIComponent('CRM Follow-up')}&body=${encodeURIComponent(`Hi ${client.firstName},\n\nI hope you're doing well. I wanted to follow up on our previous conversation.\n\nBest regards,\nYour Team`)}`;
      window.open(yahooUrl, '_blank');
      provider = 'Yahoo Mail';
    } else {
      // Default mailto for other providers
      const mailtoUrl = `mailto:${client.email}?subject=${encodeURIComponent('CRM Follow-up')}&body=${encodeURIComponent(`Hi ${client.firstName},\n\nI hope you're doing well. I wanted to follow up on our previous conversation.\n\nBest regards,\nYour Team`)}`;
      window.open(mailtoUrl, '_self');
    }
    
    // Show success message
    setTimeout(() => {
      alert(`${provider} opened for ${client.firstName} ${client.lastName} with pre-filled email`);
    }, 100);
  };

  // Handle export action
  const handleExport = async () => {
    try {
      // Export all clients (no specific selection in dashboard)
      await clientAPI.exportClients('csv');
      alert('Export completed successfully!');
    } catch (error) {
      alert('Export failed: ' + error.message);
    }
  };



  // Handle three dots menu actions
  const handleMenuAction = async (action, client) => {
    setShowMenu(null);
    setSelectedClient(client);
    
    switch (action) {
      case 'view':
        setShowDetailsModal(true);
        break;
      case 'edit':
        setEditForm({
          firstName: client.firstName,
          lastName: client.lastName,
          email: client.email,
          phone: client.phone,
          country: client.country,
          status: client.status,
          value: client.value || 0
        });
        setShowEditModal(true);
        break;
      case 'change-status':
        setSelectedStatus(client.status);
        setShowStatusModal(true);
        break;
      case 'assign':
        try {
          const agents = await clientAPI.getAvailableAgents();
          setAvailableAgents(agents);
          setSelectedAgent(client.assignedAgent?._id || '');
          setShowAssignModal(true);
        } catch (error) {
          alert('Failed to load agents: ' + error.message);
        }
        break;
      case 'delete':
        setShowDeleteModal(true);
        break;
      default:
        break;
    }
  };

  // Handle edit client
  const handleEditClient = async () => {
    try {
      setActionLoading(true);
      await clientAPI.updateClient(selectedClient._id, editForm);
      alert('Client updated successfully!');
      setShowEditModal(false);
      // Refresh dashboard data
      const data = await reportsAPI.getDashboardStats();
      setStats(data);
      setRecentClients(data.recentClients || []);
    } catch (error) {
      alert('Failed to update client: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle assign agent
  const handleAssignAgent = async () => {
    try {
      setActionLoading(true);
      await clientAPI.assignClients([selectedClient._id], selectedAgent);
      alert('Agent assigned successfully!');
      setShowAssignModal(false);
      // Refresh dashboard data
      const data = await reportsAPI.getDashboardStats();
      setStats(data);
      setRecentClients(data.recentClients || []);
    } catch (error) {
      alert('Failed to assign agent: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle delete client
  const handleDeleteClient = async () => {
    try {
      setActionLoading(true);
      await clientAPI.deleteClient(selectedClient._id);
      alert('Client deleted successfully!');
      setShowDeleteModal(false);
      // Refresh dashboard data
      const data = await reportsAPI.getDashboardStats();
      setStats(data);
      setRecentClients(data.recentClients || []);
    } catch (error) {
      alert('Failed to delete client: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle status change
  const handleStatusChange = async () => {
    try {
      setActionLoading(true);
      await clientAPI.updateClient(selectedClient._id, { status: selectedStatus });
      alert('Client status updated successfully!');
      setShowStatusModal(false);
      // Refresh dashboard data
      const data = await reportsAPI.getDashboardStats();
      setStats(data);
      setRecentClients(data.recentClients || []);
    } catch (error) {
      alert('Failed to update client status: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle quick actions
  const handleQuickAction = (action) => {
    switch (action) {
      case 'add-client':
        navigate('/clients', { state: { showAddModal: true } });
        break;
      case 'create-task':
        navigate('/tasks', { state: { showAddModal: true } });
        break;
      case 'import-data':
        navigate('/clients', { state: { showImportModal: true } });
        break;
      case 'view-reports':
        navigate('/reports');
        break;
      default:
        break;
    }
  };

  // Close all modals
  const closeAllModals = () => {
    setShowDetailsModal(false);
    setShowEditModal(false);
    setShowAssignModal(false);
    setShowDeleteModal(false);
    setShowStatusModal(false);
    setSelectedClient(null);
    setEditForm({});
    setSelectedAgent('');
    setSelectedStatus('');
  };

  if (loading) {
    return (
      <div className="flex-1 bg-gray-50">
        <div className="p-4 lg:p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 bg-gray-50">
        <div className="p-4 lg:p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50">
      
      {/* Main Content */}
      <div className="p-4 lg:p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <div 
            className="bg-white rounded-xl p-4 lg:p-6 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleStatusCardClick('all')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-gray-600">Total Clients</p>
                <p className="text-xl lg:text-2xl font-bold text-gray-900">{stats.totalClients.value}</p>
                {user?.role === 'admin' && (
                  <p className={`text-xs ${stats.totalClients.changeValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.totalClients.change} from last month
                  </p>
                )}
              </div>
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div 
            className="bg-white rounded-xl p-4 lg:p-6 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleStatusCardClick('New Lead')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-gray-600">New Leads</p>
                <p className="text-xl lg:text-2xl font-bold text-gray-900">
                  {stats.leadStatusOverview?.find(s => s._id === 'New Lead')?.count || 0}
                </p>
                {user?.role === 'admin' && (
                  <p className="text-xs text-green-600">Active leads</p>
                )}
              </div>
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Plus className="w-5 h-5 lg:w-6 lg:h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div 
            className="bg-white rounded-xl p-4 lg:p-6 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleStatusCardClick('FTD')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-gray-600">FTD</p>
                <p className="text-xl lg:text-2xl font-bold text-gray-900">{stats.ftdThisMonth.value}</p>
                {user?.role === 'admin' && (
                  <p className={`text-xs ${stats.ftdThisMonth.changeValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.ftdThisMonth.change} conversion
                  </p>
                )}
              </div>
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 lg:w-6 lg:h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div 
            className="bg-white rounded-xl p-4 lg:p-6 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleStatusCardClick('FTD RETENTION')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-gray-600">FTD Retention</p>
                <p className="text-xl lg:text-2xl font-bold text-gray-900">{stats.ftdRetention.value}</p>
                {user?.role === 'admin' && (
                  <p className="text-xs text-indigo-600">
                    {stats.ftdRetention.change}
                  </p>
                )}
              </div>
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-gray-600">Pending Tasks</p>
                <p className="text-xl lg:text-2xl font-bold text-gray-900">{stats.pendingTasks.value}</p>
                {user?.role === 'admin' && (
                  <p className="text-xs text-gray-600">{stats.pendingTasks.overdue} overdue</p>
                )}
              </div>
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-5 h-5 lg:w-6 lg:h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Recent Clients */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm">
            <div className="p-4 lg:p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
                <div className="flex items-center space-x-2">
                  <h2 className="text-base lg:text-lg font-semibold text-gray-900">Recent Clients</h2>
                  {statusFilter !== 'all' && (
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                      Filtered by: {statusFilter}
                    </span>
                  )}
                  {user?.role !== 'admin' && (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                      My Clients Only
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {/* Search input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                         <input
                       type="text"
                       placeholder="Search by name, ID, or email..."
                       value={dashboardSearchQuery}
                       onChange={(e) => updateDashboardSearch(e.target.value)}
                       className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48 lg:w-64"
                     />
                  </div>
                  <button 
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      statusFilter === 'all' 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    onClick={() => setStatusFilter('all')}
                  >
                    All
                  </button>
                  <button 
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      statusFilter === 'New Lead' 
                        ? 'bg-green-100 text-green-600' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    onClick={() => setStatusFilter('New Lead')}
                  >
                    New Leads
                  </button>
                  <button 
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      statusFilter === 'FTD' 
                        ? 'bg-purple-100 text-purple-600' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    onClick={() => setStatusFilter('FTD')}
                  >
                    FTD
                  </button>
                  <button 
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      statusFilter === 'Data' 
                        ? 'bg-indigo-100 text-indigo-600' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    onClick={() => setStatusFilter('Data')}
                  >
                    Data
                  </button>
                  <button 
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      statusFilter === 'Affiliate' 
                        ? 'bg-teal-100 text-teal-600' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    onClick={() => setStatusFilter('Affiliate')}
                  >
                    Affiliate
                  </button>
                  {user?.role === 'admin' && (
                    <button 
                      className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg flex items-center"
                      onClick={handleExport}
                    >
                      <TrendingUp className="w-4 h-4 mr-1" />
                      Export
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">COUNTRY</th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CONTACT</th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STATUS</th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AGENT</th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                                     {filteredClients.length === 0 ? (
                     <tr>
                       <td colSpan="6" className="px-4 lg:px-6 py-4 text-center text-gray-500">
                         {user?.role === 'agent' ? (
                           <div className="space-y-2">
                             <p>No clients assigned to you yet.</p>
                             <p className="text-xs text-gray-400">
                               Demo credentials: agent@example.com, agent2@example.com, or agent3@example.com
                             </p>
                           </div>
                         ) : (
                           'No clients found for the selected filter'
                         )}
                       </td>
                     </tr>
                   ) : (
                    filteredClients.map((client) => (
                      <tr key={client._id}>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">{client.clientId}</td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{client.country}</td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{client.firstName} {client.lastName}</div>
                          {user?.role === 'admin' && (
                            <div className="text-sm text-gray-500">{client.phone}</div>
                          )}
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            client.status === 'New Lead' ? 'bg-green-100 text-green-800' :
                            client.status === 'FTD' ? 'bg-blue-100 text-blue-800' :
                            client.status === 'Call Again' ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {client.status}
                          </span>
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {client.assignedAgent ? `${client.assignedAgent.firstName} ${client.assignedAgent.lastName}` : 'Unassigned'}
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button 
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                              onClick={() => handleCall(client)}
                              title="Call client"
                            >
                              <Phone className="w-4 h-4" />
                            </button>
                            <button 
                              className="text-green-600 hover:text-green-900 transition-colors"
                              onClick={() => handleMessage(client)}
                              title="Send email"
                            >
                              <Mail className="w-4 h-4" />
                            </button>
                                                         {/* Three dots menu - Only visible for administrators */}
                                                         {user?.role === 'admin' && (
                                                           <div className="relative">
                                                             <button 
                                                               className="text-gray-600 hover:text-gray-900 transition-colors"
                                                               onClick={(e) => {
                                                                 e.stopPropagation();
                                                                 setShowMenu(showMenu === client._id ? null : client._id);
                                                               }}
                                                               title="More options"
                                                             >
                                                               <MoreHorizontal className="w-4 h-4" />
                                                             </button>
                                                             {showMenu === client._id && (
                                                               <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                                                                 <div className="py-1">
                                                                   <button
                                                                     className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                                     onClick={(e) => {
                                                                       e.stopPropagation();
                                                                       handleMenuAction('view', client);
                                                                     }}
                                                                   >
                                                                     <FileText className="w-4 h-4 mr-2" />
                                                                     View Details
                                                                   </button>
                                                                   <button
                                                                     className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                                     onClick={(e) => {
                                                                       e.stopPropagation();
                                                                       handleMenuAction('edit', client);
                                                                     }}
                                                                   >
                                                                     <Edit className="w-4 h-4 mr-2" />
                                                                     Edit Client
                                                                   </button>
                                                                   <button
                                                                     className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                                     onClick={(e) => {
                                                                       e.stopPropagation();
                                                                       handleMenuAction('assign', client);
                                                                     }}
                                                                   >
                                                                     <Users className="w-4 h-4 mr-2" />
                                                                     Assign Agent
                                                                   </button>
                                                                   <button
                                                                     className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                                     onClick={(e) => {
                                                                       e.stopPropagation();
                                                                       handleMenuAction('change-status', client);
                                                                     }}
                                                                   >
                                                                     <Tag className="w-4 h-4 mr-2" />
                                                                     Change Status
                                                                   </button>
                                                                   <button
                                                                     className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                                                     onClick={(e) => {
                                                                       e.stopPropagation();
                                                                       handleMenuAction('delete', client);
                                                                     }}
                                                                   >
                                                                     <Trash2 className="w-4 h-4 mr-2" />
                                                                     Delete
                                                                   </button>
                                                                 </div>
                                                               </div>
                                                             )}
                                                           </div>
                                                         )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Lead Status Overview */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Lead Status Overview</h3>
                {(statusFilter !== 'all' || campaignFilter !== 'all' || agentFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setStatusFilter('all');
                      setCampaignFilter('all');
                      setAgentFilter('all');
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>

              {/* Filter Controls */}
              <div className="space-y-3 mb-4">
                {/* Campaign Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Campaign Filter</label>
                  <select
                    value={campaignFilter}
                    onChange={(e) => setCampaignFilter(e.target.value)}
                    className="w-full text-xs p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Campaigns</option>
                    {getUniqueCampaigns().map(campaign => (
                      <option key={campaign} value={campaign}>{campaign}</option>
                    ))}
                  </select>
                </div>

                {/* Agent Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Client Manager</label>
                  <select
                    value={agentFilter}
                    onChange={(e) => setAgentFilter(e.target.value)}
                    className="w-full text-xs p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Agents</option>
                    <option value="unassigned">Unassigned</option>
                    {getUniqueAgents().map(agent => (
                      <option key={agent._id} value={agent._id}>
                        {agent.firstName} {agent.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-3">
                {statusFilter !== 'all' && (
                  <div 
                    className="flex items-center justify-between cursor-pointer p-2 rounded-lg transition-colors hover:bg-gray-50"
                    onClick={() => setStatusFilter('all')}
                  >
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-3 bg-gray-400"></div>
                      <span className="text-sm text-gray-700">Show All</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {filteredClients.length}
                    </span>
                  </div>
                )}
                {stats.leadStatusOverview && stats.leadStatusOverview.map((status) => {
                  const filteredCount = filteredClients.filter(client => client.status === status._id).length;
                  return (
                    <div 
                      key={status._id} 
                      className={`flex items-center justify-between cursor-pointer p-2 rounded-lg transition-colors ${
                        statusFilter === status._id 
                          ? 'bg-blue-50 border border-blue-200' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleLeadStatusClick(status._id)}
                    >
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${
                          status._id === 'New Lead' ? 'bg-green-500' :
                          status._id === 'FTD' ? 'bg-blue-500' :
                          status._id === 'FTD RETENTION' ? 'bg-indigo-500' :
                          status._id === 'Call Again' ? 'bg-orange-500' :
                          status._id === 'No Answer' ? 'bg-pink-500' :
                          status._id === 'NA5UP' ? 'bg-teal-500' :
                          status._id === 'Not Interested' ? 'bg-gray-500' :
                          status._id === 'Hang Up' ? 'bg-purple-500' :
                          'bg-gray-400'
                        }`}></div>
                        <span className={`text-sm ${statusFilter === status._id ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>
                          {status._id}
                        </span>
                      </div>
                      <span className={`text-sm font-medium ${statusFilter === status._id ? 'text-blue-700' : 'text-gray-900'}`}>
                        {filteredCount}
                      </span>
                    </div>
                  );
                })}
                
                {/* Campaign Options - Dynamic based on available campaigns */}
                {getUniqueCampaigns().map(campaign => {
                  const filteredCount = filteredClients.filter(client => client.campaign === campaign).length;
                  const isSelected = statusFilter === campaign;
                  const campaignColors = {
                    'Data': 'indigo',
                    'Affiliate': 'teal',
                    'Data1': 'blue',
                    'Data2': 'green',
                    'Data3': 'yellow',
                    'Data4': 'red',
                    'Data5': 'purple'
                  };
                  const color = campaignColors[campaign] || 'gray';
                  
                  return (
                    <div 
                      key={campaign}
                      className={`flex items-center justify-between cursor-pointer p-2 rounded-lg transition-colors ${
                        isSelected 
                          ? `bg-${color}-50 border border-${color}-200` 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleLeadStatusClick(campaign)}
                    >
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 bg-${color}-500`}></div>
                        <span className={`text-sm ${isSelected ? `text-${color}-700 font-medium` : 'text-gray-700'}`}>
                          {campaign}
                        </span>
                      </div>
                      <span className={`text-sm font-medium ${isSelected ? `text-${color}-700` : 'text-gray-900'}`}>
                        {filteredCount}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button 
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center"
                  onClick={() => handleQuickAction('add-client')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Client
                </button>
                <button 
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center"
                  onClick={() => handleQuickAction('create-task')}
                >
                  <ClipboardList className="w-4 h-4 mr-2" />
                  Create Task
                </button>
                <button 
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center"
                  onClick={() => handleQuickAction('import-data')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Import Data
                </button>
                <button 
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center"
                  onClick={() => handleQuickAction('view-reports')}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Reports
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="text-sm text-gray-500 text-center py-4">
                No recent activity
              </div>
            </div>
          </div>
        </div>
      </div>

             {/* Click outside to close menu */}
       {showMenu && (
         <div 
           className="fixed inset-0 z-40" 
           onClick={() => setShowMenu(null)}
         />
       )}

      {/* Client Details Modal */}
      {showDetailsModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Client Details</h2>
              <button onClick={closeAllModals} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedClient.firstName} {selectedClient.lastName}</p>
                </div>
                {canViewEmailAddresses(user) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedClient.email}</p>
                  </div>
                )}
                {canViewPhoneNumbers(user) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedClient.phone}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Country</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedClient.country}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                    selectedClient.status === 'New Lead' ? 'bg-green-100 text-green-800' :
                    selectedClient.status === 'FTD' ? 'bg-blue-100 text-blue-800' :
                    selectedClient.status === 'Call Again' ? 'bg-orange-100 text-orange-800' :
                    selectedClient.status === 'Wrong Number' ? 'bg-red-100 text-red-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {selectedClient.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Assigned Agent</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedClient.assignedAgent ? `${selectedClient.assignedAgent.firstName} ${selectedClient.assignedAgent.lastName}` : 'Unassigned'}
                  </p>
                </div>
                {selectedClient.value && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Value</label>
                    <p className="mt-1 text-sm text-gray-900">${selectedClient.value.toLocaleString()}</p>
                  </div>
                )}
                {selectedClient.lastContact && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Contact</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedClient.lastContact).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
              {selectedClient.notes && selectedClient.notes.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                    {selectedClient.notes.map((note, index) => (
                      <div key={index} className="text-sm text-gray-700 mb-2 last:mb-0">
                        <p className="font-medium">{note.content}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {note.createdBy?.firstName} {note.createdBy?.lastName} - {new Date(note.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={closeAllModals}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {showEditModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Edit Client</h2>
              <button onClick={closeAllModals} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  type="text"
                  value={editForm.firstName || ''}
                  onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  type="text"
                  value={editForm.lastName || ''}
                  onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
              {user?.role === 'admin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={editForm.email || ''}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
              )}
              {user?.role === 'admin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="text"
                    value={editForm.phone || ''}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Country</label>
                <input
                  type="text"
                  value={editForm.country || ''}
                  onChange={(e) => setEditForm({...editForm, country: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={editForm.status || ''}
                  onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="New Lead">New Lead</option>
                  <option value="Call Again">Call Again</option>
                  <option value="FTD">FTD</option>
                  <option value="No Answer">No Answer</option>
                  <option value="Not Interested">Not Interested</option>
                  <option value="Hang Up">Hang Up</option>
                  <option value="Wrong Number">Wrong Number</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Value</label>
                <input
                  type="number"
                  value={editForm.value || 0}
                  onChange={(e) => setEditForm({...editForm, value: parseFloat(e.target.value) || 0})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={closeAllModals}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleEditClient}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Agent Modal */}
      {showAssignModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Assign Agent</h2>
              <button onClick={closeAllModals} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-4">
                Assigning: <span className="font-medium">{selectedClient.firstName} {selectedClient.lastName}</span>
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Agent</label>
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">Unassigned</option>
                {availableAgents.map((agent) => (
                  <option key={agent._id} value={agent._id}>
                    {agent.firstName} {agent.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeAllModals}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleAssignAgent}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Assigning...' : 'Assign Agent'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Client Modal */}
      {showDeleteModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Delete Client</h2>
              <button onClick={closeAllModals} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to delete <span className="font-medium">{selectedClient.firstName} {selectedClient.lastName}</span>?
              </p>
              <p className="text-xs text-red-600">
                This action cannot be undone. All client data will be permanently deleted.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeAllModals}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteClient}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Deleting...' : 'Delete Client'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Status Modal */}
      {showStatusModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Change Client Status</h2>
              <button onClick={closeAllModals} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-4">
                Client: <span className="font-medium">{selectedClient.firstName} {selectedClient.lastName}</span>
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Current Status:                 <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  selectedClient.status === 'New Lead' ? 'bg-green-100 text-green-800' :
                  selectedClient.status === 'FTD' ? 'bg-blue-100 text-blue-800' :
                  selectedClient.status === 'FTD RETENTION' ? 'bg-indigo-100 text-indigo-800' :
                  selectedClient.status === 'Call Again' ? 'bg-orange-100 text-orange-800' :
                  selectedClient.status === 'No Answer' ? 'bg-pink-100 text-pink-800' :
                  selectedClient.status === 'NA5UP' ? 'bg-teal-100 text-teal-800' :
                  selectedClient.status === 'Not Interested' ? 'bg-gray-100 text-gray-800' :
                  selectedClient.status === 'Hang Up' ? 'bg-purple-100 text-purple-800' :
                  selectedClient.status === 'Wrong Number' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {selectedClient.status}
                </span>
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">Select Status</option>
                <option value="New Lead">New Lead</option>
                <option value="FTD">FTD</option>
                <option value="FTD RETENTION">FTD RETENTION</option>
                <option value="Call Again">Call Again</option>
                <option value="No Answer">No Answer</option>
                <option value="NA5UP">NA5UP</option>
                <option value="Not Interested">Not Interested</option>
                <option value="Hang Up">Hang Up</option>
                <option value="Wrong Number">Wrong Number</option>
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeAllModals}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleStatusChange}
                disabled={actionLoading || !selectedStatus}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;


