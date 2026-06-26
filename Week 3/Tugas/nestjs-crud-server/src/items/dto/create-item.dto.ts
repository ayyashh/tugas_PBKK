import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateItemDto {
  @IsString()
  @IsNotEmpty({ message: 'Name is required and must be a non-empty string' })
  @MaxLength(100, { message: 'Name must be 100 characters or less' })
  name: string;

  @IsString()
  @IsNotEmpty({
    message: 'Description is required and must be a non-empty string',
  })
  @MaxLength(500, { message: 'Description must be 500 characters or less' })
  description: string;
}
