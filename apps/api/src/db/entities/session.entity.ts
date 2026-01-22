import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('sessions')
export class SessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  windowLabel!: string;

  @Column({ default: false })
  completedToday!: boolean;

  @Column({ default: false })
  completedExtended!: boolean;
}
