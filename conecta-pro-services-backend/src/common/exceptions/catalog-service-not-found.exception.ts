export class CatalogServiceNotFoundException extends Error {
    constructor() {
        super("Service not found in the catalog.");
        this.name = "CatalogServiceNotFoundException";
    }
}
