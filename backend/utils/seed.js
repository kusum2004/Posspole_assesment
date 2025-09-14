const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Course = require('../models/Course');
const Feedback = require('../models/Feedback');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/student_feedback_app', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const getRandomBangaloreAddress = () => {
  const areas = [
    'Whitefield', 'Indiranagar', 'Jayanagar', 'Koramangala',
    'Malleshwaram', 'Rajajinagar', 'Banashankari', 'Hebbal',
    'Electronic City', 'HSR Layout', 'Yelahanka'
  ];
  const area = areas[Math.floor(Math.random() * areas.length)];
  const streetNo = Math.floor(Math.random() * 100) + 1;
  return `${streetNo}, ${area}, Bangalore - 5600${Math.floor(Math.random() * 99)}`;
};

const seedData = async () => {
  try {
    console.log(' Starting to seed database...');

    // Clear existing data
    await User.deleteMany({});
    await Course.deleteMany({});
    await Feedback.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    const adminUser = await User.create({
      name: 'Dr. Rajesh Kumar',
      email: 'admin@bgscollege.ac.in',
      password: 'Admin@123',
      role: 'admin'
    });
    console.log('Admin user created');

    // Create sample students
    const students = [];
    const studentNames = [
      'Arjun Sharma', 'Priya Patel', 'Rahul Verma', 'Ananya Singh', 'Vikash Kumar',
      'Kavya Reddy', 'Amit Gupta', 'Sneha Joshi', 'Kusuma V'
    ];

    for (let i = 0; i < studentNames.length; i++) {
      const name = studentNames[i];
      const email = name.toLowerCase().replace(' ', '.') + '@bgscollege.ac.in';
      const password = 'Student@123';
      const phoneNumber = `+91-98${Math.floor(10000000 + Math.random() * 89999999)}`;
      const dateOfBirth = new Date(1998 + i % 5, (i * 3) % 12, (i * 5) % 28 + 1);
      const address = name === 'Kusuma V'
        ? 'BGS College, Mahalakshmi, Bangalore - 560001'
        : getRandomBangaloreAddress();

      const student = await User.create({
        name,
        email,
        password,
        phoneNumber,
        address,
        dateOfBirth,
        role: 'student'
      });

      students.push(student);
    }
    console.log('Sample BGS College students created');

    // Create sample courses (keep as original or adjust if needed)
    const courseData = [
      {
        name: 'Introduction to Computer Science',
        code: 'CS101',
        description: 'Fundamental concepts of computer science and programming using C/C++.',
        instructor: 'Dr. Suresh Agarwal',
        department: 'Computer Science & Engineering',
        credits: 4,
        createdBy: adminUser._id
      },
      {
        name: 'Data Structures and Algorithms',
        code: 'CS201',
        description: 'Advanced data structures, algorithm design and analysis.',
        instructor: 'Prof. Meera Sharma',
        department: 'Computer Science & Engineering',
        credits: 4,
        createdBy: adminUser._id
      },
      {
        name: 'Operating Systems',
        code: 'CS301',
        description: 'Process management, memory management, file systems and system calls.',
        instructor: 'Dr. Arjun Malhotra',
        department: 'Computer Science & Engineering',
        credits: 3,
        createdBy: adminUser._id
      },
      {
        name: 'Database Management Systems',
        code: 'CS302',
        description: 'Relational databases, SQL, normalization and transaction management.',
        instructor: 'Prof. Kavita Nair',
        department: 'Computer Science & Engineering',
        credits: 3,
        createdBy: adminUser._id
      },
      {
        name: 'Software Engineering',
        code: 'CS401',
        description: 'Software development lifecycle, testing methodologies and project management.',
        instructor: 'Dr. Ravi Chandra',
        department: 'Computer Science & Engineering',
        credits: 3,
        createdBy: adminUser._id
      },
      {
        name: 'Engineering Mathematics - III',
        code: 'MATH301',
        description: 'Fourier transforms, Laplace transforms and differential equations.',
        instructor: 'Prof. Sanjay Gupta',
        department: 'Applied Mathematics',
        credits: 4,
        createdBy: adminUser._id
      },
      {
        name: 'Computer Networks',
        code: 'CS402',
        description: 'Network protocols, TCP/IP, routing algorithms and network security.',
        instructor: 'Dr. Priya Bhargava',
        department: 'Computer Science & Engineering',
        credits: 3,
        createdBy: adminUser._id
      },
      {
        name: 'Machine Learning',
        code: 'CS501',
        description: 'Introduction to ML algorithms, neural networks and deep learning.',
        instructor: 'Prof. Vikram Singh',
        department: 'Computer Science & Engineering',
        credits: 4,
        createdBy: adminUser._id
      },
      {
        name: 'Engineering Physics',
        code: 'PHY101',
        description: 'Mechanics, thermodynamics, optics and modern physics.',
        instructor: 'Dr. Anita Kapoor',
        department: 'Applied Physics',
        credits: 3,
        createdBy: adminUser._id
      },
      {
        name: 'Technical Communication',
        code: 'ENG201',
        description: 'Technical writing, presentation skills and professional communication.',
        instructor: 'Prof. Neha Jain',
        department: 'Humanities & Social Sciences',
        credits: 2,
        createdBy: adminUser._id
      }
    ];

    const courses = [];
    for (const courseInfo of courseData) {
      const course = await Course.create(courseInfo);
      courses.push(course);
    }
    console.log('Sample courses created');

    // Create sample feedback messages
    const feedbackMessages = [
      'Excellent course! Sir explained the concepts very clearly with good examples. Lab sessions were very helpful.',
      'Good course overall, but could use more practical implementation examples and industry use cases.',
      'The course was challenging but very rewarding. Learned many new programming concepts and algorithms.',
      'Average course. Some topics like pointers and memory management were confusing and needed better explanation.',
      'Great hands-on experience with coding assignments. The project work helped understand real-world applications.',
      'Professor was very knowledgeable but the pace was quite fast for students from non-CS background.',
      'Well-structured syllabus with clear learning objectives. Tutorial sessions were particularly helpful.',
      'Could benefit from more interactive lab sessions and peer programming exercises.',
      'Fantastic course! The way complex algorithms were broken down was amazing. Highly recommend to juniors.',
      'Course content was very relevant to current industry trends but delivery could be more engaging.',
      'Loved the practical approach with coding contests and hackathons organized during the semester.',
      'Theory sessions were good but needed more programming practice and debugging exercises.',
      'Professor was always available for doubt clearing. The reference books suggested were very helpful.',
      'Course load was quite heavy with multiple assignments but it prepared us well for placements.',
      'Great exposure to latest technologies. Guest lectures from industry experts were very insightful.'
    ];

    // Find Kusuma V's user object
    const kusumaUser = students.find(student => student.name === 'Kusuma V');

    // Create random feedback from other students
    for (let i = 0; i < 40; i++) {
      let randomStudent = students[Math.floor(Math.random() * students.length)];
      while (randomStudent._id.equals(kusumaUser._id)) {
        randomStudent = students[Math.floor(Math.random() * students.length)];
      }

      const randomCourse = courses[Math.floor(Math.random() * courses.length)];
      const randomRating = Math.floor(Math.random() * 5) + 1;
      const randomMessage = feedbackMessages[Math.floor(Math.random() * feedbackMessages.length)];

      const existingFeedback = await Feedback.findOne({
        student: randomStudent._id,
        course: randomCourse._id
      });

      if (!existingFeedback) {
        await Feedback.create({
          student: randomStudent._id,
          course: randomCourse._id,
          rating: randomRating,
          message: randomMessage,
          isAnonymous: Math.random() > 0.6,
          tags: randomRating >= 4 ? ['positive'] : randomRating <= 2 ? ['needs-improvement'] : ['neutral']
        });
      }
    }
    console.log('Random feedback from other students created');

    // Add positive feedback from Kusuma V for all courses
    const positiveFeedbackMessages = [
      'Outstanding course! The professor\'s teaching methodology is excellent and the course content is very comprehensive.',
      'Brilliant course design! Every concept was explained with real-world examples. Highly beneficial for career growth.',
      'Exceptional learning experience! The practical assignments and lab sessions were extremely well-structured.',
      'Superb course! The instructor made complex topics easy to understand. Best course I\'ve taken so far.',
      'Amazing course content! The way theory is connected with practical applications is remarkable.',
      'Excellent course! Perfect balance of theory and practice. The project work was very insightful.',
      'Fantastic teaching! The course exceeded my expectations. Great preparation for industry requirements.',
      'Top-notch course! The instructor\'s expertise and teaching style made learning enjoyable and effective.',
      'Incredible course! Well-organized curriculum with excellent reference materials and resources.',
      'Perfect course! Great depth of knowledge covered with excellent practical implementation opportunities.'
    ];

    for (let i = 0; i < courses.length; i++) {
      const course = courses[i];
      const rating = Math.random() > 0.3 ? 5 : 4;
      const message = positiveFeedbackMessages[i % positiveFeedbackMessages.length];

      await Feedback.create({
        student: kusumaUser._id,
        course: course._id,
        rating: rating,
        message: message,
        isAnonymous: false,
        tags: ['positive', 'excellent']
      });
    }
    console.log('✨ Positive feedback from Kusuma V created for all courses');

    console.log(' Database seeded successfully with BGS College data!');
    console.log('\n  Institution: BGS College - Student Feedback System');
    console.log('\nDemo Credentials:');
    console.log('Admin: admin@bgscollege.ac.in / Admin@123');
    students.forEach(student => {
      console.log(`Student: ${student.email} / Student@123`);
    });
    console.log('\n You can now start the application and test with BGS College data!');
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

const runSeed = async () => {
  await connectDB();
  await seedData();
  process.exit(0);
};

if (require.main === module) {
  runSeed();
}

module.exports = { seedData };
