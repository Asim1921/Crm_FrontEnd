import { createContext, useContext, useState } from 'react';

const SearchContext = createContext();

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

export const SearchProvider = ({ children }) => {
  // Header search state
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const [headerSearchResults, setHeaderSearchResults] = useState([]);
  const [isHeaderSearching, setIsHeaderSearching] = useState(false);

  // Dashboard search state
  const [dashboardSearchQuery, setDashboardSearchQuery] = useState('');

  // Header search functions
  const updateHeaderSearch = (query) => {
    setHeaderSearchQuery(query);
  };

  const clearHeaderSearch = () => {
    setHeaderSearchQuery('');
    setHeaderSearchResults([]);
  };

  const setHeaderResults = (results) => {
    setHeaderSearchResults(results);
  };

  const setHeaderSearching = (searching) => {
    setIsHeaderSearching(searching);
  };

  // Dashboard search functions
  const updateDashboardSearch = (query) => {
    setDashboardSearchQuery(query);
  };

  const clearDashboardSearch = () => {
    setDashboardSearchQuery('');
  };

  return (
    <SearchContext.Provider value={{
      // Header search
      headerSearchQuery,
      headerSearchResults,
      isHeaderSearching,
      updateHeaderSearch,
      clearHeaderSearch,
      setHeaderResults,
      setHeaderSearching,
      // Dashboard search
      dashboardSearchQuery,
      updateDashboardSearch,
      clearDashboardSearch
    }}>
      {children}
    </SearchContext.Provider>
  );
};
