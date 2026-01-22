import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EditionEntity } from './edition.entity';

@Entity('cards')
export class CardEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  cardId!: string;

  @Column()
  type!: string;

  @Column({ type: 'int' })
  position!: number;

  @Column({ type: 'jsonb', nullable: true })
  payload!: Record<string, unknown> | null;

  @ManyToOne(() => EditionEntity, (edition) => edition.cards, {
    onDelete: 'CASCADE',
  })
  edition!: EditionEntity;
}
