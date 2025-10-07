import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GrammarCorrectionDto {
  @ApiProperty({
    description: 'Text to be grammar corrected',
    example:
      'me and my friend was going to the store but we couldnt find it nowhere',
  })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({
    description: 'Correction level - basic uses rules, advanced uses AI',
    enum: ['basic', 'advanced'],
    default: 'basic',
    required: false,
  })
  @IsOptional()
  @IsEnum(['basic', 'advanced'])
  level?: 'basic' | 'advanced' = 'basic';
}
