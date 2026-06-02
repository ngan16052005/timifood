import React from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, FlatList } from 'react-native';
import { COLORS } from '../utils/constants';

export default function OrderDetailsModal({ visible, order, onClose }) {
  if (!order) return null;

  let items = [];
  try {
    items = typeof order.chitiet === 'string' ? JSON.parse(order.chitiet) : order.chitiet || [];
  } catch (e) {
    console.error('Error parsing order details:', e);
  }

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chi tiết đơn hàng</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✖</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.orderInfo}>
            <Text style={styles.orderId}>Mã đơn: #{order.orderCode || order.id}</Text>
            <Text style={styles.customerInfo}>{order.tenguoinhan} - {order.sdtnhan}</Text>
            <Text style={styles.addressInfo}>{order.diachinhan}</Text>
          </View>

          <Text style={styles.listTitle}>Danh sách món ({items.length})</Text>
          <FlatList
            data={items}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.itemRow}>
                <View style={styles.itemQuantity}>
                  <Text style={styles.itemQuantityText}>{item.soluong}x</Text>
                </View>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{item.title || item.name || 'Món ăn'}</Text>
                  {item.note ? <Text style={styles.itemNote}>Ghi chú: {item.note}</Text> : null}
                </View>
                <Text style={styles.itemPrice}>{(item.price * item.soluong).toLocaleString()}đ</Text>
              </View>
            )}
            style={styles.itemsList}
          />
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng tiền thu:</Text>
            <Text style={styles.totalValue}>{order.tongtien?.toLocaleString()}đ</Text>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.cardBackground, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textDark },
  closeBtn: { padding: 8, backgroundColor: COLORS.border, borderRadius: 20 },
  closeBtnText: { fontSize: 14, color: COLORS.textDark },
  orderInfo: { backgroundColor: COLORS.background, padding: 16, borderRadius: 12, marginBottom: 20 },
  orderId: { fontSize: 16, fontWeight: '700', color: COLORS.primary, marginBottom: 8 },
  customerInfo: { fontSize: 15, fontWeight: '600', color: COLORS.textDark, marginBottom: 4 },
  addressInfo: { fontSize: 14, color: COLORS.textMuted },
  listTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textDark, marginBottom: 12 },
  itemsList: { marginBottom: 20 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 12 },
  itemQuantity: { backgroundColor: COLORS.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 12 },
  itemQuantityText: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },
  itemDetails: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: COLORS.textDark },
  itemNote: { fontSize: 13, color: COLORS.warning, marginTop: 4, fontStyle: 'italic' },
  itemPrice: { fontSize: 15, fontWeight: '700', color: COLORS.textDark },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 2, borderTopColor: COLORS.border, paddingTop: 16, marginBottom: 20 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: COLORS.textMuted },
  totalValue: { fontSize: 22, fontWeight: '900', color: COLORS.primary },
});
