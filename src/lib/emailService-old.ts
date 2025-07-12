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
 * Email küldés EmailJS szolgáltatással
 */
export async function sendInviteEmail(
  recipientEmail: string, 
  inviteToken: string,
  senderName: string = 'UG KettleBell Pro'
): Promise<boolean> {
  try {
    console.log('📧 Attempting to send invite email to:', recipientEmail);
    
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
 * Email küldés EmailJS szolgáltatással
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
      return mockEmailService(recipientEmail, inviteToken);
    }
    
    // Meghívó URL generálása
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
    
    console.log('📤 Sending email with params:', templateParams);

    // Email küldés
    const response = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATE_ID,
      templateParams,
      EMAILJS_CONFIG.PUBLIC_KEY
    );
    
    console.log('✅ Email sent successfully:', response);
    return true;
    
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return false;
  }
}

/**
 * EmailJS inicializálás
 */
export function initializeEmailJS() {
  try {
    emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
    console.log('✅ EmailJS initialized');
    return true;
  } catch (error) {
    console.error('❌ EmailJS initialization failed:', error);
    return false;
  }
}
