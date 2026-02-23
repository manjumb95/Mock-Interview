export interface User {
    id: string;
    email: string;
    name: string | null;
    credits: number;
    role: 'USER' | 'ADMIN';
}

export interface AuthResponse {
    message: string;
    token: string;
    user: User;
}
