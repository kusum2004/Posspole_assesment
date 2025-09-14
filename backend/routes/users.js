const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const User = require('../models/User');
const { protect, student } = require('../middleware/auth');

const router = express.Router();



// Configure Cloudinary
cloudinary.config({
  cloud_name: 'direyswcf',
  api_key: '983761629456714',
  api_secret: 'GDLQFfoYL61aZcxcurlfAOSv858'
});

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', [
  protect,
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('phoneNumber')
    .optional()
    .matches(/^\+?[\d\s-()]+$/)
    .withMessage('Please provide a valid phone number'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date')
    .custom((value) => {
      if (new Date(value) >= new Date()) {
        throw new Error('Date of birth must be in the past');
      }
      return true;
    }),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address cannot exceed 200 characters')
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

    const { name, phoneNumber, dateOfBirth, address } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields if provided
    if (name) user.name = name;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;
    if (address !== undefined) user.address = address; // Allow empty string

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Upload profile picture
// @route   POST /api/users/profile/picture
// @access  Private
router.post('/profile/picture', protect, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Upload to Cloudinary
    const uploadPromise = new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'student_feedback_app/profile_pictures',
          public_id: `user_${user._id}`,
          transformation: [
            { width: 300, height: 300, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    try {
      const result = await uploadPromise;
      
      // Delete old image if it exists
      if (user.profilePicture) {
        try {
          await cloudinary.uploader.destroy(`student_feedback_app/profile_pictures/user_${user._id}`);
        } catch (deleteError) {
          console.log('Failed to delete old profile picture:', deleteError);
        }
      }

      // Update user profile picture URL
      user.profilePicture = result.secure_url;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Profile picture uploaded successfully',
        profilePicture: result.secure_url
      });

    } catch (uploadError) {
      console.error('Cloudinary upload error:', uploadError);
      res.status(500).json({
        success: false,
        message: 'Failed to upload image'
      });
    }

  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete profile picture
// @route   DELETE /api/users/profile/picture
// @access  Private
router.delete('/profile/picture', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.profilePicture) {
      return res.status(400).json({
        success: false,
        message: 'No profile picture to delete'
      });
    }

    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(`student_feedback_app/profile_pictures/user_${user._id}`);
    } catch (deleteError) {
      console.log('Failed to delete from Cloudinary:', deleteError);
      // Continue with database update even if Cloudinary deletion fails
    }

    // Remove profile picture URL from user
    user.profilePicture = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile picture deleted successfully'
    });

  } catch (error) {
    console.error('Delete profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get user statistics (for students)
// @route   GET /api/users/stats
// @access  Private (Student)
router.get('/stats', [protect, student], async (req, res) => {
  try {
    const Feedback = require('../models/Feedback');
    
    // Get user's feedback statistics
    const stats = await Feedback.aggregate([
      { $match: { student: req.user._id } },
      {
        $group: {
          _id: null,
          totalFeedback: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          ratingDistribution: { $push: '$rating' }
        }
      }
    ]);

    let result = {
      totalFeedback: 0,
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };

    if (stats.length > 0) {
      const ratingDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      stats[0].ratingDistribution.forEach(rating => {
        ratingDist[rating] = (ratingDist[rating] || 0) + 1;
      });

      result = {
        totalFeedback: stats[0].totalFeedback,
        averageRating: Math.round(stats[0].averageRating * 100) / 100,
        ratingDistribution: ratingDist
      };
    }

    res.status(200).json({
      success: true,
      stats: result
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
