import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Phone, 
  MessageCircle, 
  Mail, 
  Users,
  Info,
  Send,
  BarChart3,
  List,
  Plus,
  X,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { communicationAPI, clientAPI } from '../utils/api';

const CommunicationsHub = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeCalls: { value: 0, change: '+0%' },
    messagesSent: { value: 0, change: '+0%' },
    emailsSent: { value: 0, change: '+0%' },
    onlineAgents: { value: 0, total: 0, percentage: 0 }
  });
  const [analytics, setAnalytics] = useState({
    whatsappToday: 0,
    telegramToday: 0,
    emailToday: 0
  });
  const [activeAgents, setActiveAgents] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showCallModal, setShowCallModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  
  // Form states
  const [callData, setCallData] = useState({ clientId: '', phoneNumber: '', channel: 'voip' });
  const [messageData, setMessageData] = useState({ clientId: '', content: '', channel: 'whatsapp' });
  const [emailData, setEmailData] = useState({ clientId: '', subject: '', content: '', email: '' });
  
  // Loading states for actions
  const [actionLoading, setActionLoading] = useState({
    call: false,
    message: false,
    email: false
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [statsData, analyticsData, agentsData, clientsData] = await Promise.all([
          communicationAPI.getStats(),
          communicationAPI.getAnalytics(),
          communicationAPI.getActiveAgents(),
          clientAPI.getClients({ limit: 50 })
        ]);
        
        setStats(statsData);
        setAnalytics(analyticsData);
        setActiveAgents(agentsData);
        setClients(clientsData.clients || []);
      } catch (error) {
        console.error('Error fetching communication data:', error);
        setError('Failed to load communication data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCall = async (channel = 'voip') => {
    setCallData({ ...callData, channel });
    setShowCallModal(true);
  };

  const handleMessage = async (channel = 'whatsapp') => {
    setMessageData({ ...messageData, channel });
    setShowMessageModal(true);
  };

  const handleEmail = async () => {
    setShowEmailModal(true);
  };

  const handleViewTemplates = () => {
    setShowTemplatesModal(true);
  };

  const handleAddAgent = () => {
    // Redirect to user management or show add agent modal
    alert('Add Agent functionality - Redirect to user management');
  };

  const submitCall = async () => {
    if (!callData.clientId || !callData.phoneNumber) {
      alert('Please select a client and enter phone number');
      return;
    }

    try {
      setActionLoading({ ...actionLoading, call: true });
      await communicationAPI.initiateCall(callData);
      alert('Call initiated successfully!');
      setShowCallModal(false);
      setCallData({ clientId: '', phoneNumber: '', channel: 'voip' });
    } catch (error) {
      alert('Failed to initiate call: ' + error.message);
    } finally {
      setActionLoading({ ...actionLoading, call: false });
    }
  };

  const submitMessage = async () => {
    if (!messageData.clientId || !messageData.content) {
      alert('Please select a client and enter message content');
      return;
    }

    try {
      setActionLoading({ ...actionLoading, message: true });
      await communicationAPI.sendMessage(messageData);
      alert('Message sent successfully!');
      setShowMessageModal(false);
      setMessageData({ clientId: '', content: '', channel: 'whatsapp' });
    } catch (error) {
      alert('Failed to send message: ' + error.message);
    } finally {
      setActionLoading({ ...actionLoading, message: false });
    }
  };

  const submitEmail = async () => {
    if (!emailData.clientId || !emailData.subject || !emailData.content || !emailData.email) {
      alert('Please fill in all email fields');
      return;
    }

    try {
      setActionLoading({ ...actionLoading, email: true });
      await communicationAPI.sendEmail(emailData);
      alert('Email sent successfully!');
      setShowEmailModal(false);
      setEmailData({ clientId: '', subject: '', content: '', email: '' });
    } catch (error) {
      alert('Failed to send email: ' + error.message);
    } finally {
      setActionLoading({ ...actionLoading, email: false });
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

  if (loading) {
    return (
      <div className="flex-1 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 min-h-screen">
      <div className="p-6 space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Calls</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeCalls.value}</p>
                <p className="text-xs text-green-600">{stats.activeCalls.change} from yesterday</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Phone className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Messages Sent</p>
                <p className="text-2xl font-bold text-gray-900">{stats.messagesSent.value}</p>
                <p className="text-xs text-green-600">{stats.messagesSent.change} from yesterday</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Emails Sent</p>
                <p className="text-2xl font-bold text-gray-900">{stats.emailsSent.value}</p>
                <p className="text-xs text-green-600">{stats.emailsSent.change} from yesterday</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Mail className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Online Agents</p>
                <p className="text-2xl font-bold text-gray-900">{stats.onlineAgents.value}/{stats.onlineAgents.total}</p>
                <p className="text-xs text-gray-600">{stats.onlineAgents.percentage}% availability</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Integrations Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* VoIP Integration */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">VoIP Integration</h3>
                <p className="text-sm text-gray-600">MicroSip & Zoiper</p>
              </div>
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Active</span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-900">MicroSip</span>
                </div>
                <button 
                  onClick={() => handleCall('voip')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call</span>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-900">Zoiper</span>
                </div>
                <button 
                  onClick={() => handleCall('voip')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call</span>
                </button>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <p className="text-sm text-blue-800">
                    Phone numbers are hidden from agents for security. Use the call buttons to initiate calls.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Messaging */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Messaging</h3>
                <p className="text-sm text-gray-600">WhatsApp & Telegram</p>
              </div>
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Connected</span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-green-500 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">W</span>
                  </div>
                  <span className="font-medium text-gray-900">WhatsApp Business</span>
                </div>
                <button 
                  onClick={() => handleMessage('whatsapp')}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">T</span>
                  </div>
                  <span className="font-medium text-gray-900">Telegram</span>
                </div>
                <button 
                  onClick={() => handleMessage('telegram')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-800">{analytics.whatsappToday}</div>
                  <div className="text-sm text-green-700">WhatsApp Today</div>
                </div>
                <div className="bg-blue-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-800">{analytics.telegramToday}</div>
                  <div className="text-sm text-blue-700">Telegram Today</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Email & Agents Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Email Integration */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Email Integration</h3>
                <p className="text-sm text-gray-600">Hostinger Email Service</p>
              </div>
              <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">Configured</span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Send className="w-5 h-5 text-orange-600" />
                  <span className="font-medium text-gray-900">Quick Send</span>
                </div>
                <button 
                  onClick={handleEmail}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
                >
                  <Mail className="w-4 h-4" />
                  <span>Compose Email</span>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <List className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-900">Templates</span>
                </div>
                <button 
                  onClick={handleViewTemplates}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
                >
                  <List className="w-4 h-4" />
                  <span>View Templates</span>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-900">Analytics</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{analytics.emailToday}</div>
                  <div className="text-sm text-gray-600">Emails Today</div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Agents */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Active Agents</h3>
              <button 
                onClick={handleAddAgent}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Agent</span>
              </button>
            </div>

            <div className="space-y-4">
              {activeAgents.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No active agents found</p>
                </div>
              ) : (
                activeAgents.map((agent, index) => (
                  <div key={agent._id || index} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    <div className={`w-10 h-10 ${getAvatarColor(agent.firstName || '')} rounded-full flex items-center justify-center`}>
                      <span className="text-white font-medium">{agent.initials}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{agent.firstName} {agent.lastName}</p>
                      <p className="text-sm text-gray-600">{agent.status}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Call Modal */}
      {showCallModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Initiate Call</h3>
              <button onClick={() => setShowCallModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Client</label>
                <select 
                  value={callData.clientId} 
                  onChange={(e) => setCallData({...callData, clientId: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a client...</option>
                  {clients.map(client => (
                    <option key={client._id} value={client._id}>
                      {client.firstName} {client.lastName} - {client.phone}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  value={callData.phoneNumber}
                  onChange={(e) => setCallData({...callData, phoneNumber: e.target.value})}
                  placeholder="Enter phone number"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
                <select 
                  value={callData.channel} 
                  onChange={(e) => setCallData({...callData, channel: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="voip">VoIP</option>
                  <option value="phone">Phone</option>
                </select>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button 
                onClick={() => setShowCallModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={submitCall}
                disabled={actionLoading.call}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading.call ? 'Initiating...' : 'Start Call'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Send Message</h3>
              <button onClick={() => setShowMessageModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Client</label>
                <select 
                  value={messageData.clientId} 
                  onChange={(e) => setMessageData({...messageData, clientId: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a client...</option>
                  {clients.map(client => (
                    <option key={client._id} value={client._id}>
                      {client.firstName} {client.lastName}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
                <select 
                  value={messageData.channel} 
                  onChange={(e) => setMessageData({...messageData, channel: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="telegram">Telegram</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea 
                  value={messageData.content}
                  onChange={(e) => setMessageData({...messageData, content: e.target.value})}
                  placeholder="Enter your message..."
                  rows={4}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button 
                onClick={() => setShowMessageModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={submitMessage}
                disabled={actionLoading.message}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading.message ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Compose Email</h3>
              <button onClick={() => setShowEmailModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Client</label>
                <select 
                  value={emailData.clientId} 
                  onChange={(e) => setEmailData({...emailData, clientId: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a client...</option>
                  {clients.map(client => (
                    <option key={client._id} value={client._id}>
                      {client.firstName} {client.lastName} - {client.email}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Email</label>
                <input 
                  type="email" 
                  value={emailData.email}
                  onChange={(e) => setEmailData({...emailData, email: e.target.value})}
                  placeholder="Enter email address"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input 
                  type="text" 
                  value={emailData.subject}
                  onChange={(e) => setEmailData({...emailData, subject: e.target.value})}
                  placeholder="Enter email subject"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea 
                  value={emailData.content}
                  onChange={(e) => setEmailData({...emailData, content: e.target.value})}
                  placeholder="Enter your email content..."
                  rows={4}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button 
                onClick={() => setShowEmailModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={submitEmail}
                disabled={actionLoading.email}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {actionLoading.email ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Templates Modal */}
      {showTemplatesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Email Templates</h3>
              <button onClick={() => setShowTemplatesModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Welcome Email</h4>
                <p className="text-sm text-gray-600 mb-2">Subject: Welcome to Our Platform</p>
                <p className="text-sm text-gray-700">
                  Dear [Client Name], Welcome to our platform! We're excited to have you on board. 
                  Here's your account information and next steps...
                </p>
                <button className="mt-2 text-blue-600 text-sm hover:text-blue-800">Use Template</button>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Follow-up Email</h4>
                <p className="text-sm text-gray-600 mb-2">Subject: Following Up on Our Discussion</p>
                <p className="text-sm text-gray-700">
                  Hi [Client Name], I wanted to follow up on our previous discussion. 
                  Are you still interested in our services? Let me know if you have any questions...
                </p>
                <button className="mt-2 text-blue-600 text-sm hover:text-blue-800">Use Template</button>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Monthly Report</h4>
                <p className="text-sm text-gray-600 mb-2">Subject: Your Monthly Activity Report</p>
                <p className="text-sm text-gray-700">
                  Hi [Client Name], Here's your monthly activity report. Your account shows excellent engagement 
                  and we're here to help you maximize your results...
                </p>
                <button className="mt-2 text-blue-600 text-sm hover:text-blue-800">Use Template</button>
              </div>
            </div>
            
            <div className="mt-6">
              <button 
                onClick={() => setShowTemplatesModal(false)}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunicationsHub;
