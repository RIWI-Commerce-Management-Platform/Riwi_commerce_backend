import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../../shared/auth/auth.module.js';

import { ClientsModule } from '../../shared/clients/clients.module.js';

import { ActivityLogModule } from '../../shared/activity-log/activity-log.module.js';

import { FileStorageModule } from '../../shared/file-storage/file-storage.module.js';

import { VisitDao } from './domain/dao/visit.dao.js';

import { VisitResultCatalogDao } from './domain/dao/visit-result-catalog.dao.js';

import { VisitAttachmentDao } from './domain/dao/visit-attachment.dao.js';

import { VisitOrmEntity } from './infrastructure/visit.orm-entity.js';

import { VisitAttachmentOrmEntity } from './infrastructure/visit-attachment.orm-entity.js';

import { VisitResultOptionOrmEntity } from './infrastructure/visit-result-option.orm-entity.js';

import { VisitResultLinkOrmEntity } from './infrastructure/visit-result-link.orm-entity.js';

import { TypeOrmVisitDao } from './infrastructure/dao/typeorm-visit.dao.js';

import { TypeOrmVisitResultCatalogDao } from './infrastructure/dao/typeorm-visit-result-catalog.dao.js';

import { TypeOrmVisitAttachmentDao } from './infrastructure/dao/typeorm-visit-attachment.dao.js';

import { GetVisitAgendaUseCase } from './application/use-cases/get-visit-agenda.use-case.js';

import { GetVisitByIdUseCase } from './application/use-cases/get-visit-by-id.use-case.js';

import { StartVisitUseCase } from './application/use-cases/start-visit.use-case.js';

import { RegisterVisitResultUseCase } from './application/use-cases/register-visit-result.use-case.js';

import { RescheduleVisitUseCase } from './application/use-cases/reschedule-visit.use-case.js';

import { MarkVisitNotVisitedUseCase } from './application/use-cases/mark-visit-not-visited.use-case.js';

import { GetVisitAttachmentsUseCase } from './application/use-cases/get-visit-attachments.use-case.js';

import { UploadVisitAttachmentUseCase } from './application/use-cases/upload-visit-attachment.use-case.js';

import { VisitsController } from './presentation/controllers/visit.controller.js';

// TEMPORARY: hardcoded test users while Better Auth is not integrated
// (owner: Efraín, E1). Remove this controller once the real auth module exists.
import { TestUsersController } from './presentation/controllers/test-users.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VisitOrmEntity,
      VisitAttachmentOrmEntity,
      VisitResultOptionOrmEntity,
      VisitResultLinkOrmEntity,
    ]),
    AuthModule,
    ClientsModule,
    ActivityLogModule,
    FileStorageModule,
  ],
  controllers: [VisitsController, TestUsersController],
  providers: [
    {
      provide: VisitDao,
      useClass: TypeOrmVisitDao,
    },
    {
      provide: VisitResultCatalogDao,
      useClass: TypeOrmVisitResultCatalogDao,
    },
    {
      provide: VisitAttachmentDao,
      useClass: TypeOrmVisitAttachmentDao,
    },
    GetVisitAgendaUseCase,
    GetVisitByIdUseCase,
    StartVisitUseCase,
    RegisterVisitResultUseCase,
    RescheduleVisitUseCase,
    MarkVisitNotVisitedUseCase,
    GetVisitAttachmentsUseCase,
    UploadVisitAttachmentUseCase,
  ],
  exports: [VisitDao, VisitResultCatalogDao],
})
export class VisitsModule {}
