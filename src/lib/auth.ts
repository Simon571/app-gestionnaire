import { createClient } from '@supabase/supabase-js';

// Configuration Supabase (à remplacer par vos vraies clés)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'elder' | 'servant' | 'publisher' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  assemblyId: string;
  profile: {
    firstName: string;
    lastName: string;
    phone?: string;
  };
}

export class AuthService {
  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  static async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Récupérer le profil utilisateur
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return {
      id: user.id,
      email: user.email!,
      role: profile?.role || 'publisher',
      assemblyId: profile?.assembly_id,
      profile: {
        firstName: profile?.first_name,
        lastName: profile?.last_name,
        phone: profile?.phone,
      },
    };
  }

  static async hasPermission(requiredRole: UserRole): Promise<boolean> {
    const user = await this.getCurrentUser();
    if (!user) return false;

    const roleHierarchy = {
      'admin': 4,
      'elder': 3,
      'servant': 2,
      'publisher': 1,
    };

    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
  }
}