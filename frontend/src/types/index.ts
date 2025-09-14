// User types
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: string;
  profilePicture?: string | null;
  isBlocked: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  age?: number;
}

// Course types
export interface Course {
  _id: string;
  name: string;
  code: string;
  description?: string;
  instructor?: string;
  department?: string;
  credits?: number;
  isActive: boolean;
  createdBy: string | User;
  createdAt: string;
  updatedAt: string;
  feedbackCount?: number;
  averageRating?: number;
  statistics?: CourseStatistics;
}

export interface CourseStatistics {
  averageRating: number;
  totalFeedback: number;
  ratingDistribution: { [key: number]: number };
}

// Feedback types
export interface Feedback {
  _id: string;
  student: string | User;
  course: string | Course;
  rating: number;
  message: string;
  isAnonymous: boolean;
  tags: string[];
  status: 'pending' | 'approved' | 'rejected';
  moderatorNotes?: string;
  createdAt: string;
  updatedAt: string;
}

// Auth types
export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role?: 'student' | 'admin';
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
  message?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationData;
}

export interface FeedbackPaginatedResponse {
  success: boolean;
  feedback: Feedback[];
  pagination: PaginationData;
}

export interface StudentPaginatedResponse {
  success: boolean;
  students: User[];
  pagination: PaginationData;
}

// Dashboard types
export interface DashboardStats {
  users: {
    totalStudents: number;
    activeStudents: number;
    blockedStudents: number;
  };
  courses: {
    totalCourses: number;
    activeCourses: number;
    inactiveCourses: number;
  };
  feedback: {
    totalFeedback: number;
    averageRating: number;
    ratingDistribution: { [key: number]: number };
    recentFeedback: number;
  };
  activity: {
    recentStudents: number;
    recentFeedback: number;
  };
  topCourses: Array<{
    courseId: string;
    courseName: string;
    courseCode: string;
    feedbackCount: number;
    averageRating: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    count: number;
    averageRating: number;
  }>;
}

// Form types
export interface FeedbackFormData {
  course: string;
  rating: number;
  message: string;
  isAnonymous: boolean;
  tags?: string[];
}

export interface ProfileFormData {
  name: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface CourseFormData {
  name: string;
  code: string;
  description?: string;
  instructor?: string;
  department?: string;
  credits?: number;
}

// Filter and sort types
export interface FeedbackFilters {
  course?: string;
  rating?: number;
  student?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface StudentFilters {
  search?: string;
  status?: 'active' | 'blocked' | 'all';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CourseFilters {
  active?: boolean;
  search?: string;
}

// Context types
export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isStudent: boolean;
}

// Component props types
export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'student' | 'admin';
}

export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
}

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}
