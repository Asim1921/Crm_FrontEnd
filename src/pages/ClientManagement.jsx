import React, { useState, useEffect, useCallback, useRef } from 'react';
import { clientAPI, reportsAPI } from '../utils/api';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
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
  Copy
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const ClientManagement = () => {
  const navigate = useNavigate();
  const { addClientNotification } = useNotifications();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [agentFilter, setAgentFilter] = useState('all');
  const [unassignedFilter, setUnassignedFilter] = useState(false);
  const [selectedClients, setSelectedClients] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showCampaignFilter, setShowCampaignFilter] = useState(false);
  const [duplicateFilter, setDuplicateFilter] = useState(false);
  const [assignToAgent, setAssignToAgent] = useState('');
  const statusFilterRef = useRef(null);
  const campaignFilterRef = useRef(null);
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
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(campaignFilter !== 'all' && { campaign: campaignFilter }),
        ...(countryFilter !== 'all' && { country: countryFilter }),
        ...(user?.role === 'agent' ? { agent: user._id } : (agentFilter !== 'all' && { agent: agentFilter })),
        // Date filtering based on type
        ...(dateNavigationType === 'entry' && dateFilter && { registrationDate: dateFilter }),
        ...(dateNavigationType === 'entry' && endDateFilter && { endRegistrationDate: endDateFilter }),
        ...(dateNavigationType === 'comment' && dateFilter && { commentDate: dateFilter }),
        ...(dateNavigationType === 'comment' && endDateFilter && { endCommentDate: endDateFilter }),
        ...(dateFilter && { dateFilterType: dateNavigationType }),
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
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(campaignFilter !== 'all' && { campaign: campaignFilter }),
        ...(countryFilter !== 'all' && { country: countryFilter }),
        // For agents, automatically filter to only their assigned clients
        ...(user?.role === 'agent' ? { agent: user._id } : (agentFilter !== 'all' && { agent: agentFilter })),
        // Unassigned filter
        ...(unassignedFilter && { unassigned: true }),
        // Date filtering based on type
        ...(dateNavigationType === 'entry' && dateFilter && { registrationDate: dateFilter }),
        ...(dateNavigationType === 'entry' && endDateFilter && { endRegistrationDate: endDateFilter }),
        ...(dateNavigationType === 'comment' && dateFilter && { commentDate: dateFilter }),
        ...(dateNavigationType === 'comment' && endDateFilter && { endCommentDate: endDateFilter }),
        ...(dateFilter && { dateFilterType: dateNavigationType })
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
  }, [currentPage, debouncedSearchTerm, statusFilter, campaignFilter, countryFilter, agentFilter, unassignedFilter, duplicateFilter, dateFilter, endDateFilter, dateNavigationType]);

  // Fetch global analytics whenever filters change (but not pagination)
  useEffect(() => {
    fetchGlobalAnalytics();
  }, [debouncedSearchTerm, statusFilter, campaignFilter, countryFilter, agentFilter, unassignedFilter, dateFilter, endDateFilter, dateNavigationType]);

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
    setStatusFilter(status);
    setCurrentPage(1);
  };

  // Handle left-click on client name
  const handleClientNameClick = (e, clientId) => {
    e.preventDefault();
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      clientId: clientId
    });
  };

  // Handle opening client profile in new tab
  const handleOpenClientInNewTab = () => {
    if (contextMenu.clientId) {
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

  // Auto-refresh comments every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Auto-refreshing comments...');
      fetchData();
    }, 2 * 60 * 1000); // 2 minutes in milliseconds

    return () => clearInterval(interval);
  }, []);

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
    
         // Show success message (hide phone number for agents)
     setTimeout(() => {
       if (user?.role === 'admin') {
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
    
         // Show success message (hide email for agents)
     setTimeout(() => {
       if (user?.role === 'admin') {
         alert(`${provider} opened for ${client.firstName} with pre-filled email`);
       } else {
         alert(`${provider} opened for ${client.firstName}`);
       }
     }, 100);
  };

  // Calculate dynamic analytics from current clients (which are already filtered by the API)
  const calculateDynamicAnalytics = () => {
    // Calculate clients by campaign from current clients
    const campaignCounts = {};
    const statusCounts = {};
    
    clients.forEach(client => {
      // Count by campaign
      const campaign = client.campaign || 'Data';
      campaignCounts[campaign] = (campaignCounts[campaign] || 0) + 1;
      
      // Count by status
      const status = client.status || 'Unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    // Convert to arrays for charts
    const clientsByCampaign = Object.entries(campaignCounts).map(([campaign, count]) => ({
      _id: campaign,
      count: count
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

  // Transform analytics data for charts
  const pieChartData = dynamicAnalytics.clientsByCampaign.map((item, index) => ({
    name: item._id,
    value: item.count,
    color: ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#EF4444', '#10B981'][index % 6]
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
            <select 
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Countries</option>
              {availableCountries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
            {isAdmin && (
              <select 
                value={agentFilter}
                onChange={(e) => {
                  setAgentFilter(e.target.value);
                  // Reset unassigned filter when agent filter is changed
                  if (e.target.value !== 'all') {
                    setUnassignedFilter(false);
                  }
                }}
                disabled={unassignedFilter}
                className={`px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                  unassignedFilter ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              >
                <option value="all">All Agents</option>
                {availableAgents.map((agent) => (
                  <option key={agent._id} value={agent._id}>
                    {agent.firstName} {agent.lastName}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
        {isAdmin && (
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
              className="flex items-center justify-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <Edit className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Edit Client</span>
              <span className="sm:hidden">Edit</span>
            </button>
            <button 
              onClick={() => setShowImportModal(true)}
              className="flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              <Upload className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Import Excel</span>
              <span className="sm:hidden">Import</span>
            </button>
            <button 
              onClick={handleExportClients}
              disabled={selectedClients.size === 0}
              className={`flex items-center justify-center px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedClients.size === 0
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <Download className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">
                Export Excel {selectedClients.size > 0 && `(${selectedClients.size})`}
              </span>
              <span className="sm:hidden">
                Export {selectedClients.size > 0 && `(${selectedClients.size})`}
              </span>
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Add Client</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        )}
      </div>

             {/* Assignment Bar - Only for Admins */}
       {isAdmin && (
         <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0 mb-6 p-4 bg-white rounded-lg shadow-sm">
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
                 className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
               >
                 Assign ({selectedClients.size})
               </button>
             </div>
           </div>
           <div className="flex items-center space-x-2">
             {/* Duplicate Clients Button */}
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
             
             {/* Search by Status Button */}
             <div className="relative" ref={statusFilterRef}>
               <button 
                 onClick={() => setShowStatusFilter(!showStatusFilter)}
                 className={`px-3 py-2 text-white rounded-lg text-sm font-medium flex items-center space-x-1 transition-colors ${
                   statusFilter !== 'all' 
                     ? 'bg-red-600 hover:bg-red-700' 
                     : 'bg-gray-600 hover:bg-gray-700'
                 }`}
               >
                 <Filter className="w-4 h-4" />
                 <span>Status</span>
               </button>
               
               {/* Status Filter Dropdown */}
               {showStatusFilter && (
                 <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                   <div className="py-1">
                     <button
                       onClick={() => {
                         setStatusFilter('all');
                         setShowStatusFilter(false);
                         setCurrentPage(1);
                       }}
                       className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                         statusFilter === 'all' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                       }`}
                     >
                       All Statuses
                     </button>
                     <button
                       onClick={() => {
                         setStatusFilter('New Lead');
                         setShowStatusFilter(false);
                         setCurrentPage(1);
                       }}
                       className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                         statusFilter === 'New Lead' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                       }`}
                     >
                       New Lead
                     </button>
                     <button
                       onClick={() => {
                         setStatusFilter('Call Again');
                         setShowStatusFilter(false);
                         setCurrentPage(1);
                       }}
                       className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                         statusFilter === 'Call Again' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                       }`}
                     >
                       Call Again
                     </button>
                     <button
                       onClick={() => {
                         setStatusFilter('Not Interested');
                         setShowStatusFilter(false);
                         setCurrentPage(1);
                       }}
                       className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                         statusFilter === 'Not Interested' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                       }`}
                     >
                       Not Interested
                     </button>
                     <button
                       onClick={() => {
                         setStatusFilter('Hang Up');
                         setShowStatusFilter(false);
                         setCurrentPage(1);
                       }}
                       className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                         statusFilter === 'Hang Up' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                       }`}
                     >
                       Hang Up
                     </button>
                     <button
                       onClick={() => {
                         setStatusFilter('NA5UP');
                         setShowStatusFilter(false);
                         setCurrentPage(1);
                       }}
                       className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                         statusFilter === 'NA5UP' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                       }`}
                     >
                       NA5UP
                     </button>
                     <button
                       onClick={() => {
                         setStatusFilter('No Answer');
                         setShowStatusFilter(false);
                         setCurrentPage(1);
                       }}
                       className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                         statusFilter === 'No Answer' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                       }`}
                     >
                       No Answer
                     </button>
                     <button
                       onClick={() => {
                         setStatusFilter('Wrong Number');
                         setShowStatusFilter(false);
                         setCurrentPage(1);
                       }}
                       className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                         statusFilter === 'Wrong Number' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                       }`}
                     >
                       Wrong Number
                     </button>
                     <button
                       onClick={() => {
                         setStatusFilter('Wrong Name');
                         setShowStatusFilter(false);
                         setCurrentPage(1);
                       }}
                       className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                         statusFilter === 'Wrong Name' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                       }`}
                     >
                       Wrong Name
                     </button>
                     <button
                       onClick={() => {
                         setStatusFilter('FTD');
                         setShowStatusFilter(false);
                         setCurrentPage(1);
                       }}
                       className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                         statusFilter === 'FTD' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                       }`}
                     >
                       FTD
                     </button>
                     <button
                       onClick={() => {
                         setStatusFilter('FTD RETENTION');
                         setShowStatusFilter(false);
                         setCurrentPage(1);
                       }}
                       className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                         statusFilter === 'FTD RETENTION' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                       }`}
                     >
                       FTD RETENTION
                     </button>
                   </div>
                 </div>
               )}
             </div>
             
             {/* Campaign Filter Button */}
             <div className="relative" ref={campaignFilterRef}>
               <button 
                 onClick={() => setShowCampaignFilter(!showCampaignFilter)}
                 className={`px-3 py-2 text-white rounded-lg text-sm font-medium flex items-center space-x-1 transition-colors ${
                   campaignFilter !== 'all' 
                     ? 'bg-red-600 hover:bg-red-700' 
                     : 'bg-gray-600 hover:bg-gray-700'
                 }`}
               >
                 <Filter className="w-4 h-4" />
                 <span>Campaign</span>
               </button>
               
               {/* Campaign Filter Dropdown */}
               {showCampaignFilter && (
                 <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                   <div className="py-1">
                     <button
                       onClick={() => {
                         setCampaignFilter('all');
                         setShowCampaignFilter(false);
                         setCurrentPage(1);
                       }}
                       className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                         campaignFilter === 'all' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                       }`}
                     >
                       All Campaigns
                     </button>
                     <button
                       onClick={() => {
                         setCampaignFilter('Data');
                         setShowCampaignFilter(false);
                         setCurrentPage(1);
                       }}
                       className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                         campaignFilter === 'Data' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                       }`}
                     >
                       Data
                     </button>
                     <button
                       onClick={() => {
                         setCampaignFilter('Data2');
                         setShowCampaignFilter(false);
                         setCurrentPage(1);
                       }}
                       className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                         campaignFilter === 'Data2' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                       }`}
                     >
                       Data2
                     </button>
                     <button
                       onClick={() => {
                         setCampaignFilter('Data3');
                         setShowCampaignFilter(false);
                         setCurrentPage(1);
                       }}
                       className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                         campaignFilter === 'Data3' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                       }`}
                     >
                       Data3
                     </button>
                     <button
                       onClick={() => {
                         setCampaignFilter('Data4');
                         setShowCampaignFilter(false);
                         setCurrentPage(1);
                       }}
                       className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                         campaignFilter === 'Data4' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                       }`}
                     >
                       Data4
                     </button>
                     <button
                       onClick={() => {
                         setCampaignFilter('Data5');
                         setShowCampaignFilter(false);
                         setCurrentPage(1);
                       }}
                       className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                         campaignFilter === 'Data5' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                       }`}
                     >
                       Data5
                     </button>
                     <button
                       onClick={() => {
                         setCampaignFilter('Affiliate');
                         setShowCampaignFilter(false);
                         setCurrentPage(1);
                       }}
                       className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                         campaignFilter === 'Affiliate' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                       }`}
                     >
                       Affiliate
                     </button>
                   </div>
                 </div>
               )}
             </div>
             
             <button 
               onClick={() => {
                 fetchBulkCampaignClients();
                 setShowBulkCampaignModal(true);
               }}
               className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium flex items-center space-x-1"
             >
               <Users className="w-4 h-4" />
               <span>Bulk Update</span>
             </button>
             <button 
               onClick={() => {
                 setUnassignedFilter(!unassignedFilter);
                 // Reset agent filter when unassigned filter is activated
                 if (!unassignedFilter) {
                   setAgentFilter('all');
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
               className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center space-x-2"
             >
               <Trash2 className="w-4 h-4" />
               <span>Delete ({selectedClients.size})</span>
             </button>
           </div>
         </div>
       )}

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
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">COUNTRY</th>
                                     {user?.role === 'admin' && (
                     <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PHONE</th>
                   )}
                   {user?.role === 'admin' && (
                     <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EMAIL</th>
                   )}
                   {user?.role === 'agent' && (
                     <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PHONE</th>
                   )}
                   {user?.role === 'agent' && (
                     <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EMAIL</th>
                   )}
                  {isAdmin && (
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ASSIGNED AGENT</th>
                  )}
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STATUS</th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CAMPAIGN</th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center justify-between">
                      <span>CRM ENTRY DATE</span>
                      <div className="flex flex-col ml-2">
                        <button
                          onClick={() => navigateDate('prev', 'entry')}
                          className="hover:bg-gray-100 rounded p-1"
                          title="Previous day"
                        >
                          <ChevronUp className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                        </button>
                        <button
                          onClick={() => navigateDate('next', 'entry')}
                          className="hover:bg-gray-100 rounded p-1"
                          title="Next day"
                        >
                          <ChevronDown className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center justify-between">
                      <span>LAST COMMENT</span>
                      <div className="flex flex-col ml-2">
                        <button
                          onClick={() => navigateDate('prev', 'comment')}
                          className="hover:bg-gray-100 rounded p-1"
                          title="Previous day"
                        >
                          <ChevronUp className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                        </button>
                        <button
                          onClick={() => navigateDate('next', 'comment')}
                          className="hover:bg-gray-100 rounded p-1"
                          title="Next day"
                        >
                          <ChevronDown className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clients.map((client) => (
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
                            <button
                              onClick={(e) => handleClientNameClick(e, client._id)}
                              className="text-xs lg:text-sm font-medium text-blue-600 hover:text-blue-900 hover:underline"
                            >
                              {client.firstName}
                            </button>
                          </div>
                        </div>
                      </td>
                     <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-xs lg:text-sm text-gray-900">{client.country}</td>
                                           {user?.role === 'admin' && (
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-xs lg:text-sm text-gray-900">{client.phone}</td>
                      )}
                      {user?.role === 'admin' && (
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-xs lg:text-sm text-gray-900">{client.email}</td>
                      )}
                      {user?.role === 'agent' && (
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-xs lg:text-sm text-gray-400">••••••••••</td>
                      )}
                      {user?.role === 'agent' && (
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-xs lg:text-sm text-gray-400">••••••••••</td>
                      )}
                     {isAdmin && (
                       <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-xs lg:text-sm text-gray-900">
                         {client.assignedAgent ? (
                           <div className="flex items-center">
                             <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium ${getAvatarColor(client.assignedAgent.firstName)}`}>
                               {getInitials(client.assignedAgent.firstName, client.assignedAgent.lastName)}
                             </div>
                             <span className="ml-2">{client.assignedAgent.firstName} {client.assignedAgent.lastName}</span>
                           </div>
                         ) : (
                           <span className="text-gray-400">Unassigned</span>
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
                         <div className="space-y-1">
                           <div className="truncate">
                             {client.lastComment}
                           </div>
                           <div className="text-xs text-gray-500">
                             {client.lastCommentDate ? new Date(client.lastCommentDate).toLocaleString() : 'No date'}
                           </div>
                         </div>
                       ) : (
                         <span className="text-gray-400">No comments</span>
                       )}
                     </td>
                  </tr>
                ))}
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
               <div className="text-sm text-gray-600">
                 Showing data for {dynamicAnalytics.totalClients} filtered client{dynamicAnalytics.totalClients !== 1 ? 's' : ''}
                 {(agentFilter !== 'all' || statusFilter !== 'all' || countryFilter !== 'all' || debouncedSearchTerm) && (
                   <span className="ml-2 text-blue-600">• Filtered View</span>
                 )}
               </div>
             </div>
           </div>
                   
                   {/* Clients by Campaign Status */}
           <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm">
             <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4">Clients by Campaign Status</h3>
             <div className="h-48 lg:h-64">
              {pieChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
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
               {agentFilter !== 'all' && (
                 <p className="text-xs text-blue-600 mt-1">
                   Showing data for: {availableAgents.find(a => a._id === agentFilter)?.firstName} {availableAgents.find(a => a._id === agentFilter)?.lastName}
                 </p>
               )}
             </div>
             {statusFilter !== 'all' && (
               <button
                 onClick={() => setStatusFilter('all')}
                 className="text-xs text-blue-600 hover:text-blue-800 font-medium"
               >
                 Clear Filter
               </button>
             )}
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
                   {globalAnalytics.totalClients}
                 </span>
               </div>
             )}
             {globalAnalytics.leadStatusOverview && globalAnalytics.leadStatusOverview.length > 0 ? globalAnalytics.leadStatusOverview.map((status) => (
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
                     status._id === 'Wrong Number' ? 'bg-red-500' :
                     status._id === 'Wrong Name' ? 'bg-amber-500' :
                     'bg-gray-400'
                   }`}></div>
                   <span className={`text-sm ${statusFilter === status._id ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>
                     {status._id}
                   </span>
                 </div>
                 <span className={`text-sm font-medium ${statusFilter === status._id ? 'text-blue-700' : 'text-gray-900'}`}>
                   {status.count}
                 </span>
               </div>
             )) : (
               <div className="text-center py-6">
                 <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                 <p className="text-sm text-gray-500">
                   {agentFilter !== 'all' ? 'No status data for selected agent' : 'No status data to display'}
                 </p>
               </div>
             )}
             
             {/* Campaign Options - Data and Affiliate */}
             <div 
               className={`flex items-center justify-between cursor-pointer p-2 rounded-lg transition-colors ${
                 statusFilter === 'Data' 
                   ? 'bg-indigo-50 border border-indigo-200' 
                   : 'hover:bg-gray-50'
               }`}
               onClick={() => handleLeadStatusClick('Data')}
             >
               <div className="flex items-center">
                 <div className="w-3 h-3 rounded-full mr-3 bg-indigo-500"></div>
                 <span className={`text-sm ${statusFilter === 'Data' ? 'text-indigo-700 font-medium' : 'text-gray-700'}`}>
                   Data
                 </span>
               </div>
               <span className={`text-sm font-medium ${statusFilter === 'Data' ? 'text-indigo-700' : 'text-gray-900'}`}>
                 {globalAnalytics.campaignOverview?.find(c => c._id === 'Data')?.count || 0}
               </span>
             </div>
             
             <div 
               className={`flex items-center justify-between cursor-pointer p-2 rounded-lg transition-colors ${
                 statusFilter === 'Affiliate' 
                   ? 'bg-teal-50 border border-teal-200' 
                   : 'hover:bg-gray-50'
               }`}
               onClick={() => handleLeadStatusClick('Affiliate')}
             >
               <div className="flex items-center">
                 <div className="w-3 h-3 rounded-full mr-3 bg-teal-500"></div>
                 <span className={`text-sm ${statusFilter === 'Affiliate' ? 'text-teal-700 font-medium' : 'text-gray-700'}`}>
                   Affiliate
                 </span>
               </div>
               <span className={`text-sm font-medium ${statusFilter === 'Affiliate' ? 'text-teal-700' : 'text-gray-900'}`}>
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
                Filter by {dateNavigationType === 'entry' ? 'CRM Entry Date' : 'Last Comment Date'}
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
                  <strong>Instructions:</strong> Choose how you want to filter the records by {dateNavigationType === 'entry' ? 'CRM entry date' : 'last comment date'}.
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
                    ? `${dateNavigationType === 'entry' ? 'CRM Entry' : 'Last Comment'} Date` 
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
                      ? ` ${dateNavigationType === 'entry' ? 'CRM Entry' : 'Last Comment'} date: ${dateFilter}`
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