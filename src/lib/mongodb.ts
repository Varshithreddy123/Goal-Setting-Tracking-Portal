import mongoose from 'mongoose';

let cached = (global as unknown as { mongoose: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } }).mongoose;

if (!cached) {
  cached = { conn: null, promise: null };
  (global as unknown as { mongoose: typeof cached }).mongoose = cached;
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Missing MONGODB_URI in environment variables');
}

const uri: string = MONGODB_URI;


export async function connectToMongo(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
cached.promise = mongoose
      .connect(uri, {
        // keep defaults reasonably compatible with mongoose v7
      })
      .then((m) => m);

  }

  cached.conn = await cached.promise;
  return cached.conn;
}

