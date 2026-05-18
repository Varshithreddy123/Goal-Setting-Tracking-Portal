import { Schema, model, models, type InferSchemaType } from 'mongoose';

export const auditLogSchema = new Schema(
  {
    goalId: { type: String, required: true, index: true },
    changedBy: { type: String, required: true, index: true },
    changeType: { type: String, required: true, enum: ['CREATE', 'UPDATE', 'DELETE', 'LOCK', 'UNLOCK'] },
    oldValues: { type: Schema.Types.Mixed },
    newValues: { type: Schema.Types.Mixed },
    reason: { type: String },
  },
  { timestamps: true, versionKey: false }
);

export type AuditLogDoc = InferSchemaType<typeof auditLogSchema> & { _id: any };

export const AuditLog = models.AuditLog ?? model('AuditLog', auditLogSchema);
