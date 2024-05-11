"use client";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="layout w-full h-screen items-center flex justify-center">
      {children}
      <style jsx global>{`
        .layout {
          background-image: url("/bg-login.png"); /* Replace with your image path */
          background-size: cover;
          background-position: center;
          /* Additional styles for layout if needed */
        }
      `}</style>
    </div>
  );
};

export default AuthLayout;
