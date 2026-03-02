import Header from './Header';
import AdminHeader from './AdminHeader';
import { useAppStore } from '../store/useAppStore';
import TrianglesLight from './TrianglesLight';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { role } = useAppStore();

  return (
    <div className="min-h-screen relative overflow-hidden">
      <TrianglesLight />
      <div className="relative z-10 w-full min-h-screen">
        {role === 'admin' ? <AdminHeader /> : <Header />}
        <main className="pt-16">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
