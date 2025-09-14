const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Course = require('../models/Course');
const Feedback = require('../models/Feedback');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all courses (for dropdown in feedback form)
// @route   GET /api/courses
// @access  Private
router.get('/', [
  protect,
  query('active')
    .optional()
    .isBoolean()
    .withMessage('Active must be a boolean'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Search term must not be empty')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { active, search } = req.query;

    // Build query
    let query = {};
    
    // Filter by active status
    if (active !== undefined) {
      query.isActive = active === 'true';
    }

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { instructor: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }

    const courses = await Course.find(query)
      .populate('createdBy', 'name email')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: courses.length,
      courses
    });

  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get single course with statistics
// @route   GET /api/courses/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Get course statistics
    const stats = await course.getStatistics();

    res.status(200).json({
      success: true,
      course: {
        ...course.toJSON(),
        statistics: stats
      }
    });

  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Create course
// @route   POST /api/courses
// @access  Private (Admin)
router.post('/', [
  protect,
  admin,
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Course name must be between 2 and 100 characters'),
  body('code')
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('Course code must be between 2 and 20 characters')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Course code must contain only uppercase letters and numbers'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('instructor')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Instructor name cannot exceed 100 characters'),
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department name cannot exceed 100 characters'),
  body('credits')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Credits must be between 1 and 10')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, code, description, instructor, department, credits } = req.body;

    // Check if course with same name or code already exists
    const existingCourse = await Course.findOne({
      $or: [
        { name: name.trim() },
        { code: code.trim().toUpperCase() }
      ]
    });

    if (existingCourse) {
      return res.status(400).json({
        success: false,
        message: 'Course with this name or code already exists'
      });
    }

    // Create course
    const course = await Course.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description?.trim(),
      instructor: instructor?.trim(),
      department: department?.trim(),
      credits,
      createdBy: req.user.id
    });

    // Populate creator info
    await course.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      course
    });

  } catch (error) {
    console.error('Create course error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Course with this name or code already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private (Admin)
router.put('/:id', [
  protect,
  admin,
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Course name must be between 2 and 100 characters'),
  body('code')
    .optional()
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('Course code must be between 2 and 20 characters')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Course code must contain only uppercase letters and numbers'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('instructor')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Instructor name cannot exceed 100 characters'),
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department name cannot exceed 100 characters'),
  body('credits')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Credits must be between 1 and 10'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const { name, code, description, instructor, department, credits, isActive } = req.body;

    // Check for duplicate name/code if changing them
    if (name || code) {
      const duplicateQuery = [];
      if (name && name.trim() !== course.name) {
        duplicateQuery.push({ name: name.trim() });
      }
      if (code && code.trim().toUpperCase() !== course.code) {
        duplicateQuery.push({ code: code.trim().toUpperCase() });
      }

      if (duplicateQuery.length > 0) {
        const existingCourse = await Course.findOne({
          _id: { $ne: course._id },
          $or: duplicateQuery
        });

        if (existingCourse) {
          return res.status(400).json({
            success: false,
            message: 'Course with this name or code already exists'
          });
        }
      }
    }

    // Update fields if provided
    if (name) course.name = name.trim();
    if (code) course.code = code.trim().toUpperCase();
    if (description !== undefined) course.description = description?.trim();
    if (instructor !== undefined) course.instructor = instructor?.trim();
    if (department !== undefined) course.department = department?.trim();
    if (credits) course.credits = credits;
    if (isActive !== undefined) course.isActive = isActive;

    await course.save();

    // Populate creator info
    await course.populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      course
    });

  } catch (error) {
    console.error('Update course error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Course with this name or code already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private (Admin)
router.delete('/:id', [protect, admin], async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if course has feedback
    const feedbackCount = await Feedback.countDocuments({ course: course._id });
    
    if (feedbackCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete course. It has ${feedbackCount} feedback entries. Consider deactivating instead.`
      });
    }

    await Course.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully'
    });

  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Toggle course active status
// @route   PATCH /api/courses/:id/toggle-active
// @access  Private (Admin)
router.patch('/:id/toggle-active', [protect, admin], async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    course.isActive = !course.isActive;
    await course.save();

    res.status(200).json({
      success: true,
      message: `Course ${course.isActive ? 'activated' : 'deactivated'} successfully`,
      course: {
        id: course._id,
        name: course.name,
        code: course.code,
        isActive: course.isActive
      }
    });

  } catch (error) {
    console.error('Toggle course active error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
