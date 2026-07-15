import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AssignmentEntity, AssignmentDocument } from '../../entities/assignment.entity';
import { AssignmentSubmissionEntity, AssignmentSubmissionDocument } from '../../entities/assignment-submission.entity';
import { CourseEntity, CourseDocument } from '../../entities/course.entity';

@Injectable()
export class AssignmentService {
  constructor(
    @InjectModel(AssignmentEntity.name)
    private assignmentModel: Model<AssignmentDocument>,
    @InjectModel(AssignmentSubmissionEntity.name)
    private submissionModel: Model<AssignmentSubmissionDocument>,
    @InjectModel(CourseEntity.name)
    private courseModel: Model<CourseDocument>,
  ) {}

  async create(courseId: string, title: string, description: string, deadline: Date): Promise<any> {
    const course = await this.courseModel.findById(courseId).exec();
    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }
    const assignment = new this.assignmentModel({
      title,
      description,
      deadline,
      course: courseId,
    });
    return assignment.save();
  }

  async getAssignmentsByCourse(courseId: string): Promise<any[]> {
    return this.assignmentModel.find({ course: courseId })
      .sort({ deadline: 1 })
      .exec();
  }

  async findOne(id: string): Promise<any> {
    const assignment = await this.assignmentModel.findById(id).populate('course').exec();
    if (!assignment) {
      throw new NotFoundException(`Assignment with ID ${id} not found`);
    }
    return assignment;
  }

  async delete(id: string): Promise<void> {
    const result = await this.assignmentModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Assignment with ID ${id} not found`);
    }
  }

  async submitAssignment(
    courseId: string,
    studentName: string,
    collegeName: string,
    assignmentId: string,
    file: Express.Multer.File,
  ): Promise<any> {
    const course = await this.courseModel.findById(courseId).exec();
    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }
    const assignment = await this.assignmentModel.findById(assignmentId).exec();
    if (!assignment) {
      throw new NotFoundException(`Assignment with ID ${assignmentId} not found`);
    }

    const submission = new this.submissionModel({
      studentName,
      collegeName,
      courseName: course.courseName,
      fileName: file.originalname,
      filePath: file.path,
      course: courseId,
      assignment: assignmentId,
    });

    return submission.save();
  }

  async getSubmissions(): Promise<any[]> {
    return this.submissionModel.find()
      .populate('course')
      .populate('assignment')
      .sort({ submittedAt: -1 })
      .exec();
  }

  async getSubmission(id: string): Promise<any> {
    const submission = await this.submissionModel.findById(id).populate('course').exec();
    if (!submission) {
      throw new NotFoundException(`Submission with ID ${id} not found`);
    }
    return submission;
  }

  async gradeSubmission(id: string, marks: number, feedback: string): Promise<any> {
    const submission = await this.getSubmission(id);
    submission.marks = marks;
    submission.feedback = feedback;
    return submission.save();
  }

  async getStudentSubmissions(studentName: string, collegeName: string): Promise<any[]> {
    return this.submissionModel.find({ studentName, collegeName })
      .populate('course')
      .populate('assignment')
      .sort({ submittedAt: -1 })
      .exec();
  }

  async updateAssignment(id: string, attrs: Partial<AssignmentEntity>): Promise<any> {
    const assignment = await this.assignmentModel.findById(id).exec();
    if (!assignment) {
      throw new NotFoundException(`Assignment with ID ${id} not found`);
    }
    Object.assign(assignment, attrs);
    return assignment.save();
  }
}
