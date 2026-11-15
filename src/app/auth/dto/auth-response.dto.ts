import { IsDateString, IsEmail, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AuthSuccessResponse {
  @ApiProperty({
    example: true,
    description: 'Операция авторизации успешно выполнена',
  })
  success: boolean;
}

export class ProfileResponse {
  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'Уникальный идентификатор пользователя',
  })
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    example: 'admin@gmail.com',
    description: 'Email пользователя',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: '2026-11-15T12:00:00.000Z',
    description: 'Дата регистрации пользователя',
    type: String,
    format: 'date-time',
  })
  @IsDateString()
  @IsNotEmpty()
  createdAt: Date;

  constructor(user: { id: string; email: string; createdAt: Date }) {
    this.id = user.id;
    this.email = user.email;
    this.createdAt = new Date(user.createdAt);
  }
}
