import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { UserRole } from '../../auth/domain/user-role.enum.js';
import { UserOrmEntity } from '../../auth/infrastructure/user.orm-entity.js';
import { CreateAdvisorDto } from '../presentation/dto/create-advisor.dto.js';
import { UpdateAdvisorDto } from '../presentation/dto/update-advisor.dto.js';
import { AdvisorOrmEntity } from '../infrastructure/advisor.orm-entity.js';

type AdvisorFields = Pick<
  AdvisorOrmEntity,
  'nombre' | 'correo' | 'telefono' | 'idUsuario'
>;

@Injectable()
export class AdvisorService {
  constructor(
    @InjectRepository(AdvisorOrmEntity)
    private readonly advisorRepository: Repository<AdvisorOrmEntity>,
    @InjectRepository(UserOrmEntity)
    private readonly userRepository: Repository<UserOrmEntity>,
  ) {}

  async create(input: CreateAdvisorDto): Promise<AdvisorOrmEntity> {
    const values = this.validateFields(input);
    await this.ensureEmailIsAvailable(values.correo);
    if (values.idUsuario) {
      await this.ensureUserIsNotLinked(values.idUsuario);
    }
    const user = values.idUsuario
      ? await this.getAdvisorUser(values.idUsuario, values.correo)
      : null;

    const advisor = this.advisorRepository.create({
      ...values,
      estado: true,
      usuario: user,
    });

    try {
      return await this.advisorRepository.save(advisor);
    } catch (error) {
      this.rethrowConflict(error);
      throw error;
    }
  }

  async list(includeInactive = true): Promise<AdvisorOrmEntity[]> {
    return this.advisorRepository.find({
      where: includeInactive ? undefined : { estado: true },
      order: { idAsesor: 'ASC' },
    });
  }

  async listAvailableForRoutes(): Promise<AdvisorOrmEntity[]> {
    return this.advisorRepository.find({
      where: { estado: true },
      order: { nombre: 'ASC' },
    });
  }

  async getById(id: number): Promise<AdvisorOrmEntity> {
    const advisor = await this.advisorRepository.findOneBy({ idAsesor: id });
    if (!advisor) {
      throw new NotFoundException('Advisor not found');
    }
    return advisor;
  }

  async update(id: number, input: UpdateAdvisorDto): Promise<AdvisorOrmEntity> {
    const advisor = await this.getById(id);
    const values = this.validateFields(input, true);

    if (values.correo) {
      await this.ensureEmailIsAvailable(values.correo, id);
    }
    if (values.idUsuario) {
      const user = await this.getAdvisorUser(
        values.idUsuario,
        values.correo ?? advisor.correo,
      );
      await this.ensureUserIsNotLinked(values.idUsuario, id);
      advisor.usuario = user;
      advisor.idUsuario = values.idUsuario;
    }

    Object.assign(advisor, values);
    try {
      return await this.advisorRepository.save(advisor);
    } catch (error) {
      this.rethrowConflict(error);
      throw error;
    }
  }

  async setStatus(id: number, estado: boolean): Promise<AdvisorOrmEntity> {
    if (typeof estado !== 'boolean') {
      throw new BadRequestException('estado must be a boolean');
    }
    const advisor = await this.getById(id);
    advisor.estado = estado;
    return this.advisorRepository.save(advisor);
  }

  async deactivate(id: number): Promise<AdvisorOrmEntity> {
    return this.setStatus(id, false);
  }

  async getActiveForRouteAssignment(id: number): Promise<AdvisorOrmEntity> {
    const advisor = await this.getById(id);
    if (!advisor.estado) {
      throw new ConflictException(
        'Inactive advisors cannot be assigned to routes',
      );
    }
    return advisor;
  }

  private validateFields(input: CreateAdvisorDto): AdvisorFields;
  private validateFields(
    input: UpdateAdvisorDto,
    partial: true,
  ): Partial<AdvisorFields>;
  private validateFields(
    input: CreateAdvisorDto | UpdateAdvisorDto,
    partial = false,
  ): Partial<AdvisorFields> {
    if (!input || typeof input !== 'object') {
      throw new BadRequestException('A valid advisor payload is required');
    }

    const values: Partial<AdvisorFields> = {};

    if (!partial || input.nombre !== undefined) {
      if (
        typeof input.nombre !== 'string' ||
        input.nombre.trim().length < 2 ||
        input.nombre.trim().length > 200
      ) {
        throw new BadRequestException(
          'nombre must contain between 2 and 200 characters',
        );
      }
      values.nombre = input.nombre.trim();
    }

    if (!partial || input.correo !== undefined) {
      if (
        typeof input.correo !== 'string' ||
        input.correo.length > 255 ||
        !/^[^\s@]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/.test(input.correo.trim())
      ) {
        throw new BadRequestException('correo must be a valid email address');
      }
      values.correo = input.correo.trim().toLowerCase();
    }

    if (!partial || input.telefono !== undefined) {
      if (
        typeof input.telefono !== 'string' ||
        input.telefono.trim().length < 1 ||
        input.telefono.trim().length > 30
      ) {
        throw new BadRequestException(
          'telefono must contain between 1 and 30 characters',
        );
      }
      values.telefono = input.telefono.trim();
    }

    if (!partial || input.idUsuario !== undefined) {
      if (input.idUsuario === undefined && !partial) {
        values.idUsuario = null;
      } else if (
        typeof input.idUsuario !== 'string' ||
        input.idUsuario.trim().length === 0
      ) {
        throw new BadRequestException('idUsuario must be a non-empty string');
      } else {
        values.idUsuario = input.idUsuario.trim();
      }
    }

    if (partial && Object.keys(values).length === 0) {
      throw new BadRequestException(
        'At least one advisor field must be provided',
      );
    }

    if (!partial) {
      if (
        typeof values.nombre !== 'string' ||
        typeof values.correo !== 'string' ||
        typeof values.telefono !== 'string' ||
        (values.idUsuario !== null && typeof values.idUsuario !== 'string')
      ) {
        throw new BadRequestException('All advisor fields are required');
      }
      return {
        nombre: values.nombre,
        correo: values.correo,
        telefono: values.telefono,
        idUsuario: values.idUsuario,
      };
    }

    return values;
  }

  private async getAdvisorUser(
    id: string,
    email: string,
  ): Promise<UserOrmEntity> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException('The linked user does not exist');
    }
    if (user.role !== UserRole.ASESOR) {
      throw new BadRequestException(
        'The linked user must have the ASESOR role',
      );
    }
    if (user.email.toLowerCase() !== email.toLowerCase()) {
      throw new BadRequestException(
        'The advisor email must match the linked user email',
      );
    }
    return user;
  }

  private async ensureEmailIsAvailable(
    email: string,
    exceptId?: number,
  ): Promise<void> {
    const query = this.advisorRepository
      .createQueryBuilder('advisor')
      .where('LOWER(advisor.correo) = :email', { email });
    if (exceptId !== undefined) {
      query.andWhere('advisor.idAsesor <> :exceptId', { exceptId });
    }
    if (await query.getOne()) {
      throw new ConflictException('An advisor with this email already exists');
    }
  }

  private async ensureUserIsNotLinked(
    userId: string,
    exceptId?: number,
  ): Promise<void> {
    const query = this.advisorRepository
      .createQueryBuilder('advisor')
      .where('advisor.idUsuario = :userId', { userId });
    if (exceptId !== undefined) {
      query.andWhere('advisor.idAsesor <> :exceptId', { exceptId });
    }
    if (await query.getOne()) {
      throw new ConflictException('The user is already linked to an advisor');
    }
  }

  private rethrowConflict(error: unknown): void {
    if (
      error instanceof QueryFailedError &&
      'code' in error.driverError &&
      error.driverError.code === '23505'
    ) {
      const constraint =
        'constraint' in error.driverError &&
        typeof error.driverError.constraint === 'string'
          ? error.driverError.constraint
          : '';
      if (constraint.includes('correo')) {
        throw new ConflictException(
          'An advisor with this email already exists',
        );
      }
      if (constraint.includes('usuario') || constraint.includes('id_usuario')) {
        throw new ConflictException('The user is already linked to an advisor');
      }
      throw new ConflictException(
        'An advisor with the same unique value already exists',
      );
    }
  }
}
