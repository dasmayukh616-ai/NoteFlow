"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { User, Palette, Sparkles, LogOut, CheckCircle2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function SettingsPage() {
  const { user } = useUser();
  const { theme, setTheme } = useTheme();
  const [aiModel, setAiModel] = useState("mixtral-8x7b-32768");
  
  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full p-4 pb-20 md:pb-8">
      <div className="flex items-center gap-4 border-b border-border/40 pb-6">
        <div className="p-3 bg-primary/10 rounded-xl">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-sm">Manage your workspace preferences and AI constraints.</p>
        </div>
      </div>

      <Tabs defaultValue="preferences" className="w-full">
        <TabsList className="grid w-full mb-8 max-w-md grid-cols-3 bg-secondary/50 backdrop-blur-md p-1 rounded-xl glassmorphism">
          <TabsTrigger value="preferences" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Palette className="w-4 h-4 mr-2 hidden md:inline-block" /> App
          </TabsTrigger>
          <TabsTrigger value="ai" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Sparkles className="w-4 h-4 mr-2 hidden md:inline-block" /> AI Models
          </TabsTrigger>
          <TabsTrigger value="account" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <User className="w-4 h-4 mr-2 hidden md:inline-block" /> Account
          </TabsTrigger>
        </TabsList>
        
        {/* PREFERENCES TAB */}
        <TabsContent value="preferences">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card className="border-border/40 shadow-sm bg-card/50 backdrop-blur-xl">
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize how NoteFlow looks on your device.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base font-medium">Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">OLED-optimized dark theme.</p>
                  </div>
                  <Switch 
                    checked={theme === "dark"} 
                    onCheckedChange={(c) => setTheme(c ? "dark" : "light")} 
                  />
                </div>
                
                <div className="flex items-center justify-between border-t border-border/40 pt-6">
                  <div className="space-y-0.5">
                    <Label className="text-base font-medium">System Sync</Label>
                    <p className="text-sm text-muted-foreground">Follow operating system theme settings.</p>
                  </div>
                  <Switch 
                    checked={theme === "system"} 
                    onCheckedChange={(c) => setTheme(c ? "system" : "light")} 
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* AI MODELS TAB */}
        <TabsContent value="ai">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card className="border-border/40 shadow-sm bg-card/50 backdrop-blur-xl">
              <CardHeader>
                <CardTitle>AI Configuration</CardTitle>
                <CardDescription>Select the underlying model backing your NoteFlow AI.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className={"flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer " + (aiModel === "mixtral-8x7b-32768" ? "border-primary bg-primary/5" : "border-border/40 hover:border-border")} onClick={() => setAiModel("mixtral-8x7b-32768")}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                      <span className="text-orange-500 font-bold">M</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Mixtral 8x7B <span className="ml-2 text-[10px] uppercase font-bold tracking-wider bg-primary/20 text-primary px-2 py-0.5 rounded-full">Active</span></p>
                      <p className="text-xs text-muted-foreground">Fast, high quality general purpose model</p>
                    </div>
                  </div>
                  {aiModel === "mixtral-8x7b-32768" && <CheckCircle2 className="w-5 h-5 text-primary" />}
                </div>

                <div className={"flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer " + (aiModel === "llama3-70b-8192" ? "border-primary bg-primary/5" : "border-border/40 hover:border-border")} onClick={() => setAiModel("llama3-70b-8192")}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <span className="text-blue-500 font-bold">L3</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Llama 3 70B</p>
                      <p className="text-xs text-muted-foreground">Maximum reasoning and logic capabilities</p>
                    </div>
                  </div>
                  {aiModel === "llama3-70b-8192" && <CheckCircle2 className="w-5 h-5 text-primary" />}
                </div>

                <div className="p-4 bg-secondary/50 rounded-xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex flex-col gap-2">
                     <p className="text-sm font-medium">Context Window Usage</p>
                     <div className="w-full bg-background h-2 rounded-full overflow-hidden">
                       <div className="bg-primary w-[35%] h-full rounded-full" />
                     </div>
                     <p className="text-xs text-muted-foreground mt-1">~1,000 / 32,768 tokens used in current history.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ACCOUNT TAB */}
        <TabsContent value="account">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card className="border-border/40 shadow-sm bg-card/50 backdrop-blur-xl">
              <CardHeader>
                <CardTitle>Profile Details</CardTitle>
                <CardDescription>Manage your NoteFlow identity.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16 border-2 border-primary/20">
                    <AvatarImage src={user?.imageUrl} />
                    <AvatarFallback>{user?.firstName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-medium">{user?.fullName || "Not signed in"}</h3>
                    <p className="text-sm text-muted-foreground">{user?.primaryEmailAddress?.emailAddress}</p>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-border/40">
                  <h4 className="text-sm font-medium mb-4">Connected Accounts</h4>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-background/50">
                     <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-md bg-white flex items-center justify-center shadow-sm">
                         {/* Google G logic */}
                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                       </div>
                       <div>
                         <p className="text-sm font-medium">Google Calendar</p>
                         <p className="text-xs text-muted-foreground">Synced 2 hours ago</p>
                       </div>
                     </div>
                     <Button variant="outline" size="sm" className="text-xs">Manage</Button>
                  </div>
                </div>

                <div className="pt-6">
                  <Button variant="destructive" className="w-full sm:w-auto gap-2">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
        
      </Tabs>
    </div>
  );
}
