import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchedulingService } from './services/scheduling.service.js';
import { SCHEDULING_REPOSITORY } from './repositories/scheduling.repository.interface.js';
import { SERVICE_CATALOG } from './ports/service-catalog.interface.js';
import { SchedulingEntity } from '../../infraestructure/persistence/scheduling/scheduling.orm-entity.js';
import { InMemoryServiceCatalog } from '../../infraestructure/catalog/in-memory-service-catalog.js';
import { TypeOrmSchedulingRepository } from '../../infraestructure/persistence/scheduling/typeorm-scheduling.repository.js';

@Module({
    imports: [TypeOrmModule.forFeature([SchedulingEntity])],
    providers: [
        SchedulingService,
        TypeOrmSchedulingRepository,
        InMemoryServiceCatalog,
        { provide: SCHEDULING_REPOSITORY, useExisting: TypeOrmSchedulingRepository },
        { provide: SERVICE_CATALOG, useExisting: InMemoryServiceCatalog },
    ],
    exports: [SchedulingService],
})
export class SchedulingModule {}
