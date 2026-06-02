import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { COLORS } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import { loginApi } from '../services/api';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại và mật khẩu');
      return;
    }
    try {
      const response = await loginApi(phone, password);
      if (response.data && response.data.token) {
        if (response.data.user.userType === 0) {
          Alert.alert('Lỗi quyền truy cập', 'Tài khoản này không phải là nhân viên giao hàng.');
          return;
        }
        login(response.data.user, response.data.token);
      }
    } catch (error) {
      Alert.alert('Đăng nhập thất bại', 'Sai thông tin hoặc không thể kết nối Server.');
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.loginContainer}>
      <View style={styles.loginCard}>
        <View style={styles.loginHeader}>
          <Image source={require('../../assets/timi-logo.png')} style={styles.loginLogoImage} resizeMode="contain" />
          <Text style={styles.loginTitle}>TIMI TRANSPORT</Text>
        </View>
        <Text style={styles.loginSubtitle}>Chào mừng quay trở lại!</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Số điện thoại</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập số điện thoại"
            placeholderTextColor={COLORS.textLight}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Mật khẩu</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập mật khẩu"
            placeholderTextColor={COLORS.textLight}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>
        
        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
          <Text style={styles.loginBtnText}>ĐĂNG NHẬP</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loginContainer: { flex: 1, justifyContent: 'center', backgroundColor: COLORS.background, padding: 24 },
  loginCard: { backgroundColor: COLORS.cardBackground, borderRadius: 24, padding: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 5 },
  loginHeader: { alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  loginLogoImage: { width: 80, height: 80, marginBottom: 16 },
  loginTitle: { fontSize: 24, fontWeight: '900', color: COLORS.primary },
  loginSubtitle: { fontSize: 16, color: COLORS.textMuted, textAlign: 'center', marginBottom: 40 },
  inputContainer: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textDark, marginBottom: 8 },
  input: { backgroundColor: COLORS.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: COLORS.textDark },
  loginBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 12, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  loginBtnText: { color: COLORS.cardBackground, fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
});
