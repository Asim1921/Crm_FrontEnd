import { useState } from 'react';
import { LogIn, ArrowRight } from 'lucide-react';

const LoginModal = ({ isOpen, onClose, onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(formData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 lg:p-8 w-full max-w-md mx-4">
        {/* Icon */}
        <div className="flex justify-center mb-4 lg:mb-6">
          <div className="w-12 h-12 lg:w-16 lg:h-16 bg-red-500 rounded-full flex items-center justify-center">
            <LogIn className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl lg:text-2xl font-bold text-gray-900 text-center mb-2">Login</h2>
        <p className="text-sm lg:text-base text-gray-600 text-center mb-6 lg:mb-8">Login with username and Password</p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
          <div>
            <input
              type="text"
              name="username"
              placeholder="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-3 lg:px-4 py-2 lg:py-3 text-sm lg:text-base border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 lg:px-4 py-2 lg:py-3 text-sm lg:text-base border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-red-500 text-white font-bold py-2 lg:py-3 px-3 lg:px-4 text-sm lg:text-base rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center space-x-2"
          >
            <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5" />
            <span>Yes, Sign in</span>
          </button>
        </form>


      </div>
    </div>
  );
};

export default LoginModal;
