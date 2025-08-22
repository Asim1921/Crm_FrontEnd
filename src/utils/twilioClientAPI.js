// Twilio Client API for browser-based voice calls
import { Device } from 'twilio-client';

class TwilioClientAPI {
  constructor() {
    this.device = null;
    this.activeCall = null;
    this.isInitialized = false;
  }

  // Initialize the Twilio Device
  async initializeDevice(token) {
    try {
      console.log('Initializing Twilio Device...');
      
      this.device = new Device(token, {
        debug: true,
        closeProtection: true
      });

      // Set up event listeners
      this.device.on('ready', () => {
        console.log('Twilio Device is ready');
        this.isInitialized = true;
      });

      this.device.on('error', (error) => {
        console.error('Twilio Device error:', error);
      });

      this.device.on('connect', (connection) => {
        console.log('Call connected:', connection);
        this.activeCall = connection;
      });

      this.device.on('disconnect', (connection) => {
        console.log('Call disconnected:', connection);
        this.activeCall = null;
      });

      // Register the device
      await this.device.register();
      
      return { success: true };
    } catch (error) {
      console.error('Error initializing Twilio Device:', error);
      return { success: false, error: error.message };
    }
  }

  // Make a call using the browser microphone
  async makeCall(toNumber) {
    try {
      if (!this.device || !this.isInitialized) {
        throw new Error('Twilio Device not initialized');
      }

      console.log(`Making browser call to ${toNumber}`);
      
      // Make the call
      this.activeCall = await this.device.connect({
        params: {
          To: toNumber
        }
      });

      return {
        success: true,
        call: this.activeCall
      };
    } catch (error) {
      console.error('Error making browser call:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // End the current call
  async endCall() {
    try {
      if (this.activeCall) {
        this.activeCall.disconnect();
        this.activeCall = null;
        return { success: true };
      }
      return { success: false, error: 'No active call' };
    } catch (error) {
      console.error('Error ending call:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get call status
  getCallStatus() {
    if (this.activeCall) {
      return {
        success: true,
        status: this.activeCall.status(),
        duration: this.activeCall.duration || 0
      };
    }
    return {
      success: false,
      status: 'no-call'
    };
  }

  // Check if device is ready
  isDeviceReady() {
    return this.isInitialized && this.device && this.device.status() === 'ready';
  }

  // Destroy the device
  destroy() {
    if (this.device) {
      this.device.destroy();
      this.device = null;
      this.activeCall = null;
      this.isInitialized = false;
    }
  }
}

// Create and export a singleton instance
const twilioClientAPI = new TwilioClientAPI();
export default twilioClientAPI;
