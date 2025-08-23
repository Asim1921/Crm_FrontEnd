export const isAdmin = (user) => {
  return user && user.role === 'admin';
};

export const isAgent = (user) => {
  return user && (user.role === 'agent' || user.role === 'admin');
};

export const canViewFullClientDetails = (user) => {
  return isAdmin(user);
};

export const canAssignClients = (user) => {
  return isAdmin(user);
};

export const canExportData = (user) => {
  return isAdmin(user);
};

export const canViewPhoneNumbers = (user) => {
  return isAdmin(user);
};

export const canViewEmailAddresses = (user) => {
  return isAdmin(user);
};
