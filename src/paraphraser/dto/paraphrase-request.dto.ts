import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
} from 'class-validator';

export enum ParaphraseStyle {
  SIMPLE = 'simple',
  FORMAL = 'formal',
  CASUAL = 'casual',
  CREATIVE = 'creative',
  ACADEMIC = 'academic',
}

export class ParaphraseRequestDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'Text must be at least 5 characters long' })
  @MaxLength(5000, { message: 'Text must not exceed 5000 characters' })
  text: string;

  @IsOptional()
  @IsEnum(ParaphraseStyle)
  style?: ParaphraseStyle = ParaphraseStyle.SIMPLE;

  @IsOptional()
  @IsString()
  targetLanguage?: string = 'en';
}
