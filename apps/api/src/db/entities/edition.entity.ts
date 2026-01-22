import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CardEntity } from './card.entity';

@Entity('editions')
export class EditionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  windowLabel!: string;

  @OneToMany(() => CardEntity, (card) => card.edition, { cascade: true })
  cards!: CardEntity[];
}
