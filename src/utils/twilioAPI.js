// Twilio API Configuration
const TWILIO_CONFIG = {
  accountSid: 'AC2e749f3b25fc86afa0dd6937206d95ec',
  authToken: '5300f9adc7ca0d10009e9f1c322cc4d7',
  phoneNumber: '+14433206038',
  // Note: In production, these should be stored securely on the backend
};

class TwilioAPI {
  constructor() {
    this.baseUrl = 'https://api.twilio.com/2010-04-01';
    this.accountSid = TWILIO_CONFIG.accountSid;
    this.authToken = TWILIO_CONFIG.authToken;
    this.phoneNumber = TWILIO_CONFIG.phoneNumber;
  }

  // Basic authentication header for Twilio API
  getAuthHeader() {
    const credentials = btoa(`${this.accountSid}:${this.authToken}`);
    return `Basic ${credentials}`;
  }

  // Make a voice call using Twilio
  async makeCall(toNumber, fromNumber = this.phoneNumber) {
    try {
      console.log(`Making Twilio call to ${toNumber} from ${fromNumber}`);
      
      // Use the original number since it's verified
      let testNumber = toNumber;
      
      // For now, use demo mode until ngrok is set up
      // TODO: Replace with your actual ngrok URL
      const webhookUrl = 'https://demo.twilio.com/docs/voice.xml';
      const statusCallbackUrl = 'https://demo.twilio.com/docs/voice.xml';
      
      const response = await fetch(`${this.baseUrl}/Accounts/${this.accountSid}/Calls.json`, {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: testNumber,
          From: fromNumber,
          Url: webhookUrl,
          StatusCallback: statusCallbackUrl,
          StatusCallbackEvent: 'initiated,ringing,answered,completed',
          StatusCallbackMethod: 'POST',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Twilio API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const callData = await response.json();
      console.log('Twilio call created successfully:', callData);
      
      return {
        success: true,
        callSid: callData.sid,
        status: callData.status,
        data: callData,
      };
    } catch (error) {
      console.error('Error making Twilio call:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get call status
  async getCallStatus(callSid) {
    try {
      const response = await fetch(`${this.baseUrl}/Accounts/${this.accountSid}/Calls/${callSid}.json`, {
        headers: {
          'Authorization': this.getAuthHeader(),
        },
      });

      if (!response.ok) {
        throw new Error(`Twilio API error: ${response.status} ${response.statusText}`);
      }

      const callData = await response.json();
      return {
        success: true,
        status: callData.status,
        duration: callData.duration,
        data: callData,
      };
    } catch (error) {
      console.error('Error getting call status:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // End a call
  async endCall(callSid) {
    try {
      const response = await fetch(`${this.baseUrl}/Accounts/${this.accountSid}/Calls/${callSid}.json`, {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          Status: 'completed',
        }),
      });

      if (!response.ok) {
        throw new Error(`Twilio API error: ${response.status} ${response.statusText}`);
      }

      const callData = await response.json();
      return {
        success: true,
        status: callData.status,
        data: callData,
      };
    } catch (error) {
      console.error('Error ending call:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get account information
  async getAccountInfo() {
    try {
      const response = await fetch(`${this.baseUrl}/Accounts/${this.accountSid}.json`, {
        headers: {
          'Authorization': this.getAuthHeader(),
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Twilio API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const accountData = await response.json();
      return {
        success: true,
        accountName: accountData.friendly_name,
        status: accountData.status,
        balance: accountData.balance,
        currency: accountData.currency,
        data: accountData,
      };
    } catch (error) {
      console.error('Error getting account info:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get recent calls
  async getRecentCalls(limit = 10) {
    try {
      const response = await fetch(
        `${this.baseUrl}/Accounts/${this.accountSid}/Calls.json?PageSize=${limit}`,
        {
          headers: {
            'Authorization': this.getAuthHeader(),
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Twilio API error: ${response.status} ${response.statusText}`);
      }

      const callsData = await response.json();
      return {
        success: true,
        calls: callsData.calls || [],
        data: callsData,
      };
    } catch (error) {
      console.error('Error getting recent calls:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Validate phone number format
  validatePhoneNumber(phoneNumber) {
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
  }

  // Format phone number for display
  formatPhoneNumber(phoneNumber) {
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    
    return phoneNumber; // Return as-is if can't format
  }
}

// Create and export a singleton instance
const twilioAPI = new TwilioAPI();
export default twilioAPI;
