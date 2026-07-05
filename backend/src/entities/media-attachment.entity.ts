import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('media_attachments')
export class MediaAttachmentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  fileName: string;

  @Column()
  filePath: string;

  @Column()
  fileType: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  uploadedAt: Date;
}
