import { LogOut, ArrowRight } from 'lucide-react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

const LogoutModal = ({ isOpen, onClose, onLogout, user }) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 lg:p-8 w-full max-w-md mx-4">
        {/* Icon */}
        <div className="flex justify-center mb-4 lg:mb-6">
          <div className="w-12 h-12 lg:w-16 lg:h-16 bg-red-500 rounded-full flex items-center justify-center">
            <LogOut className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl lg:text-2xl font-bold text-gray-900 text-center mb-2">Sign Out</h2>
        <p className="text-sm lg:text-base text-gray-600 text-center mb-4 lg:mb-6">Are you sure you want to sign out of your account?</p>

        {/* User Info Box */}
        <div className="bg-gray-50 rounded-lg p-3 lg:p-4 mb-4 lg:mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-xs lg:text-sm">
                {user?.firstName?.charAt(0) || 'S'}{user?.lastName?.charAt(0) || 'J'}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm lg:text-base">
                {user?.firstName || 'Sarah'} {user?.lastName || 'Johnson'}
              </p>
              <p className="text-xs lg:text-sm text-gray-600">
                {user?.email || 'sarah.johnson@company.com'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            onClick={onLogout}
            className="flex-1 bg-red-500 text-white font-bold py-2 lg:py-3 px-3 lg:px-4 text-sm lg:text-base rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center space-x-2"
          >
            <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5" />
            <span>Yes, Sign Out</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-700 font-medium py-2 lg:py-3 px-3 lg:px-4 text-sm lg:text-base rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* Footer Links */}
        <div className="mt-4 lg:mt-6 pt-4 lg:pt-6 border-t border-gray-200 text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 text-xs lg:text-sm text-gray-500">
            <a href="#" className="hover:text-gray-700">Privacy Policy</a>
            <span className="hidden sm:inline">•</span>
            <a href="#" className="hover:text-gray-700">Terms of Service</a>
          </div>
        </div>
      </div>
    </div>
  );

  // Render modal directly to document body using portal
  return createPortal(modalContent, document.body);
};

export default LogoutModal;
