import axios, { AxiosInstance, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';
import { getFromStorage } from './helpers';
import {
  User,
  Course,
  Feedback,
  AuthResponse,
  LoginData,
  RegisterData,
  ApiResponse,
  FeedbackPaginatedResponse,
  StudentPaginatedResponse,
  DashboardStats,
  FeedbackFormData,
  ProfileFormData,
  ChangePasswordData,
  CourseFormData,
  FeedbackFilters,
  StudentFilters,
  CourseFilters
} from '../types';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getFromStorage<string | null>('token', null);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      toast.error('Access denied. Insufficient permissions.');
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    } else if (error.code === 'ECONNABORTED') {
      toast.error('Request timeout. Please check your connection.');
    } else if (!error.response) {
      toast.error('Network error. Please check your connection.');
    }
    
    return Promise.reject(error);
  }
);

// Helper function to handle API responses
const handleResponse = <T>(response: AxiosResponse<ApiResponse<T>>): T => {
  if (response.data.success) {
    return response.data.data!;
  } else {
    throw new Error(response.data.message || 'API request failed');
  }
};

// Auth API
export const authApi = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return handleResponse(response);
  },

  changePassword: async (data: ChangePasswordData): Promise<void> => {
    const response = await api.put<ApiResponse>('/auth/change-password', data);
    handleResponse(response);
  },

  logout: async (): Promise<void> => {
    await api.post<ApiResponse>('/auth/logout');
  },
};

// User API
export const userApi = {
  getProfile: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>('/users/profile');
    return handleResponse(response);
  },

  updateProfile: async (data: ProfileFormData): Promise<User> => {
    const response = await api.put<ApiResponse<User>>('/users/profile', data);
    return handleResponse(response);
  },

  uploadProfilePicture: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('profilePicture', file);
    
    const response = await api.post<ApiResponse<{ profilePicture: string }>>(
      '/users/profile/picture',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return handleResponse(response).profilePicture;
  },

  deleteProfilePicture: async (): Promise<void> => {
    const response = await api.delete<ApiResponse>('/users/profile/picture');
    handleResponse(response);
  },

  getStats: async (): Promise<any> => {
    const response = await api.get<ApiResponse<any>>('/users/stats');
    return handleResponse(response);
  },
};

// Course API
export const courseApi = {
  getAllCourses: async (filters?: CourseFilters): Promise<Course[]> => {
    const params = new URLSearchParams();
    if (filters?.active !== undefined) params.append('active', filters.active.toString());
    if (filters?.search) params.append('search', filters.search);

    const response = await api.get<{ success: boolean; count: number; courses: Course[] }>(`/courses?${params}`);
    if (response.data.success) {
      return response.data.courses;
    } else {
      throw new Error('Failed to fetch courses');
    }
  },

  getCourse: async (id: string): Promise<Course> => {
    const response = await api.get<{ success: boolean; course: Course }>(`/courses/${id}`);
    if (response.data.success) {
      return response.data.course;
    } else {
      throw new Error('Failed to fetch course');
    }
  },

  createCourse: async (data: CourseFormData): Promise<Course> => {
    const response = await api.post<{ success: boolean; message: string; course: Course }>('/courses', data);
    if (response.data.success) {
      return response.data.course;
    } else {
      throw new Error('Failed to create course');
    }
  },

  updateCourse: async (id: string, data: Partial<CourseFormData>): Promise<Course> => {
    const response = await api.put<{ success: boolean; message: string; course: Course }>(`/courses/${id}`, data);
    if (response.data.success) {
      return response.data.course;
    } else {
      throw new Error('Failed to update course');
    }
  },

  deleteCourse: async (id: string): Promise<void> => {
    const response = await api.delete<{ success: boolean; message: string }>(`/courses/${id}`);
    if (!response.data.success) {
      throw new Error('Failed to delete course');
    }
  },

  toggleActive: async (id: string): Promise<Course> => {
    const response = await api.patch<{ success: boolean; message: string; course: Course }>(`/courses/${id}/toggle-active`);
    if (response.data.success) {
      return response.data.course;
    } else {
      throw new Error('Failed to toggle course status');
    }
  },
};

// Feedback API
export const feedbackApi = {
  submitFeedback: async (data: FeedbackFormData): Promise<Feedback> => {
    const response = await api.post<{ success: boolean; message: string; feedback: Feedback }>('/feedback', data);
    if (response.data.success) {
      return response.data.feedback;
    } else {
      throw new Error('Failed to submit feedback');
    }
  },

  getMyFeedback: async (filters?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<FeedbackPaginatedResponse> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

    const response = await api.get<FeedbackPaginatedResponse>(`/feedback/my-feedback?${params}`);
    return response.data;
  },

  getFeedback: async (id: string): Promise<Feedback> => {
    const response = await api.get<{ success: boolean; feedback: Feedback }>(`/feedback/${id}`);
    if (response.data.success) {
      return response.data.feedback;
    } else {
      throw new Error('Failed to fetch feedback');
    }
  },

  updateFeedback: async (id: string, data: Partial<FeedbackFormData>): Promise<Feedback> => {
    const response = await api.put<{ success: boolean; message: string; feedback: Feedback }>(`/feedback/${id}`, data);
    if (response.data.success) {
      return response.data.feedback;
    } else {
      throw new Error('Failed to update feedback');
    }
  },

  deleteFeedback: async (id: string): Promise<void> => {
    const response = await api.delete<{ success: boolean; message: string }>(`/feedback/${id}`);
    if (!response.data.success) {
      throw new Error('Failed to delete feedback');
    }
  },

  getCourseStats: async (courseId: string): Promise<any> => {
    const response = await api.get<ApiResponse<any>>(`/feedback/course/${courseId}/stats`);
    return handleResponse(response);
  },
};

// Admin API
export const adminApi = {
  getDashboard: async (): Promise<DashboardStats> => {
    const response = await api.get<{ success: boolean; dashboard: DashboardStats }>('/admin/dashboard');
    if (response.data.success) {
      return response.data.dashboard;
    } else {
      throw new Error('Failed to fetch dashboard data');
    }
  },

  getStudents: async (filters?: StudentFilters): Promise<StudentPaginatedResponse> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

    const response = await api.get<StudentPaginatedResponse>(`/admin/students?${params}`);
    return response.data;
  },

  toggleBlockStudent: async (id: string): Promise<User> => {
    const response = await api.patch<ApiResponse<User>>(`/admin/students/${id}/toggle-block`);
    return handleResponse(response);
  },

  deleteStudent: async (id: string): Promise<void> => {
    const response = await api.delete<ApiResponse>(`/admin/students/${id}`);
    handleResponse(response);
  },

  getAllFeedback: async (filters?: FeedbackFilters): Promise<FeedbackPaginatedResponse> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.course) params.append('course', filters.course);
    if (filters?.rating) params.append('rating', filters.rating.toString());
    if (filters?.student) params.append('student', filters.student);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

    const response = await api.get<FeedbackPaginatedResponse>(`/admin/feedback?${params}`);
    return response.data;
  },

  exportFeedback: async (filters?: FeedbackFilters): Promise<Blob> => {
    const params = new URLSearchParams();
    if (filters?.course) params.append('course', filters.course);
    if (filters?.rating) params.append('rating', filters.rating.toString());
    if (filters?.student) params.append('student', filters.student);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await api.get(`/admin/feedback/export?${params}`, {
      responseType: 'blob',
    });
    
    return response.data;
  },
};

export default api;
