import { IsNotEmpty, IsString } from 'class-validator';

export class PresignPictureDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  contentType: string;
}
