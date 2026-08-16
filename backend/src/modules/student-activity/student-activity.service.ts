import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StudentActivityService {
  constructor(private prisma: PrismaService) {}

  /**
   * Record a student login event
   */
  async recordLogin(studentId: string, courseId?: string, ipAddress?: string, userAgent?: string) {
    try {
      await this.prisma.studentLoginLog.create({
        data: {
          studentId,
          courseId: courseId || null,
          eventType: 'LOGIN',
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
        },
      });
    } catch (err) {
      console.error('Failed to record login event:', err.message);
    }
  }

  /**
   * Record a student registration event
   */
  async recordRegistration(studentId: string, ipAddress?: string, userAgent?: string) {
    try {
      await this.prisma.studentLoginLog.create({
        data: {
          studentId,
          eventType: 'REGISTER',
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
        },
      });
    } catch (err) {
      console.error('Failed to record registration event:', err.message);
    }
  }

  /**
   * Record a course-access event (when student selects/switches a course)
   */
  async recordCourseAccess(studentId: string, courseId: string, ipAddress?: string, userAgent?: string) {
    try {
      await this.prisma.studentLoginLog.create({
        data: {
          studentId,
          courseId,
          eventType: 'COURSE_ACCESS',
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
        },
      });
    } catch (err) {
      console.error('Failed to record course access event:', err.message);
    }
  }

  /**
   * Ensure all registered students have a REGISTER log entry
   */
  async ensureRegisteredStudentsLogged() {
    try {
      const students = await this.prisma.student.findMany({
        select: { id: true, createdAt: true },
      });

      for (const s of students) {
        const count = await this.prisma.studentLoginLog.count({
          where: { studentId: s.id, eventType: 'REGISTER' },
        });
        if (count === 0) {
          await this.prisma.studentLoginLog.create({
            data: {
              studentId: s.id,
              eventType: 'REGISTER',
              loggedInAt: s.createdAt || new Date(),
            },
          });
        }
      }
    } catch (err) {
      console.error('Error backfilling registered student logs:', err);
    }
  }

  /**
   * Get filtered activity logs for admin view
   */
  async getActivityLogs(filterType?: string, filterValue?: string, courseId?: string) {
    try {
      await this.ensureRegisteredStudentsLogged();

      const where: any = {};

      // Date filtering (Skip if filterType === 'all' or filterValue === 'all' or empty)
      if (filterType && filterType !== 'all' && filterValue && filterValue !== 'all') {
        let startDate: Date | undefined;
        let endDate: Date | undefined;

        if (filterType === 'day') {
          startDate = new Date(filterValue);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(filterValue);
          endDate.setHours(23, 59, 59, 999);
        } else if (filterType === 'month') {
          const [year, month] = filterValue.split('-').map(Number);
          if (year && month) {
            startDate = new Date(year, month - 1, 1);
            endDate = new Date(year, month, 0, 23, 59, 59, 999);
          }
        } else if (filterType === 'year') {
          const year = parseInt(filterValue, 10);
          if (year) {
            startDate = new Date(year, 0, 1);
            endDate = new Date(year, 11, 31, 23, 59, 59, 999);
          }
        }

        if (startDate && endDate && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
          where.loggedInAt = {
            gte: startDate,
            lte: endDate,
          };
        }
      }

      // Course filtering
      if (courseId) {
        where.courseId = courseId;
      }

      const logs = await this.prisma.studentLoginLog.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              collegeName: true,
            },
          },
          course: {
            select: {
              id: true,
              courseId: true,
              courseName: true,
            },
          },
        },
        orderBy: { loggedInAt: 'desc' },
        take: 500,
      });

      return logs.map((log) => ({
        id: log.id,
        studentId: log.studentId,
        studentName: log.student?.name || 'Unknown',
        studentEmail: log.student?.email || '-',
        collegeName: log.student?.collegeName || '-',
        courseId: log.course?.id || null,
        courseDisplayId: log.course?.courseId || '-',
        courseName: log.course?.courseName || '-',
        eventType: log.eventType,
        ipAddress: log.ipAddress,
        loggedInAt: log.loggedInAt,
      }));
    } catch (err) {
      console.error('Error fetching activity logs:', err);
      return [];
    }
  }
      console.error('Error fetching activity logs:', err);
      return [];
    }
  }

  /**
   * Get summary statistics for admin dashboard
   */
  async getActivitySummary() {
    try {
      const now = new Date();

      // Today boundaries
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      // This month boundaries
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      const [
        totalStudents,
        loginsToday,
        loginsThisMonth,
        uniqueStudentsThisMonth,
        courseAccessCounts,
      ] = await Promise.all([
        this.prisma.student.count().catch(() => 0),

        this.prisma.studentLoginLog.count({
          where: {
            eventType: 'LOGIN',
            loggedInAt: { gte: todayStart, lte: todayEnd },
          },
        }).catch(() => 0),

        this.prisma.studentLoginLog.count({
          where: {
            eventType: 'LOGIN',
            loggedInAt: { gte: monthStart, lte: monthEnd },
          },
        }).catch(() => 0),

        this.prisma.studentLoginLog.findMany({
          where: {
            eventType: 'LOGIN',
            loggedInAt: { gte: monthStart, lte: monthEnd },
          },
          select: { studentId: true },
          distinct: ['studentId'],
        }).catch(() => []),

        this.prisma.studentLoginLog.groupBy({
          by: ['courseId'],
          where: {
            eventType: 'COURSE_ACCESS',
            courseId: { not: null },
          },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
        }).catch(() => []),
      ]);

      // Resolve course names for the grouped counts
      const courseIds = courseAccessCounts
        .map((c) => c.courseId)
        .filter((id): id is string => id !== null);

      let courseLookup: Record<string, string> = {};
      if (courseIds.length > 0) {
        const courses = await this.prisma.course.findMany({
          where: { id: { in: courseIds } },
          select: { id: true, courseName: true, courseId: true },
        }).catch(() => []);
        courseLookup = Object.fromEntries(
          courses.map((c) => [c.id, `${c.courseName} (${c.courseId})`]),
        );
      }

      return {
        totalStudents,
        loginsToday,
        loginsThisMonth,
        uniqueStudentsThisMonth: uniqueStudentsThisMonth.length,
        courseAccessBreakdown: courseAccessCounts.map((c) => ({
          courseId: c.courseId,
          courseName: c.courseId ? (courseLookup[c.courseId] || 'Unknown') : 'Unknown',
          accessCount: c._count?.id || 0,
        })),
      };
    } catch (err) {
      console.error('Error fetching activity summary:', err);
      return {
        totalStudents: 0,
        loginsToday: 0,
        loginsThisMonth: 0,
        uniqueStudentsThisMonth: 0,
        courseAccessBreakdown: [],
      };
    }
  }
}
