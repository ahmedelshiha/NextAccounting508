export class NotificationService {
  async notifyServiceCreated(service: any, by: string): Promise<void> {
    console.info(`[notify] service created by ${by}: ${service?.name}`);
  }
  async notifyServiceUpdated(service: any, changes: string[], by: string): Promise<void> {
    console.info(`[notify] service updated by ${by}: ${service?.name} changes=${changes.join(',')}`);
  }
  async notifyServiceDeleted(service: any, by: string): Promise<void> {
    console.info(`[notify] service deleted by ${by}: ${service?.name}`);
  }
  async notifyBulkAction(action: string, count: number, by: string): Promise<void> {
    console.info(`[notify] bulk ${action} on ${count} services by ${by}`);
  }
}
