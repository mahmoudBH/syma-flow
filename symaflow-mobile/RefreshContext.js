// RefreshContext.js
import { createContext } from 'react';

const RefreshContext = createContext({
  refreshing: false,
  onRefresh: () => {},
});

export default RefreshContext;