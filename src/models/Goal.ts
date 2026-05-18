import { Schema, model, models, type InferSchemaType } from 'mongoose';

export type GoalStatus = 'Not Started' | 'On Track' | 'Completed';

export const goalSchema = new Schema(
  {
    employeeId: { type: String, required: true, index: true },
    createdBy: { type: String, required: true, index: true },

    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    thrustArea: { type: String, required: true, trim: true },
    uomType: { 
      type: String, 
      required: true, 
      trim: true,
      enum: ['Numeric', '%', 'Percentage', 'Timeline', 'Zero-based']
    },

    target: { type: Number, required: true },
    weightage: { type: Number, required: true },
    deadline: { type: Date, required: true },

    status: { type: String, required: true, default: 'Active', trim: true },
    approvalStatus: { type: String, required: true, default: 'Pending', trim: true },

    managerComment: { type: String, required: false, default: '', trim: true },
    locked: { type: Boolean, required: true, default: false },

    // Shared Goals functionality
    isShared: { type: Boolean, default: false },
    parentGoalId: { type: String, default: null, index: true },

    // Phase-2 BRD scoring direction metadata
    // Min: higher achievement better
    // Max: lower achievement better
    // Timeline: deadline-based
    // Zero: zero achievement indicates success
    metricDirection: {
      type: String,
      enum: ['Min', 'Max', 'Timeline', 'Zero'],
      required: true,
      default: 'Min',
    },
  },
  { timestamps: true, versionKey: false }
);


export type GoalDoc = InferSchemaType<typeof goalSchema> & { _id: any };

export const Goal = models.Goal ?? model('Goal', goalSchema);

