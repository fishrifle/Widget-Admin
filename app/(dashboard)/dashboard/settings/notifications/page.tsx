"use client";

import { useState, useEffect } from "react";
import { useOrganization } from "@/hooks/use-organization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Switch } from "@/components/ui/Switch";
import { Label } from "@/components/ui/Label";
import { useToast } from "@/components/ui/use-toast";
import { 
  Bell, 
  Mail, 
  Smartphone, 
  Monitor, 
  Heart, 
  Users, 
  Palette, 
  DollarSign,
  AlertCircle,
  Save,
  RefreshCw
} from "lucide-react";
import type { NotificationPreference, NotificationType, NotificationChannel } from "@/types/notifications.types";

interface NotificationSetting {
  type: NotificationType;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'donations' | 'team' | 'widgets' | 'payments' | 'system';
  channels: NotificationChannel[];
  enabled: boolean;
}

const notificationTypes: NotificationSetting[] = [
  {
    type: 'donation_received',
    title: 'Donation Received',
    description: 'Get notified when your organization receives a new donation',
    icon: <Heart className="w-4 h-4" />,
    category: 'donations',
    channels: ['email', 'in_app'],
    enabled: true
  },
  {
    type: 'goal_reached',
    title: 'Goal Reached',
    description: 'Celebrate when your fundraising goals are achieved',
    icon: <DollarSign className="w-4 h-4" />,
    category: 'donations',
    channels: ['email', 'in_app'],
    enabled: true
  },
  {
    type: 'team_invitation',
    title: 'Team Invitations',
    description: 'Notifications about team member invitations',
    icon: <Users className="w-4 h-4" />,
    category: 'team',
    channels: ['email'],
    enabled: true
  },
  {
    type: 'team_member_joined',
    title: 'Team Member Joined',
    description: 'Know when new team members join your organization',
    icon: <Users className="w-4 h-4" />,
    category: 'team',
    channels: ['in_app'],
    enabled: true
  },
  {
    type: 'widget_created',
    title: 'Widget Created',
    description: 'Updates when new donation widgets are created',
    icon: <Palette className="w-4 h-4" />,
    category: 'widgets',
    channels: ['in_app'],
    enabled: false
  },
  {
    type: 'widget_updated',
    title: 'Widget Updated',
    description: 'Changes to your donation widgets',
    icon: <Palette className="w-4 h-4" />,
    category: 'widgets',
    channels: ['in_app'],
    enabled: false
  },
  {
    type: 'payment_processed',
    title: 'Payment Processed',
    description: 'Confirmations for successful payments',
    icon: <DollarSign className="w-4 h-4" />,
    category: 'payments',
    channels: ['email'],
    enabled: true
  },
  {
    type: 'payment_failed',
    title: 'Payment Failed',
    description: 'Alerts for failed payment processing',
    icon: <AlertCircle className="w-4 h-4" />,
    category: 'payments',
    channels: ['email'],
    enabled: true
  }
];

const channelIcons = {
  email: <Mail className="w-4 h-4" />,
  in_app: <Monitor className="w-4 h-4" />,
  push: <Smartphone className="w-4 h-4" />
};

const channelLabels = {
  email: 'Email',
  in_app: 'In-App',
  push: 'Push'
};

const categoryLabels = {
  donations: 'Donations',
  team: 'Team Management',
  widgets: 'Widgets',
  payments: 'Payments',
  system: 'System'
};

export default function NotificationSettingsPage() {
  const { organization, loading: orgLoading } = useOrganization();
  const [settings, setSettings] = useState<NotificationSetting[]>(notificationTypes);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function loadPreferences() {
      if (!organization) return;

      try {
        const response = await fetch(`/api/notifications/preferences?organizationId=${organization.id}`);
        const data = await response.json();

        if (response.ok && data.preferences) {
          // Update settings with saved preferences
          setSettings(current => 
            current.map(setting => {
              const pref = data.preferences.find((p: NotificationPreference) => p.type === setting.type);
              if (pref) {
                return {
                  ...setting,
                  channels: pref.channels,
                  enabled: pref.enabled
                };
              }
              return setting;
            })
          );
        }
      } catch (error) {
        console.error("Error loading notification preferences:", error);
      } finally {
        setLoading(false);
      }
    }

    if (!orgLoading && organization) {
      loadPreferences();
    }
  }, [organization, orgLoading]);

  const updateSetting = (type: NotificationType, field: 'enabled' | 'channels', value: any) => {
    setSettings(current =>
      current.map(setting =>
        setting.type === type
          ? { ...setting, [field]: value }
          : setting
      )
    );
  };

  const toggleChannel = (type: NotificationType, channel: NotificationChannel) => {
    setSettings(current =>
      current.map(setting => {
        if (setting.type === type) {
          const channels = setting.channels.includes(channel)
            ? setting.channels.filter(c => c !== channel)
            : [...setting.channels, channel];
          return { ...setting, channels };
        }
        return setting;
      })
    );
  };

  const savePreferences = async () => {
    if (!organization) return;

    setSaving(true);
    try {
      const preferences = settings.map(setting => ({
        organization_id: organization.id,
        type: setting.type,
        channels: setting.channels,
        enabled: setting.enabled
      }));

      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save preferences');
      }

      toast({
        title: "Settings Saved",
        description: "Your notification preferences have been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save preferences",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || orgLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  const groupedSettings = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<string, NotificationSetting[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notification Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage how and when you receive notifications from PassItOn
          </p>
        </div>
        <Button onClick={savePreferences} disabled={saving}>
          {saving ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>

      {organization && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Organization: {(organization as any).display_name || organization.name}
            </CardTitle>
          </CardHeader>
        </Card>
      )}

      {Object.entries(groupedSettings).map(([category, categorySettings]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="text-lg">
              {categoryLabels[category as keyof typeof categoryLabels]}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {categorySettings.map((setting) => (
              <div key={setting.type} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {setting.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{setting.title}</h3>
                      <Badge variant={setting.enabled ? 'default' : 'secondary'}>
                        {setting.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{setting.description}</p>
                    
                    {setting.enabled && (
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700">Channels:</span>
                        {(['email', 'in_app'] as NotificationChannel[]).map((channel) => (
                          <Label key={channel} className="flex items-center gap-2 cursor-pointer">
                            <Switch
                              checked={setting.channels.includes(channel)}
                              onCheckedChange={() => toggleChannel(setting.type, channel)}
                              size="sm"
                            />
                            <span className="flex items-center gap-1 text-sm">
                              {channelIcons[channel]}
                              {channelLabels[channel]}
                            </span>
                          </Label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <Switch
                  checked={setting.enabled}
                  onCheckedChange={(checked) => updateSetting(setting.type, 'enabled', checked)}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How Notifications Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-gray-600">Sent to your registered email address</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Monitor className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium">In-App Notifications</p>
              <p className="text-sm text-gray-600">Displayed in your dashboard when you&apos;re online</p>
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> You can customize notification settings for each organization you belong to. 
              Critical notifications like payment failures will always be sent via email for security.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}