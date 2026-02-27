import Header from './Header';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen hero-bg">
      <Header />
      <main className="pt-16">{children}</main>
    </div>
  );
};

export default Layout;
