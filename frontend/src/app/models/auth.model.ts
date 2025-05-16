export interface AuthRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
}

export interface User {
  id?: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_staff?: boolean;
  is_superuser?: boolean;
  is_admin?: boolean;
  groups?: string[];
}

export interface RefreshTokenRequest {
  refresh: string;
}

export enum UserRole {
  ADMIN = 'admin',
  PATIENT = 'patient',
  UNKNOWN = 'unknown'
}

// Hilfstyp zur direkten Überprüfung von Admin-Attributen im Benutzer-Objekt
export interface AdminAttributes {
  is_staff: boolean;
  is_superuser?: boolean;
  groups?: string[];
} 