import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { clientAPI, taskAPI } from '../utils/api';
import { 
  Phone, 
  MessageCircle, 
  Mail, 
  Calendar,
  Plus,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  Edit,
  Trash2,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const ClientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [client, setClient] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('activity');
  
  // Client navigation state
  const [navigationClients, setNavigationClients] = useState([]);
  const [currentClientIndex, setCurrentClientIndex] = useState(-1);
  
  // Modal states
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [showBulkCampaignModal, setShowBulkCampaignModal] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: ''
  });
  const [editingTask, setEditingTask] = useState(null);
  
  // Bulk campaign states
  const [allClients, setAllClients] = useState([]);
  const [selectedClients, setSelectedClients] = useState(new Set());
  const [bulkCampaign, setBulkCampaign] = useState('Data');
  const [bulkLoading, setBulkLoading] = useState(false);

  // Fetch all clients for navigation
  useEffect(() => {
    const fetchAllClientsForNavigation = async () => {
      try {
        const clientsData = await clientAPI.getClients({ limit: 1000 });
        setNavigationClients(clientsData.clients || []);
        
        // Find current client index
        const index = clientsData.clients.findIndex(c => c._id === id);
        setCurrentClientIndex(index);
      } catch (err) {
        console.error('Error fetching clients for navigation:', err);
      }
    };

    fetchAllClientsForNavigation();
  }, [id]);

  // Fetch client data
  useEffect(() => {
    const fetchClientData = async () => {
      try {
        setLoading(true);
        const clientData = await clientAPI.getClientById(id);
        setClient(clientData);
        
        // Fetch all tasks for this client (not just user's tasks)
        const tasksData = await taskAPI.getTasks({ clientId: id });
        setTasks(tasksData.tasks || []);
        
        // Set notes from client data
        setNotes(clientData.notes || []);
      } catch (err) {
        setError(err.message || 'Failed to load client data');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchClientData();
    }
  }, [id]);

  // Navigation functions
  const navigateToClient = (direction) => {
    if (direction === 'prev' && currentClientIndex > 0) {
      const prevClient = navigationClients[currentClientIndex - 1];
      navigate(`/clients/${prevClient._id}`);
    } else if (direction === 'next' && currentClientIndex < navigationClients.length - 1) {
      const nextClient = navigationClients[currentClientIndex + 1];
      navigate(`/clients/${nextClient._id}`);
    }
  };

  // Handle call client
  const handleCall = () => {
    if (!client?.phone) {
      alert('Client phone number not found');
      return;
    }
    
    const phoneNumber = client.phone.replace(/\D/g, '');
    const telUrl = `tel:${phoneNumber}`;
    window.open(telUrl, '_self');
  };



  // Handle email client
  const handleEmail = () => {
    if (!client?.email) {
      alert('Client email not found');
      return;
    }
    
    const email = client.email.toLowerCase();
    
    if (email.includes('@gmail.com')) {
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(client.email)}&su=${encodeURIComponent('Follow-up')}&body=${encodeURIComponent(`Hi ${client.firstName},\n\nI hope you're doing well. I wanted to follow up on our previous conversation.\n\nBest regards,\nYour Team`)}`;
      window.open(gmailUrl, '_blank');
    } else if (email.includes('@outlook.com') || email.includes('@hotmail.com') || email.includes('@live.com')) {
      const outlookUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(client.email)}&subject=${encodeURIComponent('Follow-up')}&body=${encodeURIComponent(`Hi ${client.firstName},\n\nI hope you're doing well. I wanted to follow up on our previous conversation.\n\nBest regards,\nYour Team`)}`;
      window.open(outlookUrl, '_blank');
    } else if (email.includes('@yahoo.com')) {
      const yahooUrl = `https://compose.mail.yahoo.com/?to=${encodeURIComponent(client.email)}&subject=${encodeURIComponent('Follow-up')}&body=${encodeURIComponent(`Hi ${client.firstName},\n\nI hope you're doing well. I wanted to follow up on our previous conversation.\n\nBest regards,\nYour Team`)}`;
      window.open(yahooUrl, '_blank');
    } else {
      const mailtoUrl = `mailto:${client.email}?subject=Follow-up&body=${encodeURIComponent(`Hi ${client.firstName},\n\nI hope you're doing well. I wanted to follow up on our previous conversation.\n\nBest regards,\nYour Team`)}`;
      window.open(mailtoUrl, '_self');
    }
  };

  // Handle add note
  const handleAddNote = async () => {
    if (!newNote.trim()) {
      alert('Please enter a note');
      return;
    }

    try {
      const updatedClient = await clientAPI.addNote(id, newNote);
      setClient(updatedClient);
      setNotes(updatedClient.notes || []);
      setNewNote('');
      setShowAddNoteModal(false);
      
      alert('Note added successfully!');
    } catch (err) {
      alert('Failed to add note: ' + err.message);
    }
  };

  // Handle add task
  const handleAddTask = async () => {
    if (!newTask.title.trim()) {
      alert('Please enter a task title');
      return;
    }

    if (!newTask.dueDate) {
      alert('Please select a due date');
      return;
    }

    try {
      const taskData = {
        ...newTask,
        client: id, // Changed from clientId to client as required by the model
        assignedTo: user._id,
        status: 'pending'
      };
      
      const createdTask = await taskAPI.createTask(taskData);
      setTasks([...tasks, createdTask]);
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: ''
      });
      setShowAddTaskModal(false);
      
      alert('Task added successfully!');
    } catch (err) {
      alert('Failed to add task: ' + err.message);
    }
  };

  // Handle schedule meeting
  const handleScheduleMeeting = () => {
    alert('Meeting scheduling functionality would be implemented here');
  };

  // Handle status change
  const handleStatusChange = async (newStatus) => {
    try {
      // Update the client status via API
      await clientAPI.updateClient(id, { status: newStatus });
      
      // Update local state
      setClient(prevClient => ({
        ...prevClient,
        status: newStatus
      }));
      
      alert('Status updated successfully!');
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status: ' + (err.message || 'Unknown error'));
    }
  };

  // Handle campaign change
  const handleCampaignChange = async (newCampaign) => {
    try {
      // Update the client campaign via API
      await clientAPI.updateClient(id, { campaign: newCampaign });
      
      // Update local state
      setClient(prevClient => ({
        ...prevClient,
        campaign: newCampaign
      }));
      
      alert('Campaign updated successfully!');
    } catch (err) {
      console.error('Error updating campaign:', err);
      alert('Failed to update campaign: ' + (err.message || 'Unknown error'));
    }
  };

  // Fetch all clients for bulk campaign update
  const fetchAllClients = async () => {
    try {
      const clientsData = await clientAPI.getClients({ limit: 1000 }); // Get all clients
      setAllClients(clientsData.clients || []);
    } catch (err) {
      console.error('Error fetching clients:', err);
      alert('Failed to fetch clients: ' + (err.message || 'Unknown error'));
    }
  };

  // Handle bulk campaign update
  const handleBulkCampaignUpdate = async () => {
    if (selectedClients.size === 0) {
      alert('Please select at least one client');
      return;
    }

    const confirmUpdate = window.confirm(
      `Are you sure you want to update ${selectedClients.size} client(s) to campaign "${bulkCampaign}"?`
    );

    if (!confirmUpdate) {
      return;
    }

    setBulkLoading(true);
    try {
      // Update campaigns for selected clients
      const updatePromises = Array.from(selectedClients).map(clientId => 
        clientAPI.updateClient(clientId, { campaign: bulkCampaign })
      );
      
      await Promise.all(updatePromises);
      
      alert(`Successfully updated ${selectedClients.size} client(s) to campaign "${bulkCampaign}"!`);
      
      // Close modal and reset state
      setShowBulkCampaignModal(false);
      setSelectedClients(new Set());
      setBulkCampaign('Data');
      
      // Refresh current client data if it was updated
      if (selectedClients.has(id)) {
        const clientData = await clientAPI.getClientById(id);
        setClient(clientData);
      }
    } catch (err) {
      console.error('Error updating campaigns:', err);
      alert('Failed to update campaigns: ' + (err.message || 'Unknown error'));
    } finally {
      setBulkLoading(false);
    }
  };

  // Handle client selection for bulk update
  const handleClientSelect = (clientId, checked) => {
    const newSelectedClients = new Set(selectedClients);
    if (checked) {
      newSelectedClients.add(clientId);
    } else {
      newSelectedClients.delete(clientId);
    }
    setSelectedClients(newSelectedClients);
  };

  // Handle select all clients
  const handleSelectAllClients = (checked) => {
    if (checked) {
      const allClientIds = new Set(allClients.map(client => client._id));
      setSelectedClients(allClientIds);
    } else {
      setSelectedClients(new Set());
    }
  };

  // Handle task status update
  const handleTaskStatusUpdate = async (taskId, newStatus) => {
    try {
      await taskAPI.updateTask(taskId, { status: newStatus });
      
      // Update local state
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task._id === taskId ? { ...task, status: newStatus } : task
        )
      );
      
      alert('Task status updated successfully!');
    } catch (err) {
      console.error('Error updating task status:', err);
      alert('Failed to update task status: ' + (err.message || 'Unknown error'));
    }
  };

  // Handle task deletion
  const handleTaskDelete = async (taskId) => {
    try {
      await taskAPI.deleteTask(taskId);
      
      // Update local state
      setTasks(prevTasks => prevTasks.filter(task => task._id !== taskId));
      
      alert('Task deleted successfully!');
    } catch (err) {
      console.error('Error deleting task:', err);
      alert('Failed to delete task: ' + (err.message || 'Unknown error'));
    }
  };

  // Handle edit task
  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowEditTaskModal(true);
  };

  // Handle update task
  const handleUpdateTask = async () => {
    if (!editingTask.title.trim()) {
      alert('Please enter a task title');
      return;
    }

    if (!editingTask.dueDate) {
      alert('Please select a due date');
      return;
    }

    try {
      const updatedTask = await taskAPI.updateTask(editingTask._id, {
        title: editingTask.title,
        description: editingTask.description,
        priority: editingTask.priority,
        dueDate: editingTask.dueDate
      });
      
      // Update local state
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task._id === editingTask._id ? updatedTask : task
        )
      );
      
      setShowEditTaskModal(false);
      setEditingTask(null);
      alert('Task updated successfully!');
    } catch (err) {
      console.error('Error updating task:', err);
      alert('Failed to update task: ' + (err.message || 'Unknown error'));
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Client not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Navigation Arrows */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigateToClient('prev')}
          disabled={currentClientIndex <= 0}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Previous Client</span>
        </button>
        
        <div className="text-center">
          <span className="text-sm text-gray-600">
            Client {currentClientIndex + 1} of {navigationClients.length}
          </span>
        </div>
        
        <button
          onClick={() => navigateToClient('next')}
          disabled={currentClientIndex >= navigationClients.length - 1}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          <span>Next Client</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Client Information Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h3>
            
            <div className="text-center mb-4">
              <div className={`w-20 h-20 ${getAvatarColor(client.firstName)} rounded-full flex items-center justify-center mx-auto mb-3`}>
                <span className="text-white text-xl font-semibold">
                  {getInitials(client.firstName, client.lastName)}
                </span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900">
                {client.firstName} {client.lastName}
              </h4>
              <p className="text-gray-600">({client.role || 'Client'})</p>
              <p className="text-sm text-gray-500 font-mono">ID: {client.clientId}</p>
            </div>

            <div className="space-y-3">
              {/* Status Dropdown */}
              <div className="text-center">
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={client.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className={`px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium ${getStatusColor(client.status)} w-full max-w-xs`}
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
                </select>
              </div>

              {/* Campaign Dropdown */}
              <div className="text-center">
                <label className="block text-sm font-medium text-gray-700 mb-2">Campaign</label>
                {user?.role === 'admin' ? (
                  <select
                    value={client.campaign || 'Data'}
                    onChange={(e) => handleCampaignChange(e.target.value)}
                    className={`px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium w-full max-w-xs ${
                      client.campaign === 'Data' ? 'bg-indigo-100 text-indigo-800' : 
                      client.campaign === 'Data2' ? 'bg-purple-100 text-purple-800' :
                      client.campaign === 'Data3' ? 'bg-pink-100 text-pink-800' :
                      client.campaign === 'Data4' ? 'bg-yellow-100 text-yellow-800' :
                      client.campaign === 'Data5' ? 'bg-orange-100 text-orange-800' :
                      client.campaign === 'Affiliate' ? 'bg-teal-100 text-teal-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <option value="Data">Data</option>
                    <option value="Data2">Data2</option>
                    <option value="Data3">Data3</option>
                    <option value="Data4">Data4</option>
                    <option value="Data5">Data5</option>
                    <option value="Affiliate">Affiliate</option>
                  </select>
                ) : (
                  <div className={`px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium w-full max-w-xs ${
                    client.campaign === 'Data' ? 'bg-indigo-100 text-indigo-800' : 
                    client.campaign === 'Data2' ? 'bg-purple-100 text-purple-800' :
                    client.campaign === 'Data3' ? 'bg-pink-100 text-pink-800' :
                    client.campaign === 'Data4' ? 'bg-yellow-100 text-yellow-800' :
                    client.campaign === 'Data5' ? 'bg-orange-100 text-orange-800' :
                    client.campaign === 'Affiliate' ? 'bg-teal-100 text-teal-800' : 
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {client.campaign || 'Data'}
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={handleCall}
                  className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
                  title="Call Client"
                >
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">Call</span>
                </button>

                <button
                  onClick={handleEmail}
                  className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors"
                  title="Send Email"
                >
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">Email</span>
                </button>

                {/* Bulk Campaign Update Button - Admin Only */}
                {user?.role === 'admin' && (
                  <button
                    onClick={() => {
                      fetchAllClients();
                      setShowBulkCampaignModal(true);
                    }}
                    className="flex items-center space-x-2 text-gray-600 hover:text-orange-600 transition-colors"
                    title="Bulk Campaign Update"
                  >
                    <Users className="w-4 h-4" />
                    <span className="text-sm">Bulk Update</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            
            <div className="space-y-3">
              <button
                onClick={handleCall}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Phone className="w-4 h-4" />
                <span>Call Client</span>
              </button>
              
              <button
                onClick={handleEmail}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Mail className="w-4 h-4" />
                <span>Send Email</span>
              </button>
              
              <button
                onClick={handleScheduleMeeting}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Calendar className="w-4 h-4" />
                <span>Schedule Meeting</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('description')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'description'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Description
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'activity'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Activity & Notes
                </button>
                <button
                  onClick={() => setActiveTab('details')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'details'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Client Details
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'description' && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Client Description</h4>
                  <p className="text-gray-600">
                    {client.bio || 'No description available for this client.'}
                  </p>
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="space-y-6">
                  {/* Comments & Notes */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">Comments & Notes</h4>
                      <button
                        onClick={() => setShowAddNoteModal(true)}
                        className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Note</span>
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {notes.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No notes yet. Add your first note!</p>
                      ) : (
                        notes.map((note, index) => (
                          <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                            <div className="flex items-start space-x-3">
                              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-start space-x-2">
                                  <p className="text-gray-800">{note.content}</p>
                                  {user?.role !== 'admin' && (
                                    <span className="text-xs text-gray-400 italic">(Read-only)</span>
                                  )}
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                  <p className="text-sm text-gray-500">
                                    {note.createdBy ? `${note.createdBy.firstName} ${note.createdBy.lastName}` : 'Unknown'} • {formatDate(note.createdAt)}
                                  </p>
                                                                     {user?.role === 'admin' && (
                                     <button
                                       onClick={async () => {
                                         if (confirm('Are you sure you want to delete this note?')) {
                                           try {
                                             await clientAPI.deleteNote(id, note._id);
                                             const updatedClient = await clientAPI.getClientById(id);
                                             setClient(updatedClient);
                                             setNotes(updatedClient.notes || []);
                                             alert('Note deleted successfully!');
                                           } catch (err) {
                                             alert('Failed to delete note: ' + err.message);
                                           }
                                         }
                                       }}
                                       className="text-red-500 hover:text-red-700 text-sm"
                                     >
                                       Delete
                                     </button>
                                   )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Tasks */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">Tasks</h4>
                      <button
                        onClick={() => setShowAddTaskModal(true)}
                        className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Task</span>
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {tasks.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No tasks yet. Add your first task!</p>
                      ) : (
                        tasks.map((task) => (
                          <div key={task._id} className="bg-white rounded-lg p-3 border border-gray-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  checked={task.status === 'completed'}
                                  onChange={() => handleTaskStatusUpdate(task._id, task.status === 'completed' ? 'pending' : 'completed')}
                                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <p className="font-medium text-gray-900">{task.title}</p>
                                  </div>
                                  {task.description && (
                                    <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                                  )}
                                  <div className="flex items-center space-x-2 mt-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                      {task.priority}
                                    </span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                                      {task.status === 'completed' ? 'Completed' : task.dueDate ? `Due: ${formatDate(task.dueDate)}` : 'Pending'}
                                    </span>
                                    {task.assignedTo && (
                                      <span className="text-xs text-gray-500">
                                        • {task.assignedTo.firstName} {task.assignedTo.lastName}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {/* Allow both agents and admins to edit and delete tasks */}
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleEditTask(task)}
                                  className="text-blue-500 hover:text-blue-700 text-sm"
                                  title="Edit Task"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm('Are you sure you want to delete this task?')) {
                                      handleTaskDelete(task._id);
                                    }
                                  }}
                                  className="text-red-500 hover:text-red-700 text-sm"
                                  title="Delete Task"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'details' && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Client Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
                      <p className="text-gray-900 font-mono">{client.clientId}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <p className="text-gray-900">{client.firstName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <p className="text-gray-900">{client.lastName}</p>
                    </div>
                    {user?.role === 'admin' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <p className="text-gray-900">{client.email || 'Not provided'}</p>
                      </div>
                    )}
                    {user?.role === 'admin' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <p className="text-gray-900">{client.phone || 'Not provided'}</p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                      <p className="text-gray-900">{client.country}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={client.status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        className={`px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium ${getStatusColor(client.status)}`}
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
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Agent</label>
                      <p className="text-gray-900">
                        {client.assignedAgent ? `${client.assignedAgent.firstName} ${client.assignedAgent.lastName}` : 'Not assigned'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Created Date</label>
                      <p className="text-gray-900">{formatDate(client.createdAt)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Note Modal */}
      {showAddNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Note</h3>
              <button onClick={() => setShowAddNoteModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note Content</label>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Enter your note here..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddNoteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNote}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Task</h3>
              <button onClick={() => setShowAddTaskModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  placeholder="Enter task title"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  placeholder="Enter task description"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddTaskModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTask}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {showEditTaskModal && editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Task</h3>
              <button onClick={() => setShowEditTaskModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                  placeholder="Enter task title"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editingTask.description || ''}
                  onChange={(e) => setEditingTask({...editingTask, description: e.target.value})}
                  placeholder="Enter task description"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={editingTask.priority}
                  onChange={(e) => setEditingTask({...editingTask, priority: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                <input
                  type="date"
                  value={editingTask.dueDate ? new Date(editingTask.dueDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditingTask({...editingTask, dueDate: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowEditTaskModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateTask}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Update Task
              </button>
            </div>
          </div>
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
                  setSelectedClients(new Set());
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

              {/* Client Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">Select Clients</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="selectAllClients"
                      checked={selectedClients.size === allClients.length && allClients.length > 0}
                      onChange={(e) => handleSelectAllClients(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="selectAllClients" className="text-sm text-gray-700">
                      Select All ({allClients.length})
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
                  
                  {allClients.map((client) => (
                    <div key={client._id} className="p-3 border-b border-gray-100 hover:bg-gray-50">
                      <div className="grid grid-cols-12 gap-4 items-center text-sm">
                        <div className="col-span-1">
                          <input
                            type="checkbox"
                            checked={selectedClients.has(client._id)}
                            onChange={(e) => handleClientSelect(client._id, e.target.checked)}
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
                  Selected: {selectedClients.size} client(s)
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowBulkCampaignModal(false);
                  setSelectedClients(new Set());
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkCampaignUpdate}
                disabled={selectedClients.size === 0 || bulkLoading}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bulkLoading ? 'Updating...' : `Update ${selectedClients.size} Client(s)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientProfile;
