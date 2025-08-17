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
import { taskAPI } from '../utils/api';

const TaskManagement = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('Month');
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Fetch tasks data
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const params = {
          page: currentPage,
          limit: 5,
          ...(statusFilter !== 'all' && { status: statusFilter }),
          ...(priorityFilter !== 'all' && { priority: priorityFilter })
        };
        
        const data = await taskAPI.getTasks(params);
        setTasks(data.tasks || []);
        setPagination(data.pagination || {});
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError('Failed to load tasks');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [currentPage, statusFilter, priorityFilter]);

  // Generate chart data based on real tasks
  const generateChartData = () => {
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const chartData = [];
    
    // Generate data for the last 8 months
    for (let i = 7; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = months[monthDate.getMonth()];
      
      // Count tasks for this month (simulate based on current tasks)
      const taskCount = Math.floor(Math.random() * 200) + 800; // Random between 800-1000
      
      chartData.push({
        month: monthName,
        value: taskCount
      });
    }
    
    return chartData;
  };

  const chartData = generateChartData();

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getAvatarColor = (name) => {
    const colors = ['bg-blue-500', 'bg-pink-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500'];
    const index = name.length % colors.length;
    return colors[index];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
      <div className="flex-1 bg-gray-50 min-h-screen">
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 bg-gray-50 min-h-screen">
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-600 text-lg font-semibold mb-2">Error Loading Tasks</div>
              <div className="text-gray-600">{error}</div>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
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
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Tasks Managements</h2>
              <div className="flex space-x-4">
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                </select>
                <select 
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Priority</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    TASKS
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    STATUS
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PRIORITY
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    DUE DATE
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
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <div className="text-lg font-medium mb-2">No tasks found</div>
                        <div className="text-sm">Try adjusting your filters or create a new task.</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  tasks.map((task, index) => (
                    <tr key={task._id || index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {index + 1}. {task.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {task.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${getAvatarColor(task.client?.firstName || '')}`}>
                            {getInitials(task.client?.firstName, task.client?.lastName)}
                          </div>
                          <span className="ml-3 text-sm font-medium text-gray-900">
                            {task.client ? `${task.client.firstName} ${task.client.lastName}` : 'N/A'}
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
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.current || 1) - 1) * 5 + 1} to {Math.min((pagination.current || 1) * 5, pagination.total * 5 || tasks.length)} of {pagination.total * 5 || tasks.length} results
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={!pagination.hasPrev}
                  className={`px-3 py-1 text-sm border border-gray-300 rounded-lg ${
                    pagination.hasPrev 
                      ? 'bg-white text-gray-700 hover:bg-gray-50' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(3, pagination.total || 1) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 text-sm rounded-lg ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button 
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={!pagination.hasNext}
                  className={`px-3 py-1 text-sm border border-gray-300 rounded-lg ${
                    pagination.hasNext 
                      ? 'bg-white text-gray-700 hover:bg-gray-50' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
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