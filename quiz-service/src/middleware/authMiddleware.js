const verifyUser = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  const userEmail = req.headers['x-user-email'];
  const userRole = req.headers['x-user-role'];
  const userName = req.headers['x-user-name'];

  if (!userId || !userRole) {
    return res.status(401).json({ message: 'Unauthorized. User context missing.' });
  }

  req.user = {
    id: userId,
    email: userEmail,
    role: userRole,
    name: userName,
  };

  next();
};

const requireStudent = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized. Please log in.' });
  }

  if (req.user.role !== 'USER') {
    return res.status(403).json({
      message: `Forbidden. Only students can access this resource. Your role: ${req.user.role}`,
    });
  }

  next();
};

module.exports = { verifyUser, requireStudent };
