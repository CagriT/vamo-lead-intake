import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsPostalCode,
  IsString,
} from 'class-validator';
import { Salutation } from '../salutation.enum';

export class CreateLeadDto {
  @IsEnum(Salutation)
  salutation: Salutation;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsPostalCode('DE')
  postalCode: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;
}
