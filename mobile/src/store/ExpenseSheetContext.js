import React, { createContext, useCallback, useContext, useState } from 'react';
import ExpenseFormModal from '../components/expenses/ExpenseFormModal';

const ExpenseSheetContext = createContext(null);

export function ExpenseSheetProvider({ children }) {
  const [state, setState] = useState({
    visible: false,
    expense: null,
    defaults: null,
  });

  const openExpenseSheet = useCallback((options = {}) => {
    setState({
      visible: true,
      expense: options.expense || null,
      defaults: options.defaults || null,
    });
  }, []);

  const closeExpenseSheet = useCallback(() => {
    setState({
      visible: false,
      expense: null,
      defaults: null,
    });
  }, []);

  return (
    <ExpenseSheetContext.Provider value={{ openExpenseSheet, closeExpenseSheet }}>
      {children}
      <ExpenseFormModal
        visible={state.visible}
        expense={state.expense}
        defaults={state.defaults}
        onClose={closeExpenseSheet}
      />
    </ExpenseSheetContext.Provider>
  );
}

export const useExpenseSheet = () => useContext(ExpenseSheetContext);

