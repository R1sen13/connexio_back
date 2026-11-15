import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class AuthenticationDto {
  @ApiProperty({
    example: 'admin@gmail.com',
    description: 'Email address',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'password',
    description: 'Password',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;
}
