import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create Super Admin
  const superAdminPassword = await bcrypt.hash('SuperAdmin@123', 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@erp.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'superadmin@erp.com',
      password: superAdminPassword,
      role: 'SuperAdmin',
      isActive: true,
    },
  });
  console.log(`✅ Super Admin created: ${superAdmin.email}`);

  // Create a demo institution
  const institution = await prisma.institution.upsert({
    where: { slug: 'demo-university' },
    update: {},
    create: {
      name: 'Demo University',
      slug: 'demo-university',
      type: 'University',
      address: '123 Education Street',
      city: 'Tech City',
      state: 'Tech State',
      country: 'United States',
      phone: '+1-555-0100',
      email: 'info@demouniversity.edu',
      website: 'https://demouniversity.edu',
      principal: 'Dr. John Smith',
      academicYear: '2024-2025',
      isActive: true,
      colors: {
        primary: '#1e2761',
        secondary: '#c8902f',
        accent: '#f4e6cc',
      },
    },
  });
  console.log(`✅ Institution created: ${institution.name}`);

  // Create Academic Year
  const academicYear = await prisma.academicYear.upsert({
    where: {
      institutionId_name: {
        institutionId: institution.id,
        name: '2024-2025',
      },
    },
    update: {},
    create: {
      name: '2024-2025',
      startDate: new Date('2024-06-01'),
      endDate: new Date('2025-05-31'),
      isCurrent: true,
      status: 'active',
      institutionId: institution.id,
    },
  });
  console.log(`✅ Academic Year created: ${academicYear.name}`);

  // Create College Admin for demo institution
  const collegeAdminPassword = await bcrypt.hash('CollegeAdmin@123', 10);
  const collegeAdmin = await prisma.user.upsert({
    where: { email: 'admin@demouniversity.edu' },
    update: {},
    create: {
      name: 'College Admin',
      email: 'admin@demouniversity.edu',
      password: collegeAdminPassword,
      role: 'CollegeAdmin',
      institutionId: institution.id,
      isActive: true,
    },
  });
  console.log(`✅ College Admin created: ${collegeAdmin.email}`);

  // Create departments
  const departments = [
    { name: 'Computer Science', code: 'CS' },
    { name: 'Mathematics', code: 'MATH' },
    { name: 'Physics', code: 'PHY' },
    { name: 'Chemistry', code: 'CHEM' },
    { name: 'English', code: 'ENG' },
  ];

  const createdDepartments: any[] = [];
  for (const dept of departments) {
    const department = await prisma.department.upsert({
      where: {
        institutionId_academicYearId_code: {
          institutionId: institution.id,
          academicYearId: academicYear.id,
          code: dept.code,
        },
      },
      update: {},
      create: {
        name: dept.name,
        code: dept.code,
        institutionId: institution.id,
        academicYearId: academicYear.id,
        status: 'active',
      },
    });
    createdDepartments.push(department);
  }
  console.log(`✅ ${createdDepartments.length} departments created`);

  // Create classes
  const classNames = [
    { className: 'Bachelor of Science - CS', classCode: 'BSC-CS-1', departmentId: createdDepartments[0].id, semesterOrGrade: 'Semester 1' },
    { className: 'Bachelor of Science - CS', classCode: 'BSC-CS-2', departmentId: createdDepartments[0].id, semesterOrGrade: 'Semester 2' },
    { className: 'Bachelor of Science - CS', classCode: 'BSC-CS-3', departmentId: createdDepartments[0].id, semesterOrGrade: 'Semester 3' },
    { className: 'Bachelor of Science - Math', classCode: 'BSC-MATH-1', departmentId: createdDepartments[1].id, semesterOrGrade: 'Semester 1' },
    { className: 'Bachelor of Science - Physics', classCode: 'BSC-PHY-1', departmentId: createdDepartments[2].id, semesterOrGrade: 'Semester 1' },
  ];

  const createdClasses: any[] = [];
  for (const cls of classNames) {
    const classEntity = await prisma.class.upsert({
      where: {
        institutionId_academicYearId_departmentId_classCode: {
          institutionId: institution.id,
          academicYearId: academicYear.id,
          departmentId: cls.departmentId,
          classCode: cls.classCode,
        },
      },
      update: {},
      create: {
        className: cls.className,
        classCode: cls.classCode,
        institutionId: institution.id,
        academicYearId: academicYear.id,
        departmentId: cls.departmentId,
        semesterOrGrade: cls.semesterOrGrade,
        capacity: 60,
        status: 'active',
      },
    });
    createdClasses.push(classEntity);
  }
  console.log(`✅ ${createdClasses.length} classes created`);

  // Create sections for each class
  const sectionNames = ['A', 'B', 'C'];
  for (const cls of createdClasses) {
    for (const sectionName of sectionNames) {
      await prisma.section.upsert({
        where: {
          institutionId_classId_sectionName: {
            institutionId: institution.id,
            classId: cls.id,
            sectionName,
          },
        },
        update: {},
        create: {
          sectionName,
          institutionId: institution.id,
          classId: cls.id,
          capacity: 30,
          status: 'active',
        },
      });
    }
  }
  console.log(`✅ Sections created for ${createdClasses.length} classes`);

  // Create subjects
  const subjects = [
    { name: 'Data Structures', code: 'CS101', classId: createdClasses[0].id, departmentId: createdDepartments[0].id },
    { name: 'Algorithms', code: 'CS102', classId: createdClasses[0].id, departmentId: createdDepartments[0].id },
    { name: 'Database Systems', code: 'CS103', classId: createdClasses[0].id, departmentId: createdDepartments[0].id },
    { name: 'Calculus I', code: 'MATH101', classId: createdClasses[3].id, departmentId: createdDepartments[1].id },
    { name: 'Linear Algebra', code: 'MATH102', classId: createdClasses[3].id, departmentId: createdDepartments[1].id },
    { name: 'Mechanics', code: 'PHY101', classId: createdClasses[4].id, departmentId: createdDepartments[2].id },
    { name: 'Electromagnetism', code: 'PHY102', classId: createdClasses[4].id, departmentId: createdDepartments[2].id },
  ];

  for (const subj of subjects) {
    await prisma.subject.upsert({
      where: {
        institutionId_academicYearId_departmentId_classId_subjectCode: {
          institutionId: institution.id,
          academicYearId: academicYear.id,
          departmentId: subj.departmentId,
          classId: subj.classId,
          subjectCode: subj.code,
        },
      },
      update: {},
      create: {
        subjectName: subj.name,
        subjectCode: subj.code,
        institutionId: institution.id,
        academicYearId: academicYear.id,
        departmentId: subj.departmentId,
        classId: subj.classId,
        credits: 4,
        status: 'active',
      },
    });
  }
  console.log(`✅ ${subjects.length} subjects created`);

  // Create demo students
  const studentPassword = await bcrypt.hash('Student@123', 10);
  const studentNames = [
    { name: 'Alice Johnson', rollNo: 'STU001', className: 'BSC-CS-1', section: 'A' },
    { name: 'Bob Smith', rollNo: 'STU002', className: 'BSC-CS-1', section: 'A' },
    { name: 'Charlie Brown', rollNo: 'STU003', className: 'BSC-CS-1', section: 'B' },
    { name: 'Diana Prince', rollNo: 'STU004', className: 'BSC-CS-2', section: 'A' },
    { name: 'Eve Wilson', rollNo: 'STU005', className: 'BSC-MATH-1', section: 'A' },
  ];

  for (const student of studentNames) {
    const email = `${student.name.toLowerCase().replace(/\s+/g, '.')}@demouniversity.edu`;
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        name: student.name,
        email,
        password: studentPassword,
        role: 'Student',
        institutionId: institution.id,
        isActive: true,
        rollNo: student.rollNo,
        className: student.className,
        section: student.section,
        phone: `+1-555-${String(1000 + Math.floor(Math.random() * 9000))}`,
        address: `${Math.floor(Math.random() * 999) + 1} College Street`,
        parentName: `Parent of ${student.name.split(' ')[0]}`,
        parentPhone: `+1-555-${String(2000 + Math.floor(Math.random() * 9000))}`,
      },
    });
  }
  console.log(`✅ ${studentNames.length} students created`);

  // Create demo faculty/staff
  const facultyPassword = await bcrypt.hash('Faculty@123', 10);
  const facultyMembers = [
    { firstName: 'John', lastName: 'Doe', email: 'john.doe@demouniversity.edu', staffType: 'Professor', departmentId: createdDepartments[0].id },
    { firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@demouniversity.edu', staffType: 'Associate Professor', departmentId: createdDepartments[0].id },
    { firstName: 'Michael', lastName: 'Brown', email: 'michael.brown@demouniversity.edu', staffType: 'Professor', departmentId: createdDepartments[1].id },
    { firstName: 'Sarah', lastName: 'Davis', email: 'sarah.davis@demouniversity.edu', staffType: 'Assistant Professor', departmentId: createdDepartments[2].id },
  ];

  for (const faculty of facultyMembers) {
    const email = faculty.email;
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        name: `${faculty.firstName} ${faculty.lastName}`,
        email,
        password: facultyPassword,
        role: 'Faculty',
        institutionId: institution.id,
        isActive: true,
      },
    });
  }
  console.log(`✅ ${facultyMembers.length} faculty members created`);

  console.log('\n🎉 Database seeding complete!');
  console.log('\n📋 Login Credentials:');
  console.log('   Super Admin: superadmin@erp.com / SuperAdmin@123');
  console.log('   College Admin: admin@demouniversity.edu / CollegeAdmin@123');
  console.log('   Student: alice.johnson@demouniversity.edu / Student@123');
  console.log('   Faculty: john.doe@demouniversity.edu / Faculty@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
