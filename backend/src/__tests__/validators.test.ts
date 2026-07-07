/**
 * Zod Validator Unit Tests
 *
 * Verifies that each validator schema correctly accepts valid inputs
 * and rejects invalid ones, without touching the database.
 */

import { describe, it, expect } from 'vitest';
import { sendOtpSchema, verifyOtpSignupSchema, loginSchema } from '../validators/auth.validator';
import { uploadMaterialSchema, getMaterialsQuerySchema } from '../validators/materials.validator';
import { createGroupSchema, getGroupsQuerySchema, createPostSchema } from '../validators/community.validator';

// ─── Auth validators ───────────────────────────────────────────────────────────

describe('sendOtpSchema', () => {
  it('accepts a valid email', () => {
    expect(() => sendOtpSchema.parse({ email: 'user@example.com' })).not.toThrow();
  });
  it('rejects an invalid email', () => {
    expect(() => sendOtpSchema.parse({ email: 'not-an-email' })).toThrow();
  });
  it('rejects missing email', () => {
    expect(() => sendOtpSchema.parse({})).toThrow();
  });
});

describe('verifyOtpSignupSchema', () => {
  const valid = { fullName: 'Alice', email: 'alice@example.com', password: 'secret123', otp: '123456' };
  it('accepts valid data', () => {
    expect(() => verifyOtpSignupSchema.parse(valid)).not.toThrow();
  });
  it('rejects password shorter than 6 chars', () => {
    expect(() => verifyOtpSignupSchema.parse({ ...valid, password: '123' })).toThrow();
  });
  it('rejects OTP with wrong length', () => {
    expect(() => verifyOtpSignupSchema.parse({ ...valid, otp: '12345' })).toThrow();
  });
  it('rejects missing fullName', () => {
    expect(() => verifyOtpSignupSchema.parse({ ...valid, fullName: '' })).toThrow();
  });
});

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    expect(() => loginSchema.parse({ email: 'u@e.com', password: 'pass' })).not.toThrow();
  });
  it('rejects empty password', () => {
    expect(() => loginSchema.parse({ email: 'u@e.com', password: '' })).toThrow();
  });
});

// ─── Materials validators ──────────────────────────────────────────────────────

describe('uploadMaterialSchema', () => {
  it('accepts minimum valid data (title only)', () => {
    expect(() => uploadMaterialSchema.parse({ title: 'My Notes' })).not.toThrow();
  });
  it('accepts full valid data with link', () => {
    expect(() => uploadMaterialSchema.parse({
      title: 'Lecture', type: 'notes', link: 'https://example.com', subject: 'Maths', difficulty: 'easy'
    })).not.toThrow();
  });
  it('rejects empty title', () => {
    expect(() => uploadMaterialSchema.parse({ title: '' })).toThrow();
  });
  it('rejects title over 255 chars', () => {
    expect(() => uploadMaterialSchema.parse({ title: 'x'.repeat(256) })).toThrow();
  });
  it('rejects invalid URL for link', () => {
    expect(() => uploadMaterialSchema.parse({ title: 'Test', link: 'not-a-url' })).toThrow();
  });
});

describe('getMaterialsQuerySchema', () => {
  it('accepts empty query (defaults)', () => {
    const parsed = getMaterialsQuerySchema.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(5);
  });
  it('coerces page/limit from strings', () => {
    const parsed = getMaterialsQuerySchema.parse({ page: '2', limit: '10' });
    expect(parsed.page).toBe(2);
    expect(parsed.limit).toBe(10);
  });
  it('rejects negative page', () => {
    expect(() => getMaterialsQuerySchema.parse({ page: '-1' })).toThrow();
  });
  it('rejects limit over 100', () => {
    expect(() => getMaterialsQuerySchema.parse({ limit: '101' })).toThrow();
  });
});

// ─── Community validators ──────────────────────────────────────────────────────

describe('createGroupSchema', () => {
  it('accepts valid group data', () => {
    expect(() => createGroupSchema.parse({ name: 'Study Crew', description: 'We study hard' })).not.toThrow();
  });
  it('applies default category and meetingSchedule', () => {
    const parsed = createGroupSchema.parse({ name: 'Crew', description: 'desc' });
    expect(parsed.category).toBe('other');
    expect(parsed.meetingSchedule).toBe('Not scheduled');
  });
  it('rejects empty name', () => {
    expect(() => createGroupSchema.parse({ name: '', description: 'desc' })).toThrow();
  });
});

describe('createPostSchema', () => {
  it('accepts non-empty content', () => {
    expect(() => createPostSchema.parse({ content: 'Hello world' })).not.toThrow();
  });
  it('rejects empty content', () => {
    expect(() => createPostSchema.parse({ content: '' })).toThrow();
  });
});

describe('getGroupsQuerySchema', () => {
  it('accepts empty query', () => {
    expect(() => getGroupsQuerySchema.parse({})).not.toThrow();
  });
  it('accepts category and search', () => {
    expect(() => getGroupsQuerySchema.parse({ category: 'science', search: 'physics' })).not.toThrow();
  });
});
