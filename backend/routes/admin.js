const express = require('express');
const { body, query, validationResult } = require('express-validator');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Course = require('../models/Course');
const Feedback = require('../models/Feedback');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
router.get('/dashboard', [protect, admin], async (req, res) => {
  try {
    // Get user statistics
    const totalStudents = await User.countDocuments({ role: 'student' });
    const activeStudents = await User.countDocuments({ 
      role: 'student', 
      isBlocked: false 
    });
    const blockedStudents = totalStudents - activeStudents;

    // Get course statistics
    const totalCourses = await Course.countDocuments();
    const activeCourses = await Course.countDocuments({ isActive: true });

    // Get feedback statistics
    const feedbackStats = await Feedback.getOverallStatistics();

    // Get recent activity (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentFeedback = await Feedback.countDocuments({
      createdAt: { $gte: oneWeekAgo }
    });

    const recentStudents = await User.countDocuments({
      role: 'student',
      createdAt: { $gte: oneWeekAgo }
    });

    // Get top courses by feedback count
    const topCourses = await Feedback.aggregate([
      { $match: { status: 'approved' } },
      {
        $group: {
          _id: '$course',
          feedbackCount: { $sum: 1 },
          averageRating: { $avg: '$rating' }
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'course'
        }
      },
      { $unwind: '$course' },
      {
        $project: {
          _id: 0,
          courseId: '$_id',
          courseName: '$course.name',
          courseCode: '$course.code',
          feedbackCount: 1,
          averageRating: { $round: ['$averageRating', 2] }
        }
      },
      { $sort: { feedbackCount: -1 } },
      { $limit: 5 }
    ]);

    // Get monthly feedback trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrends = await Feedback.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          averageRating: { $avg: '$rating' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              { $cond: [
                { $lt: ['$_id.month', 10] },
                { $concat: ['0', { $toString: '$_id.month' }] },
                { $toString: '$_id.month' }
              ]}
            ]
          },
          count: 1,
          averageRating: { $round: ['$averageRating', 2] }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      dashboard: {
        users: {
          totalStudents,
          activeStudents,
          blockedStudents
        },
        courses: {
          totalCourses,
          activeCourses,
          inactiveCourses: totalCourses - activeCourses
        },
        feedback: {
          ...feedbackStats,
          recentFeedback
        },
        activity: {
          recentStudents,
          recentFeedback
        },
        topCourses,
        monthlyTrends
      }
    });

  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get all students with pagination and filters
// @route   GET /api/admin/students
// @access  Private (Admin)
router.get('/students', [
  protect,
  admin,
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Search term must not be empty'),
  query('status')
    .optional()
    .isIn(['active', 'blocked', 'all'])
    .withMessage('Status must be active, blocked, or all'),
  query('sortBy')
    .optional()
    .isIn(['name', 'email', 'createdAt', 'lastLogin'])
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
    const search = req.query.search;
    const status = req.query.status || 'all';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const skip = (page - 1) * limit;

    // Build query
    let query = { role: 'student' };

    // Filter by status
    if (status === 'active') {
      query.isBlocked = false;
    } else if (status === 'blocked') {
      query.isBlocked = true;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder;

    // Get students with pagination
    const students = await User.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('-password');

    // Get total count
    const total = await User.countDocuments(query);

    // Get feedback count for each student
    const studentsWithStats = await Promise.all(
      students.map(async (student) => {
        const feedbackCount = await Feedback.countDocuments({ 
          student: student._id 
        });
        
        return {
          ...student.toJSON(),
          feedbackCount
        };
      })
    );

    res.status(200).json({
      success: true,
      students: studentsWithStats,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });

  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Block/Unblock student
// @route   PATCH /api/admin/students/:id/toggle-block
// @access  Private (Admin)
router.patch('/students/:id/toggle-block', [protect, admin], async (req, res) => {
  try {
    const student = await User.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    if (student.role !== 'student') {
      return res.status(400).json({
        success: false,
        message: 'Can only block/unblock students'
      });
    }

    if (student._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot block yourself'
      });
    }

    student.isBlocked = !student.isBlocked;
    await student.save();

    res.status(200).json({
      success: true,
      message: `Student ${student.isBlocked ? 'blocked' : 'unblocked'} successfully`,
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        isBlocked: student.isBlocked
      }
    });

  } catch (error) {
    console.error('Toggle block student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete student
// @route   DELETE /api/admin/students/:id
// @access  Private (Admin)
router.delete('/students/:id', [protect, admin], async (req, res) => {
  try {
    const student = await User.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    if (student.role !== 'student') {
      return res.status(400).json({
        success: false,
        message: 'Can only delete students'
      });
    }

    if (student._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete yourself'
      });
    }

    // Check if student has feedback
    const feedbackCount = await Feedback.countDocuments({ student: student._id });
    
    if (feedbackCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete student. They have ${feedbackCount} feedback entries. Consider blocking instead.`
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Student deleted successfully'
    });

  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get all feedback with filters and pagination
// @route   GET /api/admin/feedback
// @access  Private (Admin)
router.get('/feedback', [
  protect,
  admin,
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('course')
    .optional()
    .isMongoId()
    .withMessage('Course must be a valid ID'),
  query('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  query('student')
    .optional()
    .isMongoId()
    .withMessage('Student must be a valid ID'),
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
    const { course, rating, student } = req.query;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const skip = (page - 1) * limit;

    // Build query
    let query = {};

    if (course) query.course = course;
    if (rating) query.rating = parseInt(rating);
    if (student) query.student = student;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder;

    // Get feedback with pagination
    const feedback = await Feedback.find(query)
      .populate('course', 'name code instructor')
      .populate('student', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await Feedback.countDocuments(query);

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
    console.error('Get admin feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Export feedback to CSV
// @route   GET /api/admin/feedback/export
// @access  Private (Admin)
router.get('/feedback/export', [
  protect,
  admin,
  query('course')
    .optional()
    .isMongoId()
    .withMessage('Course must be a valid ID'),
  query('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  query('student')
    .optional()
    .isMongoId()
    .withMessage('Student must be a valid ID'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date')
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

    const { course, rating, student, startDate, endDate } = req.query;

    // Build query
    let query = {};

    if (course) query.course = course;
    if (rating) query.rating = parseInt(rating);
    if (student) query.student = student;

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Get all feedback matching the query
    const feedback = await Feedback.find(query)
      .populate('course', 'name code instructor department')
      .populate('student', 'name email')
      .sort({ createdAt: -1 });

    // Prepare data for CSV
    const csvData = feedback.map(item => ({
      'Feedback ID': item._id.toString(),
      'Student Name': item.isAnonymous ? 'Anonymous' : item.student.name,
      'Student Email': item.isAnonymous ? 'Anonymous' : item.student.email,
      'Course Name': item.course.name,
      'Course Code': item.course.code,
      'Instructor': item.course.instructor || 'N/A',
      'Department': item.course.department || 'N/A',
      'Rating': item.rating,
      'Message': item.message,
      'Tags': item.tags.join(', '),
      'Is Anonymous': item.isAnonymous ? 'Yes' : 'No',
      'Status': item.status,
      'Created At': item.createdAt.toISOString(),
      'Updated At': item.updatedAt.toISOString()
    }));

    // Create CSV file
    const fileName = `feedback_export_${Date.now()}.csv`;
    const filePath = path.join(__dirname, '../temp', fileName);

    // Ensure temp directory exists
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const csvWriter = createCsvWriter({
      path: filePath,
      header: [
        { id: 'Feedback ID', title: 'Feedback ID' },
        { id: 'Student Name', title: 'Student Name' },
        { id: 'Student Email', title: 'Student Email' },
        { id: 'Course Name', title: 'Course Name' },
        { id: 'Course Code', title: 'Course Code' },
        { id: 'Instructor', title: 'Instructor' },
        { id: 'Department', title: 'Department' },
        { id: 'Rating', title: 'Rating' },
        { id: 'Message', title: 'Message' },
        { id: 'Tags', title: 'Tags' },
        { id: 'Is Anonymous', title: 'Is Anonymous' },
        { id: 'Status', title: 'Status' },
        { id: 'Created At', title: 'Created At' },
        { id: 'Updated At', title: 'Updated At' }
      ]
    });

    await csvWriter.writeRecords(csvData);

    // Send file
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('CSV download error:', err);
        res.status(500).json({
          success: false,
          message: 'Error downloading file'
        });
      }

      // Clean up temporary file
      setTimeout(() => {
        try {
          fs.unlinkSync(filePath);
        } catch (cleanupError) {
          console.log('Error cleaning up CSV file:', cleanupError);
        }
      }, 10000); // Delete after 10 seconds
    });

  } catch (error) {
    console.error('Export feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
