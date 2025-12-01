import React, { useState, useEffect, useCallback, useRef } from 'react';
import { clientAPI, reportsAPI } from '../utils/api';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { 
  canViewPhoneNumbers, 
  canViewEmailAddresses, 
  canViewAllClients, 
  canSearchAllClients,
  canAssignClients,
  canExportData,
  isAdmin,
  isTeamLeader
} from '../utils/roleUtils';
import { 
  Search, 
  Filter, 
  Plus, 
  Download, 
  Upload,
  Phone,
  MessageCircle,
  Mail,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  X,
  ExternalLink,
  Users,
  User,
  Settings,
  Calendar,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Copy,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const ClientManagement = () => {
  const navigate = useNavigate();
  const { addClientNotification } = useNotifications();
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState([]);
  const [campaignFilter, setCampaignFilter] = useState([]);
  const [countryFilter, setCountryFilter] = useState([]);
  const [agentFilter, setAgentFilter] = useState([]);
  const [unassignedFilter, setUnassignedFilter] = useState(false);
  const [selectedClients, setSelectedClients] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showCampaignFilter, setShowCampaignFilter] = useState(false);
  const [duplicateFilter, setDuplicateFilter] = useState(false);
  const [assignToAgent, setAssignToAgent] = useState('');
  const [showStatusHeaderDropdown, setShowStatusHeaderDropdown] = useState(false);
  const [showCampaignHeaderDropdown, setShowCampaignHeaderDropdown] = useState(false);
  const [showCountryHeaderDropdown, setShowCountryHeaderDropdown] = useState(false);
  const [showAgentHeaderDropdown, setShowAgentHeaderDropdown] = useState(false);
  const [showDateOptionsDropdown, setShowDateOptionsDropdown] = useState(false);
  const [dateSortType, setDateSortType] = useState('entry'); // 'entry' or 'comment'
  const [showSelectAllDropdown, setShowSelectAllDropdown] = useState(false);
  const statusFilterRef = useRef(null);
  const campaignFilterRef = useRef(null);
  const selectAllDropdownRef = useRef(null);
  const statusHeaderDropdownRef = useRef(null);
  const campaignHeaderDropdownRef = useRef(null);
  const countryHeaderDropdownRef = useRef(null);
  const agentHeaderDropdownRef = useRef(null);
  const dateOptionsDropdownRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    current: 1,
    total: 1,
    hasNext: false,
    hasPrev: false
  });
  const [analytics, setAnalytics] = useState({
    clientsByCampaign: [],
    leadStatusOverview: [],
    totalClients: 0
  });
  const [globalAnalytics, setGlobalAnalytics] = useState({
    leadStatusOverview: [],
    campaignOverview: [],
    totalClients: 0
  });

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [newClient, setNewClient] = useState({
    firstName: '',
    email: '',
    phone: '',
    country: '',
    status: 'New Lead',
    campaign: 'Data'
  });
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);

  // Agents state
  const [availableAgents, setAvailableAgents] = useState([]);

  // Countries state
  const [availableCountries, setAvailableCountries] = useState([]);

  // Context menu state for client names
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, clientId: null });
  const contextMenuRef = useRef(null);

  // Bulk campaign states
  const [showBulkCampaignModal, setShowBulkCampaignModal] = useState(false);
  const [bulkCampaignClients, setBulkCampaignClients] = useState([]);
  const [bulkCampaignSelected, setBulkCampaignSelected] = useState(new Set());
  const [bulkCampaign, setBulkCampaign] = useState('Data');
  const [bulkCampaignLoading, setBulkCampaignLoading] = useState(false);
  
  // Bulk campaign date filter states
  const [bulkCampaignDateFilter, setBulkCampaignDateFilter] = useState('');
  const [bulkCampaignEndDateFilter, setBulkCampaignEndDateFilter] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Date filter states
  const [showDateFilterModal, setShowDateFilterModal] = useState(false);
  const [dateFilter, setDateFilter] = useState('');
  const [dateFilterType, setDateFilterType] = useState('exact'); // exact, range
  const [endDateFilter, setEndDateFilter] = useState('');
  
  // Date navigation states
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateNavigationType, setDateNavigationType] = useState('entry'); // 'entry' or 'comment'

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'New Lead':
        return 'bg-green-100 text-green-800';
      case 'FTD':
        return 'bg-blue-100 text-blue-800';
      case 'FTD RETENTION':
        return 'bg-indigo-100 text-indigo-800';
      case 'Call Again':
        return 'bg-orange-100 text-orange-800';
      case 'No Answer':
        return 'bg-pink-100 text-pink-800';
      case 'NA5UP':
        return 'bg-teal-100 text-teal-800';
      case 'Not Interested':
        return 'bg-gray-100 text-gray-800';
      case 'Hang Up':
        return 'bg-purple-100 text-purple-800';
      case 'Wrong Number':
        return 'bg-red-100 text-red-800';
      case 'Wrong Name':
        return 'bg-amber-100 text-amber-800';
      case 'Perfilado':
        return 'bg-cyan-100 text-cyan-800';
      case 'campaign no interest':
        return 'bg-rose-100 text-rose-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCampaignColor = (campaign) => {
    switch (campaign) {
      case 'Data':
        return 'bg-indigo-100 text-indigo-800';
      case 'Data2':
        return 'bg-purple-100 text-purple-800';
      case 'Data3':
        return 'bg-pink-100 text-pink-800';
      case 'Data4':
        return 'bg-yellow-100 text-yellow-800';
      case 'Data5':
        return 'bg-orange-100 text-orange-800';
      case 'Affiliate':
        return 'bg-teal-100 text-teal-800';
      case 'not campaign':
        return 'bg-red-100 text-red-800';
      case 'DataR':
        return 'bg-indigo-200 text-indigo-900';
      case 'Data2R':
        return 'bg-purple-200 text-purple-900';
      case 'AffiliateR':
        return 'bg-teal-200 text-teal-900';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getAvatarColor = (name) => {
    const colors = ['bg-blue-500', 'bg-pink-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500'];
    const index = name.length % colors.length;
    return colors[index];
  };

  // Fetch global analytics (for lead status overview)
  const fetchGlobalAnalytics = async () => {
    try {
      const params = {
        ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
        ...(statusFilter.length > 0 && { status: statusFilter }),
        ...(campaignFilter.length > 0 && { campaign: campaignFilter }),
        ...(countryFilter.length > 0 && { country: countryFilter }),
        ...(user?.role === 'agent' ? { agent: user._id } : (agentFilter.length > 0 && { agent: agentFilter })),
        // Date filtering based on type
        ...(dateNavigationType === 'entry' && dateFilter && { registrationDate: dateFilter }),
        ...(dateNavigationType === 'entry' && endDateFilter && { endRegistrationDate: endDateFilter }),
        ...(dateNavigationType === 'comment' && dateFilter && { commentDate: dateFilter }),
        ...(dateNavigationType === 'comment' && endDateFilter && { endCommentDate: endDateFilter }),
        ...(dateFilter && { dateFilterType: dateNavigationType }),
        // Date sorting
        ...(dateSortType && { dateSortType }),
        // Date sorting
        ...(dateSortType && { dateSortType }),
        ...(unassignedFilter && { unassigned: true })
      };

      console.log('Frontend - Sending params to getLeadStatusOverview:', params);
      const globalAnalyticsData = await reportsAPI.getLeadStatusOverview(params);
      console.log('Frontend - Received globalAnalyticsData:', globalAnalyticsData);
      setGlobalAnalytics(globalAnalyticsData);
    } catch (err) {
      console.error('Error fetching global analytics:', err);
    }
  };

  // Fetch clients and analytics data
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // For duplicate filter, we need to fetch all clients to find duplicates
      const params = {
        page: duplicateFilter ? 1 : currentPage,
        limit: duplicateFilter ? 1000 : 50, // Fetch all clients for duplicate detection
        ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
        ...(statusFilter.length > 0 && { status: statusFilter }),
        ...(campaignFilter.length > 0 && { campaign: campaignFilter }),
        ...(countryFilter.length > 0 && { country: countryFilter }),
        // For agents, automatically filter to only their assigned clients
        // For TL, allow filtering by agent but don't restrict by default
        ...(user?.role === 'agent' ? { agent: user._id } : (agentFilter.length > 0 && { agent: agentFilter })),
        // Unassigned filter
        ...(unassignedFilter && { unassigned: true }),
        // Date filtering based on type
        ...(dateNavigationType === 'entry' && dateFilter && { registrationDate: dateFilter }),
        ...(dateNavigationType === 'entry' && endDateFilter && { endRegistrationDate: endDateFilter }),
        ...(dateNavigationType === 'comment' && dateFilter && { commentDate: dateFilter }),
        ...(dateNavigationType === 'comment' && endDateFilter && { endCommentDate: endDateFilter }),
        ...(dateFilter && { dateFilterType: dateNavigationType }),
        // Date sorting
        ...(dateSortType && { dateSortType })
      };
      
      // Debug logging for date filtering
      console.log('Frontend date filter params:', {
        dateNavigationType,
        dateFilter,
        endDateFilter,
        params
      });
      
      const clientsData = await clientAPI.getClients(params);
      let filteredClients = clientsData.clients || [];
      
      // Debug logging for client data
      console.log('Fetched clients data:', filteredClients.length);
      if (filteredClients.length > 0) {
        console.log('First client data:', {
          clientId: filteredClients[0].clientId,
          firstName: filteredClients[0].firstName,
          lastComment: filteredClients[0].lastComment,
          lastCommentDate: filteredClients[0].lastCommentDate,
          lastCommentViewer: filteredClients[0].lastCommentViewer
        });
      }
      
      // If duplicate filter is active, filter to show only duplicates
      if (duplicateFilter) {
        const duplicateIds = findDuplicateClients(filteredClients);
        filteredClients = filteredClients.filter(client => duplicateIds.includes(client._id));
      }
      
      setClients(filteredClients);
      setPagination(clientsData.pagination || {});
      
      // Analytics are now calculated dynamically from filtered clients
      // No need to fetch static analytics data
      
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, debouncedSearchTerm, statusFilter, campaignFilter, countryFilter, agentFilter, unassignedFilter, duplicateFilter, dateFilter, endDateFilter, dateNavigationType, dateSortType]);

  // Fetch global analytics whenever filters change (but not pagination)
  useEffect(() => {
    fetchGlobalAnalytics();
  }, [debouncedSearchTerm, statusFilter, campaignFilter, countryFilter, agentFilter, unassignedFilter, dateFilter, endDateFilter, dateNavigationType, dateSortType]);

  // Fetch available agents and countries
  useEffect(() => {
    const fetchAgentsAndCountries = async () => {
      try {
        const [agents, countries] = await Promise.all([
          clientAPI.getAvailableAgents(),
          clientAPI.getUniqueCountries()
        ]);
        setAvailableAgents(agents);
        setAvailableCountries(countries);
      } catch (err) {
        console.error('Error fetching agents and countries:', err);
      }
    };

    fetchAgentsAndCountries();
  }, []);

  // Close status filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusFilterRef.current && !statusFilterRef.current.contains(event.target)) {
        setShowStatusFilter(false);
      }
      if (campaignFilterRef.current && !campaignFilterRef.current.contains(event.target)) {
        setShowCampaignFilter(false);
      }
      if (selectAllDropdownRef.current && !selectAllDropdownRef.current.contains(event.target)) {
        setShowSelectAllDropdown(false);
      }
      if (statusHeaderDropdownRef.current && !statusHeaderDropdownRef.current.contains(event.target)) {
        setShowStatusHeaderDropdown(false);
      }
      if (campaignHeaderDropdownRef.current && !campaignHeaderDropdownRef.current.contains(event.target)) {
        setShowCampaignHeaderDropdown(false);
      }
      if (countryHeaderDropdownRef.current && !countryHeaderDropdownRef.current.contains(event.target)) {
        setShowCountryHeaderDropdown(false);
      }
      if (agentHeaderDropdownRef.current && !agentHeaderDropdownRef.current.contains(event.target)) {
        setShowAgentHeaderDropdown(false);
      }
      if (dateOptionsDropdownRef.current && !dateOptionsDropdownRef.current.contains(event.target)) {
        setShowDateOptionsDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle search input change
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Handle status filter
  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  // Handle campaign filter
  const handleCampaignFilter = (campaign) => {
    setCampaignFilter(campaign);
    setCurrentPage(1);
  };

  // Handle lead status overview clicks
  const handleLeadStatusClick = (status) => {
    setStatusFilter(prev => {
      if (prev.includes(status)) {
        // Remove if already selected
        return prev.filter(s => s !== status);
      } else {
        // Add if not selected
        return [...prev, status];
      }
    });
    setCurrentPage(1);
  };

  // Handle campaign overview clicks
  const handleCampaignClick = (campaign) => {
    setCampaignFilter(prev => {
      if (prev.includes(campaign)) {
        // Remove if already selected
        return prev.filter(c => c !== campaign);
      } else {
        // Add if not selected
        return [...prev, campaign];
      }
    });
    setCurrentPage(1);
  };

  // Handle select all clients across all pages
  const handleSelectAllClients = async () => {
    try {
      // Fetch all clients without pagination
      const params = {
        limit: 10000, // Large number to get all clients
        ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
        ...(statusFilter.length > 0 && { status: statusFilter }),
        ...(campaignFilter.length > 0 && { campaign: campaignFilter }),
        ...(countryFilter.length > 0 && { country: countryFilter }),
        ...(user?.role === 'agent' ? { agent: user._id } : (agentFilter.length > 0 && { agent: agentFilter })),
        ...(unassignedFilter && { unassigned: true }),
        ...(dateNavigationType === 'entry' && dateFilter && { registrationDate: dateFilter }),
        ...(dateNavigationType === 'entry' && endDateFilter && { endRegistrationDate: endDateFilter }),
        ...(dateNavigationType === 'comment' && dateFilter && { commentDate: dateFilter }),
        ...(dateNavigationType === 'comment' && endDateFilter && { endCommentDate: endDateFilter }),
        ...(dateFilter && { dateFilterType: dateNavigationType })
      };

      const clientsData = await clientAPI.getClients(params);
      const allClients = clientsData.clients || [];
      
      // Select all client IDs
      const allClientIds = new Set(allClients.map(client => client._id));
      setSelectedClients(allClientIds);
      setSelectAll(true);
      
      alert(`Selected all ${allClientIds.size} clients across all pages`);
    } catch (err) {
      console.error('Error selecting all clients:', err);
      alert('Failed to select all clients: ' + (err.message || 'Unknown error'));
    }
  };

  // Handle delete all selected clients
  const handleDeleteAllSelected = async () => {
    if (selectedClients.size === 0) {
      alert('No clients selected');
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ALL ${selectedClients.size} selected client(s)? This action cannot be undone.`
    );

    if (!confirmDelete) {
      return;
    }

    try {
      await clientAPI.deleteClients(Array.from(selectedClients));
      alert(`${selectedClients.size} client(s) deleted successfully!`);
      // Clear selection and refresh data
      setSelectedClients(new Set());
      setSelectAll(false);
      fetchData();
    } catch (err) {
      console.error('Error deleting clients:', err);
      alert('Failed to delete clients: ' + (err.message || 'Unknown error'));
    }
  };

  // Handle download all selected clients
  const handleDownloadAllSelected = async () => {
    if (selectedClients.size === 0) {
      alert('No clients selected');
      return;
    }

    try {
      const clientIds = Array.from(selectedClients);
      await clientAPI.exportClients('csv', clientIds);
      alert(`Successfully exported ${clientIds.length} client(s)`);
    } catch (err) {
      console.error('Error exporting clients:', err);
      alert('Failed to export clients: ' + (err.message || 'Unknown error'));
    }
  };

  // Handle left-click on client name
  const handleClientNameClick = async (e, clientId) => {
    // If Ctrl key (or Cmd on Mac) is pressed, allow natural browser behavior
    if (e.ctrlKey || e.metaKey) {
      // Mark the latest note as viewed (async, don't wait)
      const client = clients.find(c => c._id === clientId);
      if (client && client.notes && client.notes.length > 0) {
        const latestNote = client.notes[0];
        markNoteAsViewed(clientId, latestNote._id); // Fire and forget
      }
      // Don't prevent default - let browser open link in background tab naturally
      return;
    }
    
    // For normal click, prevent default and show context menu
    e.preventDefault();
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      clientId: clientId
    });
  };

  // Handle opening client profile in new tab
  const handleOpenClientInNewTab = async () => {
    if (contextMenu.clientId) {
      // Find the client to get the latest note ID
      const client = clients.find(c => c._id === contextMenu.clientId);
      if (client && client.notes && client.notes.length > 0) {
        // Mark the latest note as viewed
        const latestNote = client.notes[0]; // Notes are sorted by createdAt desc
        await markNoteAsViewed(contextMenu.clientId, latestNote._id);
      }
      
      window.open(`/clients/${contextMenu.clientId}`, '_blank');
      setContextMenu({ show: false, x: 0, y: 0, clientId: null });
    }
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
        setContextMenu({ show: false, x: 0, y: 0, clientId: null });
      }
    };

    if (contextMenu.show) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [contextMenu.show]);

  // Auto-refresh comments every 10 seconds for real-time updates (temporarily reduced for debugging)
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Auto-refreshing comments...');
      refreshCommentsOnly();
    }, 10 * 1000); // 10 seconds in milliseconds

    return () => clearInterval(interval);
  }, [currentPage, debouncedSearchTerm, statusFilter, campaignFilter, countryFilter, agentFilter, unassignedFilter, duplicateFilter, dateFilter, endDateFilter, dateNavigationType]);

  // Listen for note added events from other components
  useEffect(() => {
    const handleNoteAdded = (event) => {
      console.log('Note added event received:', event.detail);
      console.log('Refreshing data immediately...');
      // Refresh immediately without delay
      refreshDataImmediately();
      // Add a small delay to ensure the database has been updated
      setTimeout(() => {
        console.log('First refresh after 200ms...');
        refreshDataImmediately();
      }, 200);
      setTimeout(() => {
        console.log('Second refresh after 1 second...');
        refreshDataImmediately();
      }, 1000);
    };

    const handleStorageChange = (event) => {
      if (event.key === 'noteAdded') {
        console.log('localStorage noteAdded event received:', event.newValue);
        const noteData = JSON.parse(event.newValue);
        console.log('Refreshing data due to localStorage change...');
        setTimeout(() => {
          refreshDataImmediately();
        }, 500);
      }
    };

    const handleMessage = (event) => {
      if (event.data && event.data.type === 'REFRESH_CLIENT_MANAGEMENT') {
        console.log('Received postMessage to refresh ClientManagement');
        setTimeout(() => {
          refreshDataImmediately();
        }, 200);
      }
    };

    window.addEventListener('noteAdded', handleNoteAdded);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('message', handleMessage);
    console.log('ClientManagement: Added noteAdded event listener, storage listener, and message listener');
    
    return () => {
      window.removeEventListener('noteAdded', handleNoteAdded);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('message', handleMessage);
      console.log('ClientManagement: Removed event listeners');
    };
  }, []);

  // Function to update a specific client in the list
  const updateClientInList = (updatedClient) => {
    setClients(prevClients => 
      prevClients.map(client => 
        client._id === updatedClient._id ? updatedClient : client
      )
    );
  };

  // Function to mark a note as viewed when someone opens the client profile
  const markNoteAsViewed = async (clientId, noteId) => {
    try {
      await clientAPI.markNoteAsViewed(clientId, noteId);
      // Refresh the specific client data to get updated viewer information
      refreshCommentsOnly();
    } catch (error) {
      console.error('Error marking note as viewed:', error);
    }
  };

  // Function to refresh data immediately (can be called from other components)
  const refreshDataImmediately = async () => {
    console.log('Refreshing data immediately...');
    setIsRefreshing(true);
    try {
      await fetchData();
      console.log('Data refresh completed');
      console.log('Current clients after refresh:', clients.length);
      if (clients.length > 0) {
        console.log('First client lastComment:', clients[0].lastComment);
        console.log('First client lastCommentDate:', clients[0].lastCommentDate);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Make refresh function available globally for debugging
  useEffect(() => {
    window.refreshClientManagement = refreshDataImmediately;
    return () => {
      delete window.refreshClientManagement;
    };
  }, []);

  // Function to refresh only comments data without full page reload
  const refreshCommentsOnly = async () => {
    try {
      setIsRefreshing(true);
      const params = {
        page: duplicateFilter ? 1 : currentPage,
        limit: duplicateFilter ? 1000 : 50,
        ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
        ...(statusFilter.length > 0 && { status: statusFilter }),
        ...(campaignFilter.length > 0 && { campaign: campaignFilter }),
        ...(countryFilter.length > 0 && { country: countryFilter }),
        ...(user?.role === 'agent' ? { agent: user._id } : (agentFilter.length > 0 && { agent: agentFilter })),
        ...(unassignedFilter && { unassigned: true }),
        ...(dateNavigationType === 'entry' && dateFilter && { registrationDate: dateFilter }),
        ...(dateNavigationType === 'entry' && endDateFilter && { endRegistrationDate: endDateFilter }),
        ...(dateNavigationType === 'comment' && dateFilter && { commentDate: dateFilter }),
        ...(dateNavigationType === 'comment' && endDateFilter && { endCommentDate: endDateFilter }),
        ...(dateFilter && { dateFilterType: dateNavigationType })
      };
      
      const clientsData = await clientAPI.getClients(params);
      let filteredClients = clientsData.clients || [];
      
      if (duplicateFilter) {
        const duplicateIds = findDuplicateClients(filteredClients);
        filteredClients = filteredClients.filter(client => duplicateIds.includes(client._id));
      }
      
      // Only update if there are actual changes
      setClients(prevClients => {
        const hasChanges = prevClients.some((prevClient, index) => {
          const newClient = filteredClients[index];
          if (!newClient) return true;
          return (
            prevClient.lastComment !== newClient.lastComment ||
            prevClient.lastCommentDate !== newClient.lastCommentDate ||
            JSON.stringify(prevClient.lastCommentAuthor) !== JSON.stringify(newClient.lastCommentAuthor) ||
            JSON.stringify(prevClient.lastCommentViewer) !== JSON.stringify(newClient.lastCommentViewer)
          );
        });
        
        return hasChanges ? filteredClients : prevClients;
      });
    } catch (err) {
      console.error('Error refreshing comments:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle select all checkbox
  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      const allClientIds = new Set(clients.map(client => client._id));
      setSelectedClients(allClientIds);
    } else {
      setSelectedClients(new Set());
    }
  };

  // Handle individual client selection
  const handleClientSelect = (clientId, checked) => {
    const newSelectedClients = new Set(selectedClients);
    if (checked) {
      newSelectedClients.add(clientId);
    } else {
      newSelectedClients.delete(clientId);
    }
    setSelectedClients(newSelectedClients);
    setSelectAll(newSelectedClients.size === clients.length);
  };

  // Find duplicate clients based on name, email, and phone
  const findDuplicateClients = (clientsList) => {
    const duplicates = new Set();
    const seen = new Map();

    clientsList.forEach(client => {
      // Create keys for different types of duplicates
      const nameKey = `${client.firstName?.toLowerCase() || ''}_${client.lastName?.toLowerCase() || ''}`;
      const emailKey = client.email?.toLowerCase() || '';
      const phoneKey = client.phone?.replace(/\D/g, '') || ''; // Remove non-digits for phone comparison

      // Check for name duplicates
      if (nameKey && nameKey !== '_') {
        if (seen.has(`name_${nameKey}`)) {
          duplicates.add(client._id);
          duplicates.add(seen.get(`name_${nameKey}`));
        } else {
          seen.set(`name_${nameKey}`, client._id);
        }
      }

      // Check for email duplicates
      if (emailKey) {
        if (seen.has(`email_${emailKey}`)) {
          duplicates.add(client._id);
          duplicates.add(seen.get(`email_${emailKey}`));
        } else {
          seen.set(`email_${emailKey}`, client._id);
        }
      }

      // Check for phone duplicates
      if (phoneKey) {
        if (seen.has(`phone_${phoneKey}`)) {
          duplicates.add(client._id);
          duplicates.add(seen.get(`phone_${phoneKey}`));
        } else {
          seen.set(`phone_${phoneKey}`, client._id);
        }
      }
    });

    return Array.from(duplicates);
  };

  // Handle assign clients to agent
  const handleAssignClients = async () => {
    if (selectedClients.size === 0 || !assignToAgent) {
      alert('Please select clients and an agent to assign');
      return;
    }

    try {
      // API call to assign clients
      await clientAPI.assignClients(Array.from(selectedClients), assignToAgent);
      alert('Clients assigned successfully!');
      // Refresh data after assignment
      fetchData();
    } catch (err) {
      console.error('Error assigning clients:', err);
      alert('Failed to assign clients: ' + (err.message || 'Unknown error'));
    }
  };

  // Toggle status header dropdown
  const toggleStatusHeaderDropdown = () => {
    setShowStatusHeaderDropdown(prev => !prev);
  };

  // Toggle campaign header dropdown
  const toggleCampaignHeaderDropdown = () => {
    setShowCampaignHeaderDropdown(prev => !prev);
  };

  // Toggle country header dropdown
  const toggleCountryHeaderDropdown = () => {
    setShowCountryHeaderDropdown(prev => !prev);
  };

  // Toggle agent header dropdown
  const toggleAgentHeaderDropdown = () => {
    setShowAgentHeaderDropdown(prev => !prev);
  };

  // Toggle date options dropdown
  const toggleDateOptionsDropdown = () => {
    setShowDateOptionsDropdown(prev => !prev);
  };

  // Handle date sorting (newest first)
  const handleDateSortNewest = () => {
    setDateSortType('entry');
    // Clear any existing date filters and sort by newest entry date
    setDateFilter('');
    setEndDateFilter('');
    setCurrentPage(1);
    // The sorting will be handled by the API call
  };

  // Handle date sorting (oldest first)
  const handleDateSortOldest = () => {
    setDateSortType('entry');
    // Clear any existing date filters and sort by oldest entry date
    setDateFilter('');
    setEndDateFilter('');
    setCurrentPage(1);
    // The sorting will be handled by the API call
  };

  // Handle comment date sorting (newest first)
  const handleCommentSortNewest = () => {
    setDateSortType('comment');
    // Clear any existing date filters and sort by newest comment date
    setDateFilter('');
    setEndDateFilter('');
    setCurrentPage(1);
    // The sorting will be handled by the API call
  };

  // Handle comment date sorting (oldest first)
  const handleCommentSortOldest = () => {
    setDateSortType('comment');
    // Clear any existing date filters and sort by oldest comment date
    setDateFilter('');
    setEndDateFilter('');
    setCurrentPage(1);
    // The sorting will be handled by the API call
  };

  // Handle delete selected clients
  const handleDeleteClients = async () => {
    if (selectedClients.size === 0) {
      alert('Please select clients to delete');
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedClients.size} selected client(s)? This action cannot be undone again`
    );

    if (!confirmDelete) {
      return;
    }

    try {
      // API call to delete clients
      await clientAPI.deleteClients(Array.from(selectedClients));
      alert(`${selectedClients.size} client(s) deleted successfully!`);
      // Clear selection and refresh data
      setSelectedClients(new Set());
      setSelectAll(false);
      fetchData();
    } catch (err) {
      console.error('Error deleting clients:', err);
      alert('Failed to delete clients: ' + (err.message || 'Unknown error'));
    }
  };

  // Fetch all clients for bulk campaign update
  const fetchBulkCampaignClients = async () => {
    try {
      const params = {
        limit: 1000,
        // For agents, automatically filter to only their assigned clients
        ...(user?.role === 'agent' ? { agent: user._id } : {}),
        // Apply date filters if set (bulk campaign always uses entry date filtering)
        ...(bulkCampaignDateFilter && { registrationDate: bulkCampaignDateFilter }),
        ...(bulkCampaignEndDateFilter && { endRegistrationDate: bulkCampaignEndDateFilter }),
        ...(bulkCampaignDateFilter && { dateFilterType: 'entry' })
      };
      
      const clientsData = await clientAPI.getClients(params);
      setBulkCampaignClients(clientsData.clients || []);
    } catch (err) {
      console.error('Error fetching clients:', err);
      alert('Failed to fetch clients: ' + (err.message || 'Unknown error'));
    }
  };

  // Clear bulk campaign date filters
  const clearBulkCampaignDateFilters = () => {
    setBulkCampaignDateFilter('');
    setBulkCampaignEndDateFilter('');
  };

  // Date navigation functions - now opens date filter modal instead of auto-applying
  const navigateDate = (direction, type) => {
    // Set the navigation type and open the date filter modal
    setDateNavigationType(type);
    setShowDateFilterModal(true);
  };

  const resetDateNavigation = () => {
    setCurrentDate(new Date().toISOString().split('T')[0]);
    setDateFilter('');
    setEndDateFilter('');
    setDateNavigationType('entry');
    setDateFilterType('exact');
  };

  // Handle bulk campaign update
  const handleBulkCampaignUpdate = async () => {
    if (bulkCampaignSelected.size === 0) {
      alert('Please select at least one client');
      return;
    }

    const confirmUpdate = window.confirm(
      `Are you sure you want to update ${bulkCampaignSelected.size} client(s) to campaign "${bulkCampaign}"?`
    );

    if (!confirmUpdate) {
      return;
    }

    setBulkCampaignLoading(true);
    try {
      // Update campaigns for selected clients
      const updatePromises = Array.from(bulkCampaignSelected).map(clientId => 
        clientAPI.updateClient(clientId, { campaign: bulkCampaign })
      );
      
      await Promise.all(updatePromises);
      
      alert(`Successfully updated ${bulkCampaignSelected.size} client(s) to campaign "${bulkCampaign}"!`);
      
      // Close modal and reset state
      setShowBulkCampaignModal(false);
      setBulkCampaignSelected(new Set());
      setBulkCampaign('Data');
      clearBulkCampaignDateFilters();
      
      // Refresh data
      fetchData();
    } catch (err) {
      console.error('Error updating campaigns:', err);
      alert('Failed to update campaigns: ' + (err.message || 'Unknown error'));
    } finally {
      setBulkCampaignLoading(false);
    }
  };

  // Handle client selection for bulk campaign update
  const handleBulkCampaignClientSelect = (clientId, checked) => {
    const newSelectedClients = new Set(bulkCampaignSelected);
    if (checked) {
      newSelectedClients.add(clientId);
    } else {
      newSelectedClients.delete(clientId);
    }
    setBulkCampaignSelected(newSelectedClients);
  };

  // Handle select all clients for bulk campaign update
  const handleSelectAllBulkCampaignClients = (checked) => {
    if (checked) {
      const allClientIds = new Set(bulkCampaignClients.map(client => client._id));
      setBulkCampaignSelected(allClientIds);
    } else {
      setBulkCampaignSelected(new Set());
    }
  };

  // Handle date filter
  const handleDateFilter = () => {
    if (!dateFilter) {
      alert('Please select a date first');
      return;
    }
    setCurrentPage(1);
    setShowDateFilterModal(false);
  };

  // Clear date filter
  const clearDateFilter = () => {
    setDateFilter('');
    setEndDateFilter('');
    setDateFilterType('exact');
    setCurrentPage(1);
  };

  // Handle export clients
  const handleExportClients = async () => {
    try {
      if (selectedClients.size === 0) {
        alert('Please select at least one client to export');
        return;
      }
      
      const clientIds = Array.from(selectedClients);
      await clientAPI.exportClients('csv', clientIds);
      alert(`Successfully exported ${clientIds.length} client(s)`);
    } catch (err) {
      console.error('Error exporting clients:', err);
      alert('Failed to export clients: ' + (err.message || 'Unknown error'));
    }
  };

     // Handle import clients
   const handleImportClients = async () => {
     if (!importFile) {
       alert('Please select a file to import');
       return;
     }

     setImportLoading(true);
     try {
       const text = await importFile.text();
       const lines = text.split('\n').filter(line => line.trim()); // Remove empty lines
       
       if (lines.length < 2) {
         alert('CSV file must have at least a header row and one data row');
         return;
       }

       // Expected headers in order: name, email, number/phone, country, campaign
       const expectedHeaders = ['name', 'email', 'number', 'country', 'campaign'];
       const actualHeaders = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
       
       // Validate headers
       if (actualHeaders.length !== expectedHeaders.length) {
         alert(`CSV must have exactly ${expectedHeaders.length} columns in this order: ${expectedHeaders.join(', ')}`);
         return;
       }
       
       // Check if headers match expected order
       const isValidOrder = expectedHeaders.every((header, index) => 
         actualHeaders[index] === header || 
         (header === 'number' && (actualHeaders[index] === 'phone' || actualHeaders[index] === 'number'))
       );
       
       if (!isValidOrder) {
         alert(`CSV headers must be in this exact order: ${expectedHeaders.join(', ')}`);
         return;
       }

               // Parse data rows
        const clientsData = lines.slice(1).map((line, index) => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          
          if (values.length !== expectedHeaders.length) {
            throw new Error(`Row ${index + 2} has ${values.length} columns, expected ${expectedHeaders.length}`);
          }

          // Use full name as firstName
          const fullName = values[0] || '';

          return {
            firstName: fullName,
            email: values[1] || '',
            phone: values[2] || '', // number or phone column
            country: values[3] || '',
            status: 'New Lead', // Default status
            campaign: values[4] || 'Data' // campaign column, default to 'Data' if empty
          };
        }).filter(client => {
          // Validate required fields
          if (!client.firstName || !client.email) {
            console.warn(`Skipping row: missing firstName or email`);
            return false;
          }
          return true;
        });

       if (clientsData.length === 0) {
         alert('No valid client data found. Please check your CSV format.');
         return;
       }

       await clientAPI.importClients(clientsData);
       alert(`Successfully imported ${clientsData.length} clients!`);
       setShowImportModal(false);
       setImportFile(null);
       fetchData();
     } catch (err) {
       console.error('Error importing clients:', err);
       alert('Failed to import clients: ' + (err.message || 'Unknown error'));
     } finally {
       setImportLoading(false);
     }
   };

  // Handle add new client
  const handleAddClient = async () => {
    try {
      const response = await clientAPI.createClient(newClient);
      const clientName = newClient.firstName;
      
      // Add notification for new client
      addClientNotification('created', clientName, response._id || 'new-client');
      
      alert('Client added successfully!');
      setShowAddModal(false);
      setNewClient({
        firstName: '',
        email: '',
        phone: '',
        country: '',
        status: 'New Lead',
        campaign: 'Data'
      });
      
      // Refresh clients list instead of reloading the page
      fetchData();
    } catch (err) {
      console.error('Error adding client:', err);
      alert('Failed to add client: ' + (err.message || 'Unknown error'));
    }
  };

  // Handle edit client
  const handleEditClient = (client) => {
    setEditingClient({
      _id: client._id,
      firstName: client.firstName,
      email: client.email,
      phone: client.phone,
      country: client.country,
      status: client.status,
      campaign: client.campaign
    });
    setShowEditModal(true);
  };

  // Handle update client
  const handleUpdateClient = async () => {
    try {
      await clientAPI.updateClient(editingClient._id, {
        firstName: editingClient.firstName,
        email: editingClient.email,
        phone: editingClient.phone,
        country: editingClient.country,
        status: editingClient.status,
        campaign: editingClient.campaign
      });
      
      alert('Client updated successfully!');
      setShowEditModal(false);
      setEditingClient(null);
      
      // Refresh clients list
      fetchData();
    } catch (err) {
      console.error('Error updating client:', err);
      alert('Failed to update client: ' + (err.message || 'Unknown error'));
    }
  };

  // Handle call client
  const handleCall = (client) => {
    if (!client.phone) {
      alert('Client phone number not found');
      return;
    }
    
    // Format phone number (remove any non-digit characters)
    const phoneNumber = client.phone.replace(/\D/g, '');
    
    // Open dialer with hidden number for agents
    const telUrl = `tel:${phoneNumber}`;
    window.open(telUrl, '_self');
    
         // Show success message (hide phone number for non-admins)
     setTimeout(() => {
       if (canViewPhoneNumbers(user)) {
         alert(`Calling ${client.firstName} at ${client.phone}`);
       } else {
         alert(`Calling ${client.firstName}`);
       }
     }, 100);
  };



  // Handle email client
  const handleEmail = (client) => {
    if (!client.email) {
      alert('Client email not found');
      return;
    }
    
    // Detect email provider and open appropriate client
    const email = client.email.toLowerCase();
    let provider = 'Email Client';
    
    if (email.includes('@gmail.com')) {
      // Gmail Web
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(client.email)}&su=${encodeURIComponent('Follow-up')}&body=${encodeURIComponent(`Hi ${client.firstName},\n\nI hope you're doing well. I wanted to follow up on our previous conversation.\n\nBest regards,\nYour Team`)}`;
      window.open(gmailUrl, '_blank');
      provider = 'Gmail';
    } else if (email.includes('@outlook.com') || email.includes('@hotmail.com') || email.includes('@live.com')) {
      // Outlook Web
      const outlookUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(client.email)}&subject=${encodeURIComponent('Follow-up')}&body=${encodeURIComponent(`Hi ${client.firstName},\n\nI hope you're doing well. I wanted to follow up on our previous conversation.\n\nBest regards,\nYour Team`)}`;
      window.open(outlookUrl, '_blank');
      provider = 'Outlook';
    } else if (email.includes('@yahoo.com')) {
      // Yahoo Mail Web
      const yahooUrl = `https://compose.mail.yahoo.com/?to=${encodeURIComponent(client.email)}&subject=${encodeURIComponent('Follow-up')}&body=${encodeURIComponent(`Hi ${client.firstName},\n\nI hope you're doing well. I wanted to follow up on our previous conversation.\n\nBest regards,\nYour Team`)}`;
      window.open(yahooUrl, '_blank');
      provider = 'Yahoo Mail';
    } else {
      // Default mailto for other providers
      const mailtoUrl = `mailto:${client.email}?subject=${encodeURIComponent('Follow-up')}&body=${encodeURIComponent(`Hi ${client.firstName},\n\nI hope you're doing well. I wanted to follow up on our previous conversation.\n\nBest regards,\nYour Team`)}`;
      window.open(mailtoUrl, '_self');
    }
    
         // Show success message (hide email for non-admins and non-team-leads)
     setTimeout(() => {
       if (canViewEmailAddresses(user)) {
         alert(`${provider} opened for ${client.firstName} with pre-filled email`);
       } else {
         alert(`${provider} opened for ${client.firstName}`);
       }
     }, 100);
  };

  // Calculate dynamic analytics from current clients (which are already filtered by the API)
  const calculateDynamicAnalytics = () => {
    // Define all possible campaign types
    const allCampaigns = ['Data', 'Affiliate', 'Data2', 'Data3', 'not campaign', 'DataR', 'Data2R', 'AffiliateR'];
    
    // Calculate clients by campaign from current clients
    const campaignCounts = {};
    const statusCounts = {};
    
    // Initialize all campaigns with 0 count
    allCampaigns.forEach(campaign => {
      campaignCounts[campaign] = 0;
    });
    
    clients.forEach(client => {
      // Count by campaign
      const campaign = client.campaign || 'Data';
      if (allCampaigns.includes(campaign)) {
        campaignCounts[campaign] = (campaignCounts[campaign] || 0) + 1;
      }
      
      // Count by status
      const status = client.status || 'Unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    // Convert to arrays for charts - always include all campaigns
    const clientsByCampaign = allCampaigns.map(campaign => ({
      _id: campaign,
      count: campaignCounts[campaign] || 0
    }));
    
    const leadStatusOverview = Object.entries(statusCounts).map(([status, count]) => ({
      _id: status,
      count: count
    }));
    
    return {
      clientsByCampaign,
      leadStatusOverview,
      totalClients: clients.length
    };
  };

  const dynamicAnalytics = calculateDynamicAnalytics();

  // Transform analytics data for charts with consistent colors for each campaign
  const getCampaignChartColor = (campaign) => {
    switch (campaign) {
      case 'Data':
        return '#6366F1'; // Indigo
      case 'Affiliate':
        return '#10B981'; // Emerald
      case 'Data2':
        return '#8B5CF6'; // Purple
      case 'Data3':
        return '#EC4899'; // Pink
      case 'not campaign':
        return '#EF4444'; // Red
      case 'DataR':
        return '#4338CA'; // Dark Indigo
      case 'Data2R':
        return '#7C3AED'; // Dark Purple
      case 'AffiliateR':
        return '#059669'; // Dark Emerald
      default:
        return '#6B7280'; // Gray
    }
  };

  const pieChartData = dynamicAnalytics.clientsByCampaign
    .map((item) => ({
      name: item._id,
      value: item.count === 0 ? 0.1 : item.count, // Use 0.1 for zero values to show as tiny segments
      actualValue: item.count, // Keep the actual count for tooltip
      color: getCampaignChartColor(item._id)
    }));





     if (loading) {
     return (
       <div className="flex items-center justify-center h-64 p-4">
         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
       </div>
     );
   }

   if (error) {
     return (
       <div className="flex items-center justify-center h-64 p-4">
         <div className="bg-red-50 border border-red-200 rounded-lg p-4">
           <p className="text-red-800">{error}</p>
         </div>
       </div>
     );
   }

  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen">
      {/* Top Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 space-y-4 lg:space-y-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, ID, or email..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
            />
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
          </div>
        </div>
        {isAdmin(user) && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
            <button 
              onClick={() => {
                if (selectedClients.size === 0) {
                  alert('Please select a client to edit');
                  return;
                }
                if (selectedClients.size > 1) {
                  alert('Please select only one client to edit');
                  return;
                }
                const clientId = Array.from(selectedClients)[0];
                const client = clients.find(c => c._id === clientId);
                if (client) {
                  handleEditClient(client);
                }
              }}
              disabled={selectedClients.size !== 1}
              className="flex items-center justify-center px-2 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <Edit className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Edit</span>
            </button>
            <button 
              onClick={() => setShowImportModal(true)}
              className="flex items-center justify-center px-2 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Import</span>
            </button>
            <button 
              onClick={handleExportClients}
              disabled={selectedClients.size === 0}
              className={`flex items-center justify-center px-2 py-2 rounded-lg text-sm transition-colors ${
                selectedClients.size === 0
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">
                Export {selectedClients.size > 0 && `(${selectedClients.size})`}
              </span>
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center px-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Add</span>
            </button>
          </div>
        )}
      </div>

      {/* Combined Assignment Bar and Filter Buttons - Same Line */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-3 lg:space-y-0 mb-6 p-4 bg-white rounded-lg shadow-sm">
        {/* Left Side - Assignment Controls (Admin only) */}
        {isAdmin(user) && (
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="selectAll" 
                checked={selectAll}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="selectAll" className="text-sm text-gray-700 font-medium">
                Select All
              </label>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <span className="text-sm text-gray-700 font-medium">Assign to:</span>
              <select 
                value={assignToAgent}
                onChange={(e) => setAssignToAgent(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Select Agent</option>
                {availableAgents.map((agent) => (
                  <option key={agent._id} value={agent._id}>
                    {agent.firstName} {agent.lastName}
                  </option>
                ))}
              </select>
              <button 
                onClick={handleAssignClients}
                disabled={selectedClients.size === 0 || !assignToAgent}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Assign ({selectedClients.size})
              </button>
              
              {/* Select All Dropdown */}
              <div className="relative" ref={selectAllDropdownRef}>
                <button 
                  onClick={() => setShowSelectAllDropdown(!showSelectAllDropdown)}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center space-x-1"
                >
                  <Users className="w-4 h-4" />
                  <span>Select All</span>
                </button>
                
                {showSelectAllDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          handleSelectAllClients();
                          setShowSelectAllDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-gray-700"
                      >
                        Select All Clients
                      </button>
                      <button
                        onClick={() => {
                          handleDeleteAllSelected();
                          setShowSelectAllDropdown(false);
                        }}
                        disabled={selectedClients.size === 0}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                          selectedClients.size === 0 ? 'text-gray-400 cursor-not-allowed' : 'text-red-700 hover:bg-red-50'
                        }`}
                      >
                        Delete All ({selectedClients.size})
                      </button>
                      <button
                        onClick={() => {
                          handleDownloadAllSelected();
                          setShowSelectAllDropdown(false);
                        }}
                        disabled={selectedClients.size === 0}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                          selectedClients.size === 0 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-700 hover:bg-blue-50'
                        }`}
                      >
                        Download All ({selectedClients.size})
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Right Side - Filter Buttons */}
        <div className="flex items-center space-x-2 flex-wrap">
          {/* Duplicate Clients Button - Admin only */}
          {isAdmin(user) && (
            <button 
              onClick={() => {
                setDuplicateFilter(!duplicateFilter);
                setCurrentPage(1); // Reset to first page when filter changes
              }}
              className={`px-3 py-2 text-white rounded-lg text-sm font-medium flex items-center space-x-1 transition-colors ${
                duplicateFilter 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              <Copy className="w-4 h-4" />
              <span>Duplicates</span>
            </button>
          )}
          
             
             
             {/* Admin-only filter buttons */}
             {isAdmin(user) && (
               <>
                 <button 
                   onClick={() => {
                     fetchBulkCampaignClients();
                     setShowBulkCampaignModal(true);
                   }}
                   className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium flex items-center space-x-1"
                 >
                   <Users className="w-4 h-4" />
                   <span>Bulk</span>
                 </button>
                 <button 
                   onClick={() => {
                     setUnassignedFilter(!unassignedFilter);
                     // Reset agent filter when unassigned filter is activated
                     if (!unassignedFilter) {
                       setAgentFilter([]);
                     }
                     setCurrentPage(1); // Reset to first page when filter changes
                   }}
                   className={`px-3 py-2 text-white rounded-lg text-sm font-medium flex items-center space-x-1 transition-colors ${
                     unassignedFilter 
                       ? 'bg-red-600 hover:bg-red-700' 
                       : 'bg-gray-600 hover:bg-gray-700'
                   }`}
                 >
                   <User className="w-4 h-4" />
                   <span>Unassigned</span>
                 </button>
                 <button 
                   onClick={() => setShowDateFilterModal(true)}
                   className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center space-x-1 border-2 border-green-500 hover:border-green-400"
                 >
                   <Calendar className="w-4 h-4" />
                   <span>Date</span>
                 </button>
                 <button 
                   onClick={handleDeleteClients}
                   disabled={selectedClients.size === 0}
                   className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center space-x-1"
                 >
                   <Trash2 className="w-4 h-4" />
                   <span>Delete ({selectedClients.size})</span>
                 </button>
               </>
             )}
        </div>
      </div>

      {/* Main Client Table */}
      <div className="mb-6">
        {/* Duplicate Filter Indicator */}
        {duplicateFilter && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Copy className="w-5 h-5 text-yellow-600" />
                <span className="text-yellow-800 font-medium">
                  Showing {clients.length} duplicate client{clients.length !== 1 ? 's' : ''} 
                  {clients.length > 0 && ' (based on matching name, email, or phone number)'}
                </span>
              </div>
              <button
                onClick={() => setDuplicateFilter(false)}
                className="text-yellow-600 hover:text-yellow-800 font-medium text-sm"
              >
                Clear Filter
              </button>
            </div>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          
          {/* Top Pagination */}
          <div className="px-4 lg:px-6 py-3 border-b border-gray-200 bg-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="text-xs lg:text-sm text-gray-700 text-center sm:text-left">
                {(!pagination.totalClients || pagination.totalClients === 0) ? (
                  <span>No customers found</span>
                ) : pagination.totalClients === 1 ? (
                  <span>1 customer</span>
                ) : (
                  <span>
                    {pagination.current} of {pagination.total} pages • {pagination.totalClients} customer{pagination.totalClients !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-center space-x-1 lg:space-x-2">
                {/* First Page Button */}
                {pagination.current > 3 && (
                  <>
                    <button 
                      onClick={() => setCurrentPage(1)}
                      className="px-2 lg:px-3 py-1 text-xs lg:text-sm text-gray-500 hover:text-gray-700"
                    >
                      1
                    </button>
                    {pagination.current > 4 && (
                      <span className="px-1 text-gray-400">...</span>
                    )}
                  </>
                )}

                {/* Previous Button */}
                <button 
                  onClick={() => setCurrentPage(pagination.current - 1)}
                  disabled={!pagination.hasPrev}
                  className="px-2 lg:px-3 py-1 text-xs lg:text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                {/* Dynamic Page Numbers */}
                {(() => {
                  const current = pagination.current;
                  const total = pagination.total;
                  const pages = [];
                  
                  // Calculate start and end page numbers
                  let startPage = Math.max(1, current - 2);
                  let endPage = Math.min(total, current + 2);
                  
                  // Adjust if we're near the beginning or end
                  if (current <= 3) {
                    endPage = Math.min(total, 5);
                  }
                  if (current >= total - 2) {
                    startPage = Math.max(1, total - 4);
                  }
                  
                  // Generate page numbers
                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <button 
                        key={i}
                        onClick={() => setCurrentPage(i)}
                        className={`px-2 lg:px-3 py-1 text-xs lg:text-sm rounded ${
                          i === current 
                            ? 'bg-blue-600 text-white' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {i}
                      </button>
                    );
                  }
                  
                  return pages;
                })()}

                {/* Next Button */}
                <button 
                  onClick={() => setCurrentPage(pagination.current + 1)}
                  disabled={!pagination.hasNext}
                  className="px-2 lg:px-3 py-1 text-xs lg:text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>

                {/* Last Page Button */}
                {pagination.current < pagination.total - 2 && (
                  <>
                    {pagination.current < pagination.total - 3 && (
                      <span className="px-1 text-gray-400">...</span>
                    )}
                    <button 
                      onClick={() => setCurrentPage(pagination.total)}
                      className="px-2 lg:px-3 py-1 text-xs lg:text-sm text-gray-500 hover:text-gray-700"
                    >
                      {pagination.total}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto" style={{ direction: 'rtl' }}>
            <table className="w-full min-w-[800px]" style={{ direction: 'ltr' }}>
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 lg:px-6 py-3 text-left">
                    <input 
                      type="checkbox" 
                      checked={selectAll}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CLIENT NAME</th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="relative" ref={countryHeaderDropdownRef}>
                      <button
                        onClick={toggleCountryHeaderDropdown}
                        className={`flex items-center space-x-2 hover:bg-gray-100 rounded px-2 py-1 transition-colors ${
                          countryFilter.length > 0 ? 'bg-blue-50 text-blue-700' : 'text-gray-500'
                        }`}
                      >
                        <span>COUNTRY</span>
                        <Filter className="w-3 h-3" />
                      </button>
                      
                      {showCountryHeaderDropdown && (
                        <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                          <div className="py-1">
                            <button
                              onClick={() => {
                                setCountryFilter([]);
                                setCurrentPage(1);
                              }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2 ${
                                countryFilter.length === 0 ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={countryFilter.length === 0}
                                readOnly
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span>All Countries</span>
                            </button>
                            {availableCountries.length > 0 ? (
                              availableCountries.map((country) => (
                                <button
                                  key={country}
                                  onClick={() => {
                                    setCountryFilter(prev => {
                                      if (prev.includes(country)) {
                                        return prev.filter(c => c !== country);
                                      } else {
                                        return [...prev, country];
                                      }
                                    });
                                    setCurrentPage(1);
                                  }}
                                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2 ${
                                    countryFilter.includes(country) ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={countryFilter.includes(country)}
                                    readOnly
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                  />
                                  <span>{country}</span>
                                </button>
                              ))
                            ) : (
                              <div className="px-3 py-4 text-center text-sm text-gray-500">
                                No countries available
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </th>
                                     {canViewPhoneNumbers(user) && (
                     <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PHONE</th>
                   )}
                   {canViewEmailAddresses(user) && (
                     <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EMAIL</th>
                   )}
                  {(isAdmin(user) || isTeamLeader(user)) && (
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="relative" ref={agentHeaderDropdownRef}>
                        <button
                          onClick={toggleAgentHeaderDropdown}
                          className={`flex items-center space-x-2 hover:bg-gray-100 rounded px-2 py-1 transition-colors ${
                            agentFilter.length > 0 ? 'bg-blue-50 text-blue-700' : 'text-gray-500'
                          }`}
                        >
                          <span>ASSIGNED AGENT</span>
                          <Filter className="w-3 h-3" />
                        </button>
                        
                        {showAgentHeaderDropdown && (
                          <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  setAgentFilter([]);
                                  setCurrentPage(1);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2 ${
                                  agentFilter.length === 0 ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={agentFilter.length === 0}
                                  readOnly
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span>All Agents</span>
                              </button>
                              {availableAgents.length > 0 ? (
                                availableAgents.map((agent) => (
                                  <button
                                    key={agent._id}
                                    onClick={() => {
                                      setAgentFilter(prev => {
                                        if (prev.includes(agent._id)) {
                                          return prev.filter(a => a !== agent._id);
                                        } else {
                                          return [...prev, agent._id];
                                        }
                                      });
                                      setCurrentPage(1);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2 ${
                                      agentFilter.includes(agent._id) ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={agentFilter.includes(agent._id)}
                                      readOnly
                                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium ${getAvatarColor(agent.firstName)}`}>
                                      {getInitials(agent.firstName, agent.lastName)}
                                    </div>
                                    <span>{agent.firstName} {agent.lastName}</span>
                                  </button>
                                ))
                              ) : (
                                <div className="px-3 py-4 text-center text-sm text-gray-500">
                                  No agents available
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </th>
                  )}
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="relative" ref={statusHeaderDropdownRef}>
                      <button
                        onClick={toggleStatusHeaderDropdown}
                        className={`flex items-center space-x-2 hover:bg-gray-100 rounded px-2 py-1 transition-colors ${
                          statusFilter.length > 0 ? 'bg-blue-50 text-blue-700' : 'text-gray-500'
                        }`}
                      >
                        <span>STATUS</span>
                        <Filter className="w-3 h-3" />
                      </button>
                      
                      {showStatusHeaderDropdown && (
                        <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                          <div className="py-1">
                            <button
                              onClick={() => {
                                setStatusFilter([]);
                                setCurrentPage(1);
                              }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2 ${
                                statusFilter.length === 0 ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={statusFilter.length === 0}
                                readOnly
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span>All Statuses</span>
                            </button>
                            {[
                              'New Lead', 'FTD', 'FTD RETENTION', 'Call Again', 'No Answer', 
                              'NA5UP', 'Not Interested', 'Hang Up', 'Wrong Number', 'Wrong Name', 'Perfilado', 'campaign no interest'
                            ].map((status) => (
                              <button
                                key={status}
                                onClick={() => {
                                  setStatusFilter(prev => {
                                    if (prev.includes(status)) {
                                      return prev.filter(s => s !== status);
                                    } else {
                                      return [...prev, status];
                                    }
                                  });
                                  setCurrentPage(1);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2 ${
                                  statusFilter.includes(status) ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={statusFilter.includes(status)}
                                  readOnly
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <div className={`w-3 h-3 rounded-full ${
                                  status === 'New Lead' ? 'bg-green-500' :
                                  status === 'FTD' ? 'bg-blue-500' :
                                  status === 'FTD RETENTION' ? 'bg-indigo-500' :
                                  status === 'Call Again' ? 'bg-orange-500' :
                                  status === 'No Answer' ? 'bg-pink-500' :
                                  status === 'NA5UP' ? 'bg-teal-500' :
                                  status === 'Not Interested' ? 'bg-gray-500' :
                                  status === 'Hang Up' ? 'bg-purple-500' :
                                  status === 'Wrong Number' ? 'bg-red-500' :
                                  status === 'Wrong Name' ? 'bg-amber-500' :
                                  'bg-gray-400'
                                }`}></div>
                                <span>{status}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="relative" ref={campaignHeaderDropdownRef}>
                      <button
                        onClick={toggleCampaignHeaderDropdown}
                        className={`flex items-center space-x-2 hover:bg-gray-100 rounded px-2 py-1 transition-colors ${
                          campaignFilter.length > 0 ? 'bg-blue-50 text-blue-700' : 'text-gray-500'
                        }`}
                      >
                        <span>CAMPAIGN</span>
                        <Filter className="w-3 h-3" />
                      </button>
                      
                      {showCampaignHeaderDropdown && (
                        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                          <div className="py-1">
                            <button
                              onClick={() => {
                                setCampaignFilter([]);
                                setCurrentPage(1);
                              }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2 ${
                                campaignFilter.length === 0 ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={campaignFilter.length === 0}
                                readOnly
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span>All Campaigns</span>
                            </button>
                            {[
                              'Data', 'Data2', 'Data3', 'Data4', 'Data5', 'Affiliate', 
                              'not campaign', 'DataR', 'Data2R', 'AffiliateR'
                            ].map((campaign) => (
                              <button
                                key={campaign}
                                onClick={() => {
                                  setCampaignFilter(prev => {
                                    if (prev.includes(campaign)) {
                                      return prev.filter(c => c !== campaign);
                                    } else {
                                      return [...prev, campaign];
                                    }
                                  });
                                  setCurrentPage(1);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2 ${
                                  campaignFilter.includes(campaign) ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={campaignFilter.includes(campaign)}
                                  readOnly
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <div className={`w-3 h-3 rounded-full ${
                                  campaign === 'Data' ? 'bg-indigo-500' :
                                  campaign === 'Data2' ? 'bg-purple-500' :
                                  campaign === 'Data3' ? 'bg-pink-500' :
                                  campaign === 'Data4' ? 'bg-yellow-500' :
                                  campaign === 'Data5' ? 'bg-orange-500' :
                                  campaign === 'Affiliate' ? 'bg-teal-500' :
                                  campaign === 'not campaign' ? 'bg-red-500' :
                                  campaign === 'DataR' ? 'bg-indigo-600' :
                                  campaign === 'Data2R' ? 'bg-purple-600' :
                                  campaign === 'AffiliateR' ? 'bg-teal-600' :
                                  'bg-gray-400'
                                }`}></div>
                                <span>{campaign}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center justify-between">
                      <span>CRM ENTRY DATE</span>
                      <div className="flex items-center space-x-1">
                        <div className="relative" ref={dateOptionsDropdownRef}>
                          <button
                            onClick={toggleDateOptionsDropdown}
                            className="hover:bg-gray-100 rounded p-1"
                            title="Date options"
                          >
                            <Calendar className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                          </button>
                          
                          {showDateOptionsDropdown && (
                            <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                              <div className="py-1">
                                <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                  Sort by Date
                                </div>
                                <button
                                  onClick={() => {
                                    handleDateSortNewest();
                                    setShowDateOptionsDropdown(false);
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2"
                                >
                                  <ChevronUp className="w-3 h-3 text-green-500" />
                                  <span>Newest Entry First</span>
                                </button>
                                <button
                                  onClick={() => {
                                    handleDateSortOldest();
                                    setShowDateOptionsDropdown(false);
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2"
                                >
                                  <ChevronDown className="w-3 h-3 text-blue-500" />
                                  <span>Oldest Entry First</span>
                                </button>
                                <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100 mt-1">
                                  Sort by Comment
                                </div>
                                <button
                                  onClick={() => {
                                    handleCommentSortNewest();
                                    setShowDateOptionsDropdown(false);
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2"
                                >
                                  <ChevronUp className="w-3 h-3 text-green-500" />
                                  <span>Newest Comment First</span>
                                </button>
                                <button
                                  onClick={() => {
                                    handleCommentSortOldest();
                                    setShowDateOptionsDropdown(false);
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2"
                                >
                                  <ChevronDown className="w-3 h-3 text-blue-500" />
                                  <span>Oldest Comment First</span>
                                </button>
                                <div className="border-t border-gray-100 mt-1"></div>
                                <button
                                  onClick={() => {
                                    setShowDateFilterModal(true);
                                    setShowDateOptionsDropdown(false);
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2"
                                >
                                  <Calendar className="w-3 h-3 text-gray-500" />
                                  <span>Filter by Date Range</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <button
                            onClick={() => {
                              handleDateSortNewest();
                            }}
                            className="hover:bg-gray-100 rounded p-1"
                            title="Newest entries first"
                          >
                            <ChevronUp className="w-3 h-3 text-gray-400 hover:text-green-600" />
                          </button>
                          <button
                            onClick={() => {
                              handleDateSortOldest();
                            }}
                            className="hover:bg-gray-100 rounded p-1"
                            title="Oldest entries first"
                          >
                            <ChevronDown className="w-3 h-3 text-gray-400 hover:text-blue-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center justify-between">
                      <span>LATEST COMMENT</span>
                      <div className="flex items-center space-x-1">
                        <div className="relative">
                          <button
                            onClick={() => {
                              setShowDateFilterModal(true);
                              setDateNavigationType('comment');
                            }}
                            className="hover:bg-gray-100 rounded p-1"
                            title="Filter by comment date"
                          >
                            <Calendar className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                          </button>
                        </div>
                        <div className="flex flex-col">
                          <button
                            onClick={() => {
                              handleCommentSortNewest();
                            }}
                            className="hover:bg-gray-100 rounded p-1"
                            title="Newest comments first"
                          >
                            <ChevronUp className="w-3 h-3 text-gray-400 hover:text-green-600" />
                          </button>
                          <button
                            onClick={() => {
                              handleCommentSortOldest();
                            }}
                            className="hover:bg-gray-100 rounded p-1"
                            title="Oldest comments first"
                          >
                            <ChevronDown className="w-3 h-3 text-gray-400 hover:text-blue-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clients.length === 0 ? (
                  <tr>
                    <td colSpan="100%" className="px-4 lg:px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <Users className="w-12 h-12 text-gray-400" />
                        <div className="text-gray-500">
                          <p className="text-lg font-medium">No clients found</p>
                          <p className="text-sm mt-1">
                            {(statusFilter.length > 0 || campaignFilter.length > 0 || countryFilter.length > 0 || agentFilter.length > 0 || debouncedSearchTerm || dateFilter) 
                              ? 'Try adjusting your filters to see more results' 
                              : 'No clients available in the system'}
                          </p>
                        </div>
                        {(statusFilter.length > 0 || campaignFilter.length > 0 || countryFilter.length > 0 || agentFilter.length > 0 || debouncedSearchTerm || dateFilter) && (
                          <button
                            onClick={() => {
                              setStatusFilter([]);
                              setCampaignFilter([]);
                              setCountryFilter([]);
                              setAgentFilter([]);
                              setSearchTerm('');
                              setDateFilter('');
                              setEndDateFilter('');
                              setCurrentPage(1);
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                          >
                            Clear All Filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  clients.map((client) => (
                    <tr key={client._id} className="hover:bg-gray-50">
                    <td className="px-4 lg:px-6 py-4">
                      <input 
                        type="checkbox" 
                        checked={selectedClients.has(client._id)}
                        onChange={(e) => handleClientSelect(client._id, e.target.checked)}
                        className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                     <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-xs lg:text-sm text-gray-900 font-mono">{client.clientId}</td>
                                           <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-7 h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-white text-xs lg:text-sm font-medium ${getAvatarColor(client.firstName)}`}>
                            {getInitials(client.firstName, client.lastName || '')}
                          </div>
                          <div className="ml-2 lg:ml-3">
                            <a
                              href={`/clients/${client._id}`}
                              onClick={(e) => handleClientNameClick(e, client._id)}
                              className="text-xs lg:text-sm font-medium text-blue-600 hover:text-blue-900 hover:underline cursor-pointer"
                            >
                              {client.firstName}
                            </a>
                          </div>
                        </div>
                      </td>
                     <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-xs lg:text-sm text-gray-900">{client.country}</td>
                                           {canViewPhoneNumbers(user) && (
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-xs lg:text-sm text-gray-900">{client.phone}</td>
                      )}
                      {canViewEmailAddresses(user) && (
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-xs lg:text-sm text-gray-900">{client.email}</td>
                      )}
                     {(isAdmin(user) || isTeamLeader(user)) && (
                       <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-xs lg:text-sm text-gray-900">
                         {client.assignedAgent ? (
                           <div className="flex items-center space-x-2">
                             <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium ${getAvatarColor(client.assignedAgent.firstName)}`}>
                               {getInitials(client.assignedAgent.firstName, client.assignedAgent.lastName)}
                             </div>
                             <span className="text-sm">{client.assignedAgent.firstName} {client.assignedAgent.lastName}</span>
                           </div>
                         ) : (
                           <span className="text-gray-400 text-sm">Unassigned</span>
                         )}
                       </td>
                     )}
                     <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                       <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(client.status)}`}>
                         {client.status}
                       </span>
                     </td>
                     <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                       <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCampaignColor(client.campaign)}`}>
                         {client.campaign || 'Data'}
                       </span>
                     </td>
                     <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-xs lg:text-sm text-gray-900">
                       {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : 'N/A'}
                     </td>
                     <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-xs lg:text-sm text-gray-900 max-w-xs">
                       {client.lastComment ? (
                         <div className="space-y-2">
                           <div className="truncate text-gray-900 font-medium">
                             {client.lastComment}
                           </div>
                           <div className="flex flex-col space-y-1">
                             <div className="flex items-center justify-between">
                               <span className="text-xs text-gray-500">
                                 {client.lastCommentDate ? new Date(client.lastCommentDate).toLocaleString() : 'No date'}
                               </span>
                             {client.lastCommentViewer && (
                               <div className="flex items-center space-x-1">
                                 <div className={`w-2 h-2 rounded-full ${
                                   client.lastCommentViewer.role === 'admin' 
                                     ? 'bg-purple-500' 
                                     : 'bg-blue-500'
                                 }`}></div>
                                 <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                   client.lastCommentViewer.role === 'admin' 
                                     ? 'bg-purple-100 text-purple-700' 
                                     : 'bg-blue-100 text-blue-700'
                                 }`}>
                                   {client.lastCommentViewer.name}
                                 </span>
                               </div>
                             )}
                           </div>
                           {client.lastCommentViewer && (
                             <div className="text-xs text-gray-400">
                               Last viewed by {client.lastCommentViewer.role === 'admin' ? 'Administrator' : client.lastCommentViewer.role === 'tl' ? 'Team Lead' : 'Agent'}
                               {client.lastCommentViewer.viewedAt && (
                                 <span className="ml-1">
                                   • {new Date(client.lastCommentViewer.viewedAt).toLocaleString()}
                                 </span>
                               )}
                             </div>
                           )}
                           </div>
                         </div>
                       ) : (
                         <span className="text-gray-400">No comments</span>
                       )}
                     </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
                     {/* Pagination */}
           <div className="px-4 lg:px-6 py-3 border-t border-gray-200 bg-white">
             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
               <div className="text-xs lg:text-sm text-gray-700 text-center sm:text-left">
                 {(!pagination.totalClients || pagination.totalClients === 0) ? (
                   <span>No customers found</span>
                 ) : pagination.totalClients === 1 ? (
                   <span>1 customer</span>
                 ) : (
                   <span>
                     {pagination.current} of {pagination.total} pages • {pagination.totalClients} customer{pagination.totalClients !== 1 ? 's' : ''}
                   </span>
                 )}
               </div>
               <div className="flex items-center justify-center space-x-1 lg:space-x-2">
                 {/* First Page Button */}
                 {pagination.current > 3 && (
                   <>
                     <button 
                       onClick={() => setCurrentPage(1)}
                       className="px-2 lg:px-3 py-1 text-xs lg:text-sm text-gray-500 hover:text-gray-700"
                     >
                       1
                     </button>
                     {pagination.current > 4 && (
                       <span className="px-1 text-gray-400">...</span>
                     )}
                   </>
                 )}

                 {/* Previous Button */}
                 <button 
                   onClick={() => setCurrentPage(pagination.current - 1)}
                   disabled={!pagination.hasPrev}
                   className="px-2 lg:px-3 py-1 text-xs lg:text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   Previous
                 </button>

                 {/* Dynamic Page Numbers */}
                 {(() => {
                   const current = pagination.current;
                   const total = pagination.total;
                   const pages = [];
                   
                   // Calculate start and end page numbers
                   let startPage = Math.max(1, current - 2);
                   let endPage = Math.min(total, current + 2);
                   
                   // Adjust if we're near the beginning or end
                   if (current <= 3) {
                     endPage = Math.min(total, 5);
                   }
                   if (current >= total - 2) {
                     startPage = Math.max(1, total - 4);
                   }
                   
                   // Generate page numbers
                   for (let i = startPage; i <= endPage; i++) {
                     pages.push(
                       <button 
                         key={i}
                         onClick={() => setCurrentPage(i)}
                         className={`px-2 lg:px-3 py-1 text-xs lg:text-sm rounded ${
                           i === current 
                             ? 'bg-blue-600 text-white' 
                             : 'text-gray-500 hover:text-gray-700'
                         }`}
                       >
                         {i}
                       </button>
                     );
                   }
                   
                   return pages;
                 })()}

                 {/* Next Button */}
                 <button 
                   onClick={() => setCurrentPage(pagination.current + 1)}
                   disabled={!pagination.hasNext}
                   className="px-2 lg:px-3 py-1 text-xs lg:text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   Next
                 </button>

                 {/* Last Page Button */}
                 {pagination.current < pagination.total - 2 && (
                   <>
                     {pagination.current < pagination.total - 3 && (
                       <span className="px-1 text-gray-400">...</span>
                     )}
                     <button 
                       onClick={() => setCurrentPage(pagination.total)}
                       className="px-2 lg:px-3 py-1 text-xs lg:text-sm text-gray-500 hover:text-gray-700"
                     >
                       {pagination.total}
                     </button>
                   </>
                 )}
               </div>
             </div>
           </div>
        </div>
      </div>

             {/* Charts Row - Below the table */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6">
                   {/* Analytics Header */}
           <div className="lg:col-span-2 mb-2">
             <div className="flex items-center justify-between">
               <h2 className="text-lg font-semibold text-gray-900">Analytics Overview</h2>
               <div className="flex items-center space-x-4">
                 <div className="text-sm text-gray-600">
                   Showing data for {dynamicAnalytics.totalClients} filtered client{dynamicAnalytics.totalClients !== 1 ? 's' : ''}
                   {(agentFilter.length > 0 || statusFilter.length > 0 || countryFilter.length > 0 || debouncedSearchTerm) && (
                     <span className="ml-2 text-blue-600">• Filtered View</span>
                   )}
                 </div>
                 <button
                   onClick={refreshDataImmediately}
                   disabled={isRefreshing}
                   className={`flex items-center space-x-1 px-3 py-1 text-sm rounded-lg transition-colors ${
                     isRefreshing 
                       ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                       : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                   }`}
                   title="Refresh all data immediately"
                 >
                   <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                   <span>{isRefreshing ? 'Refreshing...' : 'Refresh Now'}</span>
                 </button>
               </div>
             </div>
           </div>
                   
                   {/* Clients by Campaign Status */}
          <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base lg:text-lg font-semibold text-gray-900">Clients by Campaign Status</h3>
                {campaignFilter.length > 0 && (
                  <p className="text-xs text-blue-600 mt-1">
                    Showing data for: {campaignFilter.join(', ')}
                  </p>
                )}
              </div>
              {campaignFilter.length > 0 && (
                <button
                  onClick={() => setCampaignFilter([])}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear Filter
                </button>
              )}
            </div>
             <div className="h-48 lg:h-64">
              {dynamicAnalytics.clientsByCampaign.length > 0 ? (
                <div className="flex items-center h-full">
                  <div className="w-2/3 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          minAngle={1} // Ensures even zero values show as tiny segments
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value, name, props) => {
                            const actualValue = props.payload.actualValue;
                            return [actualValue, name];
                          }}
                          labelFormatter={(label) => `${label}: ${pieChartData.find(item => item.name === label)?.actualValue || 0} clients`}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-1/3 pl-4">
                    <div className="space-y-2">
                      {campaignFilter.length > 0 && (
                        <div 
                          className="flex items-center justify-between cursor-pointer p-2 rounded-lg transition-colors hover:bg-gray-50"
                          onClick={() => setCampaignFilter([])}
                        >
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full mr-3 bg-gray-400"></div>
                            <span className="text-sm text-gray-700">Show All</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {dynamicAnalytics.totalClients}
                          </span>
                        </div>
                      )}
                      {dynamicAnalytics.clientsByCampaign.map((item) => (
                        <div 
                          key={item._id} 
                          className={`flex items-center justify-between text-sm cursor-pointer p-2 rounded-lg transition-colors ${
                            campaignFilter.includes(item._id) 
                              ? 'bg-blue-50 border border-blue-200' 
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => handleCampaignClick(item._id)}
                        >
                          <div className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-2" 
                              style={{ backgroundColor: getCampaignChartColor(item._id) }}
                            ></div>
                            <span className={`${campaignFilter === item._id ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>
                              {item._id}
                            </span>
                          </div>
                          <span className={`font-medium ${campaignFilter === item._id ? 'text-blue-700' : 'text-gray-900'}`}>
                            {item.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No clients to display</p>
                  </div>
                </div>
              )}
            </div>
          </div>

                   {/* Lead Status Overview */}
           <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm">
           <div className="flex justify-between items-center mb-4">
             <div>
               <h3 className="text-base lg:text-lg font-semibold text-gray-900">Lead Status Overview</h3>
               {agentFilter.length > 0 && (
                 <p className="text-xs text-blue-600 mt-1">
                   Showing data for: {agentFilter.map(agentId => {
                     const agent = availableAgents.find(a => a._id === agentId);
                     return agent ? `${agent.firstName} ${agent.lastName}` : '';
                   }).filter(Boolean).join(', ')}
                 </p>
               )}
             </div>
             {statusFilter.length > 0 && (
               <button
                 onClick={() => setStatusFilter([])}
                 className="text-xs text-blue-600 hover:text-blue-800 font-medium"
               >
                 Clear Filter
               </button>
             )}
           </div>
           <div className="space-y-3">
             {statusFilter.length > 0 && (
               <div 
                 className="flex items-center justify-between cursor-pointer p-2 rounded-lg transition-colors hover:bg-gray-50"
                 onClick={() => setStatusFilter([])}
               >
                 <div className="flex items-center">
                   <div className="w-3 h-3 rounded-full mr-3 bg-gray-400"></div>
                   <span className="text-sm text-gray-700">Show All</span>
                 </div>
                 <span className="text-sm font-medium text-gray-900">
                   {globalAnalytics.totalClients}
                 </span>
               </div>
             )}
             {globalAnalytics.leadStatusOverview && globalAnalytics.leadStatusOverview.length > 0 ? globalAnalytics.leadStatusOverview.map((status) => (
               <div 
                 key={status._id} 
                 className={`flex items-center justify-between cursor-pointer p-2 rounded-lg transition-colors ${
                   statusFilter.includes(status._id) 
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
                     status._id === 'Wrong Number' ? 'bg-red-500' :
                     status._id === 'Wrong Name' ? 'bg-amber-500' :
                     'bg-gray-400'
                   }`}></div>
                   <span className={`text-sm ${statusFilter.includes(status._id) ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>
                     {status._id}
                   </span>
                 </div>
                 <span className={`text-sm font-medium ${statusFilter.includes(status._id) ? 'text-blue-700' : 'text-gray-900'}`}>
                   {status.count}
                 </span>
               </div>
             )) : (
               <div className="text-center py-6">
                 <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                 <p className="text-sm text-gray-500">
                   {agentFilter.length > 0 ? 'No status data for selected agent(s)' : 'No status data to display'}
                 </p>
               </div>
             )}
             
             {/* Campaign Options - Data and Affiliate */}
             <div 
               className={`flex items-center justify-between cursor-pointer p-2 rounded-lg transition-colors ${
                 campaignFilter.includes('Data') 
                   ? 'bg-indigo-50 border border-indigo-200' 
                   : 'hover:bg-gray-50'
               }`}
               onClick={() => handleCampaignClick('Data')}
             >
               <div className="flex items-center">
                 <div className="w-3 h-3 rounded-full mr-3 bg-indigo-500"></div>
                 <span className={`text-sm ${campaignFilter.includes('Data') ? 'text-indigo-700 font-medium' : 'text-gray-700'}`}>
                   Data
                 </span>
               </div>
               <span className={`text-sm font-medium ${campaignFilter.includes('Data') ? 'text-indigo-700' : 'text-gray-900'}`}>
                 {globalAnalytics.campaignOverview?.find(c => c._id === 'Data')?.count || 0}
               </span>
             </div>
             
             <div 
               className={`flex items-center justify-between cursor-pointer p-2 rounded-lg transition-colors ${
                 campaignFilter.includes('Affiliate') 
                   ? 'bg-teal-50 border border-teal-200' 
                   : 'hover:bg-gray-50'
               }`}
               onClick={() => handleCampaignClick('Affiliate')}
             >
               <div className="flex items-center">
                 <div className="w-3 h-3 rounded-full mr-3 bg-teal-500"></div>
                 <span className={`text-sm ${campaignFilter.includes('Affiliate') ? 'text-teal-700 font-medium' : 'text-gray-700'}`}>
                   Affiliate
                 </span>
               </div>
               <span className={`text-sm font-medium ${campaignFilter.includes('Affiliate') ? 'text-teal-700' : 'text-gray-900'}`}>
                 {globalAnalytics.campaignOverview?.find(c => c._id === 'Affiliate')?.count || 0}
               </span>
             </div>
           </div>
         </div>
       </div>

             {/* Add Client Modal */}
       {showAddModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-lg p-4 lg:p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add New Client</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
                         <div className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                 <input
                   type="text"
                   value={newClient.firstName}
                   onChange={(e) => setNewClient({...newClient, firstName: e.target.value})}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                 />
               </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input
                  type="text"
                  value={newClient.country}
                  onChange={(e) => setNewClient({...newClient, country: e.target.value})}
                  placeholder="Enter country name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={newClient.status}
                  onChange={(e) => setNewClient({...newClient, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="New Lead">New Lead</option>
                  <option value="FTD">FTD</option>
                  <option value="Call Again">Call Again</option>
                  <option value="No Answer">No Answer</option>
                  <option value="Not Interested">Not Interested</option>
                  <option value="Hang Up">Hang Up</option>
                  <option value="Wrong Number">Wrong Number</option>
                  <option value="Wrong Name">Wrong Name</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campaign</label>
                <select
                  value={newClient.campaign}
                  onChange={(e) => setNewClient({...newClient, campaign: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Data">Data</option>
                  <option value="Affiliate">Affiliate</option>
                  <option value="Data2">Data2</option>
                  <option value="Data3">Data3</option>
                  <option value="not campaign">not campaign</option>
                  <option value="DataR">DataR</option>
                  <option value="Data2R">Data2R</option>
                  <option value="AffiliateR">AffiliateR</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddClient}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Client
              </button>
            </div>
          </div>
        </div>
      )}

             {/* Import Modal */}
       {showImportModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-lg p-4 lg:p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Import Clients</h3>
              <button onClick={() => setShowImportModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CSV File</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setImportFile(e.target.files[0])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
                             <p className="text-sm text-gray-600">
                 Upload a CSV file with exactly 5 columns in this order: name, email, number/phone, country, campaign
               </p>
               <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded">
                 <p className="font-medium mb-1">CSV Format Example:</p>
                 <p>name,email,number,country,campaign</p>
                 <p>John Doe,john@example.com,+1234567890,United States,Data</p>
                 <p>Jane Smith,jane@example.com,+0987654321,Canada,Data2</p>
                 <p>Mike Johnson,mike@example.com,+1122334455,UK,Affiliate</p>
               </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleImportClients}
                disabled={!importFile || importLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {importLoading ? 'Importing...' : 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu for Client Names */}
      {contextMenu.show && (
        <div
          ref={contextMenuRef}
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[160px]"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          <button
            onClick={handleOpenClientInNewTab}
            className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open in New Tab
          </button>
        </div>
      )}

      {/* Bulk Campaign Update Modal */}
      {showBulkCampaignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Bulk Campaign Update</h3>
              <button 
                onClick={() => {
                  setShowBulkCampaignModal(false);
                  setBulkCampaignSelected(new Set());
                  clearBulkCampaignDateFilters();
                }} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Campaign Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Campaign</label>
                <select
                  value={bulkCampaign}
                  onChange={(e) => setBulkCampaign(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium w-full max-w-xs"
                >
                  <option value="Data">Data</option>
                  <option value="Data2">Data2</option>
                  <option value="Data3">Data3</option>
                  <option value="Data4">Data4</option>
                  <option value="Data5">Data5</option>
                  <option value="Affiliate">Affiliate</option>
                  <option value="not campaign">not campaign</option>
                  <option value="DataR">DataR</option>
                  <option value="Data2R">Data2R</option>
                  <option value="AffiliateR">AffiliateR</option>
                </select>
              </div>

              {/* Date Filter Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Registration Date</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <input
                      type="date"
                      value={bulkCampaignDateFilter}
                      onChange={(e) => setBulkCampaignDateFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
                      placeholder="Start Date"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="date"
                      value={bulkCampaignEndDateFilter}
                      onChange={(e) => setBulkCampaignEndDateFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
                      placeholder="End Date"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        clearBulkCampaignDateFilters();
                        fetchBulkCampaignClients();
                      }}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                    >
                      Clear
                    </button>
                    <button
                      onClick={fetchBulkCampaignClients}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                      Apply Filter
                    </button>
                  </div>
                </div>
                {(bulkCampaignDateFilter || bulkCampaignEndDateFilter) && (
                  <div className="mt-2 text-xs text-gray-600">
                    Filtering by: {bulkCampaignDateFilter && `From ${bulkCampaignDateFilter}`} 
                    {bulkCampaignDateFilter && bulkCampaignEndDateFilter && ' '} 
                    {bulkCampaignEndDateFilter && `To ${bulkCampaignEndDateFilter}`}
                  </div>
                )}
              </div>

              {/* Client Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">Select Clients</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="selectAllBulkCampaignClients"
                      checked={bulkCampaignSelected.size === bulkCampaignClients.length && bulkCampaignClients.length > 0}
                      onChange={(e) => handleSelectAllBulkCampaignClients(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="selectAllBulkCampaignClients" className="text-sm text-gray-700">
                      Select All ({bulkCampaignClients.length})
                    </label>
                  </div>
                </div>
                
                <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                  <div className="p-3 bg-gray-50 border-b border-gray-200">
                    <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-600">
                      <div className="col-span-1">Select</div>
                      <div className="col-span-2">ID</div>
                      <div className="col-span-3">Name</div>
                      <div className="col-span-2">Country</div>
                      <div className="col-span-2">Current Campaign</div>
                      <div className="col-span-2">Status</div>
                    </div>
                  </div>
                  
                  {bulkCampaignClients.map((client) => (
                    <div key={client._id} className="p-3 border-b border-gray-100 hover:bg-gray-50">
                      <div className="grid grid-cols-12 gap-4 items-center text-sm">
                        <div className="col-span-1">
                          <input
                            type="checkbox"
                            checked={bulkCampaignSelected.has(client._id)}
                            onChange={(e) => handleBulkCampaignClientSelect(client._id, e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-2 font-mono text-xs">{client.clientId}</div>
                        <div className="col-span-3 font-medium">{client.firstName}</div>
                        <div className="col-span-2">{client.country}</div>
                        <div className="col-span-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            client.campaign === 'Data' ? 'bg-indigo-100 text-indigo-800' : 
                            client.campaign === 'Data2' ? 'bg-purple-100 text-purple-800' :
                            client.campaign === 'Data3' ? 'bg-pink-100 text-pink-800' :
                            client.campaign === 'Data4' ? 'bg-yellow-100 text-yellow-800' :
                            client.campaign === 'Data5' ? 'bg-orange-100 text-orange-800' :
                            client.campaign === 'Affiliate' ? 'bg-teal-100 text-teal-800' :
                            client.campaign === 'not campaign' ? 'bg-red-100 text-red-800' :
                            client.campaign === 'DataR' ? 'bg-indigo-200 text-indigo-900' :
                            client.campaign === 'Data2R' ? 'bg-purple-200 text-purple-900' :
                            client.campaign === 'AffiliateR' ? 'bg-teal-200 text-teal-900' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {client.campaign || 'Data'}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            client.status === 'New Lead' ? 'bg-green-100 text-green-800' :
                            client.status === 'FTD' ? 'bg-blue-100 text-blue-800' :
                            client.status === 'Call Again' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {client.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-2 text-sm text-gray-600">
                  Selected: {bulkCampaignSelected.size} client(s)
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowBulkCampaignModal(false);
                  setBulkCampaignSelected(new Set());
                  clearBulkCampaignDateFilters();
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkCampaignUpdate}
                disabled={bulkCampaignSelected.size === 0 || bulkCampaignLoading}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bulkCampaignLoading ? 'Updating...' : `Update ${bulkCampaignSelected.size} Client(s)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Date Filter Modal */}
      {showDateFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Filter by {dateNavigationType === 'entry' ? 'CRM Entry Date' : 'Latest Comment Date'}
              </h3>
              <button 
                onClick={() => setShowDateFilterModal(false)} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Instructions */}
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Instructions:</strong> Choose how you want to filter the records by {dateNavigationType === 'entry' ? 'CRM entry date' : 'latest comment date'}.
                  You can select a single date or a range of dates using the calendar inputs below.
                </p>
              </div>

              {/* Filter Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter Type</label>
                <select
                  value={dateFilterType}
                  onChange={(e) => setDateFilterType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="exact">Single Date</option>
                  <option value="range">Date Range</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {dateFilterType === 'exact' 
                    ? 'Show records from a specific date only' 
                    : 'Show records within a date range'
                  }
                </p>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {dateFilterType === 'exact' 
                    ? `${dateNavigationType === 'entry' ? 'CRM Entry' : 'Latest Comment'} Date` 
                    : 'Start Date'
                  }
                </label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Select date"
                />
                {dateFilterType === 'exact' && (
                  <p className="text-xs text-gray-500 mt-1">
                    Select the exact date to filter records
                  </p>
                )}
              </div>

              {/* End Date (only for range) */}
              {dateFilterType === 'range' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={endDateFilter}
                    onChange={(e) => setEndDateFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={dateFilter} // Ensure end date is not before start date
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Select the end date for the range (optional - leave empty for open-ended range)
                  </p>
                </div>
              )}

              {/* Current Filter Display */}
              {(dateFilter || endDateFilter) && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>Current Selection:</strong> 
                    {dateFilterType === 'exact' 
                      ? ` ${dateNavigationType === 'entry' ? 'CRM Entry' : 'Latest Comment'} date: ${dateFilter}`
                      : ` Date range: ${dateFilter} to ${endDateFilter || 'present'}`
                    }
                  </p>
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowDateFilterModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={clearDateFilter}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Clear All
              </button>
              <button
                onClick={handleDateFilter}
                disabled={!dateFilter}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply Filter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {showEditModal && editingClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 lg:p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Client</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editingClient.firstName}
                  onChange={(e) => setEditingClient({...editingClient, firstName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editingClient.email}
                  onChange={(e) => setEditingClient({...editingClient, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={editingClient.phone}
                  onChange={(e) => setEditingClient({...editingClient, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input
                  type="text"
                  value={editingClient.country}
                  onChange={(e) => setEditingClient({...editingClient, country: e.target.value})}
                  placeholder="Enter country name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={editingClient.status}
                  onChange={(e) => setEditingClient({...editingClient, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="New Lead">New Lead</option>
                  <option value="FTD">FTD</option>
                  <option value="FTD RETENTION">FTD RETENTION</option>
                  <option value="Call Again">Call Again</option>
                  <option value="No Answer">No Answer</option>
                  <option value="NA5UP">NA5UP</option>
                  <option value="Not Interested">Not Interested</option>
                  <option value="Hang Up">Hang Up</option>
                  <option value="Wrong Number">Wrong Number</option>
                  <option value="Wrong Name">Wrong Name</option>
                  <option value="Perfilado">Perfilado</option>
                  <option value="campaign no interest">campaign no interest</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campaign</label>
                <select
                  value={editingClient.campaign}
                  onChange={(e) => setEditingClient({...editingClient, campaign: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Data">Data</option>
                  <option value="Data2">Data2</option>
                  <option value="Data3">Data3</option>
                  <option value="Data4">Data4</option>
                  <option value="Data5">Data5</option>
                  <option value="Affiliate">Affiliate</option>
                  <option value="not campaign">not campaign</option>
                  <option value="DataR">DataR</option>
                  <option value="Data2R">Data2R</option>
                  <option value="AffiliateR">AffiliateR</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateClient}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Update Client
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientManagement;