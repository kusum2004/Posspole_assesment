import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { User, PaginationData } from '../../types';
import { adminApi } from '../../utils/api';
import { ROUTES, PAGINATION_CONFIG } from '../../utils/constants';
import { formatDateTime, generateInitials } from '../../utils/helpers';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Layout from '../../components/layout/Layout';

const AdminStudents: React.FC = () => {
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: PAGINATION_CONFIG.defaultLimit,
  });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'blocked'>('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [processingActions, setProcessingActions] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudents();
  }, [pagination.currentPage, search, status, sortBy, sortOrder]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getStudents({
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        search: search || undefined,
        status,
        sortBy,
        sortOrder,
      });
      setStudents(response.students);
      setPagination(response.pagination);
    } catch (error) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    fetchStudents();
  };

  const handleToggleBlock = async (studentId: string, isBlocked: boolean) => {
    if (processingActions.has(studentId)) return;

    const action = isBlocked ? 'unblock' : 'block';
    if (!window.confirm(`Are you sure you want to ${action} this student?`)) {
      return;
    }

    setProcessingActions(prev => new Set(prev).add(studentId));
    try {
      const updatedStudent = await adminApi.toggleBlockStudent(studentId);
      setStudents(prev => 
        prev.map(student => 
          student._id === studentId ? { ...student, isBlocked: updatedStudent.isBlocked } : student
        )
      );
      toast.success(`Student ${action}ed successfully`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || `Failed to ${action} student`;
      toast.error(errorMessage);
    } finally {
      setProcessingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(studentId);
        return newSet;
      });
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (processingActions.has(studentId)) return;

    if (!window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      return;
    }

    setProcessingActions(prev => new Set(prev).add(studentId));
    try {
      await adminApi.deleteStudent(studentId);
      setStudents(prev => prev.filter(student => student._id !== studentId));
      toast.success('Student deleted successfully');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete student';
      toast.error(errorMessage);
    } finally {
      setProcessingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(studentId);
        return newSet;
      });
    }
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
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
              <h1 className="text-3xl font-bold text-gray-900">Manage Students</h1>
              <p className="mt-1 text-sm text-gray-600">
                View and manage all student accounts
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Filters and Search */}
          <div className="card mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <form onSubmit={handleSearch} className="flex-1 max-w-lg">
                <div className="relative">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search students by name or email..."
                    className="input-field pr-10"
                  />
                  <button
                    type="submit"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
              </form>

              <div className="flex items-center space-x-4">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'all' | 'active' | 'blocked')}
                  className="input-field"
                >
                  <option value="all">All Students</option>
                  <option value="active">Active Only</option>
                  <option value="blocked">Blocked Only</option>
                </select>

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
                  <option value="name-asc">Name A-Z</option>
                  <option value="name-desc">Name Z-A</option>
                  <option value="lastLogin-desc">Last Login</option>
                </select>
              </div>
            </div>
          </div>

          {/* Students List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="large" />
            </div>
          ) : students.length === 0 ? (
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
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {search ? 'Try adjusting your search criteria.' : 'No students have registered yet.'}
              </p>
            </div>
          ) : (
            <>
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Joined
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Feedback Count
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {students.map((student) => (
                        <tr key={student._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                {student.profilePicture ? (
                                  <img
                                    className="h-10 w-10 rounded-full object-cover"
                                    src={student.profilePicture}
                                    alt={student.name}
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                    <span className="text-sm font-medium text-primary-600">
                                      {generateInitials(student.name)}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                <div className="text-sm text-gray-500">{student.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {student.phoneNumber || 'Not provided'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {student.address ? student.address.substring(0, 30) + '...' : 'No address'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                student.isBlocked
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {student.isBlocked ? 'Blocked' : 'Active'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDateTime(student.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {(student as any).feedbackCount || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleToggleBlock(student._id, student.isBlocked)}
                                disabled={processingActions.has(student._id)}
                                className={`${
                                  student.isBlocked
                                    ? 'text-green-600 hover:text-green-900'
                                    : 'text-yellow-600 hover:text-yellow-900'
                                } font-medium transition-colors duration-200`}
                              >
                                {processingActions.has(student._id) ? (
                                  <LoadingSpinner size="small" />
                                ) : student.isBlocked ? (
                                  'Unblock'
                                ) : (
                                  'Block'
                                )}
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(student._id)}
                                disabled={processingActions.has(student._id)}
                                className="text-red-600 hover:text-red-900 font-medium transition-colors duration-200"
                              >
                                {processingActions.has(student._id) ? (
                                  <LoadingSpinner size="small" />
                                ) : (
                                  'Delete'
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-700">
                    Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
                    {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
                    {pagination.totalItems} students
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
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AdminStudents;
