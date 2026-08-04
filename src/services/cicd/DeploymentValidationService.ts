/**
 * VERIIGO V2 Phase 7: Automated Deployment Smoke Verification
 */

import { CloudRunHealthService } from '../platform/CloudRunHealthService';
import { MetricsCollector } from '../telemetry/MetricsCollector';
import { logger } from '../../utils/logger';

export class DeploymentValidationService {
  public static async executeSmokeVerification(): Promise<{
    status: 'PASSED' | 'FAILED';
    environment: string;
    checksPassed: number;
    checksTotal: number;
    details: Record<string, boolean>;
  }> {
    logger.info('Starting automated post-deployment smoke test verification...');

    const health = await CloudRunHealthService.checkReadiness();
    const metrics = MetricsCollector.getMetricsSnapshot();

    const details = {
      livenessProbe: health.status === 'UP' || health.status === 'DEGRADED',
      readinessProbe: health.checks.firestore,
      metricsCollectorActive: metrics['crawl_success_total'] !== undefined,
      eventBusActive: health.checks.eventBus,
    };

    const checksPassed = Object.values(details).filter(Boolean).length;
    const checksTotal = Object.keys(details).length;
    const status = checksPassed === checksTotal ? 'PASSED' : 'FAILED';

    logger.info({ status, checksPassed, checksTotal }, 'Completed post-deployment smoke test verification');

    return {
      status,
      environment: process.env.NODE_ENV || 'production',
      checksPassed,
      checksTotal,
      details,
    };
  }
}
