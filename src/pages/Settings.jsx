import { useAuth } from '../context/AuthContext';
import { 
  Phone, 
  Mail, 
  Check, 
  Users, 
  Shield, 
  Database, 
  Lock, 
  Cloud
} from 'lucide-react';
import PageHeader from '../components/PageHeader';

const Settings = () => {
  const { user } = useAuth();

  return (
    <div className="flex-1 bg-gray-50">
      <PageHeader 
        title="Settings" 
        subtitle="Manage your security settings and data privacy controls" 
      />

      <div className="p-6">
        {/* Hidden Contact Information Section */}
        <div className="bg-white rounded-xl p-6 mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Hidden Contact Information</h2>
            <p className="text-gray-600">Control agent access to sensitive client contact details</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Phone Numbers Card */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <Phone className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Phone Numbers</h3>
                </div>
              </div>
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  checked={true}
                  readOnly
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-gray-700">Hidden from Agents</label>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Phone numbers are only visible to administrators and authorized personnel.
              </p>
              <div className="flex items-center text-green-600">
                <Check className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Currently Protected</span>
              </div>
            </div>

            {/* Email Addresses Card */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Email Addresses</h3>
                </div>
              </div>
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  checked={true}
                  readOnly
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-gray-700">Hidden from Agents</label>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Email addresses are restricted to admin-level access only.
              </p>
              <div className="flex items-center text-green-600">
                <Check className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Currently Protected</span>
              </div>
            </div>

            {/* Access Levels Section */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Access Levels</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm text-gray-700">Admins: Full Access</span>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                    <Users className="w-4 h-4 text-orange-600" />
                  </div>
                  <span className="text-sm text-gray-700">Managers: Limited Access</span>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                    <Users className="w-4 h-4 text-red-600" />
                  </div>
                  <span className="text-sm text-gray-700">Agents: No Access</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Secure Database Section */}
        <div className="bg-white rounded-xl p-6 mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Secure Database</h2>
            <p className="text-gray-600">Enterprise-grade security for your client records</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Client Records Supported */}
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Database className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-2">500,000+</div>
              <div className="text-sm text-gray-600">Client Records Supported</div>
            </div>

            {/* Encryption Standard */}
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-2">AES-256</div>
              <div className="text-sm text-gray-600">Encryption Standard</div>
            </div>

            {/* Automated Backups */}
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Cloud className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-2">24/7</div>
              <div className="text-sm text-gray-600">Automated Backups</div>
            </div>
          </div>
        </div>

        {/* Security Features & Compliance Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Security Features */}
          <div className="bg-white rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Security Features</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <Check className="w-5 h-5 text-green-600 mr-3" />
                <span className="text-gray-700">End-to-end encryption</span>
              </div>
              <div className="flex items-center">
                <Check className="w-5 h-5 text-green-600 mr-3" />
                <span className="text-gray-700">Multi-factor authentication</span>
              </div>
            </div>
          </div>

          {/* Compliance */}
          <div className="bg-white rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Compliance</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <Shield className="w-5 h-5 text-blue-600 mr-3" />
                <span className="text-gray-700">GDPR Compliant</span>
              </div>
              <div className="flex items-center">
                <Shield className="w-5 h-5 text-blue-600 mr-3" />
                <span className="text-gray-700">SOC 2 Type II</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
