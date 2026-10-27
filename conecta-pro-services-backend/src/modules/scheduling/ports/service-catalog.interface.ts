export const SERVICE_CATALOG = Symbol('SERVICE_CATALOG');

export interface ServiceSnapshot {
    serviceId: string;
    durationInMinutes: number;
}

export interface IServiceCatalog {
    findById(serviceId: string): Promise<ServiceSnapshot | null>;
}
