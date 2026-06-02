import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import { fetchOrdersApi } from '../services/api';
import OrderDetailsModal from '../components/OrderDetailsModal';

export default function HistoryScreen() {
  const { shipperInfo } = useAuth();
  const [historyOrders, setHistoryOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchHistory = async () => {
    if (!shipperInfo?.token) return;
    setLoading(true);
    try {
      const response = await fetchOrdersApi(shipperInfo.token);
      if (response.data && response.data.data) {
        // Lọc các đơn đã giao (2) và đã hủy (3)
        const completed = response.data.data.filter(o => o.trangthai === 2 || o.trangthai === 3);
        setHistoryOrders(completed);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [])
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lịch sử giao hàng</Text>
        <Text style={styles.headerSubtitle}>Tất cả đơn hàng đã hoàn tất</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          contentContainerStyle={{ paddingBottom: 20 }}
          data={historyOrders}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.card} 
              onPress={() => { setSelectedOrder(item); setModalVisible(true); }}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.orderId}>#{item.orderCode || item.id}</Text>
                <View style={[
                  styles.statusBadge, 
                  item.trangthai === 2 ? styles.statusBadgeSuccess : styles.statusBadgeDanger
                ]}>
                  <Text style={[
                    styles.statusBadgeText, 
                    item.trangthai === 2 ? styles.statusTextSuccess : styles.statusTextDanger
                  ]}>
                    {item.trangthai === 2 ? 'Hoàn thành' : 'Đã hủy'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.cardBody}>
                <Text style={styles.infoText}>Khách: {item.tenguoinhan}</Text>
                <Text style={styles.infoText} numberOfLines={1}>Đ/c: {item.diachinhan}</Text>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.dateText}>{new Date(item.thoigiandat).toLocaleDateString('vi-VN')}</Text>
                <Text style={styles.priceText}>{item.tongtien.toLocaleString()}đ</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📜</Text>
              <Text style={styles.emptyText}>Chưa có lịch sử giao hàng.</Text>
            </View>
          }
        />
      )}

      <OrderDetailsModal 
        visible={modalVisible} 
        order={selectedOrder} 
        onClose={() => setModalVisible(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 20, paddingTop: 40 },
  header: { marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.textDark },
  headerSubtitle: { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },
  card: { backgroundColor: COLORS.cardBackground, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  orderId: { fontSize: 15, fontWeight: '700', color: COLORS.textDark },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusBadgeSuccess: { backgroundColor: COLORS.success + '20' },
  statusBadgeDanger: { backgroundColor: COLORS.dangerLight },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  statusTextSuccess: { color: COLORS.success },
  statusTextDanger: { color: COLORS.primary },
  cardBody: { marginBottom: 12 },
  infoText: { fontSize: 14, color: COLORS.textMuted, marginBottom: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateText: { fontSize: 13, color: COLORS.textLight, fontWeight: '500' },
  priceText: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyEmoji: { fontSize: 60, marginBottom: 16 },
  emptyText: { fontSize: 16, color: COLORS.textLight, fontWeight: '500', textAlign: 'center' },
});
