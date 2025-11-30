import { useContext } from 'react';
import SecurityContext from '../providers/SecurityProvider';

const useSecurity = () => {
  const ctx = useContext(SecurityContext);

  if (!ctx) {
    throw new Error('useSecurity debe usarse dentro de un SecurityProvider');
  }

  return ctx;
};

export default useSecurity;
