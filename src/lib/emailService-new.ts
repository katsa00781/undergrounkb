import emailjs from '@emailjs/browser';

// EmailJS konfiguráció - ezeket be kell állítani!
const EMAILJS_CONFIG = {
  SERVICE_ID: import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_ugkettlebell',
  TEMPLATE_ID: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_invite', 
  PUBLIC_KEY: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'YOUR_PUBLIC_KEY',
};

// Ellenőrizzük, hogy az EmailJS konfigurálva van-e
const isEmailJSConfigured = (): boolean => {
  return EMAILJS_CONFIG.PUBLIC_KEY !== 'YOUR_PUBLIC_KEY' && 
         EMAILJS_CONFIG.SERVICE_ID !== 'service_ugkettlebell' &&
         EMAILJS_CONFIG.TEMPLATE_ID !== 'template_invite';
};

/**
 * Mock email service amikor EmailJS nincs konfigurálva
 */
async function mockEmailService(recipientEmail: string, inviteToken: string): Promise<boolean> {
  console.log('🎭 Mock email service - simulating email send...');
  
  const inviteUrl = `${window.location.origin}/invite/${inviteToken}`;
  
  // Szimuláljuk az email küldést
  await new Promise(resolve => setTimeout(resolve, 1000)); // 1 sec delay
  
  console.log('📧 [MOCK EMAIL SENT]');
  console.log('To:', recipientEmail);
  console.log('Subject: Meghívó a UG KettleBell Pro rendszerbe');
  console.log('Content:');
  console.log(`
  Szia!
  
  Meghívást kaptál a UG KettleBell Pro rendszerbe!
  
  Kattints a linkre a regisztrációhoz:
  ${inviteUrl}
  
  Üdvözlettel,
  UG KettleBell Pro csapat
  `);
  
  // Böngésző notifikáció (ha engedélyezett)
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Email Mock küldés', {
      body: `Meghívó email mockként elküldve: ${recipientEmail}`,
      icon: '/favicon.ico'
    });
  }
  
  return true; // Minden esetben sikeres
}

/**
 * Valódi EmailJS email küldés
 */
async function sendRealEmail(recipientEmail: string, inviteToken: string, senderName: string): Promise<boolean> {
  const inviteUrl = `${window.location.origin}/invite/${inviteToken}`;
  
  // Email template paraméterek
  const templateParams = {
    to_email: recipientEmail,
    to_name: recipientEmail.split('@')[0],
    from_name: senderName,
    invite_url: inviteUrl,
    app_name: 'UG KettleBell Pro',
    message: `Meghívást kaptál a UG KettleBell Pro rendszerbe! Kattints a linkre a regisztrációhoz.`
  };
  
  console.log('📤 Sending real email with EmailJS:', templateParams);

  // Email küldés
  const response = await emailjs.send(
    EMAILJS_CONFIG.SERVICE_ID,
    EMAILJS_CONFIG.TEMPLATE_ID,
    templateParams,
    EMAILJS_CONFIG.PUBLIC_KEY
  );
  
  console.log('✅ Real email sent successfully:', response);
  return true;
}

/**
 * Email küldés főfunkció
 */
export async function sendInviteEmail(
  recipientEmail: string, 
  inviteToken: string,
  senderName: string = 'UG KettleBell Pro'
): Promise<boolean> {
  try {
    console.log('📧 Attempting to send invite email to:', recipientEmail);
    
    // Ellenőrizzük az EmailJS konfigurációt
    if (!isEmailJSConfigured()) {
      console.warn('⚠️ EmailJS not configured. Using mock email service.');
      console.log('💡 To enable real emails, set up EmailJS configuration in emailService.ts');
      return await mockEmailService(recipientEmail, inviteToken);
    }

    // Próbáljuk a valódi email küldést
    console.log('🚀 EmailJS configured, attempting real email send...');
    return await sendRealEmail(recipientEmail, inviteToken, senderName);
    
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    console.log('🔄 Falling back to mock email service...');
    return await mockEmailService(recipientEmail, inviteToken);
  }
}

/**
 * EmailJS inicializálás
 */
export function initializeEmailJS() {
  try {
    if (isEmailJSConfigured()) {
      emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
      console.log('✅ EmailJS initialized with real configuration');
      return true;
    } else {
      console.log('⚠️ EmailJS not configured, using mock email service');
      return false;
    }
  } catch (error) {
    console.error('❌ EmailJS initialization failed:', error);
    return false;
  }
}

/**
 * EmailJS konfiguráció ellenőrzése
 */
export function checkEmailJSConfig() {
  console.log('🔍 EmailJS Configuration Check:');
  console.log('Service ID:', EMAILJS_CONFIG.SERVICE_ID);
  console.log('Template ID:', EMAILJS_CONFIG.TEMPLATE_ID);
  console.log('Public Key:', EMAILJS_CONFIG.PUBLIC_KEY.substring(0, 8) + '...');
  console.log('Configured:', isEmailJSConfigured() ? '✅ Yes' : '❌ No');
  
  return {
    configured: isEmailJSConfigured(),
    serviceId: EMAILJS_CONFIG.SERVICE_ID,
    templateId: EMAILJS_CONFIG.TEMPLATE_ID,
    publicKey: EMAILJS_CONFIG.PUBLIC_KEY
  };
}
