import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import { fetchOrdersApi, updateOrderStatusApi } from '../services/api';
import OrderDetailsModal from '../components/OrderDetailsModal';
import { io } from 'socket.io-client';
import { SERVER_URL } from '../utils/constants';

export default function OrdersScreen({ navigation }) {
  const { shipperInfo, setCurrentOrder } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchOrders = async () => {
    if (!shipperInfo?.token) return;
    setLoading(true);
    try {
      const response = await fetchOrdersApi(shipperInfo.token);
      if (response.data && response.data.data) {
        const pendingAndDelivering = response.data.data.filter(o => o.trangthai === 0 || o.trangthai === 1);
        setOrders(pendingAndDelivering);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  useEffect(() => {
    if (!shipperInfo) return;
    
    // Connect to global socket for notifications
    const socket = io(SERVER_URL, { transports: ['websocket'] });
    
    socket.on('connect', () => {
      socket.emit('joinAdmin'); // Shipper acts as admin to receive global order notifications
    });

    socket.on('newNotification', (data) => {
      if (data.type === 'order') {
        // Show local alert for new order
        Alert.alert('🔔 Có Đơn Hàng Mới!', data.body || data.message || 'Mở danh sách để xem chi tiết', [
          { text: 'Xem ngay', onPress: () => fetchOrders() }
        ]);
        fetchOrders();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [shipperInfo]);

  const takeOrder = async (order) => {
    try {
      const response = await updateOrderStatusApi(order.id, 1, shipperInfo.token);
      if (response.data.success) {
        Alert.alert('Thành công', 'Đã nhận đơn hàng thành công!');
        setCurrentOrder(order);
        navigation.navigate('Delivery');
      }
    } catch (error) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể nhận đơn hàng');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.greeting}>Xin chào,</Text>
          <Text style={styles.headerName}>{shipperInfo?.fullname}</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchOrders}>
          <Text style={styles.refreshBtnText}>🔄 Làm mới</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Đơn hàng khả dụng</Text>
        <View style={styles.badgeCount}>
          <Text style={styles.badgeCountText}>{orders.length}</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          contentContainerStyle={{ paddingBottom: 20 }}
          data={orders}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.orderId}>#{item.orderCode || item.id}</Text>
                  <View style={[styles.statusBadge, item.trangthai === 1 ? styles.statusBadgeActive : null, { marginLeft: 8 }]}>
                    <Text style={[styles.statusBadgeText, item.trangthai === 1 ? styles.statusBadgeTextActive : null]}>
                      {item.trangthai === 0 ? 'Chờ nhận' : 'Đang giao'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => { setSelectedOrder(item); setModalVisible(true); }}>
                  <Text style={styles.detailsLink}>Chi tiết</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}>👤</Text>
                  <Text style={styles.infoText}>{item.tenguoinhan} - {item.sdtnhan}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}>📍</Text>
                  <Text style={styles.infoText} numberOfLines={2}>{item.diachinhan}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}>💵</Text>
                  <Text style={styles.priceText}>{item.tongtien.toLocaleString()}đ</Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                {item.trangthai === 0 ? (
                  <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => takeOrder(item)}>
                    <Text style={styles.actionBtnText}>🚀 NHẬN ĐƠN NGAY</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.actionBtnSecondary} onPress={() => {
                    setCurrentOrder(item);
                    navigation.navigate('Delivery');
                  }}>
                    <Text style={styles.actionBtnText}>📍 ĐI ĐẾN BẢN ĐỒ</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📦</Text>
              <Text style={styles.emptyText}>Chưa có đơn hàng nào chờ bạn.</Text>
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
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 20, paddingTop: 20 },
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { fontSize: 14, color: COLORS.textMuted, fontWeight: '500' },
  headerName: { fontSize: 24, fontWeight: '800', color: COLORS.textDark },
  refreshBtn: { backgroundColor: COLORS.border, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  refreshBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.textDark },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textDark, marginRight: 12 },
  badgeCount: { backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  badgeCountText: { color: COLORS.cardBackground, fontSize: 12, fontWeight: '700' },
  card: { backgroundColor: COLORS.cardBackground, borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  orderId: { fontSize: 16, fontWeight: '800', color: COLORS.textDark },
  statusBadge: { backgroundColor: COLORS.warningLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusBadgeActive: { backgroundColor: COLORS.secondaryLight },
  statusBadgeText: { fontSize: 12, fontWeight: '700', color: COLORS.warning },
  statusBadgeTextActive: { color: COLORS.secondary },
  detailsLink: { fontSize: 14, fontWeight: '700', color: COLORS.primary, textDecorationLine: 'underline' },
  cardBody: { marginBottom: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  infoIcon: { fontSize: 16, marginRight: 12 },
  infoText: { fontSize: 15, color: COLORS.textMuted, flex: 1, lineHeight: 22 },
  priceText: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  cardFooter: { flexDirection: 'row' },
  actionBtnPrimary: { flex: 1, backgroundColor: COLORS.success, paddingVertical: 14, borderRadius: 12, alignItems: 'center', shadowColor: COLORS.success, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 3 },
  actionBtnSecondary: { flex: 1, backgroundColor: COLORS.secondary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', shadowColor: COLORS.secondary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 3 },
  actionBtnText: { color: COLORS.cardBackground, fontSize: 14, fontWeight: '700' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyEmoji: { fontSize: 60, marginBottom: 16 },
  emptyText: { fontSize: 16, color: COLORS.textLight, fontWeight: '500', textAlign: 'center' },
});
