const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a course name'],
    trim: true,
    maxlength: [100, 'Course name cannot exceed 100 characters'],
    unique: true
  },
  code: {
    type: String,
    required: [true, 'Please provide a course code'],
    trim: true,
    uppercase: true,
    maxlength: [20, 'Course code cannot exceed 20 characters'],
    unique: true,
    match: [/^[A-Z0-9]+$/, 'Course code must contain only uppercase letters and numbers']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    trim: true
  },
  instructor: {
    type: String,
    trim: true,
    maxlength: [100, 'Instructor name cannot exceed 100 characters']
  },
  department: {
    type: String,
    trim: true,
    maxlength: [100, 'Department name cannot exceed 100 characters']
  },
  credits: {
    type: Number,
    min: [1, 'Credits must be at least 1'],
    max: [10, 'Credits cannot exceed 10'],
    validate: {
      validator: Number.isInteger,
      message: 'Credits must be a whole number'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient searching
courseSchema.index({ name: 1 });
courseSchema.index({ code: 1 });
courseSchema.index({ department: 1 });
courseSchema.index({ isActive: 1 });

// Virtual for feedback count
courseSchema.virtual('feedbackCount', {
  ref: 'Feedback',
  localField: '_id',
  foreignField: 'course',
  count: true
});

// Virtual for average rating
courseSchema.virtual('averageRating').get(function() {
  // This will be calculated in the aggregation pipeline when needed
  return this._averageRating || 0;
});

// Method to get course statistics
courseSchema.methods.getStatistics = async function() {
  const Feedback = mongoose.model('Feedback');
  
  const stats = await Feedback.aggregate([
    { $match: { course: this._id } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalFeedback: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    }
  ]);

  if (stats.length === 0) {
    return {
      averageRating: 0,
      totalFeedback: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }

  const ratingDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  stats[0].ratingDistribution.forEach(rating => {
    ratingDist[rating] = (ratingDist[rating] || 0) + 1;
  });

  return {
    averageRating: Math.round(stats[0].averageRating * 100) / 100,
    totalFeedback: stats[0].totalFeedback,
    ratingDistribution: ratingDist
  };
};

// Ensure virtual fields are serialized
courseSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Course', courseSchema);
