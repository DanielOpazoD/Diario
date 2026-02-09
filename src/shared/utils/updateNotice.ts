import { APP_EVENTS } from '@shared/constants/appEvents';
import { SESSION_KEYS } from '@shared/constants/sessionKeys';
import { safeSessionGetItem, safeSessionRemoveItem, safeSessionSetItem } from '@shared/utils/safeSessionStorage';

export type UpdateEventDetail = {
  message?: string;
};

export const setUpdateNotice = () => {
  safeSessionSetItem(SESSION_KEYS.UPDATE_NOTICE, '1');
};

export const consumeUpdateNotice = () => {
  const value = safeSessionGetItem(SESSION_KEYS.UPDATE_NOTICE);
  if (value) {
    safeSessionRemoveItem(SESSION_KEYS.UPDATE_NOTICE);
    return true;
  }
  return false;
};

export const dispatchUpdateEvent = (detail?: UpdateEventDetail) => {
  window.dispatchEvent(
    new CustomEvent(APP_EVENTS.UPDATE, {
      detail,
    })
  );
};

export const addUpdateListener = (handler: (event: CustomEvent<UpdateEventDetail>) => void) => {
  window.addEventListener(APP_EVENTS.UPDATE, handler as EventListener);
};

export const removeUpdateListener = (handler: (event: CustomEvent<UpdateEventDetail>) => void) => {
  window.removeEventListener(APP_EVENTS.UPDATE, handler as EventListener);
};
