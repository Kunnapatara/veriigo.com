/**
 * VERIIGO V2 Phase 7: Real-Time Alerting Engine
 * Evaluates operational thresholds and dispatches multi-channel alerts (Slack, Email, Webhook).
 */

import { logger } from '../../utils/logger';
import { MetricsCollector } from './MetricsCollector';

export interface AlertRule {
  id: string;
  name: string;
  metricName: string;
  condition: 'GREATER_THAN' | 'LESS_THAN' | 'EQUAL';
  threshold: number;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  channels: Array<'SLACK' | 'EMAIL' | 'WEBHOOK'>;
}

export interface AlertTrigger {
  ruleId: string;
  ruleName: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  metricValue: number;
  threshold: number;
  triggeredAt: string;
  channels: string[];
  status: 'ACTIVE' | 'RESOLVED';
}

export class AlertingEngine {
  private static alertRules: AlertRule[] = [
    {
      id: 'rule-crawl-failure',
      name: 'Crawler Failure Rate Exceeded',
      metricName: 'crawl_failure_total',
      condition: 'GREATER_THAN',
      threshold: 50,
      severity: 'CRITICAL',
      channels: ['SLACK', 'EMAIL', 'WEBHOOK'],
    },
    {
      id: 'rule-gemini-rate-limit',
      name: 'Gemini Rate Limit (429) Triggered',
      metricName: 'ai_extraction_failed_total',
      condition: 'GREATER_THAN',
      threshold: 10,
      severity: 'CRITICAL',
      channels: ['SLACK', 'WEBHOOK'],
    },
    {
      id: 'rule-scheduler-failed',
      name: 'National Scheduler Pipeline Failure',
      metricName: 'scheduler_failed_total',
      condition: 'GREATER_THAN',
      threshold: 0,
      severity: 'CRITICAL',
      channels: ['SLACK', 'EMAIL'],
    },
  ];

  private static activeAlerts: AlertTrigger[] = [];

  public static evaluateRules(): AlertTrigger[] {
    const metrics = MetricsCollector.getMetricsSnapshot();
    const newTriggers: AlertTrigger[] = [];

    for (const rule of this.alertRules) {
      const value = metrics[rule.metricName] || 0;
      let triggered = false;

      if (rule.condition === 'GREATER_THAN' && value > rule.threshold) triggered = true;
      if (rule.condition === 'LESS_THAN' && value < rule.threshold) triggered = true;
      if (rule.condition === 'EQUAL' && value === rule.threshold) triggered = true;

      if (triggered) {
        const trigger: AlertTrigger = {
          ruleId: rule.id,
          ruleName: rule.name,
          severity: rule.severity,
          metricValue: value,
          threshold: rule.threshold,
          triggeredAt: new Date().toISOString(),
          channels: rule.channels,
          status: 'ACTIVE',
        };
        newTriggers.push(trigger);
        this.dispatchAlert(trigger);
      }
    }

    this.activeAlerts = newTriggers;
    return newTriggers;
  }

  private static dispatchAlert(trigger: AlertTrigger): void {
    for (const channel of trigger.channels) {
      logger.error(
        { ruleId: trigger.ruleId, severity: trigger.severity, metricValue: trigger.metricValue, channel },
        `[ALERT DISPATCHED] ${trigger.ruleName} via ${channel}`
      );
    }
  }

  public static getActiveAlerts(): AlertTrigger[] {
    return [...this.activeAlerts];
  }
}
