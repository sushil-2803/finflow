import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarPlus, Plus } from 'lucide-react-native';
import AppScreen from '../../components/common/AppScreen';
import BudgetCard from '../../components/cards/BudgetCard';
import EmptyState from '../../components/common/EmptyState';
import FormField from '../../components/common/FormField';
import LoadingState from '../../components/common/LoadingState';
import PrimaryButton from '../../components/common/PrimaryButton';
import SelectField from '../../components/common/SelectField';
import { closeBudget, createBudget, getBudgets } from '../../api/budgets';
import { MONTHS } from '../../constants';
import { useTheme } from '../../store/ThemeContext';
import { monthName, toApiDate } from '../../utils/formatters';
import { userMessage } from '../../utils/errors';

export default function MonthlyBudgetScreen({ navigation }) {
  const { colors, shadow } = useTheme();
  const queryClient = useQueryClient();
  const budgets = useQuery({ queryKey: ['budgets'], queryFn: getBudgets });
  const [form, setForm] = useState(false);
  const close = useMutation({
    mutationFn: closeBudget,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['budgets'] }),
  });

  const active = (budgets.data || []).filter((item) => !item.isClosed);
  const archived = (budgets.data || []).filter((item) => item.isClosed);

  const confirmClose = (budget) =>
    Alert.alert(
      'Close & save budget?',
      `Any positive remaining balance from “${budget.title}” will move to Overall Savings. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close & Save',
          onPress: async () => {
            try {
              await close.mutateAsync(budget._id);
              await queryClient.invalidateQueries({ queryKey: ['savings'] });
            } catch (error) {
              Alert.alert('Could not close budget', userMessage(error));
            }
          },
        },
      ]
    );

  if (budgets.isLoading) return <LoadingState />;

  return (
    <AppScreen>
      <FlatList
        data={[...active, ...archived]}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl
            refreshing={budgets.isRefetching}
            onRefresh={budgets.refetch}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <View>
                <Text style={[styles.title, { color: colors.text }]}>Budgets</Text>
                <Text style={[styles.detail, { color: colors.muted }]}>
                  Monthly plans that turn unspent money into savings.
                </Text>
              </View>
              <Pressable
                onPress={() => setForm(true)}
                style={[styles.add, { backgroundColor: colors.primary }, shadow]}
              >
                <Plus color="#ffffff" size={22} />
              </Pressable>
            </View>
            {active.length ? (
              <Text style={[styles.label, { color: colors.muted }]}>ACTIVE BUDGETS</Text>
            ) : null}
          </>
        }
        renderItem={({ item, index }) => (
          <View style={{ gap: 8 }}>
            {index === active.length && archived.length ? (
              <Text style={[styles.label, { color: colors.muted, marginTop: 10 }]}>
                BUDGET ARCHIVE
              </Text>
            ) : null}
            <BudgetCard
              budget={item}
              onPress={() => navigation.navigate('BudgetDetails', { id: item._id })}
            />
            {!item.isClosed && (
              <View style={styles.actions}>
                <Pressable
                  onPress={() => navigation.navigate('BudgetDetails', { id: item._id })}
                >
                  <Text style={[styles.link, { color: colors.primary }]}>View expenses</Text>
                </Pressable>
                <Pressable onPress={() => confirmClose(item)}>
                  <Text style={[styles.closeLink, { color: colors.danger }]}>Close & save</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            title="Plan your first month"
            detail="Set a monthly budget and FinFlow will track each linked expense."
            actionLabel="Create budget"
            onAction={() => setForm(true)}
            icon={CalendarPlus}
          />
        }
        ListFooterComponent={<View style={{ height: 20 }} />}
      />
      <BudgetForm
        visible={form}
        onClose={() => setForm(false)}
        onSuccess={() => {
          setForm(false);
          queryClient.invalidateQueries({ queryKey: ['budgets'] });
        }}
      />
    </AppScreen>
  );
}

function BudgetForm({ visible, onClose, onSuccess }) {
  const { colors } = useTheme();
  const initialYear = new Date().getFullYear();
  const initialMonth = new Date().getMonth() + 1;
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [startDate, setStart] = useState(new Date(initialYear, initialMonth - 1, 1));
  const [endDate, setEnd] = useState(new Date(initialYear, initialMonth, 0));
  const [picker, setPicker] = useState(null);
  const [menu, setMenu] = useState(null);
  const mutation = useMutation({ mutationFn: createBudget });

  const generated = title || `${monthName(month)} ${year} Budget`;

  const setPeriod = (nextMonth, nextYear) => {
    setMonth(nextMonth);
    setYear(nextYear);
    setStart(new Date(nextYear, nextMonth - 1, 1));
    setEnd(new Date(nextYear, nextMonth, 0));
  };

  const years = Array.from({ length: 7 }, (_, index) => initialYear - 1 + index);

  const submit = async () => {
    if (Number(amount) <= 0) {
      return Alert.alert('Enter a valid budget limit', 'The budget limit must be greater than zero.');
    }
    if (endDate < startDate) {
      return Alert.alert('Invalid dates', 'The end date must be after the start date.');
    }
    try {
      await mutation.mutateAsync({
        title: generated,
        month,
        year,
        startDate: toApiDate(startDate),
        endDate: toApiDate(endDate),
        budgetAmount: Number(amount),
      });
      onSuccess();
    } catch (error) {
      Alert.alert('Could not create budget', userMessage(error));
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modal, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHead, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Create monthly budget</Text>
          <Pressable onPress={onClose}>
            <Text style={[styles.cancel, { color: colors.primary }]}>Cancel</Text>
          </Pressable>
        </View>
        <View style={styles.form}>
          <FormField
            label="Title"
            value={title}
            onChangeText={setTitle}
            placeholder={generated}
          />
          <SelectField
            label="Month"
            value={monthName(month)}
            onPress={() => setMenu('month')}
          />
          <SelectField
            label="Year"
            value={String(year)}
            onPress={() => setMenu('year')}
          />
          <FormField
            label="Budget limit (₹)"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />
          <SelectField
            label="Start date"
            value={startDate.toLocaleDateString('en-IN')}
            onPress={() => setPicker('start')}
          />
          <SelectField
            label="End date"
            value={endDate.toLocaleDateString('en-IN')}
            onPress={() => setPicker('end')}
          />
          {picker && (
            <DateTimePicker
              value={picker === 'start' ? startDate : endDate}
              mode="date"
              onChange={(_, value) => {
                setPicker(null);
                if (value) {
                  if (picker === 'start') setStart(value);
                  else setEnd(value);
                }
              }}
            />
          )}
          {menu && (
            <View
              style={[
                styles.menu,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              {(menu === 'month' ? MONTHS : years).map((item) => {
                const value = menu === 'month' ? item.value : item;
                return (
                  <Pressable
                    key={value}
                    onPress={() => {
                      if (menu === 'month') setPeriod(value, year);
                      else setPeriod(month, value);
                      setMenu(null);
                    }}
                    style={[styles.menuItem, { borderBottomColor: colors.border }]}
                  >
                    <Text style={{ color: colors.text }}>
                      {menu === 'month' ? item.label : value}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
          <PrimaryButton
            title="Create budget"
            onPress={submit}
            loading={mutation.isPending}
            icon={CalendarPlus}
            style={{ marginTop: 8 }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
    paddingBottom: 80,
    gap: 13,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginVertical: 5,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
  },
  detail: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    maxWidth: 265,
  },
  add: {
    width: 46,
    height: 46,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  link: {
    fontWeight: '700',
    fontSize: 13,
  },
  closeLink: {
    fontWeight: '700',
    fontSize: 13,
  },
  modal: {
    flex: 1,
  },
  modalHead: {
    padding: 20,
    paddingTop: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '800',
  },
  cancel: {
    fontWeight: '700',
  },
  form: {
    padding: 20,
    gap: 15,
  },
  menu: {
    borderWidth: 1,
    borderRadius: 8,
    maxHeight: 205,
  },
  menuItem: {
    padding: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
