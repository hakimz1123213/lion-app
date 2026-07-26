import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

// 🛡️ دالة السحب متوافقة 100% مع الجيل الثاني (2nd Gen) ونود 24
export const submitWithdraw = onCall(async (request) => {
    // 🚀 في الجيل الثاني، البيانات والتوثيق يتم استخراجهم مباشرة من كائن الrequest
    const payload = request.data || {};
    const auth = request.auth;

    // لقط الهوية بقوة أمنية ثلاثية
    const userId = auth ? auth.uid : (payload.userId || payload.uid);
    
    if (!userId) {
        throw new HttpsError('unauthenticated', 'User ID is missing.');
    }

    const { amount, walletAddress, username } = payload;

    // التأكد من المدخلات
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 10 || !walletAddress) { 
        throw new HttpsError('invalid-argument', 'المبلغ غير كافٍ أو العنوان مفقود.');
    }

    try {
        const userRef = admin.database().ref(`users/${userId}`);
        const userSnap = await userRef.once('value');

        if (!userSnap.exists()) {
            throw new HttpsError('not-found', 'حساب المستخدم غير موجود.');
        }

        const userData = userSnap.val();
        const currentBalance = userData.balance || 0;
        const vipLevel = userData.vip_level || 0;

        const VIP_FEES: Record<number, number> = { 0:0, 1:70, 2:150, 3:300, 4:500, 5:800, 6:1400, 7:2400, 8:4100 };
        const lockedCapital = VIP_FEES[vipLevel] || 0;
        const maxWithdrawable = Math.max(0, currentBalance - lockedCapital);

        if (parsedAmount > maxWithdrawable) {
            throw new HttpsError('failed-precondition', 'المبلغ يتجاوز الأرباح المسموح بسحبها.');
        }

        // تسجيل المعاملة في الداتابيز
        const txsRef = admin.database().ref('transactions').push();
        await txsRef.set({
            id: txsRef.key,
            userId: userId,
            username: username || 'Unknown',
            type: 'Withdraw',
            amount: parsedAmount,
            walletAddress: walletAddress.trim(),
            status: 'Pending',
            createdAt: admin.database.ServerValue.TIMESTAMP,
        });

        return { success: true, message: "تم إرسال طلب السحب بنجاح!" };

    } catch (error: any) {
        console.error("Critical Withdraw Error:", error);
        throw new HttpsError('internal', error.message || 'حدث خطأ أثناء معالجة السحب.');
    }
});