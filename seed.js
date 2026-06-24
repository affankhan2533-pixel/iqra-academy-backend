const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Student = require('./models/Student');
const Teacher = require('./models/Teacher');
const Course = require('./models/Course');
const Batch = require('./models/Batch');
const Attendance = require('./models/Attendance');
const Test = require('./models/Test');
const Result = require('./models/Result');
const Fee = require('./models/Fee');
const Assignment = require('./models/Assignment');
const Note = require('./models/Note');
const Announcement = require('./models/Announcement');
const Notification = require('./models/Notification');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/iqra-academy';

const seedDatabase = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected. Clearing old data...');

    // Clear all collections
    await User.deleteMany({});
    await Student.deleteMany({});
    await Teacher.deleteMany({});
    await Course.deleteMany({});
    await Batch.deleteMany({});
    await Attendance.deleteMany({});
    await Test.deleteMany({});
    await Result.deleteMany({});
    await Fee.deleteMany({});
    await Assignment.deleteMany({});
    await Note.deleteMany({});
    await Announcement.deleteMany({});
    await Notification.deleteMany({});

    console.log('Old data cleared.');

    // 1. Create Admin
    console.log('Creating Admin...');
    const adminUser = await User.create({
      name: 'Iqra Admin',
      email: 'admin@iqra.com',
      password: 'adminpassword', // Will be hashed automatically by pre-save hook
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'
    });

    // 2. Create Courses
    console.log('Creating Courses...');
    const sscCourse = await Course.create({
      name: 'SSC (Class 10)',
      subjects: ['Mathematics', 'Science'],
      description: 'Comprehensive coaching for Class 10th students targeting board exams.',
      duration: '1 Year',
      fee: 25000
    });

    const xiCourse = await Course.create({
      name: 'XI Science',
      subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
      description: 'Foundations and core concepts for Class 11th Science students.',
      duration: '1 Year',
      fee: 45000
    });

    const xiiCourse = await Course.create({
      name: 'XII Science',
      subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
      description: 'Extensive board exam prep and entrance foundation for Class 12th Science.',
      duration: '1 Year',
      fee: 50000
    });

    // 3. Create Teachers
    console.log('Creating Teachers...');
    const t1User = await User.create({
      name: 'Prof. Shakeel Ahmed',
      email: 'shakeel@iqra.com',
      password: 'teacherpassword',
      role: 'teacher',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=150'
    });
    const teacher1 = await Teacher.create({
      user: t1User._id,
      subjects: ['Physics', 'Chemistry'],
      qualifications: 'M.Sc. in Physics, 8+ Years Experience'
    });

    const t2User = await User.create({
      name: 'Prof. Anis Kazi',
      email: 'anis@iqra.com',
      password: 'teacherpassword',
      role: 'teacher',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150'
    });
    const teacher2 = await Teacher.create({
      user: t2User._id,
      subjects: ['Mathematics'],
      qualifications: 'B.Tech from VJTI, 6+ Years Experience'
    });

    const t3User = await User.create({
      name: 'Dr. Fatima Shaikh',
      email: 'fatima@iqra.com',
      password: 'teacherpassword',
      role: 'teacher',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150'
    });
    const teacher3 = await Teacher.create({
      user: t3User._id,
      subjects: ['Biology', 'Science'],
      qualifications: 'Ph.D. in Botany, MBBS Foundation, 5+ Years Experience'
    });

    // 4. Create Batches
    console.log('Creating Batches...');
    const sscBatch = await Batch.create({
      name: 'SSC 2026 Batch A',
      course: sscCourse._id,
      teachers: [teacher2._id, teacher3._id], // Math & Science
      schedule: 'Mon-Wed-Fri 4:30 PM - 7:30 PM',
      room: 'Room 309-A'
    });

    const xiBatch = await Batch.create({
      name: 'XI Sci 2026 Batch A',
      course: xiCourse._id,
      teachers: [teacher1._id, teacher2._id, teacher3._id],
      schedule: 'Tue-Thu-Sat 3:00 PM - 7:00 PM',
      room: 'Room 309-B'
    });

    const xiiBatch = await Batch.create({
      name: 'XII Sci 2026 Batch A',
      course: xiiCourse._id,
      teachers: [teacher1._id, teacher2._id, teacher3._id],
      schedule: 'Daily 7:00 AM - 10:00 AM',
      room: 'Room 309-C'
    });

    // 5. Create Students
    console.log('Creating Students...');
    // SSC Students
    const studentData = [
      { name: 'Amit Sharma', email: 'amit@student.com', class: 'SSC', batch: sscBatch, rollNo: 'SSC-101', parentName: 'Ramesh Sharma', parentContact: '9876543210', feeStatus: 'Paid' },
      { name: 'Sana Khan', email: 'sana@student.com', class: 'SSC', batch: sscBatch, rollNo: 'SSC-102', parentName: 'Mohammad Khan', parentContact: '9876543211', feeStatus: 'Pending' },
      { name: 'Rahul Gupta', email: 'rahul@student.com', class: 'SSC', batch: sscBatch, rollNo: 'SSC-103', parentName: 'Sanjay Gupta', parentContact: '9876543212', feeStatus: 'Overdue' },

      // XI Science Students
      { name: 'Aditya Patil', email: 'aditya@student.com', class: 'XI Science', batch: xiBatch, rollNo: 'XIS-201', parentName: 'Vijay Patil', parentContact: '9876543213', feeStatus: 'Paid' },
      { name: 'Zainab Qureshi', email: 'zainab@student.com', class: 'XI Science', batch: xiBatch, rollNo: 'XIS-202', parentName: 'Arshad Qureshi', parentContact: '9876543214', feeStatus: 'Pending' },
      { name: 'Kunal Singh', email: 'kunal@student.com', class: 'XI Science', batch: xiBatch, rollNo: 'XIS-203', parentName: 'Rajesh Singh', parentContact: '9876543215', feeStatus: 'Pending' },

      // XII Science Students
      { name: 'Pranav Joshi', email: 'pranav@student.com', class: 'XII Science', batch: xiiBatch, rollNo: 'XIIS-301', parentName: 'Anil Joshi', parentContact: '9876543216', feeStatus: 'Paid' },
      { name: 'Sara Dsouza', email: 'sara@student.com', class: 'XII Science', batch: xiiBatch, rollNo: 'XIIS-302', parentName: 'Francis Dsouza', parentContact: '9876543217', feeStatus: 'Paid' },
      { name: 'Farhan Ansari', email: 'farhan@student.com', class: 'XII Science', batch: xiiBatch, rollNo: 'XIIS-303', parentName: 'Salim Ansari', parentContact: '9876543218', feeStatus: 'Overdue' }
    ];

    const studentIds = [];
    const studentProfiles = [];

    for (let index = 0; index < studentData.length; index++) {
      const data = studentData[index];
      const user = await User.create({
        name: data.name,
        email: data.email,
        password: 'studentpassword',
        role: 'student',
        avatar: `https://images.unsplash.com/photo-${1500000000000 + index}?auto=format&fit=crop&q=80&w=150`
      });

      // Create Parent User
      const parentEmail = `${data.parentName.split(' ')[0].toLowerCase()}@parent.com`;
      const parentUser = await User.create({
        name: data.parentName,
        email: parentEmail,
        password: 'parentpassword',
        role: 'parent',
        avatar: `https://images.unsplash.com/photo-${1600000000000 + index}?auto=format&fit=crop&q=80&w=150`
      });

      const student = await Student.create({
        user: user._id,
        rollNo: data.rollNo,
        class: data.class,
        batch: data.batch._id,
        parentName: data.parentName,
        parentContact: data.parentContact,
        address: 'Dharavi, Mumbai, Maharashtra 400017',
        feeStatus: data.feeStatus,
        parentUser: parentUser._id
      });

      studentIds.push(student._id);
      studentProfiles.push(student);

      // Add student ref to the batch
      await Batch.findByIdAndUpdate(data.batch._id, { $push: { students: student._id } });

      // Create Fee Records
      console.log(`Creating fees for ${data.name}...`);
      const monthFee = data.class === 'SSC' ? 2000 : data.class === 'XI Science' ? 3500 : 4000;
      const feePayload = {
        student: student._id,
        amount: monthFee,
        dueDate: new Date('2026-06-15'),
        status: data.feeStatus,
        month: 'June 2026'
      };
      if (data.feeStatus === 'Paid') {
        feePayload.paidDate = new Date('2026-06-05');
        feePayload.receiptNo = `REC-2026060${index + 1}`;
      }
      await Fee.create(feePayload);
    }

    // 6. Create Announcements
    console.log('Creating Announcements...');
    await Announcement.create({
      title: 'Welcome to Iqra Academy!',
      content: 'We are excited to begin our new academic year batch sessions. All schedules have been updated on your dashboards.',
      targetRole: ['student', 'teacher'],
      postedBy: adminUser._id
    });

    await Announcement.create({
      title: 'Monthly Test Schedule - June 2026',
      content: 'Monthly unit tests will begin in the third week of June. Attendance is mandatory for all students.',
      targetRole: ['student'],
      postedBy: adminUser._id
    });

    // 7. Create Notes
    console.log('Creating Study Materials...');
    await Note.create({
      title: 'Real Numbers & Polynomials Guide',
      subject: 'Mathematics',
      class: 'SSC',
      fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      description: 'Quick formula sheet and board questions for Chapter 1 and 2.',
      uploadedBy: t2User._id
    });

    await Note.create({
      title: 'Kinematics & Vector Basics',
      subject: 'Physics',
      class: 'XI Science',
      fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      description: 'Detailed physics notes with derivation formulas.',
      uploadedBy: t1User._id
    });

    await Note.create({
      title: 'Calculus: Limits & Derivatives',
      subject: 'Mathematics',
      class: 'XII Science',
      fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      description: 'Integration and Differentiation worksheet with solutions.',
      uploadedBy: t2User._id
    });

    // 8. Create Assignments
    console.log('Creating Assignments...');
    await Assignment.create({
      title: 'Trigonometric Identities Worksheet',
      description: 'Solve questions 1 to 20 from page 45. Hand-written submissions only.',
      batch: sscBatch._id,
      dueDate: new Date('2026-06-12'),
      uploadedBy: t2User._id
    });

    await Assignment.create({
      title: 'Coulomb\'s Law Problems',
      description: 'Practice set for electrostatics. Solve in assignments notebook.',
      batch: xiiBatch._id,
      dueDate: new Date('2026-06-14'),
      uploadedBy: t1User._id
    });

    // 9. Create Attendance over the last 5 days
    console.log('Creating Attendance logs...');
    const days = [
      new Date('2026-06-04'),
      new Date('2026-06-05'),
      new Date('2026-06-06'),
      new Date('2026-06-07'),
      new Date('2026-06-08')
    ];

    for (const day of days) {
      for (const student of studentProfiles) {
        // Randomly assign Present (85%), Late (5%), Absent (10%)
        const rand = Math.random();
        let status = 'Present';
        if (rand < 0.1) status = 'Absent';
        else if (rand < 0.15) status = 'Late';

        await Attendance.create({
          student: student._id,
          batch: student.batch,
          date: day,
          status,
          markedBy: t2User._id
        });
      }
    }

    // 10. Create Tests and Test Results
    console.log('Creating Tests & Results...');
    // SSC Test (Mathematics)
    const testSSC_Math = await Test.create({
      name: 'Algebra Chapter 1 Test',
      subject: 'Mathematics',
      class: 'SSC',
      batch: sscBatch._id,
      date: new Date('2026-06-07'),
      maxMarks: 50,
      createdBy: t2User._id
    });
    // SSC Test (Science)
    const testSSC_Sci = await Test.create({
      name: 'Chemical Reactions Test',
      subject: 'Science',
      class: 'SSC',
      batch: sscBatch._id,
      date: new Date('2026-06-07'),
      maxMarks: 50,
      createdBy: t3User._id
    });

    // XI Tests (All Subjects)
    const testXI_Phys = await Test.create({
      name: 'Units & Dimensions Quiz',
      subject: 'Physics',
      class: 'XI Science',
      batch: xiBatch._id,
      date: new Date('2026-06-07'),
      maxMarks: 25,
      createdBy: t1User._id
    });
    const testXI_Chem = await Test.create({
      name: 'Atomic Structure Test',
      subject: 'Chemistry',
      class: 'XI Science',
      batch: xiBatch._id,
      date: new Date('2026-06-07'),
      maxMarks: 50,
      createdBy: t1User._id
    });
    const testXI_Math = await Test.create({
      name: 'Trigonometry Worksheet',
      subject: 'Mathematics',
      class: 'XI Science',
      batch: xiBatch._id,
      date: new Date('2026-06-07'),
      maxMarks: 50,
      createdBy: t2User._id
    });
    const testXI_Bio = await Test.create({
      name: 'Cell Structure Quiz',
      subject: 'Biology',
      class: 'XI Science',
      batch: xiBatch._id,
      date: new Date('2026-06-07'),
      maxMarks: 25,
      createdBy: t3User._id
    });

    // XII Tests (All Subjects)
    const testXII_Math = await Test.create({
      name: 'Matrices & Determinants Test',
      subject: 'Mathematics',
      class: 'XII Science',
      batch: xiiBatch._id,
      date: new Date('2026-06-07'),
      maxMarks: 100,
      createdBy: t2User._id
    });
    const testXII_Phys = await Test.create({
      name: 'Electrostatics Board Prep Test',
      subject: 'Physics',
      class: 'XII Science',
      batch: xiiBatch._id,
      date: new Date('2026-06-07'),
      maxMarks: 100,
      createdBy: t1User._id
    });
    const testXII_Chem = await Test.create({
      name: 'Organic Chemistry Basics Test',
      subject: 'Chemistry',
      class: 'XII Science',
      batch: xiiBatch._id,
      date: new Date('2026-06-07'),
      maxMarks: 100,
      createdBy: t1User._id
    });
    const testXII_Bio = await Test.create({
      name: 'Genetics & Evolution Test',
      subject: 'Biology',
      class: 'XII Science',
      batch: xiiBatch._id,
      date: new Date('2026-06-07'),
      maxMarks: 50,
      createdBy: t3User._id
    });

    // Add Results for Test SSC
    const sscMarks_Math = [46, 38, 22]; // Amit (Roll 101), Sana (Roll 102), Rahul (Roll 103)
    const sscMarks_Sci = [42, 40, 25];
    const getGrade = (pct) => {
      if (pct >= 90) return 'A+';
      if (pct >= 80) return 'A';
      if (pct >= 70) return 'B+';
      if (pct >= 60) return 'B';
      if (pct >= 50) return 'C';
      if (pct >= 40) return 'D';
      return 'F';
    };

    const sscStudents = studentProfiles.filter(s => s.class === 'SSC');
    for (let i = 0; i < sscStudents.length; i++) {
      // Math Result
      const pctMath = (sscMarks_Math[i] / 50) * 100;
      await Result.create({
        student: sscStudents[i]._id,
        test: testSSC_Math._id,
        obtainedMarks: sscMarks_Math[i],
        percentage: pctMath,
        grade: getGrade(pctMath),
        rank: i + 1,
        remarks: sscMarks_Math[i] > 30 ? 'Great job, keep it up!' : 'Need improvement. Practice daily.'
      });

      // Science Result
      const pctSci = (sscMarks_Sci[i] / 50) * 100;
      await Result.create({
        student: sscStudents[i]._id,
        test: testSSC_Sci._id,
        obtainedMarks: sscMarks_Sci[i],
        percentage: pctSci,
        grade: getGrade(pctSci),
        rank: i + 1,
        remarks: sscMarks_Sci[i] > 30 ? 'Good conceptual grasp.' : 'Need to revise chapter notes.'
      });
    }

    // Add Results for Test XI
    const xiStudents = studentProfiles.filter(s => s.class === 'XI Science');
    const xiMarks_Phys = [23, 19, 14];
    const xiMarks_Chem = [42, 35, 20];
    const xiMarks_Math = [45, 38, 25];
    const xiMarks_Bio = [22, 18, 12];

    for (let i = 0; i < xiStudents.length; i++) {
      // Physics
      const pctPhys = (xiMarks_Phys[i] / 25) * 100;
      await Result.create({
        student: xiStudents[i]._id,
        test: testXI_Phys._id,
        obtainedMarks: xiMarks_Phys[i],
        percentage: pctPhys,
        grade: getGrade(pctPhys),
        rank: i + 1,
        remarks: xiMarks_Phys[i] > 15 ? 'Good performance' : 'Revise formulas thoroughly.'
      });

      // Chemistry
      const pctChem = (xiMarks_Chem[i] / 50) * 100;
      await Result.create({
        student: xiStudents[i]._id,
        test: testXI_Chem._id,
        obtainedMarks: xiMarks_Chem[i],
        percentage: pctChem,
        grade: getGrade(pctChem),
        rank: i + 1,
        remarks: xiMarks_Chem[i] > 30 ? 'Solid performance' : 'Need help with formulas.'
      });

      // Math
      const pctMath = (xiMarks_Math[i] / 50) * 100;
      await Result.create({
        student: xiStudents[i]._id,
        test: testXI_Math._id,
        obtainedMarks: xiMarks_Math[i],
        percentage: pctMath,
        grade: getGrade(pctMath),
        rank: i + 1,
        remarks: xiMarks_Math[i] > 30 ? 'Good analytical skills' : 'Practice trigonometry.'
      });

      // Bio
      const pctBio = (xiMarks_Bio[i] / 25) * 100;
      await Result.create({
        student: xiStudents[i]._id,
        test: testXI_Bio._id,
        obtainedMarks: xiMarks_Bio[i],
        percentage: pctBio,
        grade: getGrade(pctBio),
        rank: i + 1,
        remarks: xiMarks_Bio[i] > 15 ? 'Nice work' : 'Revise cell division.'
      });
    }

    // Add Results for Test XII
    const xiiStudents = studentProfiles.filter(s => s.class === 'XII Science');
    const xiiMarks_Math = [92, 85, 45];
    const xiiMarks_Phys = [88, 79, 50];
    const xiiMarks_Chem = [78, 82, 40];
    const xiiMarks_Bio = [44, 41, 22];

    for (let i = 0; i < xiiStudents.length; i++) {
      // Math
      const pctMath = (xiiMarks_Math[i] / 100) * 100;
      await Result.create({
        student: xiiStudents[i]._id,
        test: testXII_Math._id,
        obtainedMarks: xiiMarks_Math[i],
        percentage: pctMath,
        grade: getGrade(pctMath),
        rank: i + 1,
        remarks: xiiMarks_Math[i] > 60 ? 'Excellent work' : 'Must study harder. Contact faculty.'
      });

      // Physics
      const pctPhys = (xiiMarks_Phys[i] / 100) * 100;
      await Result.create({
        student: xiiStudents[i]._id,
        test: testXII_Phys._id,
        obtainedMarks: xiiMarks_Phys[i],
        percentage: pctPhys,
        grade: getGrade(pctPhys),
        rank: i + 1,
        remarks: xiiMarks_Phys[i] > 60 ? 'Good grasp of electrostatics' : 'Revise derivations.'
      });

      // Chemistry
      const pctChem = (xiiMarks_Chem[i] / 100) * 100;
      await Result.create({
        student: xiiStudents[i]._id,
        test: testXII_Chem._id,
        obtainedMarks: xiiMarks_Chem[i],
        percentage: pctChem,
        grade: getGrade(pctChem),
        rank: i + 1,
        remarks: xiiMarks_Chem[i] > 60 ? 'Solid performance' : 'Revise Organic mechanism.'
      });

      // Biology
      const pctBio = (xiiMarks_Bio[i] / 50) * 100;
      await Result.create({
        student: xiiStudents[i]._id,
        test: testXII_Bio._id,
        obtainedMarks: xiiMarks_Bio[i],
        percentage: pctBio,
        grade: getGrade(pctBio),
        rank: i + 1,
        remarks: xiiMarks_Bio[i] > 30 ? 'Well structured' : 'Revise genetics.'
      });
    }

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
