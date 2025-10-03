import React, { useState } from 'react';
import { amiClick2CallAPI } from '../utils/api';

const AMIClick2CallTest = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);

  const handleMakeCall = async () => {
    if (!phoneNumber.trim()) {
      setError('Please enter a phone number');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const callData = {
        phoneNumber: phoneNumber.trim(),
        context: 'click to call',
        ringtime: '30',
        CallerID: 'Anonymous',
        name: 'CRM User',
        other: 'AMI Click2Call Test'
      };

      console.log('Making AMI call with data:', callData);
      const response = await amiClick2CallAPI.makeCall(callData);
      
      if (response.success) {
        setResult(response);
        console.log('AMI call successful:', response);
      } else {
        setError(response.error || 'Call failed');
        console.error('AMI call failed:', response);
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
      console.error('AMI call error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await amiClick2CallAPI.testConnection();
      setResult(response);
      console.log('AMI connection test result:', response);
    } catch (err) {
      setError(err.message || 'Connection test failed');
      console.error('AMI connection test error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetStatus = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await amiClick2CallAPI.getStatus();
      setStatus(response);
      console.log('AMI status:', response);
    } catch (err) {
      setError(err.message || 'Failed to get status');
      console.error('AMI status error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetUserInfo = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await amiClick2CallAPI.getUserInfo();
      setResult(response);
      console.log('AMI user info:', response);
    } catch (err) {
      setError(err.message || 'Failed to get user info');
      console.error('AMI user info error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">AMI Click2Call Test</h2>
        <p className="text-gray-600">
          Test the Python AMI integration for making calls through Asterisk PBX.
        </p>
      </div>

      {/* Status Display */}
      {status && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">AMI Service Status</h3>
          <div className="text-sm text-blue-700">
            <p><strong>Service:</strong> {status.serviceName}</p>
            <p><strong>Method:</strong> {status.method}</p>
            <p><strong>Status:</strong> {status.status}</p>
            <p><strong>User Extension:</strong> {status.user?.extension}</p>
            <p><strong>Host:</strong> {status.configuration?.host}:{status.configuration?.port}</p>
          </div>
        </div>
      )}

      {/* Phone Number Input */}
      <div className="mb-6">
        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
          Phone Number
        </label>
        <input
          type="tel"
          id="phoneNumber"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="Enter phone number (e.g., +1234567890)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <button
          onClick={handleMakeCall}
          disabled={isLoading || !phoneNumber.trim()}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Calling...' : 'Make Call'}
        </button>

        <button
          onClick={handleTestConnection}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Testing...' : 'Test Connection'}
        </button>

        <button
          onClick={handleGetStatus}
          disabled={isLoading}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Loading...' : 'Get Status'}
        </button>

        <button
          onClick={handleGetUserInfo}
          disabled={isLoading}
          className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Loading...' : 'User Info'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-semibold text-red-800 mb-2">Error</h3>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">Result</h3>
          <pre className="text-sm text-green-700 whitespace-pre-wrap overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-2">How it works:</h3>
        <ol className="text-sm text-gray-600 space-y-1">
          <li>1. Enter a phone number in the input field above</li>
          <li>2. Click "Make Call" to initiate the call</li>
          <li>3. The system will execute the Python AMI script</li>
          <li>4. Asterisk will call your extension first</li>
          <li>5. When you answer, you'll be connected to the destination number</li>
        </ol>
        
        <div className="mt-4">
          <h4 className="font-semibold text-gray-800 mb-2">Configuration:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• <strong>AMI Host:</strong> localhost:5038</li>
            <li>• <strong>Username:</strong> admin</li>
            <li>• <strong>Context:</strong> from-internal</li>
            <li>• <strong>Caller ID:</strong> Anonymous</li>
            <li>• <strong>Python Script:</strong> lamda.py</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AMIClick2CallTest;
