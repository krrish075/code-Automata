import Header from './Header';
import AdminHeader from './AdminHeader';
import { useAppStore } from '../store/useAppStore';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { role } = useAppStore();

  return (
    <div className="min-h-screen hero-bg">
      {role === 'admin' ? <AdminHeader /> : <Header />}
      <main className="pt-16">{children}</main>
    </div>
  );
};

export default Layout;
