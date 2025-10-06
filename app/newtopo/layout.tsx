'use client';

import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDarkMode } from "@/lib/dark-mode-context";

export default function TopoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isDarkMode } = useDarkMode();

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className="relative">
      {/* Fixed Back to Dashboard Button */}
      <Button
        onClick={handleBackToDashboard}
        className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg transition-all duration-200 hover:scale-105 ${
          isDarkMode 
            ? 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-500' 
            : 'bg-white hover:bg-gray-50 text-gray-800 border border-gray-300'
        }`}
        size="sm"
      >
        <Home className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Button>
      
      {children}
    </div>
  );
}
