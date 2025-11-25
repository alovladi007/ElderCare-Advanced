import { useAuth } from '@/hooks/useAuth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import FormField from '@/components/ui/FormField';
import { User, Bell, Shield, Home } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your account and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <User className="text-primary-600" size={20} />
              </div>
              <h2 className="text-xl font-semibold">Profile</h2>
            </div>

            <div className="space-y-4">
              <FormField
                label="Full Name"
                value={user?.full_name || ''}
                disabled
              />
              <FormField
                label="Email"
                type="email"
                value={user?.email || ''}
                disabled
              />
              <Button variant="primary">
                Update Profile
              </Button>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Bell className="text-blue-600" size={20} />
              </div>
              <h2 className="text-xl font-semibold">Notifications</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Device Alerts</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Receive alerts for device status changes
                  </p>
                </div>
                <input type="checkbox" className="w-5 h-5" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Automation Notifications</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Get notified when automations run
                  </p>
                </div>
                <input type="checkbox" className="w-5 h-5" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Weekly Reports</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Receive weekly energy usage reports
                  </p>
                </div>
                <input type="checkbox" className="w-5 h-5" defaultChecked />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Shield className="text-green-600" size={20} />
              </div>
              <h2 className="text-xl font-semibold">Security</h2>
            </div>

            <div className="space-y-4">
              <Button variant="secondary">
                Change Password
              </Button>
              <Button variant="secondary">
                Two-Factor Authentication
              </Button>
              <Button variant="secondary">
                API Keys
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Home className="text-purple-600" size={20} />
              </div>
              <h2 className="text-xl font-semibold">Home Info</h2>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600 dark:text-gray-400">Created</p>
                <p className="font-medium">{new Date(user?.created_at || '').toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">User ID</p>
                <p className="font-mono text-xs">{user?.id}</p>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold mb-4">Danger Zone</h2>
            <Button variant="danger" className="w-full">
              Delete Account
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
