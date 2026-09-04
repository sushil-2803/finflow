import React, { useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDownRight, ArrowUpRight, Minus, Plus } from 'lucide-react-native';
import { depositSavings, getSavings, getSavingsHistory, spendSavings } from '../../api/savings';
import AppScreen from '../../components/common/AppScreen';
import EmptyState from '../../components/common/EmptyState';
import FormField from '../../components/common/FormField';
import LoadingState from '../../components/common/LoadingState';
import PrimaryButton from '../../components/common/PrimaryButton';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';
import { dateTime, money } from '../../utils/formatters';
import { userMessage } from '../../utils/errors';

export default function SavingsScreen() {
  const { refreshUser } = useAuth();
  const { colors, shadow } = useTheme();
  const queryClient = useQueryClient();
  const balance = useQuery({ queryKey: ['savings'], queryFn: getSavings });
  const history = useQuery({ queryKey: ['savings-history'], queryFn: getSavingsHistory });
  const [kind, setKind] = useState(null);

  if (balance.isLoading || history.isLoading) return <LoadingState />;

  return (
    <AppScreen>
      <FlatList
        data={history.data || []}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <View style={[styles.hero, shadow]}>
              <Text style={styles.heroLabel}>OVERALL SAVINGS</Text>
              <Text style={styles.heroAmount}>{money(balance.data)}</Text>
              <Text style={styles.heroDetail}>Funds saved from closed budgets and direct deposits.</Text>
              <View style={styles.heroButtons}>
                <Pressable onPress={() => setKind('deposit')} style={styles.heroButton}>
                  <Plus size={18} color="#fff" />
                  <Text style={styles.heroButtonText}>Add money</Text>
                </Pressable>
                <Pressable onPress={() => setKind('spend')} style={[styles.heroButton, styles.spendButton]}>
                  <Minus size={18} color={colors.success} />
                  <Text style={[styles.heroButtonText, { color: colors.success }]}>Spend</Text>
                </Pressable>
              </View>
            </View>
            <Text style={[styles.section, { color: colors.muted }]}>SAVINGS LEDGER</Text>
          </>
        }
        renderItem={({ item }) => (
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <View style={[styles.icon, { backgroundColor: item.type === 'deposit' ? colors.successLight : colors.dangerLight }]}>
              {item.type === 'deposit'
                ? <ArrowUpRight color={colors.success} size={19} />
                : <ArrowDownRight color={colors.danger} size={19} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.rowMeta, { color: colors.muted }]}>
                {dateTime(item.transactionDate)}{item.purpose ? ` • ${item.purpose}` : ''}
              </Text>
            </View>
            <Text style={[styles.rowAmount, { color: item.type === 'deposit' ? colors.success : colors.danger }]}>
              {item.type === 'deposit' ? '+' : '-'} {money(item.amount)}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            title="No savings activity yet"
            detail="Deposits, budget transfers, and withdrawals will appear here."
          />
        }
      />
      <SavingsForm
        kind={kind}
        balance={balance.data || 0}
        onClose={() => setKind(null)}
        onSuccess={async () => {
          setKind(null);
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['savings'] }),
            queryClient.invalidateQueries({ queryKey: ['savings-history'] }),
            refreshUser(),
          ]);
        }}
      />
    </AppScreen>
  );
}

function SavingsForm({ kind, balance, onClose, onSuccess }) {
  const { colors } = useTheme();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const mutation = useMutation({ mutationFn: kind === 'deposit' ? depositSavings : spendSavings });

  const save = () => {
    if (!title.trim()) return Alert.alert('Title required', 'Add a title for this savings transaction.');
    if (Number(amount) <= 0) return Alert.alert('Enter a valid amount', 'The amount must be greater than zero.');
    if (kind === 'spend' && Number(amount) > balance)
      return Alert.alert('Insufficient savings', `You have ${money(balance)} available.`);

    const action = async () => {
      try {
        await mutation.mutateAsync({ title: title.trim(), amount: Number(amount), purpose: purpose.trim() });
        await onSuccess();
      } catch (error) {
        Alert.alert('Could not save transaction', userMessage(error));
      }
    };

    if (kind === 'spend') {
      Alert.alert('Spend from savings?', `${money(amount)} will be deducted from Overall Savings.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Spend', style: 'destructive', onPress: action },
      ]);
    } else {
      action();
    }
  };

  return (
    <Modal visible={Boolean(kind)} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.modal, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHead, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {kind === 'deposit' ? 'Add money to savings' : 'Spend from savings'}
          </Text>
          <Pressable onPress={onClose}>
            <Text style={[styles.cancel, { color: colors.primary }]}>Cancel</Text>
          </Pressable>
        </View>
        <View style={styles.form}>
          <FormField
            label={kind === 'deposit' ? 'Source / title' : 'Item / title'}
            value={title}
            onChangeText={setTitle}
            placeholder={kind === 'deposit' ? 'e.g. Bonus' : 'e.g. Emergency repair'}
          />
          <FormField label="Amount (₹)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" />
          <FormField label="Memo / purpose" value={purpose} onChangeText={setPurpose} placeholder="Optional context" multiline />
          <PrimaryButton
            title={kind === 'deposit' ? 'Add money' : 'Spend money'}
            onPress={save}
            loading={mutation.isPending}
            tone={kind === 'spend' ? 'danger' : 'primary'}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 80, gap: 5 },
  // Hero keeps the green brand card — colors are intentionally hardcoded for the savings accent
  hero: { backgroundColor: '#1a9e5c', borderRadius: 8, padding: 22, gap: 8 },
  heroLabel: { fontSize: 12, color: '#E4F8EF', fontWeight: '800', letterSpacing: 0.9 },
  heroAmount: { color: '#fff', fontSize: 35, fontWeight: '800' },
  heroDetail: { color: '#E4F8EF', fontSize: 13, lineHeight: 18, maxWidth: 250 },
  heroButtons: { flexDirection: 'row', gap: 10, marginTop: 12 },
  heroButton: { flex: 1, minHeight: 44, backgroundColor: 'rgba(255,255,255,.2)', borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  spendButton: { backgroundColor: '#fff' },
  heroButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  section: { fontSize: 11, letterSpacing: 0.8, fontWeight: '800', marginTop: 21, marginBottom: 4 },
  row: { paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  icon: { height: 38, width: 38, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontWeight: '700', fontSize: 14 },
  rowMeta: { fontSize: 12, marginTop: 3, maxWidth: 200 },
  rowAmount: { fontSize: 14, fontWeight: '800' },
  modal: { flex: 1 },
  modalHead: { padding: 20, paddingTop: 24, flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1 },
  modalTitle: { fontWeight: '800', fontSize: 19 },
  cancel: { fontWeight: '700' },
  form: { padding: 20, gap: 16 },
});
