import { Schema, model, models, type InferSchemaType } from 'mongoose';

export type CyclePhase = 'GOAL_SETTING' | 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'NONE';

export const cycleWindowSchema = new Schema(
  {
    phase: { type: String, required: true, index: true },
    // If true => phase is considered open (override). If false => closed.
    isOpen: { type: Boolean, required: true, default: false },
    // Flag to indicate this phase has been manually overridden by admin.
    override: { type: Boolean, required: true, default: false },
    updatedBy: { type: String, required: false, default: '' },
  },
  { timestamps: true, versionKey: false }
);

export type CycleWindowDoc = InferSchemaType<typeof cycleWindowSchema> & { _id: any };

export const CycleWindow = models.CycleWindow ?? model('CycleWindow', cycleWindowSchema);

