import React, { useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FolderPlus, Plus } from 'lucide-react-native';
import { getGroups, createGroup } from '../../api/groups';
import AppScreen from '../../components/common/AppScreen';
import EmptyState from '../../components/common/EmptyState';
import FormField from '../../components/common/FormField';
import GroupCard from '../../components/cards/GroupCard';
import LoadingState from '../../components/common/LoadingState';
import PrimaryButton from '../../components/common/PrimaryButton';
import SelectField from '../../components/common/SelectField';
import { GROUP_STATUSES } from '../../constants';
import { useTheme } from '../../store/ThemeContext';
import { toApiDate } from '../../utils/formatters';
import { userMessage } from '../../utils/errors';

export default function ExpenseGroupsScreen({ navigation }) {
  const { colors } = useTheme();
  const groups = useQuery({ queryKey: ['groups'], queryFn: getGroups });
  const queryClient = useQueryClient();
  const [form, setForm] = useState(false);

  if (groups.isLoading) return <LoadingState />;

  return (
    <AppScreen>
      <FlatList
        data={groups.data || []}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.head}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>Expense groups</Text>
              <Text style={[styles.detail, { color: colors.muted }]}>Give temporary plans their own financial trail.</Text>
            </View>
            <Pressable onPress={() => setForm(true)} style={[styles.add, { backgroundColor: colors.primary }]}>
              <Plus size={22} color="#fff" />
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <GroupCard group={item} onPress={() => navigation.navigate('GroupDetails', { id: item._id })} />
        )}
        ListEmptyComponent={
          <EmptyState
            title="Track something special"
            detail="Create a group for a trip, wedding, project, or event."
            actionLabel="Create group"
            onAction={() => setForm(true)}
            icon={FolderPlus}
          />
        }
        ListFooterComponent={<View style={{ height: 25 }} />}
      />
      <GroupForm
        visible={form}
        onClose={() => setForm(false)}
        onSuccess={() => {
          setForm(false);
          queryClient.invalidateQueries({ queryKey: ['groups'] });
        }}
      />
    </AppScreen>
  );
}

function GroupForm({ visible, onClose, onSuccess }) {
  const { colors } = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(null);
  const [budget, setBudget] = useState(true);
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('active');
  const [picker, setPicker] = useState(null);
  const mutation = useMutation({ mutationFn: createGroup });

  const save = async () => {
    if (!title.trim()) return Alert.alert('Title required', 'Give this expense group a clear title.');
    if (budget && Number(amount) <= 0) return Alert.alert('Enter a valid limit', 'A budget limit must be greater than zero.');
    try {
      await mutation.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        startDate: toApiDate(startDate),
        endDate: endDate ? toApiDate(endDate) : null,
        isBudgetEnabled: budget,
        budgetLimit: budget ? Number(amount) : null,
        status,
      });
      onSuccess();
    } catch (error) {
      Alert.alert('Could not create group', userMessage(error));
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.modal, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHead, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Create expense group</Text>
          <Pressable onPress={onClose}>
            <Text style={[styles.cancel, { color: colors.primary }]}>Cancel</Text>
          </Pressable>
        </View>
        <View style={styles.form}>
          <FormField label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Goa trip" />
          <FormField label="Description" value={description} onChangeText={setDescription} placeholder="Optional context" multiline />
          <SelectField label="Start date" value={startDate.toLocaleDateString('en-IN')} onPress={() => setPicker('start')} />
          <SelectField label="End date" value={endDate?.toLocaleDateString('en-IN')} placeholder="No end date" onPress={() => setPicker('end')} />
          {picker && (
            <DateTimePicker
              value={picker === 'start' ? startDate : endDate || new Date()}
              mode="date"
              onChange={(_, value) => {
                setPicker(null);
                if (value) {
                  if (picker === 'start') setStartDate(value);
                  else setEndDate(value);
                }
              }}
            />
          )}
          <View style={[styles.toggle, { backgroundColor: colors.primaryLight }]}>
            <View>
              <Text style={[styles.toggleTitle, { color: colors.text }]}>Enable budget limit</Text>
              <Text style={[styles.toggleText, { color: colors.muted }]}>Track remaining room in this group.</Text>
            </View>
            <Switch value={budget} onValueChange={setBudget} trackColor={{ false: colors.border, true: colors.primary }} />
          </View>
          {budget && (
            <FormField label="Budget limit (₹)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" />
          )}
          <Text style={[styles.fieldLabel, { color: colors.text }]}>Status</Text>
          <View style={styles.statuses}>
            {GROUP_STATUSES.map((item) => (
              <Pressable
                key={item}
                onPress={() => setStatus(item)}
                style={[
                  styles.status,
                  { backgroundColor: colors.surfaceMuted },
                  status === item && { backgroundColor: colors.primary },
                ]}
              >
                <Text style={[styles.statusText, { color: colors.muted }, status === item && styles.statusTextActive]}>
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>
          <PrimaryButton title="Create group" onPress={save} loading={mutation.isPending} icon={FolderPlus} style={{ marginTop: 8 }} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 80, gap: 13 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginVertical: 5 },
  title: { fontSize: 26, fontWeight: '800' },
  detail: { marginTop: 4, maxWidth: 275, fontSize: 13, lineHeight: 18 },
  add: { height: 46, width: 46, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  modal: { flex: 1 },
  modalHead: { padding: 20, paddingTop: 24, flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1 },
  modalTitle: { fontSize: 19, fontWeight: '800' },
  cancel: { fontWeight: '700' },
  form: { padding: 20, gap: 15 },
  toggle: { padding: 14, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleTitle: { fontWeight: '700', fontSize: 14 },
  toggleText: { fontSize: 12, marginTop: 3 },
  fieldLabel: { fontSize: 13, fontWeight: '700', marginBottom: -7 },
  statuses: { flexDirection: 'row', gap: 7 },
  status: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  statusText: { textTransform: 'capitalize', fontWeight: '700', fontSize: 12 },
  statusTextActive: { color: '#fff' },
});
