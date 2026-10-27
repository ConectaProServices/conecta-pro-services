import { Injectable } from '@nestjs/common';
import { IServiceCatalog, ServiceSnapshot } from '../../modules/scheduling/ports/service-catalog.interface.js';

export const DEMO_SERVICE_ID = '33333333-3333-4333-8333-333333333333';

const SERVICES: ServiceSnapshot[] = [
    { serviceId: DEMO_SERVICE_ID, durationInMinutes: 60 },
];

@Injectable()
export class InMemoryServiceCatalog implements IServiceCatalog {
    async findById(serviceId: string): Promise<ServiceSnapshot | null> {
        return SERVICES.find((service) => service.serviceId === serviceId) ?? null;
    }
}
