import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CourseEntity, CourseDocument } from '../../entities/course.entity';

@Injectable()
export class CourseService {
  constructor(
    @InjectModel(CourseEntity.name)
    private courseModel: Model<CourseDocument>,
  ) {}

  async create(courseId: string, courseName: string, duration?: string, status: string = 'Active'): Promise<any> {
    const existing = await this.courseModel.findOne({ courseId }).exec();
    if (existing) {
      throw new ConflictException(`Course with display ID "${courseId}" already exists.`);
    }

    const course = new this.courseModel({
      courseId,
      courseName,
      duration,
      status,
    });
    return course.save();
  }

  async update(id: string, courseId: string, courseName: string, duration?: string, status?: string): Promise<any> {
    const course = await this.findOne(id);
    
    if (course.courseId !== courseId) {
      const existing = await this.courseModel.findOne({ courseId }).exec();
      if (existing) {
        throw new ConflictException(`Course with display ID "${courseId}" already exists.`);
      }
    }

    course.courseId = courseId;
    course.courseName = courseName;
    if (duration !== undefined) course.duration = duration;
    if (status !== undefined) course.status = status;

    return course.save();
  }

  async findAll(): Promise<any[]> {
    return this.courseModel.find().sort({ createdAt: 1 }).exec();
  }

  async findOne(id: string): Promise<any> {
    const course = await this.courseModel.findById(id).exec();
    if (!course) {
      throw new NotFoundException(`Course with DB ID ${id} not found`);
    }
    return course;
  }

  async findByCourseId(courseId: string): Promise<any> {
    const course = await this.courseModel.findOne({ courseId, status: 'Active' }).exec();
    if (!course) {
      throw new NotFoundException(`Course with code "${courseId}" not found or is inactive.`);
    }
    return course;
  }

  async delete(id: string): Promise<void> {
    const result = await this.courseModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Course with DB ID ${id} not found`);
    }
  }
}
