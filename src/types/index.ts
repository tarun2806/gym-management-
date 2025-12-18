export type Role = 'owner' | 'admin' | 'manager' | 'staff' | 'user';

export interface User {
    id: string | number;
    username: string;
    email: string | undefined;
    role: Role;
    status?: 'active' | 'inactive' | 'suspended';
    lastLogin?: string;
    permissions: string[];
    app_metadata?: {
        role?: string;
    };
    user_metadata?: {
        role?: string;
    };
}
