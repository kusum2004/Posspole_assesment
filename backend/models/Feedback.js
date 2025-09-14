const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student reference is required']
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course reference is required']
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
    validate: {
      validator: Number.isInteger,
      message: 'Rating must be a whole number'
    }
  },
  message: {
    type: String,
    required: [true, 'Feedback message is required'],
    trim: true,
    minlength: [10, 'Feedback message must be at least 10 characters'],
    maxlength: [1000, 'Feedback message cannot exceed 1000 characters']
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved' // Auto-approve for now, can be changed to 'pending' if moderation is needed
  },
  moderatorNotes: {
    type: String,
    maxlength: [500, 'Moderator notes cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate feedback from same student for same course
feedbackSchema.index({ student: 1, course: 1 }, { unique: true });

// Index for efficient querying
feedbackSchema.index({ course: 1, rating: 1 });
feedbackSchema.index({ student: 1, createdAt: -1 });
feedbackSchema.index({ status: 1 });
feedbackSchema.index({ createdAt: -1 });

// Pre-save middleware to add automatic tags based on rating
feedbackSchema.pre('save', function(next) {
  if (this.isModified('rating') || this.isNew) {
    // Auto-tag based on rating
    if (this.rating >= 4) {
      if (!this.tags.includes('positive')) {
        this.tags.push('positive');
      }
    } else if (this.rating <= 2) {
      if (!this.tags.includes('needs-improvement')) {
        this.tags.push('needs-improvement');
      }
    } else {
      if (!this.tags.includes('neutral')) {
        this.tags.push('neutral');
      }
    }
  }
  next();
});

// Static method to get feedback statistics for a course
feedbackSchema.statics.getCourseStatistics = async function(courseId) {
  const stats = await this.aggregate([
    { $match: { course: mongoose.Types.ObjectId(courseId), status: 'approved' } },
    {
      $group: {
        _id: null,
        totalFeedback: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    }
  ]);

  if (stats.length === 0) {
    return {
      totalFeedback: 0,
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }

  const ratingDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  stats[0].ratingDistribution.forEach(rating => {
    ratingDist[rating] = (ratingDist[rating] || 0) + 1;
  });

  return {
    totalFeedback: stats[0].totalFeedback,
    averageRating: Math.round(stats[0].averageRating * 100) / 100,
    ratingDistribution: ratingDist
  };
};

// Static method to get overall statistics
feedbackSchema.statics.getOverallStatistics = async function() {
  const stats = await this.aggregate([
    { $match: { status: 'approved' } },
    {
      $group: {
        _id: null,
        totalFeedback: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    }
  ]);

  const courseStats = await this.aggregate([
    { $match: { status: 'approved' } },
    {
      $group: {
        _id: '$course',
        count: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    },
    {
      $group: {
        _id: null,
        totalCourses: { $sum: 1 },
        avgFeedbackPerCourse: { $avg: '$count' }
      }
    }
  ]);

  const result = {
    totalFeedback: 0,
    averageRating: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    totalCourses: 0,
    avgFeedbackPerCourse: 0
  };

  if (stats.length > 0) {
    const ratingDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    stats[0].ratingDistribution.forEach(rating => {
      ratingDist[rating] = (ratingDist[rating] || 0) + 1;
    });

    result.totalFeedback = stats[0].totalFeedback;
    result.averageRating = Math.round(stats[0].averageRating * 100) / 100;
    result.ratingDistribution = ratingDist;
  }

  if (courseStats.length > 0) {
    result.totalCourses = courseStats[0].totalCourses;
    result.avgFeedbackPerCourse = Math.round(courseStats[0].avgFeedbackPerCourse * 100) / 100;
  }

  return result;
};

module.exports = mongoose.model('Feedback', feedbackSchema);
