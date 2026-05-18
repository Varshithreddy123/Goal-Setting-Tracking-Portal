import { NextResponse } from 'next/server';

export function json(data: unknown, init?: number | ResponseInit) {
  if (typeof init === 'number') return NextResponse.json(data, { status: init });
  return NextResponse.json(data, init);
}

export function badRequest(message: string, details?: unknown) {
  return json({ ok: false, error: { message, details } }, 400);
}

export function unauthorized(message = 'Unauthorized') {
  return json({ ok: false, error: { message } }, 401);
}

export function forbidden(message = 'Forbidden') {
  return json({ ok: false, error: { message } }, 403);
}

export function notFound(message = 'Not found') {
  return json({ ok: false, error: { message } }, 404);
}

export function conflict(message = 'Conflict', details?: unknown) {
  return json({ ok: false, error: { message, details } }, 409);
}

export function serverError(message = 'Internal Server Error', details?: unknown) {
  return json({ ok: false, error: { message, details } }, 500);
}

