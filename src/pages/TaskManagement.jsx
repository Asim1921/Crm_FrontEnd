import { useState, useEffect } from 'react';
import { 
  Eye, 
  Edit, 
  Trash2, 
  Calendar,
  User,
  Mail,
  Phone
} from 'lucide-react';

const TaskManagement = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState('Month');

  // Mock task data
  const mockTasks = [
    {
      _id: '1',
      title: 'Follow up with Michael Johnson',
      description: 'Call to discuss investment opportunities',
      assignedTo: 'Sarah Wilson',
      dueDate: '2024-01-20',
      status: 'In Progress',
      priority: 'High',
      client: {
        firstName: 'Michael',
        lastName: 'Johnson',
        email: 'mj@email.com',
        country: 'United States'
      }
    },
    {
      _id: '2',
      title: 'Send proposal to Emma Martinez',
      description: 'Email the updated investment proposal',
      assignedTo: 'John Doe',
      dueDate: '2024-01-22',
      status: 'Pending',
      priority: 'Medium',
      client: {
        firstName: 'Emma',
        lastName: 'Martinez',
        email: 'em@email.com',
        country: 'Canada'
      }
    },
    {
      _id: '3',
      title: 'Review David Brown application',
      description: 'Review and approve investment application',
      assignedTo: 'Sarah Wilson',
      dueDate: '2024-01-25',
      status: 'Completed',
      priority: 'High',
      client: {
        firstName: 'David',
        lastName: 'Brown',
        email: 'db@email.com',
        country: 'Australia'
      }
    }
  ];

  const displayTasks = mockTasks;

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getAvatarColor = (name) => {
    const colors = ['bg-blue-500', 'bg-pink-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500'];
    const index = name.length % colors.length;
    return colors[index];
  };

  // Chart data for smooth line chart
  const chartData = [
    { month: 'Jan', value: 850 },
    { month: 'Feb', value: 900 },
    { month: 'Mar', value: 900 },
    { month: 'Apr', value: 950 },
    { month: 'May', value: 1300 },
    { month: 'Jun', value: 1300 },
    { month: 'Jul', value: 1600 },
    { month: 'Aug', value: 1700 }
  ];

  // Create smooth curved path using cubic bezier curves
  const createSmoothPath = (data, width, height, type = 'line') => {
    if (data.length === 0) return '';
    
    const padding = 50;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;
    
    const getX = (index) => {
      return padding + (index * chartWidth) / (data.length - 1);
    };

    const getY = (value) => {
      const maxValue = 1800;
      const minValue = 0;
      return padding + ((maxValue - value) / (maxValue - minValue)) * chartHeight;
    };
    
    const points = data.map((point, index) => ({
      x: getX(index),
      y: getY(point.value)
    }));

    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const prevPoint = points[i - 1];
      const currentPoint = points[i];
      
      // Calculate control points for smooth curves
      const controlPointDistance = (currentPoint.x - prevPoint.x) * 0.4;
      
      const cp1x = prevPoint.x + controlPointDistance;
      const cp1y = prevPoint.y;
      const cp2x = currentPoint.x - controlPointDistance;
      const cp2y = currentPoint.y;
      
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${currentPoint.x} ${currentPoint.y}`;
    }

    if (type === 'area') {
      // Close the path for area fill
      const lastPoint = points[points.length - 1];
      const firstPoint = points[0];
      path += ` L ${lastPoint.x} ${height - padding}`;
      path += ` L ${firstPoint.x} ${height - padding}`;
      path += ` Z`;
    }

    return path;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 min-h-screen">
      <div className="p-6 space-y-6">
        {/* Tasks Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Tasks</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setPeriod('Week')}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  period === 'Week' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setPeriod('Month')}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  period === 'Month' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setPeriod('Year')}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  period === 'Year' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Year
              </button>
            </div>
          </div>
          
          {/* Smooth Line Chart - Full size within card */}
          <div className="relative w-full h-96 p-4">
            <svg 
              width="100%" 
              height="100%" 
              viewBox="0 0 1000 380"
              preserveAspectRatio="xMidYMid meet"
              className="w-full h-full"
            >
              {/* Gradient definitions */}
              <defs>
                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#60a5fa" />
                </linearGradient>
              </defs>
              
              {/* Y-axis labels */}
              {[0, 300, 600, 900, 1200, 1500, 1800].map((value) => (
                <text
                  key={value}
                  x={50 - 10}
                  y={50 + ((1800 - value) / 1800) * (380 - 2 * 50) + 4}
                  textAnchor="end"
                  className="text-xs fill-gray-500"
                >
                  {value === 0 ? '0' : value.toLocaleString()}
                </text>
              ))}
              
              {/* X-axis labels */}
              {chartData.map((point, index) => (
                <text
                  key={index}
                  x={50 + (index * (1000 - 2 * 50)) / (chartData.length - 1)}
                  y={380 - 50 + 20}
                  textAnchor="middle"
                  className="text-sm fill-gray-500"
                >
                  {point.month}
                </text>
              ))}
              
              {/* Area fill with smooth curves */}
              <path
                d={createSmoothPath(chartData, 1000, 380, 'area')}
                fill="url(#areaGradient)"
                className="transition-all duration-1000 ease-in-out"
              />
              
              {/* Smooth curved line - Clean minimal style */}
              <path
                d={createSmoothPath(chartData, 1000, 380, 'line')}
                stroke="url(#lineGradient)"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-1000 ease-in-out"
              />
            </svg>
          </div>
        </div>

        {/* Tasks Management Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Tasks Managements</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    TASKS
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    COUNTRY
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    EMAIL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CLIENT NAME
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayTasks.slice(0, 3).map((task, index) => (
                  <tr key={task._id || index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {index + 1}. {task.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {task.client?.country || 'United States'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {task.client?.email || 'client@email.com'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${getAvatarColor(task.client?.firstName || '')}`}>
                          {getInitials(task.client?.firstName, task.client?.lastName)}
                        </div>
                        <span className="ml-3 text-sm font-medium text-gray-900">
                          {task.client ? `${task.client.firstName} ${task.client.lastName}` : 'Client Name'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Eye className="w-4 h-4 text-gray-400 cursor-pointer hover:text-blue-600" />
                        <Edit className="w-4 h-4 text-gray-400 cursor-pointer hover:text-green-600" />
                        <Trash2 className="w-4 h-4 text-gray-400 cursor-pointer hover:text-red-600" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing 1 to 5 of 25 results
              </div>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50">
                  Previous
                </button>
                <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg">1</button>
                <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50">2</button>
                <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50">3</button>
                <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50">
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskManagement;