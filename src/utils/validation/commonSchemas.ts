import { z } from 'zod';
import { PHONE_REGEX } from './regex.js';
import { VALIDATION_MESSAGES } from './messages.js';

export const phoneSchema = z.string().regex(PHONE_REGEX, VALIDATION_MESSAGES.INVALID_PHONE);
export const emailSchema = z.string().email(VALIDATION_MESSAGES.INVALID_EMAIL);
