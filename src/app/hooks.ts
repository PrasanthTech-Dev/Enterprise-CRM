import { useCallback } from 'react';
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import type { AppDispatch, RootState } from './store';
import { pushToast } from '@/features/uiSlice';
import type { Permission, ToastItem } from '@/types';
import { ROLE_PERMISSIONS } from '@/utils/constants';

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const useCurrentUser = () => {
  const user = useAppSelector((s) => s.auth.users.find((u) => u.id === s.auth.currentUserId));
  if (!user) throw new Error('useCurrentUser must be used inside an authenticated route');
  return user;
};

export const usePermission = () => {
  const user = useCurrentUser();
  return useCallback((p: Permission) => ROLE_PERMISSIONS[user.role].includes(p), [user.role]);
};

export const useToast = () => {
  const dispatch = useAppDispatch();
  return useCallback(
    (kind: ToastItem['kind'], title: string, message?: string) => dispatch(pushToast({ kind, title, message })),
    [dispatch],
  );
};
