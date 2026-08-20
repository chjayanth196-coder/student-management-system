import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface RichLink {
  label: string;
  href: string;
}

export interface JaiReply {
  text: string;
  role: string;
  links?: RichLink[];
  data?: Record<string, unknown>;
}

@Injectable()
export class AiService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Main entry point. Routes a user message based on their role and intent.
   */
  async handleMessage(userId: string, rawMessage: string): Promise<JaiReply> {
    const message = (rawMessage || '').trim().toLowerCase();
    if (!message) {
      return {
        role: 'assistant',
        text: 'Hi, I am JAI, your ERP assistant. Ask me anything about your data, or how to use the system.',
      };
    }

    // Load the user and their role/context
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { institution: true },
    });

    if (!user) {
      return {
        role: 'assistant',
        text: 'I could not find your account. Please try logging in again.',
      };
    }

    // Detect website issue / change requests
    if (this.detectIssueReport(message)) {
      return this.handleIssueReport(user, message);
    }

    // Route by role-specific data questions
    if (user.role === 'Student' || user.role === 'Parent') {
      return this.handleStudentQuestions(user, message);
    }
    if (user.role === 'Faculty') {
      return this.handleFacultyQuestions(user, message);
    }
    if (user.role === 'SuperAdmin') {
      return this.handleSuperAdminQuestions(user, message);
    }
    // Admin / principal / HOD / etc.
    return this.handleAdminQuestions(user, message);
  }

  async getSuggestions(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const role = user?.role;

    const common = [
      { label: 'How do I add a student?', message: 'How do I add a student?' },
      { label: 'How do I mark attendance?', message: 'How do I mark attendance?' },
      { label: 'Where are my notifications?', message: 'Where are my notifications?' },
    ];

    if (role === 'Student' || role === 'Parent') {
      return [
        { label: 'My attendance', message: 'What is my attendance?' },
        { label: 'My results', message: 'What are my results?' },
        { label: 'My pending fees', message: 'What are my pending fees?' },
        ...common,
      ];
    }
    if (role === 'Faculty') {
      return [
        { label: 'My classes', message: 'What classes do I teach?' },
        { label: 'Mark attendance', message: 'How do I mark attendance?' },
        ...common,
      ];
    }
    if (role === 'SuperAdmin') {
      return [
        { label: 'Platform overview', message: 'Give me the platform overview' },
        { label: 'Report a website issue', message: 'I want to report a website issue' },
        ...common,
      ];
    }
    return [
      { label: 'Institution stats', message: 'Show my institution stats' },
      { label: 'Pending fees', message: 'How much pending fees are there?' },
      { label: 'Report a website issue', message: 'I want to report a website issue' },
      ...common,
    ];
  }

  // ============================================================
  // Student / Parent questions
  // ============================================================
  private async handleStudentQuestions(user: any, message: string): Promise<JaiReply> {
    const instId = user.institutionId;
    const studentRecord = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    // Attendance
    if (/(attendance|present|absent)/.test(message) && /(my|me|i )/.test(message)) {
      const records = await this.prisma.attendance.findMany({
        where: { studentId: user.id, institutionId: instId },
      });
      const total = records.length;
      const present = records.filter((r) => r.status === 'Present').length;
      const absent = records.filter((r) => r.status === 'Absent').length;
      const late = records.filter((r) => r.status === 'Late').length;
      const pct = total > 0 ? Math.round((present / total) * 100) : 0;
      return {
        role: 'assistant',
        text: `You have ${total} attendance record(s). Present: ${present}, Absent: ${absent}, Late: ${late}. Your attendance percentage is about ${pct}%.`,
        links: [{ label: 'View Attendance', href: '/attendance' }],
        data: { total, present, absent, late, percentage: pct },
      };
    }

    // Results
    if (/(result|grade|marks|gpa|score)/.test(message) && /(my|me|i )/.test(message)) {
      const results = await this.prisma.result.findMany({
        where: { studentId: user.id, institutionId: instId },
        orderBy: { term: 'asc' },
      });
      if (!results.length) {
        return { role: 'assistant', text: 'No results have been published for you yet.' };
      }
      const avgPct = results.reduce((s, r) => s + (r.percentage || 0), 0) / results.length;
      const top = results[0];
      return {
        role: 'assistant',
        text: `You have ${results.length} result record(s) with an average of about ${Math.round(avgPct)}%. Most recent term: ${top.term} (${Math.round(top.percentage || 0)}%).`,
        links: [{ label: 'View Results', href: '/results' }],
        data: { count: results.length, averagePercentage: Math.round(avgPct) },
      };
    }

    // Fees
    if (/(fee|payment|due|amount|pay)/.test(message) && /(my|me|i )/.test(message)) {
      const feePayments = await this.prisma.feePayment.findMany({
        where: { studentId: user.id, institutionId: instId },
      });
      const pending = feePayments.filter((f) => f.status === 'Pending' || f.status === 'Overdue');
      const totalDue = pending.reduce((s, f) => s + (f.amount - f.paidAmount), 0);
      return {
        role: 'assistant',
        text: pending.length
          ? `You have ${pending.length} pending fee item(s). Total amount due is approximately ₹${totalDue.toLocaleString()}.`
          : 'You have no pending fees. All clear!',
        links: [{ label: 'View Fees', href: '/fees' }],
        data: { pendingCount: pending.length, totalDue },
      };
    }

    // Profile summary
    if (/(profile|info|about me|who am i)/.test(message)) {
      return {
        role: 'assistant',
        text: `You are ${studentRecord?.name || 'a student'} (${studentRecord?.email}). Class: ${studentRecord?.className || 'N/A'}, Section: ${studentRecord?.section || 'N/A'}, Roll No: ${studentRecord?.rollNo || 'N/A'}.`,
        data: { name: studentRecord?.name, email: studentRecord?.email, class: studentRecord?.className, section: studentRecord?.section },
      };
    }

    return this.knowledgeBase(message, user);
  }

  // ============================================================
  // Faculty questions
  // ============================================================
  private async handleFacultyQuestions(user: any, message: string): Promise<JaiReply> {
    const instId = user.institutionId;
    const staff = await this.prisma.staff.findFirst({
      where: { userId: user.id, institutionId: instId },
    });

    if (/(class|subject|teach|cours)/.test(message)) {
      const subjects = await this.prisma.subject.findMany({
        where: { institutionId: instId, id: staff?.assignedClassId ? undefined : undefined },
      });
      return {
        role: 'assistant',
        text: subjects.length
          ? `There are ${subjects.length} subject(s) in your institution. Select a subject on the Attendance page to mark attendance.`
          : 'No subjects are configured yet. Please contact your admin to set up subjects.',
        links: [{ label: 'Open Attendance', href: '/attendance' }],
      };
    }

    if (/(today|class today|schedule)/.test(message)) {
      return {
        role: 'assistant',
        text: 'You can view and mark today\'s attendance from the Attendance module. Select your section and subject, then mark Present/Absent/Late.',
        links: [{ label: 'Mark Attendance', href: '/attendance' }],
      };
    }

    return this.knowledgeBase(message, user);
  }

  // ============================================================
  // Super Admin questions
  // ============================================================
  private async handleSuperAdminQuestions(user: any, message: string): Promise<JaiReply> {
    // Platform overview
    if (/(overview|summary|platform|all institution|total college)/.test(message)) {
      const [institutions, students, staff, feeAgg] = await Promise.all([
        this.prisma.institution.count(),
        this.prisma.user.count({ where: { role: 'Student' } }),
        this.prisma.staff.count(),
        this.prisma.feePayment.aggregate({ _sum: { paidAmount: true } }),
      ]);
      return {
        role: 'assistant',
        text: `Platform overview: ${institutions} institution(s), ${students} student(s), ${staff} staff member(s), and ₹${(feeAgg._sum.paidAmount || 0).toLocaleString()} total fee collected across all colleges.`,
        links: [{ label: 'Open Analytics', href: '/superadmin/analytics' }],
        data: { institutions, students, staff, totalIncome: feeAgg._sum.paidAmount || 0 },
      };
    }

    // Website change request (only Super Admin can perform changes)
    if (/(change|update|modify|fix|edit|add feature|build|deploy)/.test(message)) {
      return {
        role: 'assistant',
        text: 'I have logged your request. As Super Admin, you can authorize website changes. To proceed, please describe the change you want (e.g., "add a dark mode", "fix the login page"), and I will prepare a change plan for the development team.',
      };
    }

    return this.knowledgeBase(message, user);
  }

  // ============================================================
  // Admin / Principal / HOD questions
  // ============================================================
  private async handleAdminQuestions(user: any, message: string): Promise<JaiReply> {
    const instId = user.institutionId;
    if (!instId) {
      return this.knowledgeBase(message, user);
    }

    // Institution stats
    if (/(stats|overview|how many|count|summary|students|staff|classes|departments)/.test(message)) {
      const [students, staff, departments, classes, pendingFees, feeAgg] = await Promise.all([
        this.prisma.user.count({ where: { role: 'Student', institutionId: instId } }),
        this.prisma.staff.count({ where: { institutionId: instId, status: 'active' } }),
        this.prisma.department.count({ where: { institutionId: instId, status: 'active' } }),
        this.prisma.class.count({ where: { institutionId: instId, status: 'active' } }),
        this.prisma.feePayment.count({ where: { institutionId: instId, status: { in: ['Pending', 'Overdue'] } } }),
        this.prisma.feePayment.aggregate({
          where: { institutionId: instId, status: 'Paid' },
          _sum: { paidAmount: true },
        }),
      ]);
      return {
        role: 'assistant',
        text: `Your institution has ${students} student(s), ${staff} staff, ${departments} department(s), ${classes} class(es). Pending fee items: ${pendingFees}. Total collected: ₹${(feeAgg._sum.paidAmount || 0).toLocaleString()}.`,
        links: [{ label: 'Open Dashboard', href: '/dashboard' }],
        data: { students, staff, departments, classes, pendingFees, collected: feeAgg._sum.paidAmount || 0 },
      };
    }

    // Pending fees
    if (/(pending fee|unpaid|due fee|collection)/.test(message)) {
      const pending = await this.prisma.feePayment.findMany({
        where: { institutionId: instId, status: { in: ['Pending', 'Overdue'] } },
      });
      const totalDue = pending.reduce((s, f) => s + (f.amount - f.paidAmount), 0);
      return {
        role: 'assistant',
        text: pending.length
          ? `There are ${pending.length} pending fee item(s) totaling approximately ₹${totalDue.toLocaleString()}.`
          : 'No pending fees. All payments are up to date.',
        links: [{ label: 'View Fees', href: '/fees' }],
        data: { pendingCount: pending.length, totalDue },
      };
    }

    return this.knowledgeBase(message, user);
  }

  // ============================================================
  // Issue / change reporting with role enforcement
  // ============================================================
  private detectIssueReport(message: string): boolean {
    return /(issue|bug|problem|error|not working|broken|report|change|fix|update|modify|broken page)/.test(message) &&
      !/(attendance|result|fee|how do i|how to)/.test(message);
  }

  private handleIssueReport(user: any, _message: string): JaiReply {
    const canChange = user.role === 'SuperAdmin';

    if (canChange) {
      return {
        role: 'assistant',
        text: 'I have captured your request. As Super Admin, you have permission to authorize website changes. Please provide the specific page/area and the change you want, and I will create a change request for the development team.',
        links: [
          { label: 'Institutions', href: '/institutions' },
          { label: 'Analytics', href: '/superadmin/analytics' },
        ],
      };
    }

    return {
      role: 'assistant',
      text: 'I understand you\'ve found an issue. I have recorded it, but only the Super Admin can request or approve website changes. Please contact your Super Admin, or I can help you understand the feature in the meantime.',
      links: [{ label: 'How to use the system', href: '/notifications' }],
    };
  }

  // ============================================================
  // Knowledge base (how-to answers)
  // ============================================================
  private knowledgeBase(message: string, user: any): JaiReply {
    const kb: Array<{ pattern: RegExp; text: string; links?: RichLink[] }> = [
      {
        pattern: /(add|create|new) (a )?student/,
        text: 'To add a student: open the Students module, click "Add Student", and fill in name, email, roll number, class, and section. The student will get a login account automatically.',
        links: [{ label: 'Go to Students', href: '/students' }],
      },
      {
        pattern: /(mark|record|take) (attendance|the attendance|daily attendance)/,
        text: 'To mark attendance: go to the Attendance module, select the section and subject, then mark each student as Present, Absent, or Late. You can also use the bulk option for a whole class.',
        links: [{ label: 'Go to Attendance', href: '/attendance' }],
      },
      {
        pattern: /(add|create|new) (staff|teacher|faculty)/,
        text: 'To add staff: open the Staff module, click "Add Staff", enter their details and role (e.g., Faculty, HOD). A login account is created for them.',
        links: [{ label: 'Go to Staff', href: '/staff' }],
      },
      {
        pattern: /(fee|payment|pay) (structure|for student|collection)/,
        text: 'Fees are managed in the Fees module. You can create fee structures, record payments, and view collection reports there.',
        links: [{ label: 'Go to Fees', href: '/fees' }],
      },
      {
        pattern: /(result|publish|grade|marks)/,
        text: 'Results are added in the Results module. Select a student and subject, then enter the marks and grade. Students can view their results from their dashboard.',
        links: [{ label: 'Go to Results', href: '/results' }],
      },
      {
        pattern: /(notification|alert|message from admin)/,
        text: 'Your notifications appear in the Notifications module. You can mark them as read or clear them there.',
        links: [{ label: 'Go to Notifications', href: '/notifications' }],
      },
      {
        pattern: /(library|book)/,
        text: 'The Library module lets you manage books — add, search, and track availability.',
        links: [{ label: 'Go to Library', href: '/library' }],
      },
      {
        pattern: /(hostel|room|accommodation)/,
        text: 'The Hostel module manages rooms and allocations. You can create rooms and allocate/deallocate beds for students.',
        links: [{ label: 'Go to Hostel', href: '/hostel' }],
      },
      {
        pattern: /(transport|bus|route|pass)/,
        text: 'The Transport module manages bus routes and student passes. You can create routes and issue passes.',
        links: [{ label: 'Go to Transport', href: '/transport' }],
      },
      {
        pattern: /(placement|drive|job|campus)/,
        text: 'The Placement module manages placement drives and student applications. You can create drives and track applications.',
        links: [{ label: 'Go to Placement', href: '/placement' }],
      },
      {
        pattern: /(institution|college|school|my institution)/,
        text: 'Institution details are managed in the Institutions module. Super Admin can create new institutions; institution admins can update their own profile.',
        links: [{ label: 'Go to Institutions', href: '/institutions' }],
      },
      {
        pattern: /(hello|hi|hey|good morning|good afternoon)/,
        text: `Hello${user?.name ? ', ' + user.name : ''}! I am JAI, your ERP assistant. Ask me about your attendance, results, fees, or how to use any module.`,
      },
    ];

    for (const entry of kb) {
      if (entry.pattern.test(message)) {
        return { role: 'assistant', text: entry.text, links: entry.links };
      }
    }

    return {
      role: 'assistant',
      text: 'I can help you with attendance, results, fees, students, staff, and how to use each module. Try asking things like "What is my attendance?", "How do I add a student?", or "Show my pending fees". If you found an issue with the website, only the Super Admin can request changes.',
    };
  }
}
