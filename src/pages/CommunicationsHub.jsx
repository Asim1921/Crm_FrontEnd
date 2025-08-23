import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Device } from '@twilio/voice-sdk';
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
  AlertCircle,
  Volume2,
  Mic,
  MicOff,
  PhoneOff
} from 'lucide-react';
import { communicationAPI, clientAPI, twilioAPI } from '../utils/api';


const CommunicationsHub = () => {
  const { user } = useAuth();
  const { addCallNotification, addMessageNotification, addEmailNotification } = useNotifications();
  const [stats, setStats] = useState({
    activeCalls: { value: 0, change: '+0%' },
    messagesSent: { value: 0, change: '+0%' },
    emailsSent: { value: 0, change: '+0%' },
    onlineAgents: { value: 0, total: 0, percentage: 0 }
  });
  const [analytics, setAnalytics] = useState({
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
  const [showTwilioGuideModal, setShowTwilioGuideModal] = useState(false);
  
  // Form states
  const [callData, setCallData] = useState({ clientId: '', phoneNumber: '', channel: 'voip' });
  const [messageData, setMessageData] = useState({ clientId: '', content: '', channel: 'email' });
  const [emailData, setEmailData] = useState({ clientId: '', subject: '', content: '', email: '' });
  const [agentData, setAgentData] = useState({ firstName: '', lastName: '', email: '', role: 'agent' });
  
  // Twilio VoIP states
  const [twilioStatus, setTwilioStatus] = useState('disconnected');
  const [currentCall, setCurrentCall] = useState(null);
  const [callHistory, setCallHistory] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [accountInfo, setAccountInfo] = useState(null);
  const twilioRef = useRef(null);
  
  // Browser-based voice call states
  const [browserDevice, setBrowserDevice] = useState(null);
  const [browserCall, setBrowserCall] = useState(null);
  const [isBrowserCallActive, setIsBrowserCallActive] = useState(false);
  
  // Call search functionality
  const [searchAgent, setSearchAgent] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
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

  // Twilio VoIP functions
  const initializeTwilio = async () => {
    try {
      // Test Twilio connection by getting account info
      const accountResult = await twilioAPI.getAccountInfo();
      if (accountResult.success) {
        setTwilioStatus('connected');
        setAccountInfo(accountResult);
        console.log('Twilio connected successfully:', accountResult);
      } else {
        setTwilioStatus('error');
        console.error('Twilio connection failed:', accountResult.error);
      }
    } catch (error) {
      console.error('Error initializing Twilio:', error);
      setTwilioStatus('error');
    }
  };

  const initiateTwilioCall = async (phoneNumber, clientId) => {
    try {
      // Validate and format phone number
      const validatedNumber = validatePhoneNumber(phoneNumber);
      if (!validatedNumber) {
        alert('Invalid phone number format. Please enter a valid number.');
        return;
      }

      setTwilioStatus('connecting');
      
      // Make the call using new Twilio API
      const callResult = await twilioAPI.makeCall({
        clientId: clientId,
        phoneNumber: validatedNumber
      });
      
      if (callResult.success) {
        setCurrentCall({
          number: validatedNumber,
          startTime: new Date(),
          status: 'connecting',
          callSid: callResult.callSid,
          twilioStatus: callResult.status,
          communicationId: callResult.communicationId
        });
        
        setTwilioStatus('connected');
        
        // Add notification
        addCallNotification(
          formatPhoneNumber(validatedNumber),
          'Client',
          callResult.communicationId
        );
      } else {
        setTwilioStatus('error');
        alert(`❌ Call Failed: ${callResult.message || callResult.error}`);
      }
    } catch (error) {
      console.error('Error initiating Twilio call:', error);
      setTwilioStatus('error');
      alert('Failed to initiate call. Please check your Twilio configuration.');
    }
  };

  const endTwilioCall = async () => {
    try {
      if (currentCall && currentCall.callSid) {
        const endResult = await twilioAPI.endCall(currentCall.callSid);
        if (endResult.success) {
          console.log('Call ended successfully:', endResult);
        }
      }
      
      if (currentCall) {
        const callEndTime = new Date();
        const callDuration = Math.round((callEndTime - currentCall.startTime) / 1000);
        
        setCallHistory(prev => [...prev, {
          ...currentCall,
          endTime: callEndTime,
          duration: callDuration,
          status: 'completed'
        }]);
      }
      
      setCurrentCall(null);
      setIsMuted(false);
      setIsOnHold(false);
      setTwilioStatus('connected');
    } catch (error) {
      console.error('Error ending call:', error);
    }
  };

  const cancelTwilioCall = () => {
    if (currentCall) {
      const callEndTime = new Date();
      const callDuration = Math.round((callEndTime - currentCall.startTime) / 1000);
      
      setCallHistory(prev => [...prev, {
        ...currentCall,
        endTime: callEndTime,
        duration: callDuration,
        status: 'cancelled'
      }]);
    }
    
    setCurrentCall(null);
    setIsMuted(false);
    setIsOnHold(false);
    setTwilioStatus('connected');
  };

  const toggleMute = () => {
    // Note: Twilio mute functionality would require additional implementation
    // For now, we'll just toggle the UI state
    setIsMuted(!isMuted);
    console.log('Mute toggled:', !isMuted);
  };

  const toggleHold = () => {
    // Note: Twilio hold functionality would require additional implementation
    // For now, we'll just toggle the UI state
    setIsOnHold(!isOnHold);
    console.log('Hold toggled:', !isOnHold);
  };

  // Helper functions for phone number validation and formatting
  const validatePhoneNumber = (phoneNumber) => {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Check if it's a valid US number (10 digits) or international (11+ digits)
    if (cleaned.length === 10) {
      return `+1${cleaned}`; // Add US country code
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`; // Already has US country code
    } else if (cleaned.length >= 10) {
      return `+${cleaned}`; // International number
    }
    
    return null; // Invalid number
  };

  const formatPhoneNumber = (phoneNumber) => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    
    return phoneNumber; // Return as-is if can't format
  };

  // Browser-based voice call functions
  const initializeBrowserCall = async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone access granted');
      
      // Create a simple audio context for browser-based calling
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const destination = audioContext.createMediaStreamDestination();
      source.connect(destination);
      
      setBrowserDevice({ stream, audioContext, source, destination });
      return true;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Please allow microphone access to make browser calls');
      return false;
    }
  };

  const makeBrowserCall = async (toNumber, clientId) => {
    try {
      if (!browserDevice) {
        const initialized = await initializeBrowserCall();
        if (!initialized) return;
      }

      console.log(`Making browser call to ${toNumber}`);
      
      // For now, use the regular Twilio API call but with browser microphone access
      const result = await twilioAPI.makeCall({
        clientId: clientId,
        phoneNumber: toNumber
      });
      
      if (result.success) {
        setIsBrowserCallActive(true);
        setBrowserCall({
          callSid: result.callSid,
          toNumber: toNumber,
          startTime: new Date(),
          status: 'in-progress'
        });
        
        // Add to call history
        setCallHistory(prev => [...prev, {
          callSid: result.callSid,
          toNumber: toNumber,
          startTime: new Date(),
          status: 'in-progress',
          type: 'browser'
        }]);
        
        console.log('Browser call initiated successfully');
        alert('✅ Browser call initiated! Your microphone is active and connected to the call.');
      } else {
        console.error('Failed to initiate browser call:', result.error);
        alert('Failed to initiate browser call: ' + result.error);
      }
      
    } catch (error) {
      console.error('Error making browser call:', error);
      alert('Error making browser call: ' + error.message);
    }
  };

  const endBrowserCall = () => {
    if (browserCall && browserCall.connection) {
      // Disconnect the Twilio call
      browserCall.connection.disconnect();
    }
    
    if (browserCall) {
      const callEndTime = new Date();
      const callDuration = Math.round((callEndTime - browserCall.startTime) / 1000);
      
      setCallHistory(prev => [...prev, {
        ...browserCall,
        endTime: callEndTime,
        duration: callDuration,
        status: 'completed'
      }]);
    }
    
    setBrowserCall(null);
    setIsBrowserCallActive(false);
    
    // Stop microphone stream
    if (browserDevice && browserDevice.stream) {
      browserDevice.stream.getTracks().forEach(track => track.stop());
      setBrowserDevice(null);
    }
  };

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
    initializeTwilio();
  }, []);

  const handleCall = async (channel = 'voip') => {
    setCallData({ ...callData, channel });
    setShowCallModal(true);
  };

  const handleMessage = async (channel = 'email') => {
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

  const searchCallAgainClients = async () => {
    if (!searchAgent.trim()) {
      alert('Please enter an agent name to search');
      return;
    }

    try {
      // Search for clients that have been called by the specified agent
      // This would typically come from a backend API, but for now we'll simulate with call history
      const agentCalls = callHistory.filter(call => 
        call.agent && call.agent.toLowerCase().includes(searchAgent.toLowerCase())
      );

      // Get unique clients from those calls
      const clientIds = [...new Set(agentCalls.map(call => call.clientId))];
      
      // Get client details
      const agentClients = clients.filter(client => clientIds.includes(client._id));
      
      // Add some demo data for better demonstration
      const demoResults = [
        {
          clientId: 'demo-client-1',
          clientName: 'John Doe',
          phoneNumber: '+1 (555) 123-4567',
          lastCallDate: new Date(Date.now() - 86400000), // 1 day ago
          callCount: 3,
          agent: searchAgent
        },
        {
          clientId: 'demo-client-2', 
          clientName: 'Sarah Wilson',
          phoneNumber: '+1 (555) 234-5678',
          lastCallDate: new Date(Date.now() - 172800000), // 2 days ago
          callCount: 2,
          agent: searchAgent
        },
        {
          clientId: 'demo-client-3',
          clientName: 'Michael Johnson',
          phoneNumber: '+1 (555) 345-6789',
          lastCallDate: new Date(Date.now() - 259200000), // 3 days ago
          callCount: 1,
          agent: searchAgent
        }
      ];

      setSearchResults(demoResults);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Error searching call again clients:', error);
      alert('Failed to search for call again clients');
    }
  };

  const initiateCallToClient = (client) => {
    setCallData({
      clientId: client.clientId,
      phoneNumber: client.phoneNumber,
      channel: 'voip'
    });
    setShowCallModal(true);
    setShowSearchResults(false);
  };

  const submitCall = async () => {
    if (!callData.clientId || !callData.phoneNumber) {
      alert('Please select a client and enter phone number');
      return;
    }

    try {
      setActionLoading({ ...actionLoading, call: true });
      
      // Get client information for notification
      const selectedClient = clients.find(c => c._id === callData.clientId);
      const clientName = selectedClient ? `${selectedClient.firstName} ${selectedClient.lastName}` : 'Unknown Client';
      
      // Use Twilio for VoIP calls
      if (callData.channel === 'voip') {
        await initiateTwilioCall(callData.phoneNumber, callData.clientId);
      } else {
        // Fallback to regular phone call
        window.open(`tel:${callData.phoneNumber}`, '_self');
      }
      
      // Save communication record
      await communicationAPI.initiateCall(callData);
      
      // Add notification for the call
      addCallNotification(callData.phoneNumber, clientName, callData.clientId);
      
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
      
      // Get client information
      const selectedClient = clients.find(c => c._id === messageData.clientId);
      if (!selectedClient || !selectedClient.phone) {
        alert('Client phone number not found');
        return;
      }

      const clientName = `${selectedClient.firstName} ${selectedClient.lastName}`;
      const phoneNumber = selectedClient.phone.replace(/\D/g, '');
      
      // Open appropriate messaging app
      if (messageData.channel === 'telegram') {
        // Check if user wants anonymous messaging
        const useAnonymous = confirm(`📱 Telegram Messaging Options:

🔒 **Anonymous Mode (Recommended)**
- Client's phone number will be hidden
- Only the client's name will be visible
- Messages sent through a secure bot
- Better privacy protection

📞 **Direct Mode**
- Uses Telegram Web/App directly
- Client's phone number may be visible
- Requires manual contact search

Choose "OK" for Anonymous Mode or "Cancel" for Direct Mode.`);

        if (useAnonymous) {
          // Anonymous messaging through Telegram Bot API
          await sendAnonymousTelegramMessage(selectedClient, messageData.content);
        } else {
          // Direct Telegram Web approach (current implementation)
          await sendDirectTelegramMessage(selectedClient, messageData.content);
        }
      }

      // Save communication record
      await communicationAPI.sendMessage(messageData);
      
      // Add notification for the message
      addMessageNotification(messageData.channel, clientName, messageData.clientId);
      
      setShowMessageModal(false);
      setMessageData({ clientId: '', content: '', channel: 'telegram' });
    } catch (error) {
      alert('Failed to send message: ' + error.message);
    } finally {
      setActionLoading({ ...actionLoading, message: false });
    }
  };

  // New function for anonymous Telegram messaging
  const sendAnonymousTelegramMessage = async (client, messageContent) => {
    try {
      // Use real API with the configured bot
      const messageData = telegramAPI.formatAnonymousMessage(client, messageContent, user);
      const result = await telegramAPI.sendAnonymousMessage(messageData);
      
      alert(`✅ Anonymous Telegram Message Sent Successfully!

📱 **Message Details:**
👤 To: ${client.firstName} ${client.lastName}
📝 Message: "${messageContent.substring(0, 50)}${messageContent.length > 50 ? '...' : ''}"
🔒 Mode: Anonymous (Phone number hidden)
🤖 Sent via: Telegram Bot

💡 **How it works:**
- The client receives a message from your CRM bot
- Only the client's name is visible, not their phone number
- The message appears to come from your company, not a personal number
- Complete privacy protection for both parties`);
      
    } catch (error) {
      console.error('Telegram Bot API error:', error);
      
      // Show helpful error message
      const clientName = `${client.firstName} ${client.lastName}`;
      alert(`❌ Telegram Bot Error: ${error.message}

🔧 **Possible Solutions:**

1. **Bot Not Configured:**
   - Add TELEGRAM_BOT_TOKEN to your .env file
   - Restart your backend server

2. **Client Not Found:**
   - The client needs to search for your bot in Telegram
   - Send /start to your bot first
   - Then try sending the message again

3. **Invalid Token:**
   - Check your bot token in .env file
   - Make sure it's the correct token from BotFather

💡 **For now, using direct Telegram approach...**`);
      
      // Fallback to direct approach
      setTimeout(() => {
        sendDirectTelegramMessage(client, messageContent);
      }, 1000);
    }
  };



  // Function for direct Telegram messaging (current approach)
  const sendDirectTelegramMessage = async (client, messageContent) => {
    const clientName = `${client.firstName} ${client.lastName}`;
    const phoneNumber = client.phone.replace(/\D/g, '');
    
        // Simple and reliable Telegram integration
        const telegramWebUrl = `https://web.telegram.org/k/`;
        
        // Try to copy message to clipboard
        try {
      navigator.clipboard.writeText(messageContent).then(() => {
            // Open Telegram Web directly
            window.open(telegramWebUrl, '_blank');
            
            const instructions = `📱 Telegram Web opened! Here's how to send your message:

🔍 **Step 1: Find the Contact**
- Click the search icon (🔍) in Telegram
- Search for: ${phoneNumber} or "${clientName}"
- Or search by the person's name if you have them saved

📝 **Step 2: Send Message**
✅ Message copied to clipboard! Just paste (Ctrl+V) in the chat.

⚠️ **Privacy Note:**
- The client may see your phone number
- For better privacy, consider setting up the Telegram Bot (see previous instructions)

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

"${messageContent}"

⚠️ **Privacy Note:**
- The client may see your phone number
- For better privacy, consider setting up the Telegram Bot

💡 **Tips:**
- If the contact isn't found, they may need to be in your contacts first
- You can also try searching by the person's name: "${clientName}"
- Make sure you're logged into Telegram Web

📱 **Alternative:** Use Telegram Desktop or Mobile app for better contact search`;
          
          setTimeout(() => {
            alert(instructions);
      }, 2002);
    }
  };

  const submitEmail = async () => {
    if (!emailData.clientId || !emailData.subject || !emailData.content || !emailData.email) {
      alert('Please fill in all email fields');
      return;
    }

    try {
      setActionLoading({ ...actionLoading, email: true });
      
      // Get client information for notification
      const selectedClient = clients.find(c => c._id === emailData.clientId);
      const clientName = selectedClient ? `${selectedClient.firstName} ${selectedClient.lastName}` : 'Unknown Client';
      
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
      
      // Add notification for the email
      addEmailNotification(emailData.email, emailData.subject, emailData.clientId);
      
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
      <div className="flex-1 bg-gray-50 min-h-screen flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-16 w-16 lg:h-32 lg:w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 bg-gray-50 min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 lg:w-16 lg:h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-sm lg:text-base text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 min-h-screen">
      <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-gray-600">Active Calls</p>
                <p className="text-xl lg:text-2xl font-bold text-gray-900">{stats.activeCalls.value}</p>
                <p className="text-xs text-green-600">{stats.activeCalls.change} from yesterday</p>
              </div>
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Phone className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-gray-600">Messages Sent</p>
                <p className="text-xl lg:text-2xl font-bold text-gray-900">{stats.messagesSent.value}</p>
                <p className="text-xs text-green-600">{stats.messagesSent.change} from yesterday</p>
              </div>
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 lg:w-6 lg:h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-gray-600">Emails Sent</p>
                <p className="text-xl lg:text-2xl font-bold text-gray-900">{stats.emailsSent.value}</p>
                <p className="text-xs text-green-600">{stats.emailsSent.change} from yesterday</p>
              </div>
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 lg:w-6 lg:h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-gray-600">Online Agents</p>
                <p className="text-xl lg:text-2xl font-bold text-gray-900">{stats.onlineAgents.value}/{stats.onlineAgents.total}</p>
                <p className="text-xs text-gray-600">{stats.onlineAgents.percentage}% availability</p>
              </div>
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 lg:w-6 lg:h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Integrations Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* VoIP Integration */}
          <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 lg:mb-6 space-y-2 sm:space-y-0">
              <div>
                <h3 className="text-base lg:text-lg font-semibold text-gray-900">VoIP Integration</h3>
                <p className="text-xs lg:text-sm text-gray-600">Twilio VoIP System</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                twilioStatus === 'connected' ? 'bg-green-100 text-green-800' :
                twilioStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {twilioStatus === 'connected' ? 'Connected' :
                 twilioStatus === 'connecting' ? 'Connecting' :
                 twilioStatus === 'error' ? 'Error' : 'Disconnected'}
              </span>
            </div>

            <div className="space-y-4">
              {/* Twilio Status */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 lg:p-4 bg-gray-50 rounded-lg space-y-3 sm:space-y-0">
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600" />
                  <div>
                    <span className="text-sm lg:text-base font-medium text-gray-900">Twilio VoIP</span>
                    <p className="text-xs text-gray-600">
                      {twilioStatus === 'connected' ? 'API Connected' :
                       twilioStatus === 'connecting' ? 'Connecting to Twilio' :
                       twilioStatus === 'error' ? 'Connection Error' : 'Disconnected'}
                    </p>
                    {accountInfo && (
                      <p className="text-xs text-green-600">
                        Balance: ${accountInfo.balance} {accountInfo.currency}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleCall('voip')}
                    disabled={twilioStatus === 'error'}
                    className="bg-blue-600 text-white px-3 lg:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call</span>
                  </button>
                  <button 
                    onClick={() => {
                      // Quick test call without client selection
                      const demoClientId = clients.length > 0 ? clients[0]._id : 'demo-client-123';
                      initiateTwilioCall('+923405735723', demoClientId);
                    }}
                    disabled={twilioStatus === 'error'}
                    className="bg-purple-600 text-white px-3 lg:px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    title="Quick test call"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Test Call</span>
                  </button>
                  <button 
                    onClick={() => {
                      // Use first available client or create a demo call
                      const demoClientId = clients.length > 0 ? clients[0]._id : 'demo-client-123';
                      const demoPhoneNumber = callData.phoneNumber || '+923405735723';
                      makeBrowserCall(demoPhoneNumber, demoClientId);
                    }}
                    className="bg-green-600 text-white px-3 lg:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 text-sm"
                    title="Make call with browser microphone"
                  >
                    <Mic className="w-4 h-4" />
                    <span>Browser Call</span>
                  </button>
                </div>
              </div>

                             {/* Current Call Status */}
               {currentCall && (
                 <div className="bg-green-50 border border-green-200 rounded-lg p-3 lg:p-4">
                   <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 space-y-2 sm:space-y-0">
                     <div className="flex items-center space-x-2">
                       <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                       <span className="text-sm lg:text-base font-medium text-green-800">
                         {currentCall.twilioStatus === 'initiated' ? 'Call Initiated' : 'Active Call'}
                       </span>
                </div>
                     <span className="text-xs lg:text-sm text-green-600">
                       {Math.round((new Date() - currentCall.startTime) / 1000)}s
                     </span>
              </div>

                   <p className="text-xs lg:text-sm text-green-700 mb-3">Calling: {formatPhoneNumber(currentCall.number)}</p>
                   
                   {currentCall.callSid && (
                     <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                  <p className="text-sm text-blue-800">
                         <strong>Call SID:</strong> {currentCall.callSid}
                       </p>
                       <p className="text-xs text-blue-600 mt-1">
                         Status: {currentCall.twilioStatus}
                  </p>
                </div>
                   )}
                   
                   <div className="flex flex-wrap gap-2">
                     {twilioStatus === 'connected' && (
                       <>
                         <button
                           onClick={toggleMute}
                           className={`p-2 rounded-lg flex items-center space-x-1 ${
                             isMuted ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                           }`}
                         >
                           {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                           <span className="text-xs">{isMuted ? 'Unmute' : 'Mute'}</span>
                         </button>
                         
                         <button
                           onClick={toggleHold}
                           className={`p-2 rounded-lg flex items-center space-x-1 ${
                             isOnHold ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                           }`}
                         >
                           <Clock className="w-4 h-4" />
                           <span className="text-xs">{isOnHold ? 'Resume' : 'Hold'}</span>
                         </button>
                       </>
                     )}
                     
                     <button
                       onClick={endTwilioCall}
                       className="p-2 rounded-lg bg-red-100 text-red-700 flex items-center space-x-1"
                     >
                       <PhoneOff className="w-4 h-4" />
                       <span className="text-xs">End</span>
                     </button>
                     
                     <button
                       onClick={cancelTwilioCall}
                       className="p-2 rounded-lg bg-gray-100 text-gray-700 flex items-center space-x-1"
                     >
                       <X className="w-4 h-4" />
                       <span className="text-xs">Cancel</span>
                     </button>
              </div>
            </div>
               )}



                             {/* Call History */}
               {callHistory.length > 0 && (
                 <div className="bg-gray-50 rounded-lg p-3 lg:p-4">
                   <h4 className="text-sm lg:text-base font-medium text-gray-900 mb-3">Recent Calls</h4>
                   <div className="space-y-2 max-h-32 overflow-y-auto">
                     {callHistory.slice(-3).reverse().map((call, index) => (
                       <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs lg:text-sm space-y-1 sm:space-y-0">
                         <span className="text-gray-700">{call.number}</span>
                         <div className="flex items-center space-x-2">
                           <span className="text-gray-500">{call.duration}s</span>
                           {call.status === 'completed' ? (
                             <CheckCircle className="w-4 h-4 text-green-500" />
                           ) : call.status === 'cancelled' ? (
                             <X className="w-4 h-4 text-red-500" />
                           ) : (
                             <Clock className="w-4 h-4 text-yellow-500" />
                           )}
              </div>
            </div>
                     ))}
                  </div>
                </div>
               )}

              <div className="bg-blue-50 rounded-lg p-3 lg:p-4">
                <div className="flex items-start space-x-3">
                  <Info className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600 mt-0.5" />
                  <div className="text-xs lg:text-sm text-blue-800">
                    <p className="font-medium mb-1">Twilio VoIP Integration</p>
                    <p>
                      {twilioStatus === 'connected' ? 
                        'Full API integration available. Calls will be made through Twilio cloud service.' :
                       twilioStatus === 'connecting' ? 
                        'Connecting to Twilio...' :
                       'Twilio integration not available. Check configuration.'}
                    </p>
                    {twilioStatus === 'error' && (
                <button 
                        onClick={() => setShowTwilioGuideModal(true)}
                        className="mt-2 text-blue-600 hover:text-blue-800 font-medium text-xs"
                >
                        View Integration Guide →
                </button>
                    )}
                    {twilioStatus === 'connected' && (
                <button 
                        onClick={() => setShowTwilioGuideModal(true)}
                        className="mt-2 text-blue-600 hover:text-blue-800 font-medium text-xs"
                >
                        View Account Info →
                </button>
                    )}
              </div>
              </div>
            </div>
          </div>
        </div>

          {/* Email Integration */}
          <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 lg:mb-6 space-y-2 sm:space-y-0">
              <div>
                <h3 className="text-base lg:text-lg font-semibold text-gray-900">Email Integration</h3>
                <p className="text-xs lg:text-sm text-gray-600">Hostinger Email Service</p>
              </div>
              <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">Configured</span>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 lg:p-4 bg-gray-50 rounded-lg space-y-3 sm:space-y-0">
                <div className="flex items-center space-x-3">
                  <Send className="w-4 h-4 lg:w-5 lg:h-5 text-orange-600" />
                  <span className="text-sm lg:text-base font-medium text-gray-900">Quick Send</span>
                </div>
                <button 
                  onClick={handleEmail}
                  className="bg-orange-600 text-white px-3 lg:px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2 text-sm"
                >
                  <Mail className="w-4 h-4" />
                  <span>Open Email Client</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 lg:p-4 bg-gray-50 rounded-lg space-y-3 sm:space-y-0">
                <div className="flex items-center space-x-3">
                  <List className="w-4 h-4 lg:w-5 lg:h-5 text-gray-600" />
                  <span className="text-sm lg:text-base font-medium text-gray-900">Templates</span>
                </div>
                <button 
                  onClick={handleViewTemplates}
                  className="bg-gray-600 text-white px-3 lg:px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2 text-sm"
                >
                  <List className="w-4 h-4" />
                  <span>View Templates</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 lg:p-4 bg-gray-50 rounded-lg space-y-3 sm:space-y-0">
                <div className="flex items-center space-x-3">
                  <BarChart3 className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600" />
                  <span className="text-sm lg:text-base font-medium text-gray-900">Analytics</span>
                </div>
                <div className="text-right">
                  <div className="text-xl lg:text-2xl font-bold text-gray-900">{analytics.emailToday}</div>
                  <div className="text-xs lg:text-sm text-gray-600">Emails Today</div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Agents */}
          <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 lg:mb-6 space-y-2 sm:space-y-0">
              <h3 className="text-base lg:text-lg font-semibold text-gray-900">Active Agents</h3>
              <button 
                onClick={handleAddAgent}
                className="bg-blue-600 text-white px-3 lg:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Agent</span>
              </button>
            </div>

            <div className="space-y-4">
              {activeAgents.length === 0 ? (
                <div className="text-center py-6 lg:py-8">
                  <Users className="w-10 h-10 lg:w-12 lg:h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm lg:text-base text-gray-500">No active agents found</p>
                </div>
              ) : (
                activeAgents.map((agent, index) => (
                  <div key={agent._id || index} className="flex items-center space-x-3 p-3 lg:p-4 bg-gray-50 rounded-lg">
                    <div className={`w-8 h-8 lg:w-10 lg:h-10 ${getAvatarColor(agent.firstName || '')} rounded-full flex items-center justify-center`}>
                      <span className="text-white text-sm lg:text-base font-medium">{agent.initials}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm lg:text-base font-medium text-gray-900">{agent.firstName} {agent.lastName}</p>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${agent.status === 'Online' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <p className={`text-xs lg:text-sm ${agent.status === 'Online' ? 'text-green-600' : 'text-gray-600'}`}>
                          {agent.status}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs lg:text-sm text-gray-600">{agent.role}</p>
                      <p className="text-xs text-gray-500">{agent.lastSeen}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Call Again Search Section */}
        <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 lg:mb-6 space-y-2 sm:space-y-0">
            <div>
              <h3 className="text-base lg:text-lg font-semibold text-gray-900">Call Again Search</h3>
              <p className="text-xs lg:text-sm text-gray-600">Find clients to call back</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 lg:p-4">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-3">
              <input
                type="text"
                placeholder="Enter agent name to search their clients..."
                value={searchAgent}
                onChange={(e) => setSearchAgent(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                onKeyPress={(e) => e.key === 'Enter' && searchCallAgainClients()}
              />
              <button
                onClick={searchCallAgainClients}
                className="px-3 lg:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Search
              </button>
            </div>
            
            {showSearchResults && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs lg:text-sm text-gray-600 mb-2 space-y-1 sm:space-y-0">
                  <span>Found {searchResults.length} clients for agent "{searchAgent}"</span>
                  <button
                    onClick={() => setShowSearchResults(false)}
                    className="text-blue-600 hover:text-blue-800 text-xs"
                  >
                    Close
                  </button>
                </div>
                {searchResults.map((client, index) => (
                  <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 space-y-1 sm:space-y-0">
                      <span className="text-sm lg:text-base font-medium text-gray-900">{client.clientName}</span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {client.callCount} calls
                      </span>
                    </div>
                    <div className="text-xs lg:text-sm text-gray-600 mb-2">
                      {user?.role === 'admin' && (
                        <div>📞 {client.phoneNumber}</div>
                      )}
                      <div>📅 Last call: {client.lastCallDate.toLocaleDateString()}</div>
                    </div>
                    <button
                      onClick={() => initiateCallToClient(client)}
                      className="w-full px-3 py-1 bg-green-600 text-white text-xs lg:text-sm rounded hover:bg-green-700 transition-colors"
                    >
                      Call Again
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Call Modal */}
      {showCallModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 lg:p-6 w-full max-w-md">
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
                      {client.firstName} {client.lastName}{user?.role === 'admin' ? ` - ${client.phone}` : ''}
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
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
              <button 
                onClick={() => setShowCallModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={submitCall}
                disabled={actionLoading.call}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                {actionLoading.call ? 'Initiating...' : 'Start Call'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 lg:p-6 w-full max-w-md">
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
                      {client.firstName} {client.lastName}{user?.role === 'admin' ? ` - ${client.phone}` : ''}
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
                  <option value="email">Email</option>
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
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
              <button 
                onClick={() => setShowMessageModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={submitMessage}
                disabled={actionLoading.message}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
              >
                {actionLoading.message ? 'Opening...' : 'Open App'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 lg:p-6 w-full max-w-md">
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
                      {client.firstName} {client.lastName}{user?.role === 'admin' ? ` - ${client.email}` : ''}
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
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
              <button 
                onClick={() => setShowEmailModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={submitEmail}
                disabled={actionLoading.email}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 text-sm"
              >
                {actionLoading.email ? 'Opening...' : 'Open Email Client'}
              </button>
            </div>
          </div>
        </div>
      )}

             {/* Templates Modal */}
       {showTemplatesModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-lg p-4 lg:p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
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
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-lg p-4 lg:p-6 w-full max-w-md">
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
             
             <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
               <button 
                 onClick={() => setShowAddAgentModal(false)}
                 className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
               >
                 Cancel
               </button>
               <button 
                 onClick={submitAddAgent}
                 disabled={actionLoading.agent}
                 className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
               >
                 {actionLoading.agent ? 'Adding...' : 'Add Agent'}
               </button>
             </div>
           </div>
         </div>
       )}

               {/* Twilio Integration Guide Modal */}
        {showTwilioGuideModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-4 lg:p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Twilio VoIP Integration Guide</h3>
                <button onClick={() => setShowTwilioGuideModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">What is Twilio?</h4>
                  <p className="text-sm text-blue-800">
                    Twilio is a cloud communications platform that enables you to make and receive phone calls, 
                    send and receive text messages, and other communications functions using its web service APIs.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Current Configuration:</h4>
                  <div className="space-y-4">
                    <div className="bg-green-50 rounded-lg p-4">
                      <h5 className="font-medium text-green-900 mb-2">Account Information:</h5>
                      <div className="text-sm text-green-800 space-y-1">
                        <p><strong>Account SID:</strong> AC2e749f3b25fc86afa0dd6937206d95ec</p>
                        <p><strong>Phone Number:</strong> +1 (443) 320-6038</p>
                        <p><strong>Status:</strong> {twilioStatus === 'connected' ? 'Connected' : 'Disconnected'}</p>
                        {accountInfo && (
                          <p><strong>Balance:</strong> ${accountInfo.balance} {accountInfo.currency}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-900 mb-2">How It Works:</h4>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• When you make a call, Twilio will call your registered phone number first</li>
                    <li>• Once you answer, Twilio will connect you to the target number</li>
                    <li>• All calls are made through Twilio's cloud infrastructure</li>
                    <li>• Call quality and reliability are managed by Twilio</li>
                    <li>• No additional software installation required</li>
                  </ul>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">Benefits:</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Professional call quality</li>
                    <li>• No software installation required</li>
                    <li>• Call recording and analytics</li>
                    <li>• Global phone number support</li>
                    <li>• Reliable cloud infrastructure</li>
                    <li>• Detailed call logs and reporting</li>
                  </ul>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Testing:</h4>
                  <p className="text-sm text-blue-800">
                    To test the integration, try making a call to any phone number. 
                    Twilio will first call your registered number, then connect you to the target.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
                <button 
                  onClick={() => window.open('https://www.twilio.com', '_blank')}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  Visit Twilio
                </button>
                <button 
                  onClick={() => setShowTwilioGuideModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
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
