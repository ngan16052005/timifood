import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { COLORS } from '../utils/constants';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen() {
  const { shipperInfo, logout } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.profileCard}>
        <View style={styles.avatarBig}>
          <Text style={styles.avatarBigText}>{shipperInfo?.fullname?.charAt(0) || 'S'}</Text>
        </View>
        <Text style={styles.profileNameBig}>{shipperInfo?.fullname}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>Tài xế TiMiFood</Text>
        </View>
        <View style={styles.profileDetailRow}>
          <Text style={styles.profileDetailLabel}>Số điện thoại</Text>
          <Text style={styles.profileDetailValue}>{shipperInfo?.phone}</Text>
        </View>
        
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutButtonText}>ĐĂNG XUẤT</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: COLORS.background },
  profileCard: { backgroundColor: COLORS.cardBackground, width: '100%', borderRadius: 24, padding: 32, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 4 },
  avatarBig: { width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.dangerLight, justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 4, borderColor: COLORS.cardBackground, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  avatarBigText: { fontSize: 36, color: COLORS.primary, fontWeight: '900' },
  profileNameBig: { fontSize: 24, fontWeight: '800', color: COLORS.textDark, marginBottom: 8 },
  roleBadge: { backgroundColor: COLORS.secondaryLight, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginBottom: 32 },
  roleBadgeText: { color: COLORS.secondary, fontWeight: '700', fontSize: 14 },
  profileDetailRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, borderTopWidth: 1, borderTopColor: COLORS.border, borderBottomWidth: 1, borderBottomColor: COLORS.border, marginBottom: 32 },
  profileDetailLabel: { color: COLORS.textMuted, fontSize: 16, fontWeight: '500' },
  profileDetailValue: { color: COLORS.textDark, fontSize: 16, fontWeight: '700' },
  logoutButton: { backgroundColor: COLORS.textDark, width: '100%', paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  logoutButtonText: { color: COLORS.cardBackground, fontSize: 15, fontWeight: '700' },
});
