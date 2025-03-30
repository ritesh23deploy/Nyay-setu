import { useState, useEffect } from "react";
import { useLanguagePreference } from "@/lib/hooks";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const { language, toggleLanguage } = useLanguagePreference();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [loginMethod, setLoginMethod] = useState<"phone" | "email">("phone");
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to true for dark mode
  const [isOfflineEnabled, setIsOfflineEnabled] = useState(false);

  // Initialize dark mode on component mount
  useEffect(() => {
    // Check if dark mode is already applied
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
  }, []);

  const toggleDarkMode = () => {
    const newDarkModeState = !isDarkMode;
    setIsDarkMode(newDarkModeState);
    
    // Apply or remove dark mode class and data-theme attribute
    if (newDarkModeState) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    }
  };
  
  // Initialize dark mode on mount
  useEffect(() => {
    // Check for saved preference or system preference
    const userPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark' || (!savedTheme && userPrefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleOfflineMode = () => {
    setIsOfflineEnabled(!isOfflineEnabled);
    // Implementation would go here
  };

  return (
    <header className="bg-gradient-to-r from-primary to-primary-dark text-white shadow-md z-20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex items-center">
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center mr-3">
                <span className="material-icons">balance</span>
              </div>
              <h1 className="text-xl font-serif font-bold tracking-wide">Nyay Setu</h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={toggleLanguage} 
              className="px-3 py-1.5 rounded-full border border-white/30 hover:bg-white/10 transition text-sm font-medium"
            >
              <span>{language === 'en' ? 'हिंदी' : 'English'}</span>
            </button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full overflow-hidden h-9 w-9 bg-white/10 hover:bg-white/20 transition flex items-center justify-center">
                  <span className="material-icons text-sm">person</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setIsLoginOpen(true)} className="cursor-pointer">
                  <span className="material-icons mr-2 text-sm">login</span>
                  <span>{language === 'en' ? 'Login / Register' : 'लॉगिन / रजिस्टर'}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsSettingsOpen(true)} className="cursor-pointer">
                  <span className="material-icons mr-2 text-sm">settings</span>
                  <span>{language === 'en' ? 'Settings' : 'सेटिंग्स'}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {language === 'en' ? 'Login to Nyay Setu' : 'न्याय सेतु में लॉगिन करें'}
            </DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="phone" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger 
                value="phone" 
                onClick={() => setLoginMethod("phone")}
              >
                {language === 'en' ? 'Phone' : 'फ़ोन'}
              </TabsTrigger>
              <TabsTrigger 
                value="email" 
                onClick={() => setLoginMethod("email")}
              >
                {language === 'en' ? 'Email' : 'ईमेल'}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="phone" className="space-y-4 mt-4">
              <div>
                <Input
                  type="tel"
                  placeholder={language === 'en' ? 'Phone Number' : 'फ़ोन नंबर'}
                  className="mb-2"
                />
              </div>
              <Button className="w-full">
                {language === 'en' ? 'Get OTP' : 'OTP प्राप्त करें'}
              </Button>
            </TabsContent>
            
            <TabsContent value="email" className="space-y-4 mt-4">
              <div>
                <Input
                  type="email"
                  placeholder={language === 'en' ? 'Email Address' : 'ईमेल पता'}
                  className="mb-2"
                />
                <Input
                  type="password"
                  placeholder={language === 'en' ? 'Password' : 'पासवर्ड'}
                />
              </div>
              <Button className="w-full">
                {language === 'en' ? 'Login' : 'लॉगिन'}
              </Button>
              <div className="text-center text-sm">
                <Button variant="link" className="p-0 h-auto text-sm">
                  {language === 'en' ? 'Forgot Password?' : 'पासवर्ड भूल गए?'}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex items-center my-4">
            <div className="flex-grow border-t"></div>
            <span className="px-3 text-sm text-neutral-500">
              {language === 'en' ? 'OR' : 'या'}
            </span>
            <div className="flex-grow border-t"></div>
          </div>
          
          <Button variant="outline" className="w-full">
            {language === 'en' ? 'Create New Account' : 'नया अकाउंट बनाएँ'}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Settings Modal */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'en' ? 'Settings' : 'सेटिंग्स'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="material-icons">translate</span>
                <span>{language === 'en' ? 'Language' : 'भाषा'}</span>
              </div>
              <Button onClick={toggleLanguage} variant="outline" size="sm">
                {language === 'en' ? 'English' : 'हिंदी'}
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="material-icons">dark_mode</span>
                <span>{language === 'en' ? 'Dark Mode' : 'डार्क मोड'}</span>
              </div>
              <Button 
                onClick={toggleDarkMode} 
                variant={isDarkMode ? "default" : "outline"} 
                size="sm"
              >
                {isDarkMode ? (language === 'en' ? 'On' : 'चालू') : (language === 'en' ? 'Off' : 'बंद')}
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="material-icons">download</span>
                <span>{language === 'en' ? 'Offline Access' : 'ऑफलाइन एक्सेस'}</span>
              </div>
              <Button 
                onClick={toggleOfflineMode} 
                variant={isOfflineEnabled ? "default" : "outline"} 
                size="sm"
              >
                {isOfflineEnabled ? (language === 'en' ? 'On' : 'चालू') : (language === 'en' ? 'Off' : 'बंद')}
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="material-icons">notifications</span>
                <span>{language === 'en' ? 'Notifications' : 'नोटिफिकेशन'}</span>
              </div>
              <Button variant="outline" size="sm">
                {language === 'en' ? 'Manage' : 'प्रबंधित करें'}
              </Button>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <Button variant="outline" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50">
              {language === 'en' ? 'Log Out' : 'लॉग आउट'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
