import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../../shared/auth/auth.module.js';

import { ClientsModule } from '../../shared/clients/clients.module.js';

import { ActivityLogModule } from '../../shared/activity-log/activity-log.module.js';

import { FileStorageModule } from '../../shared/file-storage/file-storage.module.js';

import { FollowUpDao } from './domain/dao/follow-up.dao.js';

import { VisitAttachmentDao } from './domain/dao/visit-attachment.dao.js';

import { FollowUpOrmEntity } from './infrastructure/follow-up.orm-entity.js';

import { VisitAttachmentOrmEntity } from './infrastructure/visit-attachment.orm-entity.js';

import { TypeOrmFollowUpDao } from './infrastructure/dao/typeorm-follow-up.dao.js';

import { TypeOrmVisitAttachmentDao } from './infrastructure/dao/typeorm-visit-attachment.dao.js';

import { RescheduleVisitUseCase } from './application/use-cases/reschedule-visit.use-case.js';

import { MarkVisitNotVisitedUseCase } from './application/use-cases/mark-visit-not-visited.use-case.js';

import { RegisterCommercialOutcomeUseCase } from './application/use-cases/register-commercial-outcome.use-case.js';

import { CreateFollowUpUseCase } from './application/use-cases/create-follow-up.use-case.js';

import { GetFollowUpAgendaUseCase } from './application/use-cases/get-follow-up-agenda.use-case.js';

import { CompleteFollowUpUseCase } from './application/use-cases/complete-follow-up.use-case.js';

import { UploadVisitAttachmentUseCase } from './application/use-cases/upload-visit-attachment.use-case.js';

import { ListVisitAttachmentsUseCase } from './application/use-cases/list-visit-attachments.use-case.js';

import { DeleteVisitAttachmentUseCase } from './application/use-cases/delete-visit-attachment.use-case.js';

import { FollowUpsController } from './presentation/controllers/follow-ups.controller.js';

import { VisitDao } from './domain/dao/visit.dao.js';

import { VisitResultCatalogDao } from './domain/dao/visit-result-catalog.dao.js';

import { VisitOrmEntity } from './infrastructure/visit.orm-entity.js';

import { VisitResultOptionOrmEntity } from './infrastructure/visit-result-option.orm-entity.js';

import { VisitResultLinkOrmEntity } from './infrastructure/visit-result-link.orm-entity.js';

import { TypeOrmVisitDao } from './infrastructure/dao/typeorm-visit.dao.js';

import { TypeOrmVisitResultCatalogDao } from './infrastructure/dao/typeorm-visit-result-catalog.dao.js';

import { GetVisitAgendaUseCase } from './application/use-cases/get-visit-agenda.use-case.js';

import { GetVisitByIdUseCase } from './application/use-cases/get-visit-by-id.use-case.js';

import { StartVisitUseCase } from './application/use-cases/start-visit.use-case.js';

import { RegisterVisitResultUseCase } from './application/use-cases/register-visit-result.use-case.js';

import { VisitsController } from './presentation/controllers/visit.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VisitOrmEntity,
      VisitResultOptionOrmEntity,
      VisitResultLinkOrmEntity,
      FollowUpOrmEntity,
      VisitAttachmentOrmEntity,
    ]),
    AuthModule,
    ClientsModule,
    ActivityLogModule,
    FileStorageModule,
  ],
  controllers: [VisitsController, FollowUpsController],
  providers: [
    {
      provide: VisitDao,
      useClass: TypeOrmVisitDao,
    },
    {
      provide: VisitResultCatalogDao,
      useClass: TypeOrmVisitResultCatalogDao,
    },
    GetVisitAgendaUseCase,
    GetVisitByIdUseCase,
    StartVisitUseCase,
    RegisterVisitResultUseCase,
    {
      provide: FollowUpDao,
      useClass: TypeOrmFollowUpDao,
    },
    {
      provide: VisitAttachmentDao,
      useClass: TypeOrmVisitAttachmentDao,
    },
    RescheduleVisitUseCase,
    MarkVisitNotVisitedUseCase,
    RegisterCommercialOutcomeUseCase,
    CreateFollowUpUseCase,
    GetFollowUpAgendaUseCase,
    CompleteFollowUpUseCase,
    UploadVisitAttachmentUseCase,
    ListVisitAttachmentsUseCase,
    DeleteVisitAttachmentUseCase,
  ],
  exports: [VisitDao, VisitResultCatalogDao],
})
export class VisitsModule {}
