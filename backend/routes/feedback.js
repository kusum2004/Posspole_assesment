const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Feedback = require('../models/Feedback');
const Course = require('../models/Course');
const { protect, student } = require('../middleware/auth');

const router = express.Router();

// @desc    Submit feedback
// @route   POST /api/feedback
// @access  Private (Student)
router.post('/', [
  protect,
  student,
  body('course')
    .isMongoId()
    .withMessage('Please provide a valid course ID'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('message')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Feedback message must be between 10 and 1000 characters'),
  body('isAnonymous')
    .optional()
    .isBoolean()
    .withMessage('isAnonymous must be a boolean'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
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

    const { course, rating, message, isAnonymous, tags } = req.body;

    // Check if course exists and is active
    const courseDoc = await Course.findById(course);
    if (!courseDoc) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (!courseDoc.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot submit feedback for inactive course'
      });
    }

    // Check if student has already submitted feedback for this course
    const existingFeedback = await Feedback.findOne({
      student: req.user.id,
      course: course
    });

    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted feedback for this course'
      });
    }

    // Create feedback
    const feedback = await Feedback.create({
      student: req.user.id,
      course,
      rating,
      message,
      isAnonymous: isAnonymous || false,
      tags: tags || []
    });

    // Populate course and student info for response
    await feedback.populate([
      { path: 'course', select: 'name code' },
      { path: 'student', select: 'name email' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback
    });

  } catch (error) {
    console.error('Submit feedback error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted feedback for this course'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get user's feedback with pagination
// @route   GET /api/feedback/my-feedback
// @access  Private (Student)
router.get('/my-feedback', [
  protect,
  student,
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'rating', 'course'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
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

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const skip = (page - 1) * limit;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder;

    // Get feedback with pagination
    const feedback = await Feedback.find({ student: req.user.id })
      .populate('course', 'name code instructor')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await Feedback.countDocuments({ student: req.user.id });

    res.status(200).json({
      success: true,
      feedback,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });

  } catch (error) {
    console.error('Get my feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get single feedback
// @route   GET /api/feedback/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id)
      .populate('course', 'name code instructor department')
      .populate('student', 'name email');

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Check if user can view this feedback
    if (req.user.role === 'student' && feedback.student._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this feedback'
      });
    }

    res.status(200).json({
      success: true,
      feedback
    });

  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update feedback
// @route   PUT /api/feedback/:id
// @access  Private (Student - own feedback only)
router.put('/:id', [
  protect,
  student,
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('message')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Feedback message must be between 10 and 1000 characters'),
  body('isAnonymous')
    .optional()
    .isBoolean()
    .withMessage('isAnonymous must be a boolean'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
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

    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Check if user owns this feedback
    if (feedback.student.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this feedback'
      });
    }

    const { rating, message, isAnonymous, tags } = req.body;

    // Update fields if provided
    if (rating) feedback.rating = rating;
    if (message) feedback.message = message;
    if (isAnonymous !== undefined) feedback.isAnonymous = isAnonymous;
    if (tags) feedback.tags = tags;

    await feedback.save();

    // Populate for response
    await feedback.populate([
      { path: 'course', select: 'name code' },
      { path: 'student', select: 'name email' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Feedback updated successfully',
      feedback
    });

  } catch (error) {
    console.error('Update feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete feedback
// @route   DELETE /api/feedback/:id
// @access  Private (Student - own feedback only)
router.delete('/:id', [protect, student], async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Check if user owns this feedback
    if (feedback.student.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this feedback'
      });
    }

    await Feedback.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Feedback deleted successfully'
    });

  } catch (error) {
    console.error('Delete feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get feedback statistics for a course
// @route   GET /api/feedback/course/:courseId/stats
// @access  Private
router.get('/course/:courseId/stats', protect, async (req, res) => {
  try {
    const { courseId } = req.params;

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const stats = await Feedback.getCourseStatistics(courseId);

    res.status(200).json({
      success: true,
      course: {
        id: course._id,
        name: course.name,
        code: course.code
      },
      stats
    });

  } catch (error) {
    console.error('Get course stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
