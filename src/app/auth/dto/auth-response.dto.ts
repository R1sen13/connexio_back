import { IsDateString, IsEmail, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProfileResponse {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  createdAt: Date;

  constructor(user: { id: string; email: string; createdAt: Date }) {
    this.id = user.id;
    this.email = user.email;
    this.createdAt = new Date(user.createdAt);
  }
}
