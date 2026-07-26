// 📡 NoirWealth — Telegram Admin Alert System

// 📡 NoirWealth — Telegram Admin Alert System

const TELEGRAM_BOT_TOKEN = process.env.EXPO_PUBLIC_TELEGRAM_BOT_TOKEN;
// 👈 هنا نحينا كلمة ADMIN باش يقرأ من ملف .env صح
const TELEGRAM_ADMIN_CHAT_ID = process.env.EXPO_PUBLIC_TELEGRAM_CHAT_ID; 

export const sendTelegramAdminAlert = async (
// ... باقي الكود يبقى كيما راه
  username: string,
  type: 'Deposit' | 'Withdrawal',
  amount: number,
  extraDetails?: string,
  imageUri?: string
) => {
  // تأمين الحماية: إذا كانت المتغيرات الأساسية غير موجودة لا تكمل
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_ADMIN_CHAT_ID) {
    console.error("Telegram Admin Alert Error: Missing Token or Chat ID in environment variables.");
    return;
  }

  try {
    const emoji = type === 'Deposit' ? '📥' : '📤';
    const actionText = type === 'Deposit' ? 'إيداع شحن جديد' : 'طلب سحب أرباح';
    
    // 👑 ديزاين النص المنسق
    const message = 
`🚨 *MASTER COMMAND — NoirWealth* 🚨

${emoji} *نوع العملية:* ${actionText} (${type})
👤 *المستخدم:* \`${username}\`
💰 *المبلغ:* \`$${amount.toFixed(2)}\`
${extraDetails ? `📝 *تفاصيل إضافية:* \n\`${extraDetails}\`\n` : ''}⚡ *الحالة:* معلق في قائمة الانتظار (Pending)

🎮 _latchaaaaaaa boyyyyyyyyyyyy khoofffffff!_`;

    const hasPhoto = imageUri && imageUri.trim() !== '' && !imageUri.includes('No image');
    let response;

    if (hasPhoto) {
      const isHttp = imageUri!.startsWith('http');
      
      if (isHttp) {
        // 🌐 1. إذا كانت الصورة رابط -> نرسلها كـ JSON
        response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: TELEGRAM_ADMIN_CHAT_ID,
            photo: imageUri,
            caption: message,
            parse_mode: 'Markdown'
          })
        });
      } else {
        // 📱 2. إذا كانت الصورة من استوديو الهاتف -> نرفعها عبر FormData
        const formData = new FormData();
        
        // تحويلها لـ String بشكل صريح لمنع أي مشكلة في الـ Type Runtime
        formData.append('chat_id', `${TELEGRAM_ADMIN_CHAT_ID}`);
        formData.append('parse_mode', 'Markdown');
        formData.append('caption', message);
        formData.append('photo', {
          uri: imageUri,
          name: 'proof.jpg',
          type: 'image/jpeg',
        } as any);

        response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
          method: 'POST',
          body: formData, // بدون هيدرز يدوية هنا، الفيتش يتكفل بالباقي
        });
      }
    } else {
      // ✉️ 3. إذا لم توجد صورة نهائياً -> نرسل رسالة نصية فقط عبر JSON
      response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_ADMIN_CHAT_ID,
          text: message,
          parse_mode: 'Markdown'
        })
      });
    }

    // 🛡️ خطة الطوارئ: إذا فشل إرسال الصورة، نرسل إشعار نصي فوري للإنقاذ!
    if (response && !response.ok && hasPhoto) {
      const errorData = await response.json().catch(() => ({}));
      console.warn("Telegram Primary Send Failed, running fallback...", errorData);

      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_ADMIN_CHAT_ID,
          text: message + "\n\n⚠️ _(ملاحظة: فشل عرض الصورة في الشات، ولكن الطلب مسجل في التطبيق بنجاح)._",
          parse_mode: 'Markdown'
        })
      });
    }
    
  } catch (error) {
    console.error("Telegram Admin Alert Error: ", error);
  }
};