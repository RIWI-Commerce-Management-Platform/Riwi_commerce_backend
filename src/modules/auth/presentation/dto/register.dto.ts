import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'Juan Perez',
    description: 'Nombre completo del usuario',
  })
  name!: string;

  @ApiProperty({
    example: 'usuario@correo.com',
    description: 'Correo electrónico del usuario',
  })
  email!: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Contraseña para la cuenta',
  })
  password!: string;
}
