import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Calendar,
  CalendarDays,
  Check,
  FolderKanban,
  FolderOpen,
  PiggyBank,
  Plus,
  Tag,
  X,
} from 'lucide-react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getBudgets } from '../../api/budgets';
import { getGroups } from '../../api/groups';
import { createCategory, getCategories } from '../../api/categories';
import { createExpense, updateExpense } from '../../api/expenses';
import { useTheme } from '../../store/ThemeContext';
import { PAYMENT_METHODS } from '../../constants';
import { shortDate, toApiDate } from '../../utils/formatters';
import { userMessage } from '../../utils/errors';
import FormField from '../common/FormField';
import PrimaryButton from '../common/PrimaryButton';
import SelectField from '../common/SelectField';

const schema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  amount: z.string().refine((value) => Number(value) > 0, 'Enter an amount greater than zero'),
  category: z.string().optional(),
  paymentMethod: z.string(),
  seller: z.string().optional(),
  notes: z.string().optional(),
  budgetId: z.string().nullable(),
  groupId: z.string().nullable(),
  isSpentFromSavings: z.boolean(),
});

const defaultValues = {
  title: '',
  amount: '',
  category: '',
  paymentMethod: 'UPI',
  seller: '',
  notes: '',
  budgetId: null,
  groupId: null,
  isSpentFromSavings: false,
};

function DestinationBadge({ budget, group, isSpentFromSavings }) {
  const { colors, shadow } = useTheme();

  if (isSpentFromSavings) {
    return (
      <View
        style={[
          styles.destBadge,
          { backgroundColor: colors.successLight, borderColor: colors.success },
        ]}
      >
        <View style={[styles.destBadgeIcon, { backgroundColor: colors.surface }, shadow]}>
          <PiggyBank size={18} color={colors.success} />
        </View>
        <View style={styles.destBadgeContent}>
          <Text style={[styles.destBadgeTitle, { color: colors.success }]}>
            Destination: Overall Savings
          </Text>
          <Text style={[styles.destBadgeSub, { color: colors.muted }]}>
            Paid from savings. Deducts directly from your savings ledger.
          </Text>
        </View>
      </View>
    );
  }

  if (budget && group) {
    return (
      <View
        style={[
          styles.destBadge,
          { backgroundColor: colors.purpleLight, borderColor: colors.purple },
        ]}
      >
        <View style={[styles.destBadgeIcon, { backgroundColor: colors.surface }, shadow]}>
          <FolderKanban size={18} color={colors.purple} />
        </View>
        <View style={styles.destBadgeContent}>
          <Text style={[styles.destBadgeTitle, { color: colors.purple }]}>
            Destination: {budget.title} + {group.title}
          </Text>
          <Text style={[styles.destBadgeSub, { color: colors.muted }]}>
            Counted in monthly budget and tracked in {group.title} group.
          </Text>
        </View>
      </View>
    );
  }

  if (budget) {
    return (
      <View
        style={[
          styles.destBadge,
          { backgroundColor: colors.blueLight, borderColor: colors.blue },
        ]}
      >
        <View style={[styles.destBadgeIcon, { backgroundColor: colors.surface }, shadow]}>
          <Calendar size={18} color={colors.blue} />
        </View>
        <View style={styles.destBadgeContent}>
          <Text style={[styles.destBadgeTitle, { color: colors.blue }]}>
            Destination: {budget.title} (Monthly Budget)
          </Text>
          <Text style={[styles.destBadgeSub, { color: colors.muted }]}>
            Counted toward your monthly limit for {budget.month}/{budget.year}.
          </Text>
        </View>
      </View>
    );
  }

  if (group) {
    return (
      <View
        style={[
          styles.destBadge,
          { backgroundColor: colors.purpleLight, borderColor: colors.purple },
        ]}
      >
        <View style={[styles.destBadgeIcon, { backgroundColor: colors.surface }, shadow]}>
          <FolderOpen size={18} color={colors.purple} />
        </View>
        <View style={styles.destBadgeContent}>
          <Text style={[styles.destBadgeTitle, { color: colors.purple }]}>
            Destination: {group.title} (Special Group)
          </Text>
          <Text style={[styles.destBadgeSub, { color: colors.muted }]}>
            Assigned to {group.title} group ledger.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.destBadge,
        { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
      ]}
    >
      <View style={[styles.destBadgeIcon, { backgroundColor: colors.surface }, shadow]}>
        <Tag size={18} color={colors.muted} />
      </View>
      <View style={styles.destBadgeContent}>
        <Text style={[styles.destBadgeTitle, { color: colors.text }]}>
          Destination: Standalone Expense
        </Text>
        <Text style={[styles.destBadgeSub, { color: colors.muted }]}>
          Normal personal expense (not linked to any monthly budget or group).
        </Text>
      </View>
    </View>
  );
}

function ChoiceModal({ visible, title, choices, selected, onSelect, onClose, renderLabel }) {
  const { colors, shadow } = useTheme();

  if (!visible) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.pickerOverlay} onPress={onClose}>
        <Pressable
          style={[
            styles.pickerContainer,
            { backgroundColor: colors.surface, borderColor: colors.border },
            shadow,
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View
            style={[
              styles.pickerHeader,
              { backgroundColor: colors.surfaceMuted, borderBottomColor: colors.border },
            ]}
          >
            <Text style={[styles.pickerTitle, { color: colors.text }]}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={10} style={styles.pickerClose}>
              <X size={18} color={colors.muted} />
            </Pressable>
          </View>
          <ScrollView style={{ maxHeight: 300 }} keyboardShouldPersistTaps="handled">
            {choices.map((item) => {
              const value =
                item.value !== undefined
                  ? item.value
                  : item._id !== undefined
                  ? item._id
                  : item;
              const label = renderLabel
                ? renderLabel(item)
                : item.label || item.title || String(item);
              const isSelected = selected === value || (!selected && value === '');
              return (
                <Pressable
                  key={String(value)}
                  onPress={() => {
                    onSelect(value);
                    onClose();
                  }}
                  style={[
                    styles.pickerItem,
                    { borderBottomColor: colors.border },
                    isSelected && { backgroundColor: colors.primaryLight },
                  ]}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      { color: isSelected ? colors.primary : colors.text },
                      isSelected && { fontWeight: '800' },
                    ]}
                  >
                    {label}
                  </Text>
                  {isSelected && <Check size={18} color={colors.primary} />}
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function ExpenseFormModal({ visible, expense, defaults, onClose }) {
  const { colors, shadow } = useTheme();
  const queryClient = useQueryClient();
  const scrollRef = useRef(null);
  const [date, setDate] = useState(new Date());
  const [showDate, setShowDate] = useState(false);
  const [activePicker, setActivePicker] = useState(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [successBanner, setSuccessBanner] = useState('');

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const values = watch();

  const budgets = useQuery({ queryKey: ['budgets'], queryFn: getBudgets, enabled: visible });
  const groups = useQuery({ queryKey: ['groups'], queryFn: getGroups, enabled: visible });
  const categories = useQuery({ queryKey: ['categories'], queryFn: getCategories, enabled: visible });

  const activeBudgets = useMemo(
    () => (budgets.data || []).filter((budget) => !budget.isClosed),
    [budgets.data]
  );
  const activeGroups = useMemo(
    () => (groups.data || []).filter((group) => group.status === 'active'),
    [groups.data]
  );

  const selectedBudget = useMemo(
    () => activeBudgets.find((item) => item._id === values.budgetId),
    [activeBudgets, values.budgetId]
  );
  const selectedGroup = useMemo(
    () => activeGroups.find((item) => item._id === values.groupId),
    [activeGroups, values.groupId]
  );

  const mutation = useMutation({
    mutationFn: (data) => (expense?._id ? updateExpense(expense._id, data) : createExpense(data)),
    onSuccess: async () => {
      await Promise.all(
        ['expenses', 'budgets', 'groups', 'savings', 'savings-history'].map((key) =>
          queryClient.invalidateQueries({ queryKey: [key] })
        )
      );
    },
  });

  const addCategory = useMutation({
    mutationFn: createCategory,
    onSuccess: (name) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setValue('category', name);
      setCategorySearch(name);
    },
  });

  useEffect(() => {
    if (visible) {
      const current = expense || {};
      reset({
        ...defaultValues,
        ...defaults,
        title: current.title || '',
        amount: current.amount ? String(current.amount) : '',
        category: current.category || '',
        paymentMethod: current.paymentMethod || 'UPI',
        seller: current.seller || '',
        notes: current.notes || '',
        budgetId: current.budgetId?._id || current.budgetId || defaults?.budgetId || null,
        groupId: current.groupId?._id || current.groupId || defaults?.groupId || null,
        isSpentFromSavings: Boolean(current.isSpentFromSavings),
      });
      setCategorySearch(current.category || '');
      setDate(current.expenseDate ? new Date(current.expenseDate) : new Date());
      setSuccessBanner('');
    }
  }, [visible, expense, defaults, reset]);

  const submit = (mode) =>
    handleSubmit(async (data) => {
      try {
        const payload = {
          ...data,
          title: data.title.trim(),
          amount: Number(data.amount),
          category: data.category?.trim() || '',
          seller: data.seller?.trim() || '',
          notes: data.notes?.trim() || '',
          expenseDate: toApiDate(date),
          budgetId: data.isSpentFromSavings ? null : data.budgetId,
          groupId: data.groupId || null,
        };

        await mutation.mutateAsync(payload);

        if (mode === 'another' && !expense?._id) {
          const retainedBudget = values.budgetId;
          const retainedGroup = values.groupId;
          const retainedPayment = values.paymentMethod;
          const retainedSavings = values.isSpentFromSavings;

          reset({
            ...defaultValues,
            budgetId: retainedBudget,
            groupId: retainedGroup,
            paymentMethod: retainedPayment,
            isSpentFromSavings: retainedSavings,
          });
          setCategorySearch('');
          setSuccessBanner('✓ Expense recorded! Ready for next entry.');
          scrollRef.current?.scrollTo({ y: 0, animated: true });
        } else {
          onClose();
        }
      } catch (error) {
        Alert.alert('Could not save expense', userMessage(error));
      }
    })();

  const categoryOptions = (categories.data || []).filter((item) =>
    item.toLowerCase().includes(categorySearch.toLowerCase())
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.modalRoot, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Sticky Header */}
        <View
          style={[
            styles.modalHeader,
            { backgroundColor: colors.surface, borderBottomColor: colors.border },
            shadow,
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {expense?._id ? 'Edit Transaction' : 'Record New Expense'}
            </Text>
            <Text style={[styles.modalSub, { color: colors.muted }]}>
              {expense?._id
                ? 'Update expense details and destination.'
                : 'Add an expense and allocate it to your budgets.'}
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: colors.surfaceMuted }]}
            hitSlop={10}
          >
            <X size={20} color={colors.text} />
          </Pressable>
        </View>

        {/* Scrollable Form Body */}
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Success Banner (for Save & Add Another) */}
          {successBanner ? (
            <View
              style={[
                styles.successBanner,
                { backgroundColor: colors.successLight, borderColor: colors.success },
              ]}
            >
              <Check size={16} color={colors.success} strokeWidth={2.5} />
              <Text style={[styles.successBannerText, { color: colors.success }]}>
                {successBanner}
              </Text>
            </View>
          ) : null}

          {/* Dynamic Destination / Allocation Indicator */}
          <DestinationBadge
            budget={selectedBudget}
            group={selectedGroup}
            isSpentFromSavings={values.isSpentFromSavings}
          />

          {/* Section: Main Details */}
          <View
            style={[
              styles.formSection,
              { backgroundColor: colors.surface, borderColor: colors.border },
              shadow,
            ]}
          >
            <Text style={[styles.sectionHeader, { color: colors.muted }]}>EXPENSE DETAILS</Text>

            {/* Title & Amount */}
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, value } }) => (
                <FormField
                  label="Title *"
                  value={value}
                  onChangeText={(text) => {
                    setSuccessBanner('');
                    onChange(text);
                  }}
                  placeholder="e.g. Weekly Groceries, Flight Tickets"
                  error={errors.title?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="amount"
              render={({ field: { onChange, value } }) => (
                <FormField
                  label="Amount (₹) *"
                  value={value}
                  onChangeText={(text) => {
                    setSuccessBanner('');
                    onChange(text);
                  }}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  error={errors.amount?.message}
                />
              )}
            />

            {/* Date & Payment Method */}
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <SelectField
                  label="Expense Date"
                  value={shortDate(date)}
                  onPress={() => setShowDate(true)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <SelectField
                  label="Payment Method"
                  value={values.paymentMethod}
                  onPress={() => setActivePicker('payment')}
                />
              </View>
            </View>

            {showDate && (
              <DateTimePicker
                value={date}
                mode="date"
                onChange={(_, val) => {
                  setShowDate(Platform.OS === 'ios');
                  if (val) setDate(val);
                }}
              />
            )}

            {/* Category with inline search / add */}
            <Controller
              control={control}
              name="category"
              render={({ field: { onChange, value } }) => (
                <View style={{ gap: 6 }}>
                  <FormField
                    label="Category"
                    value={categorySearch}
                    onChangeText={(text) => {
                      setCategorySearch(text);
                      onChange(text);
                    }}
                    placeholder="Search or type a category (e.g. Food, Travel)"
                  />
                  {categorySearch &&
                    !categoryOptions.some(
                      (item) => item.toLowerCase() === categorySearch.toLowerCase()
                    ) && (
                      <Pressable
                        onPress={() => addCategory.mutate(categorySearch)}
                        style={[styles.addCategory, { backgroundColor: colors.primaryLight }]}
                      >
                        <Plus size={16} color={colors.primary} />
                        <Text style={[styles.addText, { color: colors.primary }]}>
                          {addCategory.isPending
                            ? 'Adding category...'
                            : `Add new category “${categorySearch}”`}
                        </Text>
                      </Pressable>
                    )}
                  {categoryOptions.length > 0 && (
                    <View style={styles.categoryChips}>
                      {categoryOptions.slice(0, 5).map((item) => (
                        <Pressable
                          key={item}
                          onPress={() => {
                            onChange(item);
                            setCategorySearch(item);
                          }}
                          style={[
                            styles.categoryChip,
                            {
                              backgroundColor: colors.surfaceMuted,
                              borderColor: colors.border,
                            },
                            value === item && {
                              backgroundColor: colors.primaryLight,
                              borderColor: colors.primary,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.categoryChipText,
                              { color: colors.text },
                              value === item && { color: colors.primary, fontWeight: '700' },
                            ]}
                          >
                            {item}
                          </Text>
                          {value === item && <Check size={14} color={colors.primary} />}
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              )}
            />

            {/* Seller & Notes */}
            <Controller
              control={control}
              name="seller"
              render={({ field: { onChange, value } }) => (
                <FormField
                  label="Seller / Platform"
                  value={value}
                  onChangeText={onChange}
                  placeholder="e.g. Amazon, DMart, Uber"
                />
              )}
            />

            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, value } }) => (
                <FormField
                  label="Notes"
                  value={value}
                  onChangeText={onChange}
                  placeholder="Optional memo or breakdown"
                  multiline
                />
              )}
            />
          </View>

          {/* Section: Destination & Linking */}
          <View
            style={[
              styles.formSection,
              { backgroundColor: colors.surface, borderColor: colors.border },
              shadow,
            ]}
          >
            <Text style={[styles.sectionHeader, { color: colors.muted }]}>
              DESTINATION & ALLOCATION
            </Text>

            {/* Funding Source: Savings */}
            <View
              style={[
                styles.savingsCard,
                { backgroundColor: colors.successLight, borderColor: colors.success },
              ]}
            >
              <View style={{ flex: 1 }}>
                <View style={styles.savingsCardTitleRow}>
                  <PiggyBank size={18} color={colors.success} />
                  <Text style={[styles.savingsCardTitle, { color: colors.text }]}>
                    Pay this expense from savings
                  </Text>
                </View>
                <Text style={[styles.savingsCardSub, { color: colors.muted }]}>
                  Deducts the amount from Overall Savings and records it in the savings ledger.
                </Text>
              </View>
              <Switch
                value={values.isSpentFromSavings}
                onValueChange={(val) => {
                  setValue('isSpentFromSavings', val);
                  if (val) setValue('budgetId', null);
                }}
                trackColor={{ false: colors.border, true: colors.success }}
              />
            </View>

            {/* Monthly Budget Selector */}
            <SelectField
              label="Monthly Budget"
              value={
                values.isSpentFromSavings
                  ? 'Paid from savings'
                  : selectedBudget
                  ? `${selectedBudget.title} (${selectedBudget.month}/${selectedBudget.year})`
                  : 'Unassigned (Not linked to month)'
              }
              disabled={values.isSpentFromSavings}
              onPress={() => setActivePicker('budget')}
            />

            {/* Special Expense Group Selector */}
            <SelectField
              label="Special Expense Group"
              value={selectedGroup ? selectedGroup.title : 'Unassigned (Normal expense)'}
              onPress={() => setActivePicker('group')}
            />
          </View>
        </ScrollView>

        {/* Sticky Action Footer */}
        <View
          style={[
            styles.modalFooter,
            { backgroundColor: colors.surface, borderTopColor: colors.border },
            shadow,
          ]}
        >
          <View style={styles.footerButtonsRow}>
            {!expense?._id && (
              <PrimaryButton
                title="Save & Add Another"
                tone="secondary"
                icon={Plus}
                onPress={() => submit('another')}
                disabled={mutation.isPending}
                style={{ flex: 1 }}
              />
            )}
            <PrimaryButton
              title={
                mutation.isPending
                  ? 'Saving...'
                  : expense?._id
                  ? 'Save Changes'
                  : 'Add Expense'
              }
              icon={expense?._id ? Check : CalendarDays}
              onPress={() => submit('close')}
              loading={mutation.isPending}
              style={{ flex: 1 }}
            />
          </View>
        </View>

        {/* Choice Picker Modals */}
        <ChoiceModal
          visible={activePicker === 'payment'}
          title="Select Payment Method"
          choices={PAYMENT_METHODS}
          selected={values.paymentMethod}
          onSelect={(val) => setValue('paymentMethod', val)}
          onClose={() => setActivePicker(null)}
        />

        <ChoiceModal
          visible={activePicker === 'budget'}
          title="Select Monthly Budget"
          choices={[{ _id: '', title: 'Unassigned (Not linked to month)' }, ...activeBudgets]}
          selected={values.budgetId || ''}
          onSelect={(val) => setValue('budgetId', val || null)}
          onClose={() => setActivePicker(null)}
          renderLabel={(item) =>
            item.month && item.year
              ? `${item.title} (${item.month}/${item.year})`
              : item.title
          }
        />

        <ChoiceModal
          visible={activePicker === 'group'}
          title="Select Special Expense Group"
          choices={[{ _id: '', title: 'Unassigned (Normal expense)' }, ...activeGroups]}
          selected={values.groupId || ''}
          onSelect={(val) => setValue('groupId', val || null)}
          onClose={() => setActivePicker(null)}
          renderLabel={(item) => item.title}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 20 : 18,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  modalSub: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 8,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 28,
    gap: 16,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
  },
  successBannerText: {
    fontWeight: '700',
    fontSize: 13,
  },
  destBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  destBadgeIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  destBadgeContent: {
    flex: 1,
  },
  destBadgeTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  destBadgeSub: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  formSection: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 14,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: -4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  addCategory: {
    padding: 10,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    borderRadius: 8,
  },
  addText: {
    fontSize: 13,
    fontWeight: '700',
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  savingsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  savingsCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  savingsCardTitle: {
    fontWeight: '700',
    fontSize: 13,
  },
  savingsCardSub: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
  },
  modalFooter: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    borderTopWidth: 1,
  },
  footerButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    padding: 24,
  },
  pickerContainer: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  pickerClose: {
    padding: 4,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pickerItemText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});
