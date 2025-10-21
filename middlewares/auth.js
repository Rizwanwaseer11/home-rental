module.exports.isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) return next();
  return res.redirect("/auth/login");
};

module.exports.isOwner = (req, res, next) => {
  if (req.session && req.session.role === "owner") return next();
  return res.status(403).send("Access denied: Owners only");
};

module.exports.isRenter = (req, res, next) => {
  if (req.session && req.session.role === "renter") return next();
  return res.status(403).send("Access denied: Renters only");
};

module.exports.isAdmin = (req, res, next) => {
  if (req.session && req.session.role === "admin") return next();
  return res.status(403).send("Access denied: Admins only");
};
