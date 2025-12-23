import { IsNotEmpty, IsString } from 'class-validator';

export class AttachPictureDto {
  @IsString()
  @IsNotEmpty()
  key!: string;

  @IsString()
  @IsNotEmpty()
  mimeType!: string;

  @IsString()
  @IsNotEmpty()
  originalName!: string;
}
