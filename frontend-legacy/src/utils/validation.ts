/**
 * Input Validation Module
 * Comprehensive validation for user inputs
 */

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Email validation
 */
export function validateEmail(email: string, fieldName = 'Email'): ValidationError | null {
  const trimmed = email.trim();
  
  if (trimmed.length === 0) {
    return { field: fieldName, message: `${fieldName} is required`, code: 'required' };
  }
  
  // Email regex pattern
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return { field: fieldName, message: 'Invalid email format', code: 'format' };
  }
  
  return null;
}

/**
 * Name validation
 */
export function validateName(
  name: string,
  fieldName = 'Name',
  minLength = 1,
  maxLength = 100
): ValidationError | null {
  const trimmed = name.trim();
  
  if (trimmed.length === 0) {
    return { field: fieldName, message: `${fieldName} is required`, code: 'required' };
  }
  
  if (trimmed.length < minLength) {
    return { field: fieldName, message: `${fieldName} must be at least ${minLength} characters`, code: 'min_length' };
  }
  
  if (trimmed.length > maxLength) {
    return { field: fieldName, message: `${fieldName} must be at most ${maxLength} characters`, code: 'max_length' };
  }
  
  return null;
}

/**
 * Password validation
 */
export function validatePassword(
  password: string,
  fieldName = 'Password',
  minLength = 6
): ValidationError | null {
  if (password.length === 0) {
    return { field: fieldName, message: `${fieldName} is required`, code: 'required' };
  }
  
  if (password.length < minLength) {
    return { field: fieldName, message: `${fieldName} must be at least ${minLength} characters`, code: 'min_length' };
  }
  
  return null;
}

/**
 * Role validation (whitelist)
 */
export function validateRole(
  role: string,
  fieldName = 'Role',
  allowedRoles: string[] = ['user', 'admin', 'moderator']
): ValidationError | null {
  const trimmed = role.trim();
  
  if (trimmed.length === 0) {
    return { field: fieldName, message: `${fieldName} is required`, code: 'required' };
  }
  
  if (!allowedRoles.includes(trimmed)) {
    return { field: fieldName, message: `Invalid role: ${trimmed}`, code: 'invalid_value' };
  }
  
  return null;
}

/**
 * Status validation (whitelist)
 */
export function validateStatus(
  status: string,
  fieldName = 'Status',
  allowedStatuses: string[] = ['active', 'inactive']
): ValidationError | null {
  const trimmed = status.trim();
  
  if (trimmed.length === 0) {
    return { field: fieldName, message: `${fieldName} is required`, code: 'required' };
  }
  
  if (!allowedStatuses.includes(trimmed)) {
    return { field: fieldName, message: `Invalid status: ${trimmed}`, code: 'invalid_value' };
  }
  
  return null;
}

/**
 * Validate user input object
 */
export function validateUserInput(user: {
  name?: string;
  email?: string;
  role?: string;
  status?: string;
  password?: string;
}): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Validate name
  if (user.name !== undefined) {
    const nameError = validateName(user.name);
    if (nameError) errors.push(nameError);
  }
  
  // Validate email
  if (user.email !== undefined) {
    const emailError = validateEmail(user.email);
    if (emailError) errors.push(emailError);
  }
  
  // Validate role
  if (user.role !== undefined) {
    const roleError = validateRole(user.role);
    if (roleError) errors.push(roleError);
  }
  
  // Validate status
  if (user.status !== undefined) {
    const statusError = validateStatus(user.status);
    if (statusError) errors.push(statusError);
  }
  
  // Validate password (only if provided)
  if (user.password !== undefined && user.password.length > 0) {
    const passwordError = validatePassword(user.password);
    if (passwordError) errors.push(passwordError);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  return errors.map(e => `${e.field}: ${e.message}`).join(', ');
}
