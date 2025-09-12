"use client"

import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Label } from '@/components/ui/Label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup'
import { Separator } from '@/components/ui/Separator'
import { signOut } from 'next-auth/react'
import { Moon, Sun, Monitor, LogOut, Trash2 } from 'lucide-react'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your application preferences and account settings.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Customize how the application looks on your device.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Label className="text-base">Theme</Label>
              <RadioGroup 
                value={theme} 
                onValueChange={setTheme}
                className="grid grid-cols-3 gap-8"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="light" id="light" />
                  <Label htmlFor="light" className="flex items-center space-x-2 cursor-pointer">
                    <Sun className="h-4 w-4" />
                    <span>Light</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dark" id="dark" />
                  <Label htmlFor="dark" className="flex items-center space-x-2 cursor-pointer">
                    <Moon className="h-4 w-4" />
                    <span>Dark</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="system" id="system" />
                  <Label htmlFor="system" className="flex items-center space-x-2 cursor-pointer">
                    <Monitor className="h-4 w-4" />
                    <span>System</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              Manage your account and authentication settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium">Sign Out</h4>
                <p className="text-sm text-muted-foreground">
                  Sign out of your current session
                </p>
              </div>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-red-600">Danger Zone</h4>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all data
                </p>
              </div>
              <Button 
                variant="destructive" 
                onClick={() => alert('Account deletion not implemented yet')}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
