import { Button } from "@/components/ui/button";
import { Sparkles, Zap } from 'lucide-react';

const JIRA_CLIENT_ID = "1iPOA0bjBb26MQLB5NPc2zNoapLvAcpk";
const REDIRECT_URI = encodeURIComponent("https://jira-automation.mnv-dev.site/auth/callback");
const SCOPE = "read:issue:jira write:issue:jira delete:issue:jira read:jira-work read:jira-user write:jira-work offline_access";
const AUTH_URL = `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=${JIRA_CLIENT_ID}&scope=${encodeURIComponent(SCOPE)}&redirect_uri=${REDIRECT_URI}&state=YOUR_USER_BOUND_VALUE&response_type=code&prompt=consent`;

const deleteCookie = (name: string) => {
  // Try deleting with different options
  const domains = [window.location.hostname, '.' + window.location.hostname, ''];
  const paths = ['/', window.location.pathname];
  const attrs = [
    '',
    'SameSite=None; Secure',
    'SameSite=Lax',
    'SameSite=Strict',
  ];
  for (const domain of domains) {
    for (const path of paths) {
      for (const attr of attrs) {
        let cookie = `${name}=; max-age=0; path=${path};`;
        if (domain) cookie += ` domain=${domain};`;
        if (attr) cookie += ` ${attr};`;
        document.cookie = cookie;
      }
    }
  }
};

const logout = async () => {
  try {
    await fetch("/logout", { method: "POST", credentials: "include" });
  } catch (e) {
    // Ignore errors, just reload
  }
  // Optionally clear localStorage/sessionStorage if used
  // localStorage.clear();
  // sessionStorage.clear();
  window.location.href = '/';
};

const LoginButton = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
    <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 md:p-12 flex flex-col items-center max-w-md w-full border border-gray-200/60">
      <div className="flex items-center mb-6">
        <div className="w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg mr-4">
          <Zap className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Jira Assistant</h1>
          <p className="text-sm text-gray-500 mt-1">AI-powered Jira automation</p>
        </div>
      </div>
      <div className="mb-8 text-center">
        <p className="text-lg text-gray-700 font-medium mb-2">Welcome!</p>
        <p className="text-gray-500">Sign in with Jira to start automating your workflows and chatting with your AI assistant.</p>
      </div>
      <Button
        onClick={() => {
          window.location.href = AUTH_URL;
        }}
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl shadow-lg text-lg font-semibold flex items-center gap-2 transition-all duration-200"
        size="lg"
      >
        <Sparkles className="w-5 h-5 mr-1 animate-bounce" />
        Login with Jira
      </Button>
    </div>
    <p className="mt-8 text-xs text-gray-400 text-center">&copy; {new Date().getFullYear()} Jira Automation Chatbot. All rights reserved.</p>
  </div>
);

export { logout };
export default LoginButton;