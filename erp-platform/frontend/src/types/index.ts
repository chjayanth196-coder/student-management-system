// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
  path: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// ============================================
// Auth Types
// ============================================

export type UserRole =
  | "SuperAdmin"
  | "CollegeAdmin"
  | "Principal"
  | "VicePrincipal"
  | "HOD"
  | "Faculty"
  | "LabFaculty"
  | "Accountant"
  | "Librarian"
  | "HostelWarden"
  | "TransportManager"
  | "PlacementOfficer"
  | "Parent"
  | "Student"
  | "Alumni"
  | "Guest";

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
  avatar?: string;
  institutionId?: string;
  institution?: Institution;
  rollNo?: string;
  enrollmentNo?: string;
  className?: string;
  section?: string;
  parentName?: string;
  parentPhone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: UserRole;
  institutionId?: string;
}

// ============================================
// Institution Types
// ============================================

export type InstitutionType = "School" | "College" | "University" | "Other";

export interface Institution {
  id: string;
  name: string;
  slug: string;
  type: InstitutionType;
  logo?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  principal?: string;
  academicYear?: string;
  isActive: boolean;
  colors?: Record<string, string>;
  settings?: Record<string, unknown>;
  _count?: {
    users: number;
    departments: number;
    classes: number;
    staff: number;
  };
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Academic Types
// ============================================

export interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  status: string;
  institutionId: string;
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  hodName?: string;
  status: string;
  institutionId: string;
  academicYearId: string;
  createdAt: string;
}

export interface Class {
  id: string;
  className: string;
  classCode: string;
  semesterOrGrade?: string;
  capacity?: number;
  status: string;
  institutionId: string;
  academicYearId: string;
  departmentId: string;
  createdAt: string;
}

export interface Section {
  id: string;
  sectionName: string;
  roomNumber?: string;
  capacity?: number;
  status: string;
  institutionId: string;
  classId: string;
  createdAt: string;
}

export interface Subject {
  id: string;
  subjectName: string;
  subjectCode: string;
  credits?: number;
  description?: string;
  status: string;
  institutionId: string;
  academicYearId: string;
  departmentId: string;
  classId: string;
  createdAt: string;
}

// ============================================
// Student Types
// ============================================

export interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string;
  gender?: string;
  dob?: string;
  address?: string;
  rollNo?: string;
  enrollmentNo?: string;
  className?: string;
  section?: string;
  parentName?: string;
  parentPhone?: string;
  admissionYear?: number;
  semester?: number;
  isActive: boolean;
  institutionId: string;
  createdAt: string;
}

export interface CreateStudentRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  gender?: string;
  dob?: string;
  address?: string;
  rollNo?: string;
  enrollmentNo?: string;
  className?: string;
  section?: string;
  parentName?: string;
  parentPhone?: string;
  admissionYear?: number;
  semester?: number;
}

// ============================================
// Staff Types
// ============================================

export interface Staff {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  gender?: string;
  dob?: string;
  address?: string;
  qualification?: string;
  specialization?: string;
  experience?: number;
  joiningDate?: string;
  designation?: string;
  staffType: string;
  salary?: number;
  classTeacher: boolean;
  status: string;
  institutionId: string;
  departmentId?: string;
  createdAt: string;
}

export interface CreateStaffRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  staffType: string;
  phone?: string;
  gender?: string;
  dob?: string;
  address?: string;
  qualification?: string;
  specialization?: string;
  experience?: number;
  joiningDate?: string;
  designation?: string;
  departmentId?: string;
  salary?: number;
  classTeacher?: boolean;
}

// ============================================
// Attendance Types
// ============================================

export interface Attendance {
  id: string;
  date: string;
  status: "Present" | "Absent" | "Late" | "Holiday";
  subject?: string;
  remarks?: string;
  studentId: string;
  institutionId: string;
  sectionId?: string;
  subjectId?: string;
  createdAt: string;
}

export interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  percentage: number;
}

// ============================================
// Result Types
// ============================================

export type ExamType = "Internal" | "MidSemester" | "Semester" | "Practical" | "Assignment" | "Quiz";

export interface Result {
  id: string;
  examType: ExamType;
  term: string;
  marksObtained: number;
  maxMarks: number;
  percentage?: number;
  grade?: string;
  remarks?: string;
  studentId: string;
  institutionId: string;
  subjectId?: string;
  academicYearId?: string;
  classId?: string;
  createdAt: string;
}

export interface GpaResult {
  gpa: number;
  totalCredits: number;
  earnedCredits: number;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
}

// ============================================
// Exam Types
// ============================================

export interface ExamSchedule {
  id: string;
  examName: string;
  examType: string;
  term: string;
  subjectId: string;
  classId: string;
  academicYearId: string;
  date: string;
  startTime: string;
  endTime: string;
  roomNumber?: string;
  maxMarks: number;
  description?: string;
  institutionId: string;
  createdAt: string;
  updatedAt: string;
  subject?: { id: string; subjectName: string; subjectCode: string };
  class?: { id: string; className: string; classCode: string };
}

// ============================================
// Fee Types
// ============================================

export interface FeeStructure {
  id: string;
  name: string;
  category: string;
  amount: number;
  frequency: string;
  dueDay?: number;
  lateFee?: number;
  isOptional: boolean;
  description?: string;
  isActive: boolean;
  institutionId: string;
  createdAt: string;
}

export interface FeePayment {
  id: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  paidDate?: string;
  status: "Pending" | "Paid" | "Overdue" | "Partial" | "Cancelled";
  paymentMode?: string;
  transactionId?: string;
  receiptNo?: string;
  fine?: number;
  discount?: number;
  remarks?: string;
  studentId: string;
  institutionId: string;
  feeStructureId?: string;
  createdAt: string;
}

export interface StudentFeeSummary {
  totalFees: number;
  totalPaid: number;
  totalDue: number;
  totalFine: number;
  paymentStatus: string;
  payments: FeePayment[];
}

// ============================================
// Dashboard Types
// ============================================

export interface SuperAdminDashboard {
  stats: {
    totalInstitutions: number;
    totalUsers: number;
    totalStudents: number;
    totalStaff: number;
    activeInstitutions: number;
  };
  recentInstitutions: Institution[];
}

export interface AdminDashboard {
  institution: Institution;
  currentYear?: AcademicYear | null;
  stats: {
    totalStudents: number;
    totalStaff: number;
    totalDepartments: number;
    totalClasses: number;
    totalSubjects: number;
    todayAttendance: number;
    pendingFees: number;
    totalFeeCollected: number;
  };
}

export interface StudentDashboard {
  student: Pick<User, "id" | "name" | "email" | "rollNo" | "className" | "section" | "avatar"> | null;
  attendance: {
    totalClasses: number;
    present: number;
    absent: number;
    late: number;
    percentage: number;
    recent: Attendance[];
  };
  results: {
    totalSubjects: number;
    averagePercentage: number;
    recent: Result[];
  };
  fees: {
    totalDue: number;
    totalPaid: number;
    pendingAmount: number;
    pendingCount: number;
    recent: FeePayment[];
  };
}

export interface FacultyDashboard {
  staff: Staff | null;
  stats: {
    totalStudents: number;
    classesAssigned: number;
    todayMarked: number;
  };
  recentAttendance: Attendance[];
}

// ============================================
// Notification Types
// ============================================

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  userId: string;
  createdAt: string;
}

// ============================================
// Super Admin Analytics Types
// ============================================

export interface InstitutionAnalyticsSummary {
  id: string;
  name: string;
  type: InstitutionType;
  city?: string;
  state?: string;
  isActive: boolean;
  createdAt: string;
  students: number;
  staff: number;
  departments: number;
  classes: number;
  subjects: number;
  placements: number;
  highestPackage: number;
  averagePackage: number;
  totalIncome: number;
  pendingFees: number;
}

export interface PlatformAnalytics {
  totals: {
    institutions: number;
    totalIncome: number;
    totalStudents: number;
    totalStaff: number;
    totalPlacements: number;
    highestPackageOverall: number;
  };
  institutions: InstitutionAnalyticsSummary[];
}

export interface YearlyIncome {
  year: string;
  income: number;
  payments: number;
}

export interface PlacementRecord {
  id: string;
  companyName: string;
  jobTitle?: string;
  package?: number;
  status: string;
}

export interface InstitutionDeepAnalytics {
  institution: Institution;
  summary: InstitutionAnalyticsSummary;
  incomeByYear: YearlyIncome[];
  placements: PlacementRecord[];
}

// ============================================
// Super Admin College Credentials Types
// ============================================

export interface CollegeAdminCredentials {
  adminId: string;
  loginId: string;
  password: string | null;
  adminName: string;
  isActive: boolean;
}

export interface CollegeCredentialRow {
  institutionId: string;
  institutionName: string;
  type: InstitutionType;
  slug: string;
  isActive: boolean;
  createdAt: string;
  admin: CollegeAdminCredentials | null;
}

// ============================================
// JAI AI Assistant Types
// ============================================

export interface AiLink {
  label: string;
  href: string;
}

export interface AiReply {
  text: string;
  role: "assistant" | "user";
  links?: AiLink[];
  data?: Record<string, unknown>;
}

export interface AiSuggestion {
  label: string;
  message: string;
}

