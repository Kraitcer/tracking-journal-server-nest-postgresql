import { createUserSchema } from './create-user.dto.js';

// The old server validated PUT /users/:id with the same schema as registration.
export const updateUserSchema = createUserSchema;
