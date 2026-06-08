import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Switch, ActivityIndicator, Alert, Platform, Linking } from 'react-native';
import * as Location from 'expo-location';
import { io } from 'socket.io-client';
import MapView, { Marker } from 'react-native-maps';
import { COLORS, SERVER_URL } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import { updateOrderStatusApi } from '../services/api';
import OrderDetailsModal from '../components/OrderDetailsModal';

export default function DeliveryScreen({ navigation }) {
  const { currentOrder, setCurrentOrder, shipperInfo, isOnline, setIsOnline } = useAuth();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [socket, setSocket] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState(true);
  const locationSubscription = useRef(null);
  const mapRef = useRef(null);
  const offlineQueue = useRef([]);

  const completeOrder = async (status) => {
    try {
      const response = await updateOrderStatusApi(currentOrder.id, status, shipperInfo.token);
      if (response.data.success) {
        Alert.alert('Thành công', 'Cập nhật trạng thái đơn hàng thành công');
        setCurrentOrder(null);
        setIsOnline(false);
        navigation.navigate('Orders');
      }
    } catch (error) {
      Alert.alert('Lỗi cập nhật', error.response?.data?.message || error.message);
    }
  };

  const openGoogleMaps = () => {
    if (!currentOrder) return;
    let url = '';
    if (currentOrder.lat && currentOrder.lng) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${currentOrder.lat},${currentOrder.lng}`;
    } else {
      const dest = encodeURIComponent(currentOrder.diachinhan);
      url = `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
    }
    Linking.openURL(url).catch(() => Alert.alert('Lỗi', 'Không thể mở Google Maps'));
  };

  useEffect(() => {
    if (currentOrder && !isOnline) {
      setIsOnline(true);
    }
  }, [currentOrder, isOnline, setIsOnline]);

  useEffect(() => {
    if (isOnline && currentOrder) {
      const newSocket = io(`${SERVER_URL}/shipperLocation`, { transports: ['websocket'] });
      setSocket(newSocket);

      newSocket.on('connect', () => {
        if (offlineQueue.current.length > 0) {
          offlineQueue.current.forEach(point => newSocket.emit('shipperLocation', point));
          offlineQueue.current = [];
        }
      });

      (async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Lỗi', 'Không có quyền truy cập vị trí!');
          setIsOnline(false);
          return;
        }

        locationSubscription.current = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 10 },
          (location) => {
            const { latitude, longitude } = location.coords;
            setCurrentLocation({ latitude, longitude });

            const locationData = {
              orderId: currentOrder.id,
              lat: latitude,
              lng: longitude,
              phone: shipperInfo.phone,
              isOnline: true,
              timestamp: Date.now()
            };

            if (newSocket && newSocket.connected) {
              newSocket.emit('shipperLocation', locationData);
            } else {
              offlineQueue.current.push(locationData);
            }
          }
        );
      })();
    } else {
      if (socket) { socket.disconnect(); setSocket(null); }
      if (locationSubscription.current) { locationSubscription.current.remove(); locationSubscription.current = null; }
    }

    return () => {
      if (locationSubscription.current) locationSubscription.current.remove();
      if (socket) socket.disconnect();
    };
  }, [isOnline, currentOrder]);

  if (!currentOrder) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyEmoji}>🛵</Text>
        <Text style={styles.emptyText}>Bạn chưa chọn đơn hàng đang giao.</Text>
        <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => navigation.navigate('Orders')}>
          <Text style={styles.actionBtnText}>QUAY LẠI DANH SÁCH</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mapHeaderOverlay}>
        <TouchableOpacity style={styles.backBtnMap} onPress={() => navigation.navigate('Orders')}>
          <Text style={styles.backBtnText}>⬅️</Text>
        </TouchableOpacity>
        <View style={styles.mapStatusToggle}>
          <Text style={[styles.gpsText, isOnline ? styles.gpsActive : styles.gpsInactive]}>
            {isOnline ? 'GPS ĐANG BẬT' : 'GPS ĐANG TẮT'}
          </Text>
          <Switch
            value={isOnline}
            onValueChange={setIsOnline}
            trackColor={{ false: '#CBD5E0', true: '#C6F6D5' }}
            thumbColor={isOnline ? '#38A169' : '#FFFFFF'}
          />
        </View>
      </View>

      <View style={styles.mapContainer}>
        {currentLocation ? (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              latitudeDelta: 0.015,
              longitudeDelta: 0.015,
            }}
            showsUserLocation={true}
          >
            <Marker coordinate={currentLocation} title="Vị trí của bạn" pinColor={COLORS.secondary} />
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <ActivityIndicator size="large" color={COLORS.secondary} />
            <Text style={styles.mapPlaceholderText}>Đang lấy vị trí GPS...</Text>
          </View>
        )}
      </View>

      <View style={styles.deliveryBottomSheet}>
        <TouchableOpacity 
          activeOpacity={0.8} 
          onPress={() => setIsBottomSheetExpanded(!isBottomSheetExpanded)}
          style={{ marginBottom: isBottomSheetExpanded ? 24 : 0 }}
        >
          <View style={styles.bottomSheetHandle} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={[styles.bottomSheetTitle, { marginBottom: 0 }]}>Chi tiết giao hàng</Text>
            <Text style={{ fontSize: 14, color: COLORS.textMuted, fontWeight: 'bold' }}>
              {isBottomSheetExpanded ? '🔽 Thu gọn' : '🔼 Mở rộng'}
            </Text>
          </View>
        </TouchableOpacity>

        {isBottomSheetExpanded && (
          <>
            <View style={styles.deliveryInfoCard}>
              <View style={styles.infoRowMap}>
                <View style={styles.iconCircleMap}><Text>📍</Text></View>
                <View style={styles.infoContentMap}>
                  <Text style={styles.infoLabelMap}>Giao đến</Text>
                  <Text style={styles.infoValueMap}>{currentOrder.diachinhan}</Text>
                </View>
              </View>
              <View style={styles.infoRowMap}>
                <View style={styles.iconCircleMap}><Text>👤</Text></View>
                <View style={styles.infoContentMap}>
                  <Text style={styles.infoLabelMap}>Khách hàng</Text>
                  <Text style={styles.infoValueMap}>{currentOrder.tenguoinhan} - {currentOrder.sdtnhan}</Text>
                </View>
              </View>
              <View style={[styles.infoRowMap, { marginBottom: 0 }]}>
                <View style={styles.iconCircleMap}><Text>💵</Text></View>
                <View style={styles.infoContentMap}>
                  <Text style={styles.infoLabelMap}>Số tiền cần thu</Text>
                  <Text style={styles.priceValueMap}>{currentOrder.tongtien.toLocaleString()}đ</Text>
                </View>
              </View>
            </View>

            <View style={styles.actionRowSecondary}>
              <TouchableOpacity style={styles.btnOutline} onPress={() => setModalVisible(true)}>
                <Text style={styles.btnOutlineText}>📦 CHI TIẾT MÓN</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnOutlinePrimary} onPress={openGoogleMaps}>
                <Text style={styles.btnOutlinePrimaryText}>🗺 DẪN ĐƯỜNG</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actionRowMap}>
              <TouchableOpacity style={styles.btnSuccess} onPress={() => completeOrder(2)}>
                <Text style={styles.btnSuccessText}>✔️ ĐÃ GIAO XONG</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnFail} onPress={() => completeOrder(3)}>
                <Text style={styles.btnFailText}>❌ HỦY/BÙNG ĐƠN</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
      
      <OrderDetailsModal 
        visible={modalVisible} 
        order={currentOrder} 
        onClose={() => setModalVisible(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.border },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  emptyEmoji: { fontSize: 60, marginBottom: 16 },
  emptyText: { fontSize: 16, color: COLORS.textLight, fontWeight: '500', textAlign: 'center' },
  actionBtnPrimary: { marginTop: 20, paddingHorizontal: 32, backgroundColor: COLORS.success, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  actionBtnText: { color: COLORS.cardBackground, fontSize: 14, fontWeight: '700' },
  mapHeaderOverlay: { position: 'absolute', top: Platform.OS === 'android' ? 40 : 50, left: 20, right: 20, zIndex: 10, flexDirection: 'row', justifyContent: 'space-between' },
  backBtnMap: { backgroundColor: COLORS.cardBackground, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  backBtnText: { fontSize: 20 },
  mapStatusToggle: { backgroundColor: COLORS.cardBackground, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 25, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  gpsText: { fontSize: 12, fontWeight: '800', marginRight: 10 },
  gpsActive: { color: COLORS.success },
  gpsInactive: { color: COLORS.textLight },
  mapContainer: { flex: 1 },
  map: { width: '100%', height: '100%' },
  mapPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.border },
  mapPlaceholderText: { marginTop: 12, fontSize: 14, color: COLORS.textMuted, fontWeight: '600' },
  deliveryBottomSheet: { backgroundColor: COLORS.cardBackground, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 90, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 15, position: 'absolute', bottom: 0, width: '100%' },
  bottomSheetHandle: { width: 40, height: 5, backgroundColor: '#E2E8F0', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  bottomSheetTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textDark, marginBottom: 20 },
  deliveryInfoCard: { backgroundColor: COLORS.background, borderRadius: 16, padding: 20, marginBottom: 24 },
  infoRowMap: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  iconCircleMap: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.cardBackground, alignItems: 'center', justifyContent: 'center', marginRight: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  infoContentMap: { flex: 1 },
  infoLabelMap: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600', marginBottom: 4 },
  infoValueMap: { fontSize: 15, color: COLORS.textDark, fontWeight: '700' },
  priceValueMap: { fontSize: 18, color: COLORS.primary, fontWeight: '900' },
  actionRowSecondary: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  btnOutline: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.background },
  btnOutlineText: { color: COLORS.textDark, fontSize: 13, fontWeight: '700' },
  btnOutlinePrimary: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.primaryLight, backgroundColor: COLORS.primaryLight },
  btnOutlinePrimaryText: { color: COLORS.primary, fontSize: 13, fontWeight: '700' },
  actionRowMap: { flexDirection: 'row', gap: 12 },
  btnSuccess: { flex: 1, backgroundColor: COLORS.success, paddingVertical: 16, borderRadius: 14, alignItems: 'center', shadowColor: COLORS.success, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 3 },
  btnSuccessText: { color: COLORS.cardBackground, fontSize: 14, fontWeight: '800' },
  btnFail: { flex: 1, backgroundColor: COLORS.cardBackground, paddingVertical: 16, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.dangerLight },
  btnFailText: { color: COLORS.primary, fontSize: 14, fontWeight: '800' },
});
