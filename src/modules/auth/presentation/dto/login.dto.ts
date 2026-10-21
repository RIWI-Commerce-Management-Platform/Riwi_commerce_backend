import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'usuario@correo.com',
    description: 'Correo electrónico registrado del usuario',
  })
  email!: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Contraseña del usuario',
  })
  password!: string;

  @ApiPropertyOptional({
    example: true,
    description:
      'Si es true, la sesión persiste tras cerrar el navegador (cookie persistente). Si es false, expira al cerrar la sesión de navegación.',
    default: false,
  })
  rememberMe?: boolean;
}
