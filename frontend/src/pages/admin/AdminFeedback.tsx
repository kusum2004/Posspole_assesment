import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Feedback, Course, User, PaginationData } from '../../types';
import { adminApi, courseApi } from '../../utils/api';
import { ROUTES, PAGINATION_CONFIG } from '../../utils/constants';
import { formatDateTime, formatRating, downloadFile } from '../../utils/helpers';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Layout from '../../components/layout/Layout';

const AdminFeedback: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: PAGINATION_CONFIG.defaultLimit,
  });
  const [filters, setFilters] = useState({
    course: '',
    rating: '',
    student: '',
    startDate: '',
    endDate: '',
  });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeedbacks();
    fetchCourses();
  }, [pagination.currentPage, sortBy, sortOrder]);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAllFeedback({
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        course: filters.course || undefined,
        rating: filters.rating ? parseInt(filters.rating) : undefined,
        sortBy,
        sortOrder,
      });
      setFeedbacks(response.feedback);
      setPagination(response.pagination);
    } catch (error) {
      toast.error('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const coursesData = await courseApi.getAllCourses();
      setCourses(coursesData);
    } catch (error) {
      console.error('Failed to load courses');
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    fetchFeedbacks();
  };

  const clearFilters = () => {
    setFilters({
      course: '',
      rating: '',
      student: '',
      startDate: '',
      endDate: '',
    });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    fetchFeedbacks();
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await adminApi.exportFeedback({
        ...filters,
        course: filters.course || undefined,
        rating: filters.rating ? parseInt(filters.rating) : undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      });

      const fileName = `feedback_export_${new Date().toISOString().split('T')[0]}.csv`;
      downloadFile(blob, fileName);
      toast.success('Feedback exported successfully!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to export feedback';
      toast.error(errorMessage);
    } finally {
      setExporting(false);
    }
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${
              rating >= star ? 'text-yellow-400' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  const renderPagination = () => {
    const pages = [];
    for (let i = 1; i <= pagination.totalPages; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-2 text-sm font-medium rounded-md ${
            i === pagination.currentPage
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  return (
    <Layout>
      {/* Header */}
      <div className="bg-white shadow mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Feedback Management</h1>
              <p className="mt-1 text-sm text-gray-600">
                View, filter, and export all student feedback
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleExport}
                disabled={exporting}
                className="btn-secondary flex items-center"
              >
                {exporting ? (
                  <>
                    <LoadingSpinner size="small" className="mr-2" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export CSV
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Filters */}
          <div className="card mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                <select
                  value={filters.course}
                  onChange={(e) => handleFilterChange('course', e.target.value)}
                  className="input-field"
                >
                  <option value="">All Courses</option>
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.code} - {course.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                <select
                  value={filters.rating}
                  onChange={(e) => handleFilterChange('rating', e.target.value)}
                  className="input-field"
                >
                  <option value="">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field);
                    setSortOrder(order as 'asc' | 'desc');
                  }}
                  className="input-field"
                >
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                  <option value="rating-desc">Highest Rating</option>
                  <option value="rating-asc">Lowest Rating</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-4">
              <button onClick={clearFilters} className="btn-secondary">
                Clear Filters
              </button>
              <button onClick={applyFilters} className="btn-primary">
                Apply Filters
              </button>
            </div>
          </div>

          {/* Feedback List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="large" />
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 8h10m0 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m10 0v10a2 2 0 01-2 2H9a2 2 0 01-2-2V8m10 0H7m6 5v4"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No feedback found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your filter criteria.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-6">
                {feedbacks.map((feedback) => (
                  <div key={feedback._id} className="card">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {typeof feedback.course === 'string' 
                                ? feedback.course 
                                : `${feedback.course.code} - ${feedback.course.name}`}
                            </h3>
                            <p className="text-sm text-gray-600">
                              By {feedback.isAnonymous ? 'Anonymous' : 
                                  typeof feedback.student === 'string' ? 
                                  feedback.student : 
                                  (feedback.student as User).name}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {renderStarRating(feedback.rating)}
                            <span className="text-sm text-gray-600">
                              ({formatRating(feedback.rating)})
                            </span>
                          </div>
                        </div>

                        <p className="text-gray-700 mb-3">{feedback.message}</p>

                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>
                            Submitted {formatDateTime(feedback.createdAt)}
                          </span>
                          {feedback.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {feedback.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              feedback.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : feedback.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {feedback.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-8 flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-700">
                    Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
                    {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
                    {pagination.totalItems} feedback entries
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {renderPagination()}
                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={pagination.currentPage === pagination.totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {/* Summary Stats */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="text-2xl font-bold text-primary-600">{pagination.totalItems}</div>
                  <div className="text-sm text-gray-600">Total Feedback</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="text-2xl font-bold text-green-600">
                    {feedbacks.filter(f => f.rating >= 4).length}
                  </div>
                  <div className="text-sm text-gray-600">Positive (4-5 stars)</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="text-2xl font-bold text-yellow-600">
                    {feedbacks.filter(f => f.rating === 3).length}
                  </div>
                  <div className="text-sm text-gray-600">Neutral (3 stars)</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="text-2xl font-bold text-red-600">
                    {feedbacks.filter(f => f.rating <= 2).length}
                  </div>
                  <div className="text-sm text-gray-600">Negative (1-2 stars)</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AdminFeedback;
