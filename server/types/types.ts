/**
 * The user shape returned to the frontend 
 * — intentionally excludes password and Mongoose internals
 */
export interface FrontendUser {
  _id: string;
  username: string;
  email: string;
}


/**
 * Standard wrapper for auth endpoint responses
 */
export interface AuthResponse {
  frontendUser: FrontendUser;
  token: string; // JWT Token
}
