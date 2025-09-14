import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import toast from 'react-hot-toast';
import { Feedback, Course, FeedbackFormData, PaginationData } from '../../types';
import { feedbackApi, courseApi } from '../../utils/api';
import { feedbackSchema } from '../../utils/validation';
import { ROUTES, RATING_CONFIG, PAGINATION_CONFIG } from '../../utils/constants';
import { formatDateTime, formatRating } from '../../utils/helpers';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import Layout from '../../components/layout/Layout';

const FeedbackList: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: PAGINATION_CONFIG.defaultLimit,
  });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [editingFeedback, setEditingFeedback] = useState<Feedback | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingFeedback, setDeletingFeedback] = useState<string | null>(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FeedbackFormData>({
    resolver: yupResolver(feedbackSchema) as any,
  });

  const selectedRating = watch('rating');

  useEffect(() => {
    fetchFeedbacks();
    fetchCourses();
  }, [pagination.currentPage, sortBy, sortOrder]);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const response = await feedbackApi.getMyFeedback({
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
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

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const openEditModal = (feedback: Feedback) => {
    setEditingFeedback(feedback);
    setValue('course', typeof feedback.course === 'string' ? feedback.course : feedback.course._id);
    setValue('rating', feedback.rating);
    setValue('message', feedback.message);
    setValue('isAnonymous', feedback.isAnonymous);
    setValue('tags', feedback.tags);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingFeedback(null);
    reset();
  };

  const handleEdit = async (data: FeedbackFormData) => {
    if (!editingFeedback) return;

    try {
      const updatedFeedback = await feedbackApi.updateFeedback(editingFeedback._id, data);
      setFeedbacks(prev => 
        prev.map(f => f._id === editingFeedback._id ? updatedFeedback : f)
      );
      toast.success('Feedback updated successfully!');
      closeEditModal();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update feedback';
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (feedbackId: string) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) {
      return;
    }

    try {
      setDeletingFeedback(feedbackId);
      await feedbackApi.deleteFeedback(feedbackId);
      setFeedbacks(prev => prev.filter(f => f._id !== feedbackId));
      toast.success('Feedback deleted successfully!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete feedback';
      toast.error(errorMessage);
    } finally {
      setDeletingFeedback(null);
    }
  };

  const handleRatingClick = (rating: number) => {
    setValue('rating', rating);
  };

  const renderStarRating = (rating: number, interactive = false) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? "button" : undefined}
            onClick={interactive ? () => handleRatingClick(star) : undefined}
            className={`w-4 h-4 ${interactive ? 'cursor-pointer' : 'cursor-default'} transition-colors duration-200 ${
              rating >= star
                ? 'text-yellow-400'
                : 'text-gray-300'
            }`}
          >
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
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
              <h1 className="text-3xl font-bold text-gray-900">My Feedback</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage and view all your course feedback
              </p>
            </div>
            <button
              onClick={() => navigate(ROUTES.SUBMIT_FEEDBACK)}
              className="btn-primary"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Submit New Feedback
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {loading ? (
            <div className="flex justify-center">
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
              <h3 className="mt-2 text-sm font-medium text-gray-900">No feedback yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by submitting your first course feedback.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => navigate(ROUTES.SUBMIT_FEEDBACK)}
                  className="btn-primary"
                >
                  Submit Feedback
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Sort Controls */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-700">Sort by:</span>
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [field, order] = e.target.value.split('-');
                      setSortBy(field);
                      setSortOrder(order as 'asc' | 'desc');
                    }}
                    className="text-sm border-gray-300 rounded-md"
                  >
                    <option value="createdAt-desc">Newest First</option>
                    <option value="createdAt-asc">Oldest First</option>
                    <option value="rating-desc">Highest Rating</option>
                    <option value="rating-asc">Lowest Rating</option>
                  </select>
                </div>
                <div className="text-sm text-gray-500">
                  {pagination.totalItems} feedback{pagination.totalItems !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Feedback List */}
              <div className="space-y-6">
                {feedbacks.map((feedback) => (
                  <div key={feedback._id} className="card">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-medium text-gray-900">
                            {typeof feedback.course === 'string' 
                              ? feedback.course 
                              : `${feedback.course.code} - ${feedback.course.name}`}
                          </h3>
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
                          {feedback.isAnonymous && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              Anonymous
                            </span>
                          )}
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
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => openEditModal(feedback)}
                          className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(feedback._id)}
                          disabled={deletingFeedback === feedback._id}
                          className="text-red-600 hover:text-red-800 transition-colors duration-200"
                        >
                          {deletingFeedback === feedback._id ? (
                            <LoadingSpinner size="small" />
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center space-x-2">
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
              )}
            </>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        title="Edit Feedback"
        size="medium"
      >
        <form onSubmit={handleSubmit(handleEdit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course
            </label>
            <select
              {...register('course')}
              className="input-field"
              disabled
            >
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.code} - {course.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating *
            </label>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingClick(star)}
                  className={`w-8 h-8 transition-colors duration-200 ${
                    selectedRating >= star
                      ? 'text-yellow-400 hover:text-yellow-500'
                      : 'text-gray-300 hover:text-gray-400'
                  }`}
                >
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
            {errors.rating && (
              <p className="mt-1 text-sm text-red-600">{errors.rating.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Feedback *
            </label>
            <textarea
              {...register('message')}
              rows={4}
              className="input-field resize-none"
              placeholder="Share your experience..."
            />
            {errors.message && (
              <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
            )}
          </div>

          <div className="flex items-center">
            <input
              {...register('isAnonymous')}
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">
              Submit this feedback anonymously
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={closeEditModal}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Update Feedback
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default FeedbackList;
