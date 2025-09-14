import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import toast from 'react-hot-toast';
import { Course, CourseFormData } from '../../types';
import { courseApi } from '../../utils/api';
import { courseSchema } from '../../utils/validation';
import { ROUTES } from '../../utils/constants';
import { formatDateTime } from '../../utils/helpers';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import Layout from '../../components/layout/Layout';

const AdminCourses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [processingActions, setProcessingActions] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CourseFormData>({
    resolver: yupResolver(courseSchema) as any,
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const coursesData = await courseApi.getAllCourses();
      setCourses(coursesData);
    } catch (error) {
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(search.toLowerCase()) ||
                         course.code.toLowerCase().includes(search.toLowerCase()) ||
                         (course.instructor?.toLowerCase().includes(search.toLowerCase()) ?? false);
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && course.isActive) ||
                         (statusFilter === 'inactive' && !course.isActive);
    
    return matchesSearch && matchesStatus;
  });

  const openCreateModal = () => {
    reset();
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    reset();
  };

  const openEditModal = (course: Course) => {
    setEditingCourse(course);
    setValue('name', course.name);
    setValue('code', course.code);
    setValue('description', course.description || '');
    setValue('instructor', course.instructor || '');
    setValue('department', course.department || '');
    setValue('credits', course.credits);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingCourse(null);
    reset();
  };

  const handleCreate = async (data: CourseFormData) => {
    setSubmitting(true);
    try {
      const newCourse = await courseApi.createCourse(data);
      setCourses(prev => [newCourse, ...prev]);
      toast.success('Course created successfully!');
      closeCreateModal();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to create course';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (data: CourseFormData) => {
    if (!editingCourse) return;

    setSubmitting(true);
    try {
      const updatedCourse = await courseApi.updateCourse(editingCourse._id, data);
      setCourses(prev => 
        prev.map(course => course._id === editingCourse._id ? updatedCourse : course)
      );
      toast.success('Course updated successfully!');
      closeEditModal();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update course';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (courseId: string, isActive: boolean) => {
    if (processingActions.has(courseId)) return;

    const action = isActive ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} this course?`)) {
      return;
    }

    setProcessingActions(prev => new Set(prev).add(courseId));
    try {
      const updatedCourse = await courseApi.toggleActive(courseId);
      setCourses(prev => 
        prev.map(course => 
          course._id === courseId ? { ...course, isActive: updatedCourse.isActive } : course
        )
      );
      toast.success(`Course ${action}d successfully`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || `Failed to ${action} course`;
      toast.error(errorMessage);
    } finally {
      setProcessingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(courseId);
        return newSet;
      });
    }
  };

  const handleDelete = async (courseId: string) => {
    if (processingActions.has(courseId)) return;

    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }

    setProcessingActions(prev => new Set(prev).add(courseId));
    try {
      await courseApi.deleteCourse(courseId);
      setCourses(prev => prev.filter(course => course._id !== courseId));
      toast.success('Course deleted successfully');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete course';
      toast.error(errorMessage);
    } finally {
      setProcessingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(courseId);
        return newSet;
      });
    }
  };

  return (
    <Layout>
      {/* Header */}
      <div className="bg-white shadow mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
              <p className="mt-1 text-sm text-gray-600">
                Create, edit, and manage course offerings
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={openCreateModal}
                className="btn-primary"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Course
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Filters */}
          <div className="card mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1 max-w-lg">
                <div className="relative">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search courses by name, code, or instructor..."
                    className="input-field pr-10"
                  />
                  <svg className="absolute inset-y-0 right-0 pr-3 flex items-center h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                  className="input-field"
                >
                  <option value="all">All Courses</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Courses List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="large" />
            </div>
          ) : filteredCourses.length === 0 ? (
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
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No courses found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {search ? 'Try adjusting your search criteria.' : 'Get started by creating your first course.'}
              </p>
              {!search && (
                <div className="mt-6">
                  <button onClick={openCreateModal} className="btn-primary">
                    Add Course
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <div key={course._id} className="card">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{course.name}</h3>
                      <p className="text-sm text-gray-600">{course.code}</p>
                    </div>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        course.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {course.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {course.description && (
                    <p className="text-sm text-gray-700 mb-3 line-clamp-2">{course.description}</p>
                  )}

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    {course.instructor && (
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {course.instructor}
                      </div>
                    )}
                    {course.department && (
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {course.department}
                      </div>
                    )}
                    {course.credits && (
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                        {course.credits} Credits
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-gray-500 mb-4">
                    Created {formatDateTime(course.createdAt)}
                  </div>

                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => openEditModal(course)}
                      className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleToggleActive(course._id, course.isActive)}
                      disabled={processingActions.has(course._id)}
                      className={`${
                        course.isActive
                          ? 'text-yellow-600 hover:text-yellow-800'
                          : 'text-green-600 hover:text-green-800'
                      } transition-colors duration-200`}
                    >
                      {processingActions.has(course._id) ? (
                        <LoadingSpinner size="small" />
                      ) : course.isActive ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18 12M6 6l12 12" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(course._id)}
                      disabled={processingActions.has(course._id)}
                      className="text-red-600 hover:text-red-800 transition-colors duration-200"
                    >
                      {processingActions.has(course._id) ? (
                        <LoadingSpinner size="small" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Course Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        title="Create New Course"
        size="medium"
      >
        <form onSubmit={handleSubmit(handleCreate)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course Name *
            </label>
            <input
              {...register('name')}
              className={`input-field ${errors.name ? 'border-red-500' : ''}`}
              placeholder="Enter course name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course Code *
            </label>
            <input
              {...register('code')}
              className={`input-field ${errors.code ? 'border-red-500' : ''}`}
              placeholder="e.g., CS101"
            />
            {errors.code && (
              <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className={`input-field resize-none ${errors.description ? 'border-red-500' : ''}`}
              placeholder="Course description"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Instructor
            </label>
            <input
              {...register('instructor')}
              className={`input-field ${errors.instructor ? 'border-red-500' : ''}`}
              placeholder="Instructor name"
            />
            {errors.instructor && (
              <p className="mt-1 text-sm text-red-600">{errors.instructor.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <input
              {...register('department')}
              className={`input-field ${errors.department ? 'border-red-500' : ''}`}
              placeholder="Department name"
            />
            {errors.department && (
              <p className="mt-1 text-sm text-red-600">{errors.department.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Credits
            </label>
            <input
              {...register('credits', { valueAsNumber: true })}
              type="number"
              min="1"
              max="10"
              className={`input-field ${errors.credits ? 'border-red-500' : ''}`}
              placeholder="Number of credits"
            />
            {errors.credits && (
              <p className="mt-1 text-sm text-red-600">{errors.credits.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={closeCreateModal}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex items-center"
            >
              {submitting ? (
                <>
                  <LoadingSpinner size="small" className="mr-2" />
                  Creating...
                </>
              ) : (
                'Create Course'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Course Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        title="Edit Course"
        size="medium"
      >
        <form onSubmit={handleSubmit(handleEdit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course Name *
            </label>
            <input
              {...register('name')}
              className={`input-field ${errors.name ? 'border-red-500' : ''}`}
              placeholder="Enter course name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course Code *
            </label>
            <input
              {...register('code')}
              className={`input-field ${errors.code ? 'border-red-500' : ''}`}
              placeholder="e.g., CS101"
            />
            {errors.code && (
              <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className={`input-field resize-none ${errors.description ? 'border-red-500' : ''}`}
              placeholder="Course description"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Instructor
            </label>
            <input
              {...register('instructor')}
              className={`input-field ${errors.instructor ? 'border-red-500' : ''}`}
              placeholder="Instructor name"
            />
            {errors.instructor && (
              <p className="mt-1 text-sm text-red-600">{errors.instructor.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <input
              {...register('department')}
              className={`input-field ${errors.department ? 'border-red-500' : ''}`}
              placeholder="Department name"
            />
            {errors.department && (
              <p className="mt-1 text-sm text-red-600">{errors.department.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Credits
            </label>
            <input
              {...register('credits', { valueAsNumber: true })}
              type="number"
              min="1"
              max="10"
              className={`input-field ${errors.credits ? 'border-red-500' : ''}`}
              placeholder="Number of credits"
            />
            {errors.credits && (
              <p className="mt-1 text-sm text-red-600">{errors.credits.message}</p>
            )}
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
              disabled={submitting}
              className="btn-primary flex items-center"
            >
              {submitting ? (
                <>
                  <LoadingSpinner size="small" className="mr-2" />
                  Updating...
                </>
              ) : (
                'Update Course'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default AdminCourses;
