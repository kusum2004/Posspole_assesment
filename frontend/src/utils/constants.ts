// App configuration
export const APP_CONFIG = {
  name: 'Student Feedback App',
  version: '1.0.0',
  description: 'A comprehensive platform for student feedback management',
  author: 'Student Feedback Team',
};

// API configuration
export const API_CONFIG = {
  baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000,
};

// Authentication configuration
export const AUTH_CONFIG = {
  tokenKey: 'token',
  userKey: 'user',
  sessionTimeout: 7 * 24 * 60 * 60 * 1000, // 7 days
  rememberMeKey: 'rememberMe',
};

// Pagination configuration
export const PAGINATION_CONFIG = {
  defaultPage: 1,
  defaultLimit: 10,
  maxLimit: 100,
  pageSizes: [5, 10, 20, 50],
};

// File upload configuration
export const FILE_CONFIG = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  allowedImageExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  cloudinaryFolder: 'student_feedback_app/profile_pictures',
};

// Validation constants
export const VALIDATION_CONFIG = {
  password: {
    minLength: 8,
    maxLength: 128,
    requireSpecialChar: true,
    requireNumber: true,
    requireUppercase: false,
    requireLowercase: false,
  },
  name: {
    minLength: 2,
    maxLength: 50,
  },
  email: {
    maxLength: 255,
  },
  feedback: {
    messageMinLength: 10,
    messageMaxLength: 1000,
    maxTags: 10,
    tagMaxLength: 50,
  },
  course: {
    nameMinLength: 2,
    nameMaxLength: 100,
    codeMinLength: 2,
    codeMaxLength: 20,
    descriptionMaxLength: 500,
    instructorMaxLength: 100,
    departmentMaxLength: 100,
    minCredits: 1,
    maxCredits: 10,
  },
  profile: {
    addressMaxLength: 200,
    phoneMaxLength: 20,
  },
};

// Rating configuration
export const RATING_CONFIG = {
  min: 1,
  max: 5,
  step: 1,
  labels: {
    1: 'Very Poor',
    2: 'Poor',
    3: 'Average',
    4: 'Good',
    5: 'Excellent',
  },
  colors: {
    1: 'text-red-600',
    2: 'text-orange-600',
    3: 'text-yellow-600',
    4: 'text-blue-600',
    5: 'text-green-600',
  },
  bgColors: {
    1: 'bg-red-100',
    2: 'bg-orange-100',
    3: 'bg-yellow-100',
    4: 'bg-blue-100',
    5: 'bg-green-100',
  },
};

// User roles
export const USER_ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin',
} as const;

// Feedback status
export const FEEDBACK_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

// Sort options
export const SORT_OPTIONS = {
  feedback: [
    { value: 'createdAt', label: 'Date Created' },
    { value: 'rating', label: 'Rating' },
    { value: 'course', label: 'Course' },
  ],
  students: [
    { value: 'name', label: 'Name' },
    { value: 'email', label: 'Email' },
    { value: 'createdAt', label: 'Registration Date' },
    { value: 'lastLogin', label: 'Last Login' },
  ],
  courses: [
    { value: 'name', label: 'Course Name' },
    { value: 'code', label: 'Course Code' },
    { value: 'createdAt', label: 'Date Created' },
  ],
};

// Filter options
export const FILTER_OPTIONS = {
  status: [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'blocked', label: 'Blocked' },
  ],
  rating: [
    { value: '', label: 'All Ratings' },
    { value: '5', label: '5 Stars' },
    { value: '4', label: '4 Stars' },
    { value: '3', label: '3 Stars' },
    { value: '2', label: '2 Stars' },
    { value: '1', label: '1 Star' },
  ],
};

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  FEEDBACK: '/feedback',
  SUBMIT_FEEDBACK: '/feedback/submit',
  MY_FEEDBACK: '/feedback/my-feedback',
  ADMIN: '/admin',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_STUDENTS: '/admin/students',
  ADMIN_FEEDBACK: '/admin/feedback',
  ADMIN_COURSES: '/admin/courses',
  COURSES: '/courses',
  NOT_FOUND: '/404',
};

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  REMEMBER_ME: 'rememberMe',
  SIDEBAR_COLLAPSED: 'sidebarCollapsed',
  FEEDBACK_FILTERS: 'feedbackFilters',
  STUDENT_FILTERS: 'studentFilters',
};

// Toast configuration
export const TOAST_CONFIG = {
  position: 'top-right' as const,
  duration: 4000,
  success: {
    duration: 3000,
    style: {
      background: '#10B981',
      color: '#fff',
    },
  },
  error: {
    duration: 5000,
    style: {
      background: '#EF4444',
      color: '#fff',
    },
  },
  loading: {
    style: {
      background: '#3B82F6',
      color: '#fff',
    },
  },
};

// Chart configuration
export const CHART_CONFIG = {
  colors: {
    primary: '#3B82F6',
    secondary: '#10B981',
    tertiary: '#F59E0B',
    quaternary: '#EF4444',
    quinary: '#8B5CF6',
  },
  gradients: {
    blue: ['#3B82F6', '#1D4ED8'],
    green: ['#10B981', '#047857'],
    orange: ['#F59E0B', '#D97706'],
    red: ['#EF4444', '#DC2626'],
    purple: ['#8B5CF6', '#7C3AED'],
  },
};

// Animation durations
export const ANIMATION_DURATION = {
  fast: 150,
  normal: 300,
  slow: 500,
  extraSlow: 700,
};

// Breakpoints (matching Tailwind CSS)
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied. Insufficient permissions.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  FILE_TOO_LARGE: 'File size is too large.',
  INVALID_FILE_TYPE: 'Invalid file type.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  GENERIC_ERROR: 'An unexpected error occurred.',
};

// Success messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  REGISTER_SUCCESS: 'Registration successful!',
  LOGOUT_SUCCESS: 'Logged out successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  PASSWORD_CHANGED: 'Password changed successfully!',
  FEEDBACK_SUBMITTED: 'Feedback submitted successfully!',
  FEEDBACK_UPDATED: 'Feedback updated successfully!',
  FEEDBACK_DELETED: 'Feedback deleted successfully!',
  COURSE_CREATED: 'Course created successfully!',
  COURSE_UPDATED: 'Course updated successfully!',
  COURSE_DELETED: 'Course deleted successfully!',
  FILE_UPLOADED: 'File uploaded successfully!',
  DATA_EXPORTED: 'Data exported successfully!',
  SETTINGS_SAVED: 'Settings saved successfully!',
};

// Regular expressions
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[!@#$%^&*(),.?":{}|<>])(?=.*\d).{8,}$/,
  PHONE: /^\+?[\d\s-()]+$/,
  COURSE_CODE: /^[A-Z0-9]+$/,
  URL: /^https?:\/\/(?:[-\w.])+(?::[0-9]+)?(?:\/(?:[\w/_.])*(?:\?(?:[\w&=%.])*)?(?:#(?:[\w.])*)?)?$/,
};

// Default values
export const DEFAULT_VALUES = {
  PAGE_SIZE: 10,
  DEBOUNCE_DELAY: 300,
  SEARCH_MIN_LENGTH: 2,
  RETRY_ATTEMPTS: 3,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
};
