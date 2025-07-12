import { supabase } from '../config/supabase';
import { sendInviteEmail, checkEmailJSConfig } from './emailService';
import toast from 'react-hot-toast';

export interface PendingInvite {
  id: string;
  email: string;
  role: 'admin' | 'user' | 'disabled';
  invited_by: string | null;
  invite_token: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InviteData {
  email: string;
  role: 'admin' | 'user';
}

/**
 * Meghívó létrehozása (admin funkció)
 */
export async function createInvite(inviteData: InviteData): Promise<PendingInvite> {
  console.log('🚀 Creating invite:', inviteData);
  
  try {
    // Először ellenőrizzük a Supabase kapcsolatot
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      console.error('❌ Auth check failed:', authError);
      throw new Error('Nincs bejelentkezve vagy lejárt a session');
    }
    
    console.log('✅ Auth check passed, user:', authData.user.email);
    
    // Meghívó létrehozása
    console.log('📤 Calling create_user_invite RPC...');
    const { data, error } = await supabase
      .rpc('create_user_invite', {
        invite_email: inviteData.email,
        invite_role: inviteData.role
      });

    console.log('📥 RPC Response:', { data, error });

    if (error) {
      console.error('❌ RPC Error:', error);
      
      // Specifikus hibakezelés
      if (error.message.includes('function') && error.message.includes('not found')) {
        throw new Error('A meghívó funkció nincs telepítve a database-ben. Futtasd le a create-invite-system.sql scriptet!');
      } else if (error.message.includes('permission denied')) {
        throw new Error('Nincs jogosultságod meghívó küldésére. Csak adminok küldhetnek meghívót.');
      } else if (error.message.includes('already exists')) {
        throw new Error('Ezzel az email címmel már létezik felhasználó vagy aktív meghívó.');
      }
      
      throw error;
    }

    if (!data || data.length === 0) {
      console.error('❌ No data returned from RPC');
      throw new Error('A server nem adott vissza meghívó adatokat');
    }

    const invite = data[0] as PendingInvite;
    console.log('✅ Invite created successfully:', invite);
    
    // Meghívó URL generálása
    const inviteUrl = `${window.location.origin}/invite/${invite.invite_token}`;
    
    // Email küldés megkísérlése
    console.log('📧 Attempting to send invite email...');
    
    // EmailJS konfiguráció ellenőrzése
    const emailConfig = checkEmailJSConfig();
    console.log('📋 Email configuration:', emailConfig);
    
    try {
      const emailSent = await sendInviteEmail(invite.email, invite.invite_token);
      
      if (emailSent) {
        if (emailConfig.configured) {
          toast.success(`✅ Meghívó létrehozva és email elküldve: ${invite.email}`);
          console.log('✅ Real email sent successfully to:', invite.email);
        } else {
          toast.success(`✅ Meghívó létrehozva! (Email mock mode) Link: ${inviteUrl}`);
          console.log('🎭 Mock email sent to:', invite.email);
        }
      } else {
        toast.success(`⚠️ Meghívó létrehozva, de email küldés sikertelen. Link: ${inviteUrl}`);
        console.warn('⚠️ Email sending failed, but invite created');
      }
    } catch (emailError) {
      console.error('❌ Email service error:', emailError);
      toast.success(`⚠️ Meghívó létrehozva, email hiba miatt manual küldés szükséges. Link: ${inviteUrl}`);
    }
    
    console.log('🔗 Invite URL:', inviteUrl);
    
    return invite;
  } catch (error) {
    console.error('Error in createInvite:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        toast.error('Ezzel az email címmel már létezik felhasználó');
      } else if (error.message.includes('Active invite already exists')) {
        toast.error('Már van aktív meghívó ehhez az email címhez');
      } else if (error.message.includes('Unauthorized')) {
        toast.error('Csak adminok hozhatnak létre meghívókat');
      } else {
        toast.error(`Hiba a meghívó létrehozása során: ${error.message}`);
      }
    } else {
      toast.error('Ismeretlen hiba történt a meghívó létrehozása során');
    }
    
    throw error;
  }
}

/**
 * Aktív meghívók lekérése (admin funkció)
 */
export async function getPendingInvites(): Promise<PendingInvite[]> {
  try {
    const { data, error } = await supabase
      .from('pending_invites')
      .select(`
        *,
        invited_by_profile:invited_by(email, full_name)
      `)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending invites:', error);
      throw error;
    }

    return data as PendingInvite[];
  } catch (error) {
    console.error('Error in getPendingInvites:', error);
    toast.error('Hiba a meghívók betöltése során');
    throw error;
  }
}

/**
 * Meghívó token validálása (publikus funkció)
 */
export async function validateInvite(token: string): Promise<PendingInvite | null> {
  try {
    const { data, error } = await supabase
      .rpc('validate_invite_token', {
        token: token
      });

    if (error) {
      console.error('Error validating invite:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    return data[0] as PendingInvite;
  } catch (error) {
    console.error('Error in validateInvite:', error);
    return null;
  }
}

/**
 * Regisztráció meghívó alapján
 */
export async function acceptInvite(
  token: string, 
  password: string, 
  displayName?: string
): Promise<void> {
  try {
    // 1. Meghívó validálása
    const invite = await validateInvite(token);
    if (!invite) {
      throw new Error('Érvénytelen vagy lejárt meghívó');
    }

    // 2. Felhasználó regisztráció Supabase Auth-ban
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: invite.email,
      password: password,
      options: {
        data: {
          display_name: displayName || invite.email.split('@')[0],
          role: invite.role,
          invite_token: token
        }
      }
    });

    if (signUpError) {
      console.error('Auth signup error:', signUpError);
      throw signUpError;
    }

    if (!authData.user) {
      throw new Error('Felhasználó létrehozása sikertelen');
    }

    // 3. Meghívó token felhasználása és profil létrehozása
    const { error: useInviteError } = await supabase
      .rpc('use_invite_token', {
        token: token,
        new_user_id: authData.user.id
      });

    if (useInviteError) {
      console.error('Error using invite token:', useInviteError);
      // Ne blokkoljuk a folyamatot, ha a token használata nem sikerül
      console.warn('Invite token usage failed, but user was created');
    }

    toast.success('Sikeres regisztráció! Jelentkezz be az új fiókkal.');
    
  } catch (error) {
    console.error('Error in acceptInvite:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('User already registered')) {
        toast.error('Ezzel az email címmel már regisztráltak');
      } else if (error.message.includes('Password')) {
        toast.error('A jelszó túl gyenge. Minimum 6 karakter szükséges.');
      } else {
        toast.error(`Hiba a regisztráció során: ${error.message}`);
      }
    } else {
      toast.error('Ismeretlen hiba történt a regisztráció során');
    }
    
    throw error;
  }
}

/**
 * Meghívó törlése (admin funkció)
 */
export async function cancelInvite(inviteId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('pending_invites')
      .delete()
      .eq('id', inviteId);

    if (error) {
      console.error('Error canceling invite:', error);
      throw error;
    }

    toast.success('Meghívó törölve');
  } catch (error) {
    console.error('Error in cancelInvite:', error);
    toast.error('Hiba a meghívó törlése során');
    throw error;
  }
}

/**
 * Lejárt meghívók tisztítása (admin funkció)
 */
export async function cleanupExpiredInvites(): Promise<number> {
  try {
    const { data, error } = await supabase
      .rpc('cleanup_expired_invites');

    if (error) {
      console.error('Error cleaning up invites:', error);
      throw error;
    }

    const deletedCount = data as number;
    toast.success(`${deletedCount} lejárt meghívó törölve`);
    
    return deletedCount;
  } catch (error) {
    console.error('Error in cleanupExpiredInvites:', error);
    toast.error('Hiba a meghívók tisztítása során');
    throw error;
  }
}
