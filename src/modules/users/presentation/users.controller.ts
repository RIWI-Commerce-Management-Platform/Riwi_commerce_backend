import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConsumes,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ListUsersUseCase } from '../application/list-users.use-case.js';
import { GetUserByIdUseCase } from '../application/get-user-by-id.use-case.js';
import { AssignUserRoleUseCase } from '../application/assign-user-role.use-case.js';
import { AssignUserRoleDto } from './dto/assign-user-role.dto.js';
import { FindUsersQueryDto } from './dto/find-users-query.dto.js';
import { FindUsersByRoleQueryDto } from './dto/find-users-by-role-query.dto.js';
import { UserResponseDto } from './dto/user-response.dto.js';
import { PaginatedResponseDto } from '../../../shared/pagination/paginated-response.dto.js';
import { queryValidationPipe } from '../../../shared/pagination/query-validation.pipe.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { UserRole } from '../../auth/domain/user-role.enum.js';
import { InvalidRoleError } from '../../auth/domain/errors/invalid-role.error.js';
import { ZoneRequiredError } from '../../auth/domain/errors/zone-required.error.js';
import { UnexpectedZoneError } from '../../auth/domain/errors/unexpected-zone.error.js';
import { ZoneNotFoundError } from '../../auth/domain/errors/zone-not-found.error.js';
import { UserNotFoundError } from '../../auth/domain/errors/user-not-found.error.js';

/**
 * User administration (Admin only). The role endpoint keeps its original
 * path, `/auth/users/:userId/role`, so existing clients are not affected.
 */
@ApiTags('Users')
@ApiUnauthorizedResponse({ description: 'No active session.' })
@ApiForbiddenResponse({ description: 'The Admin role is required.' })
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
@Controller()
export class UsersController {
  constructor(
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
    private readonly assignUserRoleUseCase: AssignUserRoleUseCase,
  ) {}

  @Get('users')
  @ApiOperation({
    summary: 'List users: admins, regional directors and advisors (Admin only)',
  })
  @ApiOkResponse({ type: [UserResponseDto] })
  async list(
    @Query(queryValidationPipe()) query: FindUsersQueryDto,
  ): Promise<PaginatedResponseDto<UserResponseDto>> {
    const result = await this.listUsersUseCase.execute({
      role: query.role,
      zoneId: query.zoneId,
      search: query.search,
      page: query.parsedPage,
      limit: query.parsedLimit,
    });
    return PaginatedResponseDto.create(
      result,
      (user) => new UserResponseDto(user),
    );
  }

  // Declared before `users/:id` so "role" is not parsed as an id.
  @Get('users/role/:role')
  @ApiOperation({ summary: 'List the users with a given role (Admin only)' })
  @ApiParam({ name: 'role', enum: UserRole, enumName: 'UserRole' })
  @ApiOkResponse({ type: [UserResponseDto] })
  @ApiBadRequestResponse({ description: 'Unknown role.' })
  async listByRole(
    @Param('role', new ParseEnumPipe(UserRole)) role: UserRole,
    @Query(queryValidationPipe()) query: FindUsersByRoleQueryDto,
  ): Promise<PaginatedResponseDto<UserResponseDto>> {
    const result = await this.listUsersUseCase.execute({
      role,
      search: query.search,
      page: query.parsedPage,
      limit: query.parsedLimit,
    });
    return PaginatedResponseDto.create(
      result,
      (user) => new UserResponseDto(user),
    );
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get a user by id (Admin only)' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiNotFoundResponse({ description: 'User not found.' })
  async getById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserResponseDto> {
    try {
      return new UserResponseDto(await this.getUserByIdUseCase.execute(id));
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Patch('auth/users/:userId/role')
  // The form content type is only there so Swagger UI shows the role as a
  // dropdown; JSON stays the default and works as before.
  @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
  @ApiOperation({
    summary: 'Assign or change a user role (Admin only)',
    description:
      'A DIRECTOR_REGIONAL needs a zoneId; the other roles must not send one.',
  })
  @ApiOkResponse({ description: 'Role updated successfully.' })
  @ApiBadRequestResponse({ description: 'Invalid role or zone.' })
  @ApiNotFoundResponse({ description: 'User or zone not found.' })
  async assignRole(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: AssignUserRoleDto,
  ): Promise<{ id: number; role: UserRole; zoneId: number | null }> {
    try {
      return await this.assignUserRoleUseCase.execute({
        userId,
        role: dto.role,
        zoneId: dto.zoneId,
      });
    } catch (error) {
      if (
        error instanceof InvalidRoleError ||
        error instanceof ZoneRequiredError ||
        error instanceof UnexpectedZoneError
      ) {
        throw new BadRequestException(error.message);
      }
      if (
        error instanceof ZoneNotFoundError ||
        error instanceof UserNotFoundError
      ) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}
