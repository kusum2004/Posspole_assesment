import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardStats } from '../../types';
import { adminApi } from '../../utils/api';
import { ROUTES } from '../../utils/constants';
import { formatDateTime, formatRating } from '../../utils/helpers';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Layout from '../../components/layout/Layout';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const dashboardStats = await adminApi.getDashboard();
      setStats(dashboardStats);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    color: string;
    onClick?: () => void;
  }> = ({ title, value, subtitle, icon, color, onClick }) => (
    <div
      onClick={onClick}
      className={`card hover:shadow-lg transition-shadow duration-200 ${
        onClick ? 'cursor-pointer hover:bg-gray-50' : ''
      }`}
    >
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-lg ${color}`}>
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  const renderRatingDistribution = () => {
    if (!stats?.feedback.ratingDistribution) return null;

    const total = Object.values(stats.feedback.ratingDistribution).reduce((sum, count) => sum + count, 0);
    
    return (
      <div className="space-y-3">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = stats.feedback.ratingDistribution[rating] || 0;
          const percentage = total > 0 ? (count / total) * 100 : 0;
          
          return (
            <div key={rating} className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 w-16">
                <span className="text-sm font-medium text-gray-700">{rating}</span>
                <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
              <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-64">
          <LoadingSpinner size="large" />
        </div>
      </Layout>
    );
  }

  if (!stats) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <p className="text-gray-600">Failed to load dashboard data</p>
            <button
              onClick={fetchDashboardStats}
              className="mt-4 btn-primary"
            >
              Retry
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <div className="bg-white shadow mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">
              Overview of your application's performance and statistics
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Students"
              value={stats.users.totalStudents}
              subtitle={`${stats.users.activeStudents} active`}
              color="bg-blue-100"
              icon={
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              }
              onClick={() => navigate(ROUTES.ADMIN_STUDENTS)}
            />

            <StatCard
              title="Total Courses"
              value={stats.courses.totalCourses}
              subtitle={`${stats.courses.activeCourses} active`}
              color="bg-green-100"
              icon={
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              }
              onClick={() => navigate(ROUTES.ADMIN_COURSES)}
            />

            <StatCard
              title="Total Feedback"
              value={stats.feedback.totalFeedback}
              subtitle={`${formatRating(stats.feedback.averageRating)} avg rating`}
              color="bg-yellow-100"
              icon={
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10m0 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m10 0v10a2 2 0 01-2 2H9a2 2 0 01-2-2V8m10 0H7m6 5v4" />
                </svg>
              }
              onClick={() => navigate(ROUTES.ADMIN_FEEDBACK)}
            />

            <StatCard
              title="Recent Activity"
              value={stats.activity.recentFeedback}
              subtitle="feedback this week"
              color="bg-purple-100"
              icon={
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              }
            />
          </div>

          {/* Charts and Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Rating Distribution */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Rating Distribution</h3>
              {renderRatingDistribution()}
            </div>

            {/* Top Courses */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Top Courses by Feedback</h3>
              <div className="space-y-3">
                {stats.topCourses.slice(0, 5).map((course, index) => (
                  <div key={course.courseId} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {course.courseCode}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {course.courseName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {course.feedbackCount}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatRating(course.averageRating)} ★
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Trends */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Feedback Trends</h3>
              <div className="space-y-3">
                {stats.monthlyTrends.slice(-6).map((trend) => (
                  <div key={trend.month} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{trend.month}</span>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{trend.count}</p>
                      <p className="text-xs text-gray-500">{formatRating(trend.averageRating)} ★</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="card hover:shadow-lg transition-shadow duration-200 cursor-pointer" onClick={() => navigate(ROUTES.ADMIN_STUDENTS)}>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Manage Students</h3>
                  <p className="text-sm text-gray-600">View, block, or delete student accounts</p>
                </div>
              </div>
            </div>

            <div className="card hover:shadow-lg transition-shadow duration-200 cursor-pointer" onClick={() => navigate(ROUTES.ADMIN_COURSES)}>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Manage Courses</h3>
                  <p className="text-sm text-gray-600">Add, edit, or delete course offerings</p>
                </div>
              </div>
            </div>

            <div className="card hover:shadow-lg transition-shadow duration-200 cursor-pointer" onClick={() => navigate(ROUTES.ADMIN_FEEDBACK)}>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10m0 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m10 0v10a2 2 0 01-2 2H9a2 2 0 01-2-2V8m10 0H7m6 5v4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">View Feedback</h3>
                  <p className="text-sm text-gray-600">Review and export student feedback</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-8">
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">System Overview</h3>
                <button
                  onClick={fetchDashboardStats}
                  className="btn-secondary text-sm"
                >
                  Refresh
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.users.activeStudents}</div>
                  <div className="text-sm text-gray-600">Active Students</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {stats.users.blockedStudents} blocked
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.courses.activeCourses}</div>
                  <div className="text-sm text-gray-600">Active Courses</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {stats.courses.inactiveCourses} inactive
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{stats.activity.recentFeedback}</div>
                  <div className="text-sm text-gray-600">Recent Feedback</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Last 7 days
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
