import * as yup from 'yup';

// Common validation schemas
export const emailSchema = yup
  .string()
  .email('Please enter a valid email address')
  .required('Email is required');

export const passwordSchema = yup
  .string()
  .min(8, 'Password must be at least 8 characters')
  .matches(
    /^(?=.*[!@#$%^&*(),.?":{}|<>])(?=.*\d).{8,}$/,
    'Password must contain at least 1 special character and 1 number'
  )
  .required('Password is required');

export const nameSchema = yup
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name cannot exceed 50 characters')
  .required('Name is required');

export const phoneSchema = yup
  .string()
  .matches(/^\+?[\d\s-()]+$/, 'Please enter a valid phone number')
  .nullable();

// Auth schemas
export const loginSchema = yup.object({
  email: emailSchema,
  password: yup.string().required('Password is required'),
});

export const registerSchema = yup.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});

export const changePasswordSchema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: passwordSchema,
  confirmNewPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'Passwords must match')
    .required('Please confirm your new password'),
});

// Profile schema
export const profileSchema = yup.object({
  name: nameSchema,
  phoneNumber: yup
    .string()
    .matches(/^\+?[\d\s-()]+$/, 'Please enter a valid phone number')
    .optional(),
  dateOfBirth: yup
    .string()
    .optional(),
  address: yup
    .string()
    .max(200, 'Address cannot exceed 200 characters')
    .optional(),
});

// Feedback schema
export const feedbackSchema = yup.object({
  course: yup.string().required('Please select a course'),
  rating: yup
    .number()
    .min(1, 'Rating must be between 1 and 5')
    .max(5, 'Rating must be between 1 and 5')
    .required('Rating is required'),
  message: yup
    .string()
    .min(10, 'Feedback message must be at least 10 characters')
    .max(1000, 'Feedback message cannot exceed 1000 characters')
    .required('Feedback message is required'),
  isAnonymous: yup.boolean().default(false),
  tags: yup.array().of(yup.string()).default([]),
});

// Course schema
export const courseSchema = yup.object({
  name: yup
    .string()
    .min(2, 'Course name must be at least 2 characters')
    .max(100, 'Course name cannot exceed 100 characters')
    .required('Course name is required'),
  code: yup
    .string()
    .min(2, 'Course code must be at least 2 characters')
    .max(20, 'Course code cannot exceed 20 characters')
    .matches(/^[A-Z0-9]+$/, 'Course code must contain only uppercase letters and numbers')
    .required('Course code is required'),
  description: yup
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional(),
  instructor: yup
    .string()
    .max(100, 'Instructor name cannot exceed 100 characters')
    .optional(),
  department: yup
    .string()
    .max(100, 'Department name cannot exceed 100 characters')
    .optional(),
  credits: yup
    .number()
    .min(1, 'Credits must be at least 1')
    .max(10, 'Credits cannot exceed 10')
    .integer('Credits must be a whole number')
    .optional(),
});

// Validation helper functions
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  
  if (!/(?=.*[!@#$%^&*(),.?":{}|<>])/.test(password)) {
    errors.push('Password must contain at least 1 special character');
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least 1 number');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateFile = (
  file: File,
  options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}
): { isValid: boolean; error?: string } => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'],
  } = options;

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size must be less than ${(maxSize / (1024 * 1024)).toFixed(1)}MB`,
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!allowedExtensions.includes(fileExtension)) {
    return {
      isValid: false,
      error: `File extension not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`,
    };
  }

  return { isValid: true };
};
