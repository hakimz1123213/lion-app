import React, { useState, useEffect, useRef } from 'react';
import {
  View, 
  Text,
  StyleSheet,
  ScrollView,
  Linking,
  Pressable,
  ActivityIndicator,
  Platform,
  Modal, 
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Animated,
  Easing
} from 'react-native';
import { Image } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker'; 
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Hooks & Contexts
import { useAuth } from '@/hooks/useAuth'; 
import { useWallet } from '@/hooks/useWallet';
import { useTask } from '@/hooks/useTask';
import { useAlert } from '@/template';
import { TASK_TOTAL, getVIPTier } from '@/constants/config'; 

// Firebase
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '@/services/firebaseConfig';
import { ref, update } from 'firebase/database';

export default function ProfileScreen() {
  const { user, logout, updateUserProfileData }: any = useAuth();
  const { transactions } = useWallet();
  const { dailyCounter } = useTask();
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [isSupportModalVisible, setIsSupportModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isLangModalVisible, setIsLangModalVisible] = useState(false); 

  const [editUsername, setEditUsername] = useState('');
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null); 
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // --- إعدادات الأنيميشن للميدالية (الأيقونة) ---
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.08, duration: 1000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 1000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) })
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -4, duration: 1500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) })
      ])
    ).start();
  }, [scaleAnim, floatAnim]);

  if (!user) return null;

  const lang = user?.language || 'EN';
  const isAR = lang === 'AR';
  
  const userVip = user.vip_level || 0;
  const tier = getVIPTier ? getVIPTier(userVip) : { label: `VIP ${userVip}` };

  const copyReferralCode = async () => {
    if (user.referralCode) {
      await Clipboard.setStringAsync(user.referralCode);
      showAlert('Copied!', 'Your referral code has been copied to clipboard.');
    }
  };

  const handleLogout = () => {
    showAlert('Sign Out', 'Do you want to log out of your account?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: async () => { await logout(); router.replace('/login'); } },
    ]);
  };

  const changeLanguageSelection = async (selectedLang: 'EN' | 'AR') => {
    try {
      await update(ref(db, `users/${user.uid}`), { language: selectedLang });
      setIsLangModalVisible(false);
    } catch (err: any) {
      console.error("Language saving error:", err);
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      showAlert('Permission Denied', 'You need to allow gallery access.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], 
      quality: 0.5,
    });
    if (!result.canceled && result.assets[0]) {
      setSelectedImageUri(result.assets[0].uri);
    }
  };

  const handleSaveProfileData = async () => {
    if (!editUsername.trim()) {
      showAlert('Error', 'Username cannot be empty.');
      return;
    }
    try {
      setIsSavingProfile(true);
      let finalAvatarUrl = selectedImageUri;

      if (selectedImageUri && !selectedImageUri.startsWith('http')) {
        const response = await fetch(selectedImageUri);
        const blob = await response.blob();
        const storage = getStorage();
        const imageRef = storageRef(storage, `avatars/${user.uid}_${Date.now()}.jpg`);
        await uploadBytes(imageRef, blob);
        finalAvatarUrl = await getDownloadURL(imageRef);
      }

      const result = await updateUserProfileData(editUsername, finalAvatarUrl);
      if (result.error === null) {
        setIsEditModalVisible(false);
      } else {
        showAlert('Error', result.error);
      }
    } catch (e: any) {
      showAlert('Error', e.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const MenuItem = ({ 
    icon, 
    label, 
    onPress, 
    iconColor = "#1E1E1E",
    labelColor = "#1E1E1E",
    rightText
  }: { 
    icon: keyof typeof Ionicons.glyphMap, 
    label: string, 
    onPress: () => void,
    iconColor?: string,
    labelColor?: string,
    rightText?: string
  }) => (
    <Pressable style={[styles.menuItem, isAR && { flexDirection: 'row-reverse' }]} onPress={onPress}>
      <Ionicons name={icon} size={22} color={iconColor} style={[styles.menuIcon, isAR ? { marginLeft: 16, marginRight: 0 } : {}]} />
      <Text style={[styles.menuText, { color: labelColor }]}>{label}</Text>
      <View style={{ flex: 1 }} />
      {rightText && <Text style={[styles.menuRightText, isAR ? { marginLeft: 10, marginRight: 0 } : {}]}>{rightText}</Text>}
      <Ionicons name={isAR ? "chevron-back" : "chevron-forward"} size={16} color="#C7C7CC" />
    </Pressable>
  );

  return (
    <View style={styles.screen}>
      <View style={styles.topBackground} />

      <ScrollView 
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { paddingTop: insets.top + 10 }, isAR && { flexDirection: 'row-reverse' }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name={isAR ? "chevron-forward" : "chevron-back"} size={28} color="#8A2BE2" />
          </Pressable>
        </View>

        <View style={[styles.profileRow, isAR && { flexDirection: 'row-reverse' }]}>
          <Pressable 
            style={[styles.avatarBox, isAR ? { marginLeft: 20, marginRight: 0 } : { marginRight: 20 }]}
            onPress={() => { 
              setEditUsername(user.username); 
              setSelectedImageUri(user.profileImage || null); 
              setIsEditModalVisible(true); 
            }}
          >
            {user.profileImage ? (
              <Image source={{ uri: user.profileImage }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={44} color="#FFFFFF" />
            )}
          </Pressable>
          <View style={[styles.profileDetails, isAR && { alignItems: 'flex-end' }]}>
            <View style={[styles.nameRow, isAR && { flexDirection: 'row-reverse' }]}>
              <Text style={styles.usernameText}>{user.username || 'User'}</Text>
              <Ionicons name={isAR ? "chevron-back" : "chevron-forward"} size={18} color="#8A2BE2" style={[isAR ? { marginRight: 6 } : { marginLeft: 6 }, { marginTop: 2 }]} />
            </View>
            <Text style={styles.emailText}>{user.email}</Text>
          </View>
        </View>

        {/* Stats Card */}
        <View style={[styles.statsCard, isAR && { flexDirection: 'row-reverse' }]}>
          
          <View style={styles.statBox}>
            {/* الأيقونة الحية الدائرية */}
            <Animated.View style={[
              styles.iconMedalContainer,
              { transform: [{ scale: scaleAnim }, { translateY: floatAnim }] }
            ]}>
              <LinearGradient
                colors={userVip > 0 ? ['#FCD34D', '#F59E0B', '#D97706'] : ['#E5E7EB', '#9CA3AF', '#6B7280']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconMedalGradient}
              >
                <MaterialCommunityIcons 
                  name={userVip > 0 ? "crown" : "star-outline"} 
                  size={20} 
                  color="#FFF" 
                />
              </LinearGradient>
            </Animated.View>
            <Text style={styles.statValue}>{userVip > 0 ? tier.label : `VIP ${userVip}`}</Text>
            <Text style={styles.statLabel}>{isAR ? 'رتبتي' : 'My Rank'}</Text>
          </View>

          <View style={styles.divider} />
          
          <View style={styles.statBox}>
            <Ionicons name="search-outline" size={28} color="#8A2BE2" style={{ marginBottom: 6 }} />
            <Text style={styles.statValue}>{dailyCounter}/{TASK_TOTAL}</Text>
            <Text style={styles.statLabel}>{isAR ? 'المهام اليومية' : 'Daily tasks'}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.statBox}>
            <Ionicons name="wallet-outline" size={28} color="#8A2BE2" style={{ marginBottom: 6 }} />
            <Text style={styles.statValue}>${user.balance ? user.balance.toFixed(2) : '0.00'}</Text>
            <Text style={styles.statLabel}>{isAR ? 'الرصيد' : 'Balance'}</Text>
          </View>
        </View>

        <Pressable style={[styles.promoCard, isAR && { flexDirection: 'row-reverse' }]} onPress={copyReferralCode}>
          <View style={[styles.promoLeft, isAR && { flexDirection: 'row-reverse' }]}>
            <Ionicons name="link-outline" size={24} color="#8A2BE2" />
            <Text style={styles.promoText}>{isAR ? 'رمز الإحالة' : 'Referral Code'}</Text>
          </View>
          <View style={[styles.promoRight, isAR && { flexDirection: 'row-reverse' }]}>
            <Text style={styles.promoCode}>{user.referralCode || 'GENERATING'}</Text>
            <Ionicons name="copy-outline" size={16} color="#2E8A3B" style={[isAR ? { marginRight: 4 } : { marginLeft: 4 }]} />
          </View>
        </Pressable>

        <View style={styles.menuContainer}>
          {user.uid === 'jec4njRnjSO5ZQfqz1h4X2jAqla2' && (
            <MenuItem icon="key-outline" label="Admin Control Panel" onPress={() => router.push('/admin')} iconColor="#D4AF37" />
          )}

          <MenuItem 
            icon="globe-outline" 
            label={isAR ? "لغة / LANGUAGE" : "LANGUAGE / لغة"} 
            onPress={() => setIsLangModalVisible(true)} 
            iconColor="#8A2BE2"
            rightText={lang === 'AR' ? 'العربية' : 'English GB'}
          />
          
          <MenuItem 
            icon="diamond-outline" 
            label={isAR ? "ترقية VIP" : "VIP Upgrade"} 
            onPress={() => router.push('/vip-upgrade')} 
            iconColor="#D4AF37" 
            labelColor="#D4AF37" 
          />
          
          <MenuItem icon="bar-chart-outline" label={isAR ? "سجل المعاملات" : "Transaction History"} onPress={() => router.push('/(tabs)/wallet')} />
          <MenuItem icon="shield-checkmark-outline" label={isAR ? "الأمان وكلمة المرور" : "Security & Password"} onPress={() => router.push('/security')} iconColor="#8A2BE2" />
          <MenuItem icon="chatbubble-ellipses-outline" label={isAR ? "مركز الدعم" : "Support Center"} onPress={() => setIsSupportModalVisible(true)} />
          <MenuItem icon="information-circle-outline" label={isAR ? "معلومات عنا" : "About Us"} onPress={() => Linking.openURL('https://noirwealth.com')} iconColor="#8A2BE2" />
          
          <View style={{ height: 10 }} />
          <MenuItem icon="log-out-outline" label={isAR ? "تسجيل الخروج" : "Sign Out"} onPress={handleLogout} iconColor="#FF3B30" labelColor="#FF3B30" />
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={isEditModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Personal Identity</Text>
            <Text style={styles.modalSubtitle}>Update your account details</Text>

            <View style={{ alignItems: 'center', marginBottom: 25, marginTop: 5 }}>
              <Pressable style={styles.interactiveAvatarFrame} onPress={pickImage}>
                {selectedImageUri ? (
                  <Image source={{ uri: selectedImageUri }} style={styles.interactiveAvatarImg} />
                ) : (
                  <Ionicons name="person" size={40} color="#fff" />
                )}
                <View style={styles.cameraPillBadge}>
                  <Ionicons name="camera" size={14} color="#fff" />
                </View>
              </Pressable>
            </View>

            <TextInput 
              style={[styles.textInput, isAR && { textAlign: 'right' }]} 
              value={editUsername} 
              onChangeText={setEditUsername} 
              placeholder="Username" 
              placeholderTextColor="#8E8E93"
            />

            <View style={[styles.modalActions, isAR && { flexDirection: 'row-reverse' }]}>
              <Pressable style={styles.cancelBtn} onPress={() => setIsEditModalVisible(false)}>
                <Text style={{ color: '#1E1E1E', fontWeight: '600' }}>{isAR ? 'إلغاء' : 'Cancel'}</Text>
              </Pressable>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfileData} disabled={isSavingProfile}>
                {isSavingProfile ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>{isAR ? 'حفظ التغييرات' : 'Save Changes'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Language Modal Updated */}
      <Modal visible={isLangModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: 40 }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{isAR ? 'اختر اللغة' : 'Select Language'}</Text>
            <View style={{ height: 20 }} />

            <View style={styles.langListContainer}>
              {/* خيار اللغة الإنجليزية */}
              <Pressable 
                style={[styles.langOptionItem, lang === 'EN' && styles.langOptionItemSelected]}
                onPress={() => changeLanguageSelection('EN')}
              >
                <View style={[styles.langLeft, isAR && { flexDirection: 'row-reverse' }]}>
                  <View style={[styles.flagCircle, isAR ? { marginLeft: 12 } : { marginRight: 12 }]}>
                    <Text style={styles.flagEmoji}>🇬🇧</Text>
                  </View>
                  <Text style={styles.langText}>English</Text>
                </View>
                {lang === 'EN' && <Ionicons name="checkmark" size={22} color="#4CAF50" />}
              </Pressable>

              {/* خيار اللغة العربية */}
              <Pressable 
                style={[styles.langOptionItem, lang === 'AR' && styles.langOptionItemSelected]}
                onPress={() => changeLanguageSelection('AR')}
              >
                <View style={[styles.langLeft, isAR && { flexDirection: 'row-reverse' }]}>
                  <View style={[styles.flagCircle, isAR ? { marginLeft: 12 } : { marginRight: 12 }]}>
                    <Text style={styles.flagEmoji}>🇩🇿</Text>
                  </View>
                  <Text style={styles.langText}>العربية</Text>
                </View>
                {lang === 'AR' && <Ionicons name="checkmark" size={22} color="#4CAF50" />}
              </Pressable>
            </View>

            <Pressable style={[styles.cancelBtn, { marginTop: 15, width: '100%' }]} onPress={() => setIsLangModalVisible(false)}>
              <Text style={{ color: '#1E1E1E', fontWeight: 'bold' }}>{isAR ? 'إلغاء' : 'Cancel'}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAFAFC' },
  topBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 350,
    backgroundColor: '#F4F0FF', 
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
  },
  header: { paddingHorizontal: 16, paddingBottom: 10, flexDirection: 'row' },
  backBtn: { padding: 8, marginLeft: -8 },
  
  profileRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, marginTop: 10, marginBottom: 30 },
  avatarBox: {
    width: 84, height: 84, borderRadius: 42, backgroundColor: '#4C74F4', 
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#4C74F4', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  avatarImage: { width: '100%', height: '100%', borderRadius: 42 },
  profileDetails: { flex: 1, justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  usernameText: { color: '#1E1E1E', fontSize: 24, fontWeight: '700' },
  emailText: { color: '#757575', fontSize: 14, fontWeight: '500' },

  statsCard: {
    flexDirection: 'row', backgroundColor: '#FFFFFF', marginHorizontal: 20, borderRadius: 20, paddingVertical: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 14, elevation: 2, marginBottom: 20,
  },
  statBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  
  iconMedalContainer: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 6,
  },
  iconMedalGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  divider: { width: 1, backgroundColor: '#F0F0F0', height: '70%', alignSelf: 'center' },
  statValue: { fontSize: 16, fontWeight: '700', color: '#1E1E1E' },
  statLabel: { fontSize: 12, color: '#8E8E93', fontWeight: '500', marginTop: 4 },

  promoCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF',
    marginHorizontal: 20, borderRadius: 16, paddingHorizontal: 20, paddingVertical: 18, marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 1,
    borderWidth: 1, borderColor: '#F4F0FF'
  },
  promoLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  promoText: { fontSize: 15, fontWeight: '600', color: '#1E1E1E' },
  promoRight: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(46, 138, 59, 0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  promoCode: { fontSize: 13, fontWeight: '700', color: '#2E8A3B', letterSpacing: 1 },

  menuContainer: { paddingHorizontal: 24 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  menuIcon: { marginRight: 16 },
  menuText: { fontSize: 16, fontWeight: '500' },
  menuRightText: { fontSize: 13, color: '#8E8E93', marginRight: 10, fontWeight: '500' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', padding: 30, borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  modalHandle: { width: 40, height: 5, backgroundColor: '#E0E0E0', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { color: '#1E1E1E', fontSize: 22, fontWeight: '700', textAlign: 'center' },
  modalSubtitle: { color: '#757575', fontSize: 14, textAlign: 'center', marginBottom: 25, marginTop: 4 },
  
  interactiveAvatarFrame: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#4C74F4', position: 'relative', justifyContent: 'center', alignItems: 'center' },
  interactiveAvatarImg: { width: '100%', height: '100%', borderRadius: 45 },
  cameraPillBadge: { position: 'absolute', bottom: -4, right: -4, backgroundColor: '#1E1E1E', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#FFF' },
  
  textInput: { backgroundColor: '#F5F5F5', color: '#1E1E1E', padding: 16, borderRadius: 14, fontSize: 16, marginBottom: 24 },
  modalActions: { flexDirection: 'row', gap: 12 },
  saveBtn: { flex: 2, backgroundColor: '#8A2BE2', padding: 16, borderRadius: 14, alignItems: 'center' },
  cancelBtn: { flex: 1, backgroundColor: '#F5F5F5', padding: 16, borderRadius: 14, alignItems: 'center' },

  // --- ستايلات قائمة اختيار اللغة الجديدة ---
  langListContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    overflow: 'hidden',
  },
  langOptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  langOptionItemSelected: {
    backgroundColor: '#FFFFFF',
  },
  langLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: '#E0E0E0'
  },
  flagEmoji: {
    fontSize: 24,
    lineHeight: 28,
    textAlign: 'center'
  },
  langText: {
    fontSize: 16,
    color: '#1E1E1E',
    fontWeight: '500',
  }
});