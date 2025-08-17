import { Navigate, Outlet } from "react-router-dom";

function ProtectedRoute({ user }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.phone || !user.name || !user.gender || !user.birthdate) {
    return <Navigate to="/profile-setup" replace />;
  }

  return <Outlet />; // 통과 시 자식 라우트 렌더링
}

export default ProtectedRoute;