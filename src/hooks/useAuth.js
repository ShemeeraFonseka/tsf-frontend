export const getUser = () => {
  const stored = localStorage.getItem("user");
  return stored ? JSON.parse(stored) : null;
};

// Sales = viewer, everyone else = admin
export const isAdmin = () => {
  const user = getUser();
  if (!user) return false;
  return user.position !== "sales";
};
