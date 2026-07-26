import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  FadeInRight,
  FadeOutLeft,
} from 'react-native-reanimated';
import { useAuth } from '@/hooks/useAuth';
import { useAlert } from '@/template';

// 🎨 الألوان الثابتة للتصميم الأرجواني الملوكي
const NOIR_PURPLE = '#2A103C';
const NOIR_ACCENT = '#3A1854';
const NOIR_GOLD = '#D4AF37';
const LIGHT_BG = '#F9F8FC';
const INPUT_BG = '#F2EFF7';
const TEXT_DARK = '#1C1524';
const TEXT_MUTED = '#8E8899';

const registerTranslations: Record<string, Record<string, string>> = {
  EN: {
    welcome: "Welcome to Lion!",
    tagline: "Build your elite financial empire.",
    emailLabel: "EMAIL",
    emailPlaceholder: "your.name@domain.com",
    enterPromo: "Enter promo / referral code",
    haveAccount: "Have an account? ",
    signIn: "Log in",
    nextBtn: "Continue",
    createPassTitle: "Create your password for",
    passPlaceholder: "Create a password",
    minChars: "Minimum 6 characters",
    hasNumber: "Contains a number",
    createAccBtn: "Create account",
    otpTitle: "Verify your Security Token",
    otpSub: "We've sent a 6-digit verification code to your email.",
    verifyBtn: "Verify & Activate",
    missingEmail: "Please enter a valid email.",
    // ترجمات شروط الاستخدام (Step 4)
    acceptTermsTitle: "Accept terms",
    acceptTermsSub: "Please read our terms. By tapping \"I accept,\" you agree to receive documents electronically and use electronic signatures for all agreements.",
    ageCheck: "I am 18 years or older and accept platform policies.",
    policyCheck: "I agree to the Lion Program Agreement, Privacy Policy, and Auto Debit Authorization.",
    iAcceptBtn: "I accept",
    cancelBtn: "Cancel",
  },
  AR: {
    welcome: "مرحباً بك في Lion",
    tagline: "أنشئ إمبراطوريتك المالية الملوكية.",
    emailLabel: "البريد الإلكتروني",
    emailPlaceholder: "أدخل بريدك الإلكتروني هنا...",
    enterPromo: "إدخال كود الإحالة / الخصم",
    haveAccount: "لديك حساب بالفعل؟ ",
    signIn: "تسجيل الدخول",
    nextBtn: "استمرار",
    createPassTitle: "إنشاء كلمة السر الخاصة بـ",
    passPlaceholder: "أدخل كلمة السر هنا...",
    minChars: "6 رموز كحد أدنى",
    hasNumber: "تحتوي على رقم على الأقل",
    createAccBtn: "تأكيد وبناء الحساب",
    otpTitle: "تأكيد رمز الأمان",
    otpSub: "أدخل الكود المكون من 6 أرقام المرسل لإيميلك.",
    verifyBtn: "تفعيل الحساب الآن",
    missingEmail: "يرجى كتابة البريد الإلكتروني أولاً.",
    // ترجمات شروط الاستخدام (Step 4)
    acceptTermsTitle: "قبول الشروط والأحكام",
    acceptTermsSub: "يرجى قراءة الشروط. بالنقر على \"أوافق\"، فإنك توافق على استلام المستندات إلكترونياً واستخدام التوقيعات الإلكترونية لجميع الاتفاقيات.",
    ageCheck: "أبلغ من العمر 18 عاماً أو أكثر وأوافق على سياسات المنصة.",
    policyCheck: "أوافق على اتفاقية برنامج Lion، وسياسة الخصوصية، وتفويض الخصم التلقائي.",
    iAcceptBtn: "أوافق (I accept)",
    cancelBtn: "إلغاء",
  }
};

export default function RegisterScreen() {
  const { register, confirmRegisterOTP } = useAuth();
  const { showAlert } = useAlert();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Email, 2: Password, 3: OTP, 4: Terms
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showReferralInput, setShowReferralInput] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  
  // حالة مربعات الشروط (Step 4)
  const [acceptedAge, setAcceptedAge] = useState(false);
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);

  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<'EN' | 'AR'>('EN');

  const t = registerTranslations[lang];
  const isAR = lang === 'AR';

  // 🦁 أنيميشن الشعار العائم المتموج
  const floatAnim = useSharedValue(0);
  useEffect(() => {
    floatAnim.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatAnim.value }],
  }));

  const hasMinChars = password.length >= 6;
  const hasNum = /\d/.test(password);

  const handleNextStep = () => {
    if (!email.trim() || !email.includes('@')) {
      showAlert("Notice", t.missingEmail);
      return;
    }
    setUsername(email.split('@')[0]);
    setStep(2);
  };

  const handleRegister = async () => {
    if (!hasMinChars || !hasNum) return;

    setLoading(true);
    const result = await register(username, email.trim(), password, "", referralCode.trim());
    setLoading(false);

    if (result.error === null) {
      setStep(3);
    } else {
      const cleanMsg = typeof result.error === 'string' ? result.error : "Registration failed.";
      showAlert("Error", cleanMsg);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpInput.trim()) return;

    setLoading(true);
    const result = await confirmRegisterOTP(email.trim(), otpInput.trim());
    setLoading(false);

    if (result.error === null) {
      // بعد نجاح الـ OTP ننتقل مباشرة لشروط وأحكام المنصة (الخطوة 4)
      setStep(4);
    } else {
      const cleanMsg = typeof result.error === 'string' ? result.error : "Validation failed.";
      showAlert("Error", cleanMsg);
    }
  };

  const handleFinalAccept = () => {
    if (!acceptedAge || !acceptedPolicy) return;
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: LIGHT_BG }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 🔝 الهيدر: زر العودة وتغيير اللغة */}
        <View style={[styles.header, { paddingTop: insets.top + 10 }, isAR && { flexDirection: 'row-reverse' }]}>
          {step > 1 && step < 4 ? (
            <Pressable onPress={() => setStep((prev) => (prev - 1) as any)} style={styles.backBtn}>
              <MaterialIcons name={isAR ? "arrow-forward" : "arrow-back"} size={22} color={NOIR_PURPLE} />
            </Pressable>
          ) : (
            <View style={{ width: 40 }} />
          )}

          <Pressable 
            style={[styles.langBtn, isAR && { flexDirection: 'row-reverse' }]} 
            onPress={() => setLang(l => l === 'EN' ? 'AR' : 'EN')}
          >
            <Ionicons name="globe-outline" size={14} color={NOIR_GOLD} />
            <Text style={styles.langText}>{isAR ? "English 🇬🇧" : "العربية 🇩🇿"}</Text>
          </Pressable>
        </View>

        {/* -------------------- STEP 1: EMAIL & PROMO -------------------- */}
        {step === 1 && (
          <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.container}>
            <View style={styles.logoSection}>
              <Animated.View style={[styles.iconCircle, animatedLogoStyle]}>
                <Ionicons name="paw" size={36} color={NOIR_GOLD} />
              </Animated.View>
              <Text style={styles.title}>{t.welcome}</Text>
              <Text style={styles.subtitle}>{t.tagline}</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, isAR && { textAlign: 'right' }]}>{t.emailLabel}</Text>
              <TextInput
                style={[styles.input, isAR && { textAlign: 'right' }, email.length > 0 && styles.inputFocused]}
                value={email}
                onChangeText={setEmail}
                placeholder={t.emailPlaceholder}
                placeholderTextColor={TEXT_MUTED}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.primaryBtn,
                { opacity: email.trim().length > 3 ? (pressed ? 0.85 : 1) : 0.5 }
              ]}
              disabled={email.trim().length <= 3}
              onPress={handleNextStep}
            >
              <Text style={styles.primaryBtnText}>{t.nextBtn}</Text>
            </Pressable>

            {!showReferralInput ? (
              <Pressable onPress={() => setShowReferralInput(true)} style={styles.promoBtn}>
                <Text style={styles.promoText}>{t.enterPromo}</Text>
              </Pressable>
            ) : (
              <Animated.View entering={FadeInRight} style={{ marginTop: 16 }}>
                <TextInput
                  style={[styles.input, { backgroundColor: '#EFEBF5' }, isAR && { textAlign: 'right' }]}
                  value={referralCode}
                  onChangeText={setReferralCode}
                  placeholder="e.g. LION-888"
                  placeholderTextColor={TEXT_MUTED}
                  autoCapitalize="characters"
                />
              </Animated.View>
            )}

            <View style={[styles.footer, isAR && { flexDirection: 'row-reverse' }]}>
              <Text style={styles.footerText}>{t.haveAccount}</Text>
              <Pressable onPress={() => router.push('/login')}>
                <Text style={styles.footerLink}>{t.signIn}</Text>
              </Pressable>
            </View>
          </Animated.View>
        )}

        {/* -------------------- STEP 2: PASSWORD CREATION -------------------- */}
        {step === 2 && (
          <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.container}>
            <Text style={[styles.stepTitle, isAR && { textAlign: 'right' }]}>{t.createPassTitle}</Text>
            <Text style={[styles.emailHighlight, isAR && { textAlign: 'right' }]}>{email}</Text>

            <View style={[styles.inputGroup, { marginTop: 24 }]}>
              <TextInput
                style={[styles.input, styles.inputFocused, isAR && { textAlign: 'right' }]}
                value={password}
                onChangeText={setPassword}
                placeholder={t.passPlaceholder}
                placeholderTextColor={TEXT_MUTED}
                secureTextEntry
              />
            </View>

            <View style={styles.checklist}>
              <View style={[styles.checkRow, isAR && { flexDirection: 'row-reverse' }]}>
                <MaterialIcons name={hasMinChars ? "check-circle" : "cancel"} size={18} color={hasMinChars ? NOIR_GOLD : TEXT_MUTED} />
                <Text style={[styles.checkText, hasMinChars && styles.checkTextActive]}>{t.minChars}</Text>
              </View>
              <View style={[styles.checkRow, isAR && { flexDirection: 'row-reverse' }]}>
                <MaterialIcons name={hasNum ? "check-circle" : "cancel"} size={18} color={hasNum ? NOIR_GOLD : TEXT_MUTED} />
                <Text style={[styles.checkText, hasNum && styles.checkTextActive]}>{t.hasNumber}</Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.primaryBtn,
                { marginTop: 40, opacity: (hasMinChars && hasNum) ? (pressed ? 0.85 : 1) : 0.5 }
              ]}
              disabled={!hasMinChars || !hasNum || loading}
              onPress={handleRegister}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.primaryBtnText}>{t.createAccBtn}</Text>
              )}
            </Pressable>
          </Animated.View>
        )}

        {/* -------------------- STEP 3: OTP VERIFICATION -------------------- */}
        {step === 3 && (
          <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.container}>
            <Text style={[styles.stepTitle, isAR && { textAlign: 'right' }]}>{t.otpTitle}</Text>
            <Text style={[styles.subtitle, { textAlign: isAR ? 'right' : 'left', marginBottom: 24 }]}>{t.otpSub}</Text>

            <TextInput
              style={[styles.input, styles.otpInput, isAR && { textAlign: 'center' }]}
              value={otpInput}
              onChangeText={setOtpInput}
              placeholder="000000"
              placeholderTextColor={TEXT_MUTED}
              keyboardType="number-pad"
              maxLength={6}
            />

            <Pressable
              style={({ pressed }) => [
                styles.primaryBtn,
                { marginTop: 30, opacity: otpInput.length === 6 ? (pressed ? 0.85 : 1) : 0.5 }
              ]}
              disabled={otpInput.length !== 6 || loading}
              onPress={handleVerifyOTP}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.primaryBtnText}>{t.verifyBtn}</Text>
              )}
            </Pressable>
          </Animated.View>
        )}

        {/* -------------------- STEP 4: ACCEPT TERMS & POLICIES (مربع الشروط الجديد) -------------------- */}
        {step === 4 && (
          <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.container}>
            <View style={styles.termsCard}>
              <Text style={[styles.stepTitle, { fontSize: 22 }, isAR && { textAlign: 'right' }]}>
                {t.acceptTermsTitle}
              </Text>
              <Text style={[styles.termsSubtitle, isAR && { textAlign: 'right' }]}>
                {t.acceptTermsSub}
              </Text>

              {/* الشرط الأول: العمر */}
              <Pressable 
                style={[styles.checkboxRow, isAR && { flexDirection: 'row-reverse' }]}
                onPress={() => setAcceptedAge(!acceptedAge)}
              >
                <View style={[styles.checkbox, acceptedAge && styles.checkboxChecked]}>
                  {acceptedAge && <MaterialIcons name="check" size={14} color="#FFF" />}
                </View>
                <Text style={[styles.checkboxText, isAR && { textAlign: 'right', flex: 1 }]}>
                  {t.ageCheck}
                </Text>
              </Pressable>

              {/* الشرط الثاني: سياسة المنصة والخصوصية */}
              <Pressable 
                style={[styles.checkboxRow, isAR && { flexDirection: 'row-reverse' }]}
                onPress={() => setAcceptedPolicy(!acceptedPolicy)}
              >
                <View style={[styles.checkbox, acceptedPolicy && styles.checkboxChecked]}>
                  {acceptedPolicy && <MaterialIcons name="check" size={14} color="#FFF" />}
                </View>
                <Text style={[styles.checkboxText, isAR && { textAlign: 'right', flex: 1 }]}>
                  {t.policyCheck}
                </Text>
              </Pressable>

              {/* زر القبول النهائي (I Accept) */}
              <Pressable
                style={({ pressed }) => [
                  styles.primaryBtn,
                  { marginTop: 30, opacity: (acceptedAge && acceptedPolicy) ? (pressed ? 0.85 : 1) : 0.5 }
                ]}
                disabled={!acceptedAge || !acceptedPolicy}
                onPress={handleFinalAccept}
              >
                <Text style={styles.primaryBtnText}>{t.iAcceptBtn}</Text>
              </Pressable>

              {/* زر الإلغاء */}
              <Pressable 
                onPress={() => setStep(3)} 
                style={{ marginTop: 16, alignItems: 'center' }}
              >
                <Text style={{ color: TEXT_MUTED, fontSize: 14, fontWeight: '600' }}>
                  {t.cancelBtn}
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFEBF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2DAEC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  langText: {
    fontSize: 12,
    color: NOIR_PURPLE,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: NOIR_PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: NOIR_PURPLE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: TEXT_DARK,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: TEXT_MUTED,
    marginTop: 6,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: TEXT_MUTED,
    marginBottom: 8,
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: INPUT_BG,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 15,
    color: TEXT_DARK,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  inputFocused: {
    borderColor: NOIR_PURPLE,
    backgroundColor: '#FFF',
  },
  primaryBtn: {
    backgroundColor: NOIR_PURPLE,
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: NOIR_PURPLE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  promoBtn: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 8,
  },
  promoText: {
    color: NOIR_GOLD,
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    color: TEXT_MUTED,
    fontSize: 14,
  },
  footerLink: {
    color: NOIR_GOLD,
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: TEXT_DARK,
  },
  emailHighlight: {
    fontSize: 15,
    fontWeight: '700',
    color: NOIR_GOLD,
    marginTop: 4,
  },
  checklist: {
    marginTop: 16,
    gap: 10,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkText: {
    fontSize: 13,
    color: TEXT_MUTED,
  },
  checkTextActive: {
    color: TEXT_DARK,
    fontWeight: '600',
  },
  otpInput: {
    textAlign: 'center',
    letterSpacing: 10,
    fontSize: 24,
    fontWeight: 'bold',
    backgroundColor: '#FFF',
    borderColor: NOIR_PURPLE,
  },
  // تصاميم شروط الاستخدام (Step 4)
  termsCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EFEBF5',
    shadowColor: NOIR_PURPLE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  termsSubtitle: {
    fontSize: 13,
    color: TEXT_MUTED,
    marginTop: 10,
    marginBottom: 24,
    lineHeight: 20,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 20,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: NOIR_PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    backgroundColor: '#FFF',
  },
  checkboxChecked: {
    backgroundColor: NOIR_PURPLE,
  },
  checkboxText: {
    fontSize: 13,
    color: TEXT_DARK,
    lineHeight: 18,
    flex: 1,
  },
});