"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { Mail, Lock, User as UserIcon, Phone } from "lucide-react";
import Image from "next/image";
import { SubmitLoading } from "@/components/ui/submit-loading";

type TabType = "login" | "signup";

export default function AuthenticationPage() {
  const [activeTab, setActiveTab] = useState<TabType>("login");
  const router = useRouter();

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Sign up state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupLoading, setSignupLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setLoginLoading(true);
    setLoginError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (error) throw error;
      
      // Delay navigation slightly to let auth cookies settle
      setTimeout(() => {
        router.push("/dashboard");
      }, 500);
    } catch (error: unknown) {
      setLoginError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setSignupLoading(true);
    setSignupError(null);

    if (signupPassword !== repeatPassword) {
      setSignupError("Passwords do not match");
      setSignupLoading(false);
      return;
    }

    if (!fullName.trim()) {
      setSignupError("Full name is required");
      setSignupLoading(false);
      return;
    }

    try {
      // Sign up user with metadata - database trigger will automatically create profile
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            full_name: fullName,
            phone: phone,
          },
        },
      });

      if (authError) throw authError;

      // Supabase email enumeration protection check. 
      // If the email is already registered, it returns an empty identities array.
      if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
        setSignupError("Email sudah terdaftar. Silakan gunakan email lain atau langsung Login.");
        setSignupLoading(false);
        return;
      }

      // Profile will be automatically created by database trigger
      // Redirect to success page
      router.push("/auth/sign-up-success");
    } catch (error: unknown) {
      console.error("Signup error:", error);
      setSignupError(
        error instanceof Error
          ? error.message
          : "An error occurred during registration"
      );
    } finally {
      setSignupLoading(false);
    }
  };

const handleGoogleAuth = async () => {
    const supabase = createClient();
    
    // Set loading state based on active tab
    if (activeTab === "login") {
      setLoginLoading(true);
      setLoginError(null);
    } else {
      setSignupLoading(true);
      setSignupError(null);
    }
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      
      if (error) throw error;
      
      // Redirect will happen automatically via OAuth flow
    } catch (error: unknown) {
      console.error("Error signing in with Google:", error);
      const errorMessage = error instanceof Error ? error.message : "An error occurred with Google Login";
      
      if (activeTab === "login") {
        setLoginError(errorMessage);
        setLoginLoading(false);
      } else {
        setSignupError(errorMessage);
        setSignupLoading(false);
      }
    }
    };

    const handleFacebookAuth = () => {
      console.log(`Facebook ${activeTab}`);
    };

    return (
      <div className="flex min-h-screen w-full">
        {/* Left Side - Geometric Design */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/90 via-primary to-secondary/80 relative overflow-hidden">
          <div className="absolute inset-0">
            <div
              className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-primary/40 to-transparent transform -translate-x-20 -translate-y-20"
              style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
            />
          </div>

          <div className="relative z-10 flex flex-col justify-center items-center px-12 py-20 text-white w-full">
            <div className="text-center transition-all duration-500">
              <h1 className="text-6xl font-bold mb-4">
                {activeTab === "login" ? "LOGIN" : "SIGN UP"}
            </h1>
            <p className="text-xl text-white/90">
              {activeTab === "login" ? "Welcome back to Ragly" : "Join Ragly today"}
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-10 bg-background relative">
        <SubmitLoading 
          isLoading={loginLoading || signupLoading} 
          text={loginLoading ? "Memverifikasi Kredensial..." : "Membuat Akun..."} 
        />
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            {/* Logo */}
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center shadow-lg">
                <Image
                  src="/images/logo-ragly.svg"
                  alt="Logo"
                  width={100}
                  height={100}
                />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-4xl font-bold text-center text-foreground mb-2">
              {activeTab === "login" ? "LOGIN" : "SIGN UP"}
            </h1>

            {/* Tab Toggle */}
            <div className="flex rounded-full bg-muted p-1 mb-4">
              <button
                type="button"
                onClick={() => setActiveTab("login")}
                className={cn(
                  "flex-1 py-2.5 px-4 rounded-full font-medium text-center transition-all duration-300",
                  activeTab === "login"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                LOGIN
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("signup")}
                className={cn(
                  "flex-1 py-2.5 px-4 rounded-full font-medium text-center transition-all duration-300",
                  activeTab === "signup"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                SIGN UP
              </button>
            </div>

            {/* Forms Container with Slide Animation */}
            <div className="relative overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{
                  transform: activeTab === "login" ? "translateX(0)" : "translateX(-100%)",
                }}
              >
                {/* Login Form */}
                <div className="w-full flex-shrink-0">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="Email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-11 h-12 border-b-2 border-t-0 border-l-0 border-r-0 rounded-none placeholder:text-gray-400 focus-visible:ring-0 focus-visible:border-primary"
                      />
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="Password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-11 h-12 border-b-2 border-t-0 placeholder:text-gray-400 border-l-0 border-r-0 rounded-none focus-visible:ring-0 focus-visible:border-primary"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => router.push("/auth/forgot-password")}
                        className="text-sm text-primary hover:underline"
                      >
                        Forgot Password?
                      </button>
                    </div>

                    {loginError && (
                      <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20">
                        {loginError}
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={loginLoading}
                      className="w-full h-12 rounded-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white font-semibold text-base shadow-lg"
                    >
                      {loginLoading ? "LOGGING IN..." : "LOGIN"}
                    </Button>
                  </form>
                </div>

                {/* Sign Up Form */}
                <div className="w-full flex-shrink-0">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Full Name"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-11 h-12 border-b-2 border-t-0 placeholder:text-gray-400 border-l-0 border-r-0 rounded-none focus-visible:ring-0 focus-visible:border-primary"
                      />
                    </div>

                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Email"
                        required
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className="pl-11 h-12 border-b-2 border-t-0 placeholder:text-gray-400 border-l-0 border-r-0 rounded-none focus-visible:ring-0 focus-visible:border-primary"
                      />
                    </div>

                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Phone Number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-11 h-12 border-b-2 border-t-0 border-l-0 border-r-0 placeholder:text-gray-400 rounded-none focus-visible:ring-0 focus-visible:border-primary"
                      />
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Password"
                        required
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="pl-11 h-12 border-b-2 border-t-0 border-l-0 border-r-0 placeholder:text-gray-400 rounded-none focus-visible:ring-0 focus-visible:border-primary"
                      />
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="repeat-password"
                        type="password"
                        placeholder="Confirm Password"
                        required
                        value={repeatPassword}
                        onChange={(e) => setRepeatPassword(e.target.value)}
                        className="pl-11 h-12 border-b-2 border-t-0 border-l-0 border-r-0 placeholder:text-gray-400 rounded-none focus-visible:ring-0 focus-visible:border-primary"
                      />
                    </div>

                    {signupError && (
                      <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20">
                        {signupError}
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={signupLoading}
                      className="w-full h-12 rounded-full bg-gradient-to-r from-secondary to-primary hover:opacity-90 text-white font-semibold text-base shadow-lg"
                    >
                      {signupLoading ? "CREATING ACCOUNT..." : "SIGN UP"}
                    </Button>
                  </form>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or {activeTab === "login" ? "Login" : "Sign Up"} With
                </span>
              </div>
            </div>

            {/* Social Login Buttons */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-11 gap-2"
                onClick={handleGoogleAuth}
                disabled={loginLoading || signupLoading}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {(loginLoading || signupLoading) ? "Connecting..." : "Google"}
                
              </Button>
              {/* <Button
                type="button"
                variant="outline"
                className="flex-1 h-11 gap-2"
                onClick={handleFacebookAuth}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </Button> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
