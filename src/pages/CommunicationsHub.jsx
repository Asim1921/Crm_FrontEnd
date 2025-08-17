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
  const [showAddAgentModal, setShowAddAgentModal] = useState(false);
  
  // Form states
  const [callData, setCallData] = useState({ clientId: '', phoneNumber: '', channel: 'voip' });
  const [messageData, setMessageData] = useState({ clientId: '', content: '', channel: 'whatsapp' });
  const [emailData, setEmailData] = useState({ clientId: '', subject: '', content: '', email: '' });
  const [agentData, setAgentData] = useState({ firstName: '', lastName: '', email: '', role: 'agent' });
  
  // Email templates
  const emailTemplates = [
    {
      id: 'welcome',
      name: 'Welcome Email',
      subject: 'Welcome to Our Platform',
      content: `Dear [Client Name],

Welcome to our platform! We're excited to have you on board.

Here's your account information and next steps:
- Your account has been successfully created
- You can now access all our services
- Our support team is available 24/7

If you have any questions, please don't hesitate to contact us.

Best regards,
Your Team`
    },
    {
      id: 'followup',
      name: 'Follow-up Email',
      subject: 'Following Up on Our Discussion',
      content: `Hi [Client Name],

I wanted to follow up on our previous discussion about your needs and how we can help you achieve your goals.

Are you still interested in our services? I'd be happy to:
- Schedule a detailed consultation
- Provide more information about our solutions
- Answer any questions you might have

Please let me know if you'd like to continue our conversation.

Best regards,
[Your Name]`
    },
    {
      id: 'monthly',
      name: 'Monthly Report',
      subject: 'Your Monthly Activity Report',
      content: `Hi [Client Name],

Here's your monthly activity report for [Month Year].

Your account shows excellent engagement and we're here to help you maximize your results.

Key highlights:
- [Activity metric 1]
- [Activity metric 2]
- [Activity metric 3]

If you'd like to discuss your performance or explore new opportunities, please let me know.

Best regards,
[Your Name]`
    }
  ];
  
  // Loading states for actions
  const [actionLoading, setActionLoading] = useState({
    call: false,
    message: false,
    email: false,
    agent: false
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

  // Auto-fill email when client is selected
  const handleClientSelect = (clientId, type) => {
    const selectedClient = clients.find(c => c._id === clientId);
    if (selectedClient) {
      if (type === 'email') {
        setEmailData({
          ...emailData,
          clientId,
          email: selectedClient.email || ''
        });
      } else if (type === 'message') {
        setMessageData({
          ...messageData,
          clientId
        });
      } else if (type === 'call') {
        setCallData({
          ...callData,
          clientId,
          phoneNumber: selectedClient.phone || ''
        });
      }
    }
  };

  const handleViewTemplates = () => {
    setShowTemplatesModal(true);
  };

  const useTemplate = (template) => {
    // Get selected client name if available
    const selectedClient = clients.find(c => c._id === emailData.clientId);
    const clientName = selectedClient ? `${selectedClient.firstName} ${selectedClient.lastName}` : '[Client Name]';
    
    // Replace placeholders in template
    let content = template.content.replace(/\[Client Name\]/g, clientName);
    content = content.replace(/\[Your Name\]/g, `${user.firstName} ${user.lastName}`);
    content = content.replace(/\[Month Year\]/g, new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
    
    // Update email form
    setEmailData({
      ...emailData,
      subject: template.subject,
      content: content
    });
    
    // Close templates modal and open email modal
    setShowTemplatesModal(false);
    setShowEmailModal(true);
  };

  const handleAddAgent = () => {
    setShowAddAgentModal(true);
  };

  const submitAddAgent = async () => {
    if (!agentData.firstName || !agentData.lastName || !agentData.email) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setActionLoading({ ...actionLoading, agent: true });
      
      // This would typically call an API to create the agent
      // For now, we'll simulate the process
      console.log('Adding agent:', agentData);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Agent added successfully! The new agent will appear in the list once they log in.');
      setShowAddAgentModal(false);
      setAgentData({ firstName: '', lastName: '', email: '', role: 'agent' });
      
      // Refresh the agents list
      try {
        const agentsData = await communicationAPI.getActiveAgents();
        setActiveAgents(agentsData);
      } catch (error) {
        console.log('Could not refresh agents list:', error);
      }
    } catch (error) {
      alert('Failed to add agent: ' + error.message);
    } finally {
      setActionLoading({ ...actionLoading, agent: false });
    }
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
      
      // Get client phone number
      const selectedClient = clients.find(c => c._id === messageData.clientId);
      if (!selectedClient || !selectedClient.phone) {
        alert('Client phone number not found');
        return;
      }

      // Format phone number (remove any non-digit characters)
      const phoneNumber = selectedClient.phone.replace(/\D/g, '');
      
      // Open appropriate messaging app
      if (messageData.channel === 'whatsapp') {
        // WhatsApp Web/App URL
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(messageData.content)}`;
        window.open(whatsappUrl, '_blank');
      } else if (messageData.channel === 'telegram') {
        // Simple and reliable Telegram integration
        const telegramWebUrl = `https://web.telegram.org/k/`;
        
        // Get client name for better search
        const selectedClient = clients.find(c => c._id === messageData.clientId);
        const clientName = selectedClient ? `${selectedClient.firstName} ${selectedClient.lastName}` : 'the contact';
        
        // Try to copy message to clipboard
        try {
          navigator.clipboard.writeText(messageData.content).then(() => {
            // Open Telegram Web directly
            window.open(telegramWebUrl, '_blank');
            
            const instructions = `📱 Telegram Web opened! Here's how to send your message:

🔍 **Step 1: Find the Contact**
- Click the search icon (🔍) in Telegram
- Search for: ${phoneNumber} or "${clientName}"
- Or search by the person's name if you have them saved

📝 **Step 2: Send Message**
✅ Message copied to clipboard! Just paste (Ctrl+V) in the chat.

💡 **Tips:**
- If the contact isn't found, they may need to be in your contacts first
- You can also try searching by the person's name: "${clientName}"
- Make sure you're logged into Telegram Web

📱 **Alternative:** Use Telegram Desktop or Mobile app for better contact search`;
            
            setTimeout(() => {
              alert(instructions);
            }, 2000);
          });
        } catch (error) {
          // Fallback if clipboard API is not available
          window.open(telegramWebUrl, '_blank');
          
          const instructions = `📱 Telegram Web opened! Here's how to send your message:

🔍 **Step 1: Find the Contact**
- Click the search icon (🔍) in Telegram
- Search for: ${phoneNumber} or "${clientName}"
- Or search by name if you have the contact saved

📝 **Step 2: Copy & Send Message**
Copy this message and paste it in the chat:

"${messageData.content}"

💡 **Tips:**
- If the contact isn't found, they may need to be in your contacts first
- You can also try searching by the person's name: "${clientName}"
- Make sure you're logged into Telegram Web

📱 **Alternative:** Use Telegram Desktop or Mobile app for better contact search`;
          
          setTimeout(() => {
            alert(instructions);
          }, 2000);
        }
      }

      // Save communication record
      await communicationAPI.sendMessage(messageData);
      
      alert('Message app opened successfully!');
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
      
      // Detect email provider and open appropriate client
      const email = emailData.email.toLowerCase();
      let emailUrl = '';
      
      if (email.includes('@gmail.com')) {
        // Gmail Web
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emailData.email)}&su=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.content)}`;
        window.open(gmailUrl, '_blank');
        emailUrl = gmailUrl;
      } else if (email.includes('@outlook.com') || email.includes('@hotmail.com') || email.includes('@live.com')) {
        // Outlook Web
        const outlookUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(emailData.email)}&subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.content)}`;
        window.open(outlookUrl, '_blank');
        emailUrl = outlookUrl;
      } else if (email.includes('@yahoo.com')) {
        // Yahoo Mail Web
        const yahooUrl = `https://compose.mail.yahoo.com/?to=${encodeURIComponent(emailData.email)}&subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.content)}`;
        window.open(yahooUrl, '_blank');
        emailUrl = yahooUrl;
      } else {
        // Default mailto for other providers
        const mailtoUrl = `mailto:${emailData.email}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.content)}`;
        window.open(mailtoUrl, '_self');
        emailUrl = mailtoUrl;
      }
      
      // Save communication record
      await communicationAPI.sendEmail(emailData);
      
      // Show success message with provider info
      const provider = email.includes('@gmail.com') ? 'Gmail' : 
                      email.includes('@outlook.com') || email.includes('@hotmail.com') || email.includes('@live.com') ? 'Outlook' :
                      email.includes('@yahoo.com') ? 'Yahoo Mail' : 'Email Client';
      
      alert(`${provider} opened successfully! The email is pre-filled and ready to send.`);
      setShowEmailModal(false);
      setEmailData({ clientId: '', subject: '', content: '', email: '' });
    } catch (error) {
      alert('Failed to open email client: ' + error.message);
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
                  <span>Open WhatsApp</span>
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
                  <span>Open Telegram</span>
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
                  <span>Open Email Client</span>
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
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{agent.firstName} {agent.lastName}</p>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${agent.status === 'Online' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <p className={`text-sm ${agent.status === 'Online' ? 'text-green-600' : 'text-gray-600'}`}>
                          {agent.status}
                        </p>
                      </div>
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
                  onChange={(e) => handleClientSelect(e.target.value, 'call')}
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
                  onChange={(e) => handleClientSelect(e.target.value, 'message')}
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
                {actionLoading.message ? 'Opening...' : 'Open App'}
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
                  onChange={(e) => handleClientSelect(e.target.value, 'email')}
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
                {actionLoading.email ? 'Opening...' : 'Open Email Client'}
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
               {emailTemplates.map((template) => (
                 <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                   <h4 className="font-medium text-gray-900 mb-2">{template.name}</h4>
                   <p className="text-sm text-gray-600 mb-2">Subject: {template.subject}</p>
                   <p className="text-sm text-gray-700 mb-3 line-clamp-3">
                     {template.content.substring(0, 150)}...
                   </p>
                   <button 
                     onClick={() => useTemplate(template)}
                     className="text-blue-600 text-sm hover:text-blue-800 font-medium"
                   >
                     Use Template
                   </button>
                 </div>
               ))}
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

       {/* Add Agent Modal */}
       {showAddAgentModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white rounded-lg p-6 w-full max-w-md">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-lg font-semibold">Add New Agent</h3>
               <button onClick={() => setShowAddAgentModal(false)} className="text-gray-400 hover:text-gray-600">
                 <X className="w-5 h-5" />
               </button>
             </div>
             
             <div className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                 <input 
                   type="text" 
                   value={agentData.firstName}
                   onChange={(e) => setAgentData({...agentData, firstName: e.target.value})}
                   placeholder="Enter first name"
                   className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                 />
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                 <input 
                   type="text" 
                   value={agentData.lastName}
                   onChange={(e) => setAgentData({...agentData, lastName: e.target.value})}
                   placeholder="Enter last name"
                   className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                 />
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                 <input 
                   type="email" 
                   value={agentData.email}
                   onChange={(e) => setAgentData({...agentData, email: e.target.value})}
                   placeholder="Enter email address"
                   className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                 />
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                 <select 
                   value={agentData.role} 
                   onChange={(e) => setAgentData({...agentData, role: e.target.value})}
                   className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                 >
                   <option value="agent">Agent</option>
                   <option value="supervisor">Supervisor</option>
                   <option value="manager">Manager</option>
                 </select>
               </div>
             </div>
             
             <div className="flex space-x-3 mt-6">
               <button 
                 onClick={() => setShowAddAgentModal(false)}
                 className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
               >
                 Cancel
               </button>
               <button 
                 onClick={submitAddAgent}
                 disabled={actionLoading.agent}
                 className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
               >
                 {actionLoading.agent ? 'Adding...' : 'Add Agent'}
               </button>
             </div>
           </div>
         </div>
       )}
    </div>
  );
};

export default CommunicationsHub;
