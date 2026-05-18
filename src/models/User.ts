import { Schema, model, models, type InferSchemaType } from 'mongoose';

export type UserRole = 'employee' | 'manager' | 'admin';

export type UserDoc = InferSchemaType<typeof userSchema>;

export const userSchema = new Schema(
  {
    uid: { type: String, required: true, unique: true, index: true },
    employeeId: { type: String, required: true, unique: true, index: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },

    // Placeholder only. Authentication is handled by Firebase client auth.
    password: { type: String, required: false, select: false },

    role: {
      type: String,
      required: true,
      enum: ['employee', 'manager', 'admin'],
      index: true,
    },
    department: { type: String, required: true, trim: true },
    managerId: { type: String, required: false, default: null, index: true },

    isActive: { type: Boolean, required: true, default: true, index: true },
  },
  { timestamps: true, versionKey: false }
);

export const User = models.User ?? model('User', userSchema);


