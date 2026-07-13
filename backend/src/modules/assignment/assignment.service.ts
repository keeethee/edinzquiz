import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssignmentEntity } from '../../entities/assignment.entity';
import { AssignmentSubmissionEntity } from '../../entities/assignment-submission.entity';
import { CourseEntity } from '../../entities/course.entity';

@Injectable()
export class AssignmentService {
  constructor(
    @InjectRepository(AssignmentEntity)
    private assignmentRepository: Repository<AssignmentEntity>,
    @InjectRepository(AssignmentSubmissionEntity)
    private submissionRepository: Repository<AssignmentSubmissionEntity>,
    @InjectRepository(CourseEntity)
    private courseRepository: Repository<CourseEntity>,
  ) {}

  async create(courseId: number, title: string, description: string, deadline: Date): Promise<AssignmentEntity> {
    const course = await this.courseRepository.findOneBy({ id: courseId });
    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }
    const assignment = this.assignmentRepository.create({
      title,
      description,
      deadline,
      course,
    });
    return this.assignmentRepository.save(assignment);
  }

  async getAssignmentsByCourse(courseId: number): Promise<AssignmentEntity[]> {
    return this.assignmentRepository.find({
      where: { course: { id: courseId } },
      order: { deadline: 'ASC' },
    });
  }

  async findOne(id: number): Promise<AssignmentEntity> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id },
      relations: { course: true },
    });
    if (!assignment) {
      throw new NotFoundException(`Assignment with ID ${id} not found`);
    }
    return assignment;
  }

  async delete(id: number): Promise<void> {
    const result = await this.assignmentRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Assignment with ID ${id} not found`);
    }
  }

  async submitAssignment(
    courseId: number,
    studentName: string,
    collegeName: string,
    assignmentId: number,
    file: Express.Multer.File,
  ): Promise<AssignmentSubmissionEntity> {
    const course = await this.courseRepository.findOneBy({ id: courseId });
    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }
    const assignment = await this.assignmentRepository.findOneBy({ id: assignmentId });
    if (!assignment) {
      throw new NotFoundException(`Assignment with ID ${assignmentId} not found`);
    }

    const submission = this.submissionRepository.create({
      studentName,
      collegeName,
      courseName: course.courseName,
      fileName: file.originalname,
      filePath: file.path,
      course,
      assignment,
    });

    return this.submissionRepository.save(submission);
  }

  async getSubmissions(): Promise<AssignmentSubmissionEntity[]> {
    return this.submissionRepository.find({
      relations: { course: true, assignment: true },
      order: { submittedAt: 'DESC' },
    });
  }

  async getSubmission(id: number): Promise<AssignmentSubmissionEntity> {
    const submission = await this.submissionRepository.findOne({
      where: { id },
      relations: { course: true },
    });
    if (!submission) {
      throw new NotFoundException(`Submission with ID ${id} not found`);
    }
    return submission;
  }

  async gradeSubmission(id: number, marks: number, feedback: string): Promise<AssignmentSubmissionEntity> {
    const submission = await this.getSubmission(id);
    submission.marks = marks;
    submission.feedback = feedback;
    return this.submissionRepository.save(submission);
  }

  async getStudentSubmissions(studentName: string, collegeName: string): Promise<AssignmentSubmissionEntity[]> {
    return this.submissionRepository.find({
      where: { studentName, collegeName },
      relations: { course: true, assignment: true },
      order: { submittedAt: 'DESC' },
    });
  }

  async updateAssignment(id: number, attrs: Partial<AssignmentEntity>): Promise<AssignmentEntity> {
    const assignment = await this.assignmentRepository.findOneBy({ id });
    if (!assignment) {
      throw new NotFoundException(`Assignment with ID ${id} not found`);
    }
    Object.assign(assignment, attrs);
    return this.assignmentRepository.save(assignment);
  }
}
