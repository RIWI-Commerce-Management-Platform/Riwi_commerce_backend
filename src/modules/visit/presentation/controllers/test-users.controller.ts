import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

const TEST_USERS = [
  {
    id: 1,
    name: 'Asesor de prueba 1',
    email: 'asesor1@test.local',
    role: 'advisor',
  },
  {
    id: 2,
    name: 'Asesor de prueba 2',
    email: 'asesor2@test.local',
    role: 'advisor',
  },
  {
    id: 3,
    name: 'Asesor de prueba 3',
    email: 'asesor3@test.local',
    role: 'advisor',
  },
];

@ApiTags('Test Users')
@Controller('users/test')
export class TestUsersController {
  @Get()
  @ApiOperation({ summary: 'List hardcoded users for local visit testing' })
  list() {
    return TEST_USERS;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a hardcoded test user by ID' })
  getById(@Param('id', ParseIntPipe) id: number) {
    const user = TEST_USERS.find((candidate) => candidate.id === id);
    if (!user) {
      throw new NotFoundException('Test user not found.');
    }

    return user;
  }
}
