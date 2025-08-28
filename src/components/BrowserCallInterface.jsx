import { useState, useEffect, useRef } from 'react';
import { Device } from '@twilio/voice-sdk';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, User, Settings, Circle } from 'lucide-react';

const BrowserCallInterface = ({ onCallEnd, clientInfo }) => {
  const [device, setDevice] = useState(null);
  const [call, setCall] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callStatus, setCallStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [showSetupModal, setShowSetupModal] = useState(true);
  const [agentName, setAgentName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState(null);
  const [isDeviceReady, setIsDeviceReady] = useState(false);
  
  const audioRef = useRef(null);
  const durationIntervalRef = useRef(null);

  useEffect(() => {
    // Always show setup modal with BLANK fields - no auto-fill
    setShowSetupModal(true);
    
    // Clear any existing data
    setAgentName('');
    setPhoneNumber('');
    
    // Initialize device for calling
    initializeDevice();
    return () => {
      if (device) {
        device.destroy();
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []);

  const initializeDevice = async () => {
    try {
      console.log('Starting device initialization...');
      
      // Request microphone permissions first
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('Microphone permission granted');
        stream.getTracks().forEach(track => track.stop()); // Stop the stream after permission
      } catch (micError) {
        console.warn('Microphone permission denied:', micError);
        setError('Microphone permission is required for calling. Please enable it and refresh.');
        return;
      }

      console.log('Getting Twilio token...');
      // Get Twilio token from backend
      const response = await fetch('http://localhost:5001/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identity: 'crm-agent'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token response error:', response.status, errorText);
        throw new Error(`Failed to get Twilio token: ${response.status} ${errorText}`);
      }

      const { token } = await response.json();
      console.log('Token received, initializing device...');

      // Initialize Twilio Device
      const newDevice = new Device(token, {
        logLevel: 1,
        codecPreferences: ['opus', 'pcmu'],
        enableRingingState: true,
        closeProtection: true
      });

      // Set up event listeners
             newDevice.on('ready', () => {
         console.log('Twilio Device is ready');
         setCallStatus('ready');
         setIsDeviceReady(true);
         setError(null);
       });

      newDevice.on('error', (error) => {
        console.error('Twilio Device error:', error);
        setError(error.message);
        setCallStatus('error');
        setIsConnecting(false);
      });

      newDevice.on('connect', (connection) => {
        console.log('Call connected:', connection);
        setCall(connection);
        setCallStatus('connected');
        setIsConnecting(false);
        setError(null);
        
        // Start duration timer
        const startTime = Date.now();
        durationIntervalRef.current = setInterval(() => {
          setCallDuration(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);

        // Check if recording started
        if (connection.parameters && connection.parameters.RecordingUrl) {
          setIsRecording(true);
          setRecordingUrl(connection.parameters.RecordingUrl);
        }
      });

      newDevice.on('ringing', () => {
        console.log('Call is ringing');
        setCallStatus('ringing');
      });

      newDevice.on('disconnect', (connection) => {
        console.log('Call disconnected:', connection);
        setCall(null);
        setCallStatus('idle');
        setCallDuration(0);
        setIsRecording(false);
        setRecordingUrl(null);
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
        }
        onCallEnd();
      });

      newDevice.on('incoming', (connection) => {
        console.log('Incoming call:', connection);
        setCall(connection);
        setCallStatus('incoming');
      });

             setDevice(newDevice);
       
       // Add timeout for device ready
       setTimeout(() => {
         if (!isDeviceReady) {
           console.warn('Device initialization timeout');
           setError('Device initialization timeout. Please refresh and try again.');
         }
       }, 10000); // 10 second timeout
       
     } catch (error) {
       console.error('Error initializing device:', error);
       setError(error.message);
     }
   };

  const makeCall = async (phoneNumber) => {
    if (!device || !device.isOnline()) {
      setError('Device not ready');
      return;
    }

    try {
      setIsConnecting(true);
      setCallStatus('connecting');
      setError(null);

      const connection = await device.connect({
        params: {
          To: phoneNumber,
          From: '+14433206038', // Your Twilio number
          Record: 'true', // Enable recording
          RecordingStatusCallback: 'https://2a152400c10e.ngrok-free.app/api/recording-status'
        }
      });

      console.log('Call initiated:', connection);
    } catch (error) {
      console.error('Error making call:', error);
      setError(error.message);
      setIsConnecting(false);
      setCallStatus('error');
    }
  };

  const endCall = () => {
    if (call) {
      call.disconnect();
    }
    if (device) {
      device.disconnectAll();
    }
  };

  const toggleMute = () => {
    if (call) {
      if (isMuted) {
        call.mute(false);
      } else {
        call.mute(true);
      }
      setIsMuted(!isMuted);
    }
  };

  const toggleSpeaker = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isSpeakerOn;
      setIsSpeakerOn(!isSpeakerOn);
    }
  };

  const acceptIncomingCall = () => {
    if (call && callStatus === 'incoming') {
      call.accept();
      setCallStatus('connected');
    }
  };

  const rejectIncomingCall = () => {
    if (call && callStatus === 'incoming') {
      call.reject();
      setCall(null);
      setCallStatus('idle');
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartCall = () => {
    if (!agentName.trim() || !phoneNumber.trim()) {
      setError('Please enter both agent name and phone number');
      return;
    }
    setShowSetupModal(false);
    makeCall(phoneNumber);
  };

  const handleSetupComplete = async () => {
    if (!agentName.trim() || !phoneNumber.trim()) {
      setError('Please enter both agent name and phone number');
      return;
    }
    
    // Wait for device to be ready before making call
    if (!device || !device.isOnline()) {
      setError('Device not ready. Please wait a moment and try again.');
      return;
    }
    
    setShowSetupModal(false);
    
    // Actually make the call when setup is complete
    await makeCall(phoneNumber);
  };

  // Setup Modal
  if (showSetupModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 shadow-lg max-w-md w-full mx-4">
                     <div className="text-center mb-6">
             <h3 className="text-lg font-semibold text-gray-900">Browser Call Setup</h3>
             <p className="text-sm text-gray-600">Enter the details for your call</p>
           </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Device Status */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Device Status:</span>
              <span className={`text-sm font-medium ${
                isDeviceReady ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {isDeviceReady ? 'Ready' : 'Initializing...'}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Who are you calling?
              </label>
              <input
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="Enter name (e.g., John Doe)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Phone Number to Call
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter phone number (e.g., +1234567890)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              onClick={() => onCallEnd()}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
                         <button
               onClick={handleSetupComplete}
               disabled={!isDeviceReady || isConnecting}
               className={`flex-1 px-4 py-2 rounded-md transition-colors ${
                 isDeviceReady && !isConnecting 
                   ? 'bg-blue-600 text-white hover:bg-blue-700' 
                   : 'bg-gray-400 text-gray-200 cursor-not-allowed'
               }`}
             >
               {isConnecting ? 'Connecting...' : isDeviceReady ? 'Start Call' : 'Initializing...'}
             </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Browser Call Interface</h3>
        <p className="text-sm text-gray-600">
          {agentName ? `Calling: ${agentName}` : 'Ready to call'}
        </p>
        {phoneNumber && (
          <p className="text-xs text-gray-500 mt-1">{phoneNumber}</p>
        )}
        <button
          onClick={() => setShowSetupModal(true)}
          className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center justify-center mx-auto"
        >
          <Settings className="w-3 h-3 mr-1" />
          Change Details
        </button>
      </div>

      {/* Call Status */}
      <div className="text-center mb-4">
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          callStatus === 'connected' ? 'bg-green-100 text-green-800' :
          callStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
          callStatus === 'incoming' ? 'bg-blue-100 text-blue-800' :
          callStatus === 'error' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {callStatus === 'connected' ? 'Connected' :
           callStatus === 'connecting' ? 'Connecting...' :
           callStatus === 'incoming' ? 'Incoming Call' :
           callStatus === 'error' ? 'Error' :
           'Ready'}
        </div>
      </div>

      {/* Call Duration */}
      {callStatus === 'connected' && (
        <div className="text-center mb-4">
          <p className="text-lg font-mono text-gray-700">{formatDuration(callDuration)}</p>
        </div>
      )}

      {/* Recording Status */}
      {isRecording && (
        <div className="text-center mb-4">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <Circle className="w-4 h-4 mr-2 animate-pulse" />
            Recording...
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Call Controls */}
      <div className="flex justify-center space-x-4 mb-4">
        {callStatus === 'ready' && (
          <button
            onClick={() => makeCall(phoneNumber)}
            disabled={!phoneNumber}
            className="bg-green-600 text-white p-3 rounded-full hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Start call"
          >
            <Phone className="w-6 h-6" />
          </button>
        )}

        {callStatus === 'incoming' && (
          <>
            <button
              onClick={acceptIncomingCall}
              className="bg-green-600 text-white p-3 rounded-full hover:bg-green-700 transition-colors"
              title="Accept call"
            >
              <Phone className="w-6 h-6" />
            </button>
            <button
              onClick={rejectIncomingCall}
              className="bg-red-600 text-white p-3 rounded-full hover:bg-red-700 transition-colors"
              title="Reject call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </>
        )}

        {(callStatus === 'connected' || callStatus === 'connecting') && (
          <>
            <button
              onClick={endCall}
              className="bg-red-600 text-white p-3 rounded-full hover:bg-red-700 transition-colors"
              title="End call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
            
            <button
              onClick={toggleMute}
              className={`p-3 rounded-full transition-colors ${
                isMuted ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            <button
              onClick={toggleSpeaker}
              className={`p-3 rounded-full transition-colors ${
                !isSpeakerOn ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
              }`}
              title={isSpeakerOn ? 'Turn off speaker' : 'Turn on speaker'}
            >
              {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
            </button>
          </>
        )}
      </div>

      {/* Audio Element for Speaker Control */}
      <audio ref={audioRef} autoPlay />

      {/* Call Info */}
      {call && (
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-600">
            Call SID: {call.parameters?.CallSid || 'N/A'}
          </p>
          <p className="text-sm text-gray-600">
            Direction: {call.direction || 'N/A'}
          </p>
          {recordingUrl && (
            <p className="text-sm text-gray-600">
              Recording: <a href={recordingUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Listen</a>
            </p>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 text-xs text-gray-500">
        <p>• Make sure your microphone is enabled</p>
        <p>• Use mute button to control your microphone</p>
        <p>• Use speaker button to control audio output</p>
        <p>• Calls are automatically recorded</p>
      </div>
    </div>
  );
};

export default BrowserCallInterface;
