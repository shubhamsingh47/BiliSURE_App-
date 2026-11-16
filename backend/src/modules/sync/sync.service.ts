import { BilirubinReadingModel } from '../../models/BilirubinReading';
import { BabyModel } from '../../models/Baby';
import { ObservationModel } from '../../models/Observation';
import { ReadingsService } from '../readings/readings.service';
import { BabiesService } from '../babies/babies.service';
import { ObservationsService } from '../observations/observations.service';

export interface SyncOperationItem {
  operationId: string;
  entityType: 'baby' | 'reading' | 'observation';
  action: 'create' | 'update';
  payload: any;
  timestamp: string;
}

export class SyncService {
  static async processBatch(operations: SyncOperationItem[], userId?: string) {
    const results: any[] = [];

    for (const op of operations) {
      try {
        let serverId: string | undefined;

        if (op.entityType === 'reading') {
          const res = await ReadingsService.createReading({
            ...op.payload,
            clientOperationId: op.operationId,
          }, userId);
          serverId = res._id?.toString() || res.id;
        } else if (op.entityType === 'baby') {
          const res = await BabiesService.createBaby(op.payload, userId);
          serverId = res._id?.toString() || res.id;
        } else if (op.entityType === 'observation') {
          const res = await ObservationsService.create({
            ...op.payload,
            clientOperationId: op.operationId,
          });
          serverId = res._id?.toString() || res.id;
        }

        results.push({
          operationId: op.operationId,
          entityType: op.entityType,
          status: 'synced',
          serverId,
          confirmedAt: new Date().toISOString(),
        });
      } catch (err: any) {
        results.push({
          operationId: op.operationId,
          entityType: op.entityType,
          status: 'failed',
          error: err.message,
          confirmedAt: new Date().toISOString(),
        });
      }
    }

    return results;
  }
}
