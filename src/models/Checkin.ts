import { Schema, model, models, type InferSchemaType } from 'mongoose';

export type ProgressStatus = 'Not Started' | 'On Track' | 'Completed';

export const checkinSchema = new Schema(
  {
    goalId: { type: String, required: true, index: true },
    quarter: { type: String, required: true, trim: true },
    plannedTarget: { type: Number, required: true },
    actualAchievement: { type: Number, required: true },
    progressStatus: {
      type: String,
      required: true,
      enum: ['Not Started', 'On Track', 'Completed'],
      default: 'Not Started',
    },
    employeeComment: { type: String, required: false, default: '', trim: true },
    managerComment: { type: String, required: false, default: '', trim: true },

    // Phase-2 computed score based on Goal.metricDirection + UoM
    computedScore: { type: Number, required: true, default: 0 },
  },
  { timestamps: true, versionKey: false }
);

export type CheckinDoc = InferSchemaType<typeof checkinSchema> & { _id: any };

export const Checkin = models.Checkin ?? model('Checkin', checkinSchema);

