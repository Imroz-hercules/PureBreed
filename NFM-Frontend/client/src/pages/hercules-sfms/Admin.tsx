import React, { useState, useEffect } from 'react';
import { WaterSystemLayout } from '../../components/hercules-sfms/WaterSystemLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Upload, Mail, Clock, Shield, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { apiService, SMTPProfile } from '@/lib/api';

export function Admin() {
  const [logo, setLogo] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [uploadedLogo, setUploadedLogo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // SMTP Settings state
  const [smtpSettings, setSmtpSettings] = useState({
    host: '',
    port: 587,
    username: '',
    password: '',
    sender: ''
  });

  // SMTP Profiles state
  const [smtpProfiles, setSmtpProfiles] = useState<any[]>([]);
  const [activeProfile, setActiveProfile] = useState('');
  const [newProfile, setNewProfile] = useState<SMTPProfile>({
    name: '',
    host: '',
    port: 587,
    username: '',
    password: '',
    sender: '',
    use_tls: true
  });

  // Report Scheduler state
  const [reportScheduler, setReportScheduler] = useState({
    reportType: 'Daily Production Report',
    schedule: 'Daily at 6:00 AM',
    recipients: ''
  });

  // Security Settings state
  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: 30,
    passwordPolicy: 'Standard'
  });

  // Load SMTP profiles on component mount
  useEffect(() => {
    loadSMTPProfiles();
  }, []);

  const loadSMTPProfiles = async () => {
    try {
      setLoading(true);
      const response = await apiService.getSMTPProfiles();
      setSmtpProfiles(Object.values(response.data));
      setActiveProfile(response.active || '');
    } catch (err) {
      setError('Failed to load SMTP profiles');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogo(file);
      setPreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!logo) return;
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const response = await apiService.uploadLogo(logo);
      setUploadedLogo(response.logoUrl);
      setSuccess('Logo uploaded successfully!');
      
      // Clear the form
      setLogo(null);
      setPreview('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload logo';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSMTPSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      await apiService.saveSMTPSettings(smtpSettings);
      setSuccess('SMTP settings saved successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save SMTP settings';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSMTPProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      await apiService.addSMTPProfile(newProfile);
      setSuccess(`SMTP profile "${newProfile.name}" added successfully!`);
      
      // Reset form
      setNewProfile({
        name: '',
        host: '',
        port: 587,
        username: '',
        password: '',
        sender: '',
        use_tls: true
      });
      
      // Reload profiles
      await loadSMTPProfiles();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add SMTP profile';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateProfile = async (name: string) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      await apiService.activateSMTPProfile(name);
      setActiveProfile(name);
      setSuccess(`Profile "${name}" activated successfully!`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to activate profile';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!reportScheduler.recipients) {
      setError('Please enter recipient email address');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      await apiService.sendTestEmail(reportScheduler.recipients);
      setSuccess('Test email sent successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send test email';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <WaterSystemLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-lg">
            <Settings className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-cyan-400">Admin Panel</h1>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-900/20 border border-red-500 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <span className="text-red-400">{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-4 bg-green-900/20 border border-green-500 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <span className="text-green-400">{success}</span>
          </div>
        )}

        {/* Logo Upload Section */}
        <Card className="bg-slate-900/95 dark:bg-slate-900/95 bg-white/95 border-slate-700 dark:border-slate-700 border-slate-300 max-w-xl mx-auto">
          <CardHeader>
            <CardTitle className="text-cyan-300 dark:text-cyan-300 text-slate-700 flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Logo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="bg-slate-800 dark:bg-slate-800 bg-white border-slate-600 dark:border-slate-600 border-slate-300 text-white dark:text-white text-slate-900"
              />
              <p className="text-sm mt-2 text-slate-400 dark:text-slate-400 text-slate-600">
                {logo ? logo.name : 'No file chosen'}
              </p>
            </div>

            {preview && (
              <div className="space-y-2">
                <Label className="text-cyan-300 dark:text-cyan-300 text-slate-700">Preview:</Label>
                <img src={preview} alt="Preview" className="w-32 rounded shadow" />
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={!logo || loading}
              className={`w-full ${
                logo && !loading
                  ? 'bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600'
                  : 'bg-slate-600 cursor-not-allowed'
              }`}
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Upload Logo
            </Button>

            {uploadedLogo && (
              <div className="space-y-2">
                <Label className="text-cyan-300 dark:text-cyan-300 text-slate-700">Current Logo:</Label>
                <img src={uploadedLogo} alt="Current Logo" className="w-32 rounded shadow" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settings Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SMTP Settings */}
          <Card className="bg-slate-900/95 dark:bg-slate-900/95 bg-white/95 border-slate-700 dark:border-slate-700 border-slate-300">
            <CardHeader>
              <CardTitle className="text-cyan-300 dark:text-cyan-300 text-slate-700 flex items-center gap-2">
                <Mail className="h-5 w-5" />
                SMTP Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300 dark:text-slate-300 text-slate-600">SMTP Server</Label>
                <Input 
                  className="bg-slate-800 dark:bg-slate-800 bg-white border-slate-600 dark:border-slate-600 border-slate-300 text-white dark:text-white text-slate-900" 
                  placeholder="smtp.example.com"
                  value={smtpSettings.host}
                  onChange={(e) => setSmtpSettings({...smtpSettings, host: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300 dark:text-slate-300 text-slate-600">Port</Label>
                <Input 
                  className="bg-slate-800 dark:bg-slate-800 bg-white border-slate-600 dark:border-slate-600 border-slate-300 text-white dark:text-white text-slate-900" 
                  placeholder="587"
                  type="number"
                  value={smtpSettings.port}
                  onChange={(e) => setSmtpSettings({...smtpSettings, port: parseInt(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300 dark:text-slate-300 text-slate-600">Username</Label>
                <Input 
                  className="bg-slate-800 dark:bg-slate-800 bg-white border-slate-600 dark:border-slate-600 border-slate-300 text-white dark:text-white text-slate-900" 
                  placeholder="user@example.com"
                  value={smtpSettings.username}
                  onChange={(e) => setSmtpSettings({...smtpSettings, username: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300 dark:text-slate-300 text-slate-600">Password</Label>
                <Input 
                  type="password" 
                  className="bg-slate-800 dark:bg-slate-800 bg-white border-slate-600 dark:border-slate-600 border-slate-300 text-white dark:text-white text-slate-900"
                  value={smtpSettings.password}
                  onChange={(e) => setSmtpSettings({...smtpSettings, password: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300 dark:text-slate-300 text-slate-600">Sender Email</Label>
                <Input 
                  className="bg-slate-800 dark:bg-slate-800 bg-white border-slate-600 dark:border-slate-600 border-slate-300 text-white dark:text-white text-slate-900" 
                  placeholder="noreply@company.com"
                  value={smtpSettings.sender}
                  onChange={(e) => setSmtpSettings({...smtpSettings, sender: e.target.value})}
                />
              </div>
              <Button 
                className="w-full bg-[#0088a9] hover:bg-[#007b98] text-white font-medium py-2 px-4 rounded-[8px] shadow-md transition-all duration-200"
                onClick={handleSaveSMTPSettings}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Save SMTP Settings
              </Button>
            </CardContent>
          </Card>

          {/* SMTP Profiles */}
          <Card className="bg-slate-900/95 dark:bg-slate-900/95 bg-white/95 border-slate-700 dark:border-slate-700 border-slate-300">
            <CardHeader>
              <CardTitle className="text-cyan-300 dark:text-cyan-300 text-slate-700 flex items-center gap-2">
                <Mail className="h-5 w-5" />
                SMTP Profiles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Profile */}
              <div className="space-y-2">
                <Label className="text-slate-300 dark:text-slate-300 text-slate-600">Profile Name</Label>
                <Input 
                  className="bg-slate-800 dark:bg-slate-800 bg-white border-slate-600 dark:border-slate-600 border-slate-300 text-white dark:text-white text-slate-900" 
                  placeholder="Profile Name"
                  value={newProfile.name}
                  onChange={(e) => setNewProfile({...newProfile, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300 dark:text-slate-300 text-slate-600">Host</Label>
                <Input 
                  className="bg-slate-800 dark:bg-slate-800 bg-white border-slate-600 dark:border-slate-600 border-slate-300 text-white dark:text-white text-slate-900" 
                  placeholder="smtp.example.com"
                  value={newProfile.host}
                  onChange={(e) => setNewProfile({...newProfile, host: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300 dark:text-slate-300 text-slate-600">Port</Label>
                <Input 
                  className="bg-slate-800 dark:bg-slate-800 bg-white border-slate-600 dark:border-slate-600 border-slate-300 text-white dark:text-white text-slate-900" 
                  placeholder="587"
                  type="number"
                  value={newProfile.port}
                  onChange={(e) => setNewProfile({...newProfile, port: parseInt(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300 dark:text-slate-300 text-slate-600">Username</Label>
                <Input 
                  className="bg-slate-800 dark:bg-slate-800 bg-white border-slate-600 dark:border-slate-600 border-slate-300 text-white dark:text-white text-slate-900" 
                  placeholder="user@example.com"
                  value={newProfile.username}
                  onChange={(e) => setNewProfile({...newProfile, username: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300 dark:text-slate-300 text-slate-600">Password</Label>
                <Input 
                  type="password" 
                  className="bg-slate-800 dark:bg-slate-800 bg-white border-slate-600 dark:border-slate-600 border-slate-300 text-white dark:text-white text-slate-900"
                  value={newProfile.password}
                  onChange={(e) => setNewProfile({...newProfile, password: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300 dark:text-slate-300 text-slate-600">Sender Email</Label>
                <Input 
                  className="bg-slate-800 dark:bg-slate-800 bg-white border-slate-600 dark:border-slate-600 border-slate-300 text-white dark:text-white text-slate-900" 
                  placeholder="noreply@company.com"
                  value={newProfile.sender}
                  onChange={(e) => setNewProfile({...newProfile, sender: e.target.value})}
                />
              </div>
              <Button 
                className="w-full bg-[#0088a9] hover:bg-[#007b98] text-white font-medium py-2 px-4 rounded-[8px] shadow-md transition-all duration-200"
                onClick={handleAddSMTPProfile}
                disabled={loading || !newProfile.name}
              >
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Add SMTP Profile
              </Button>

              {/* Existing Profiles */}
              {smtpProfiles.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-slate-300 dark:text-slate-300 text-slate-600">Existing Profiles</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {smtpProfiles.map((profile, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-slate-800 rounded">
                        <span className="text-white text-sm">{profile.name}</span>
                        <Button
                          size="sm"
                          variant={activeProfile === profile.name ? "default" : "outline"}
                          onClick={() => handleActivateProfile(profile.name)}
                          disabled={loading}
                        >
                          {activeProfile === profile.name ? 'Active' : 'Activate'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Report Scheduler */}
        <Card className="bg-slate-900/95 dark:bg-slate-900/95 bg-white/95 border-slate-700 dark:border-slate-700 border-slate-300">
          <CardHeader>
            <CardTitle className="text-cyan-300 dark:text-cyan-300 text-slate-700 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Report Scheduler
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300 dark:text-slate-300 text-slate-600">Report Type</Label>
              <select 
                className="w-full bg-slate-800 dark:bg-slate-800 bg-white border border-slate-600 dark:border-slate-600 border-slate-300 text-white dark:text-white text-slate-900 rounded-md px-3 py-2"
                value={reportScheduler.reportType}
                onChange={(e) => setReportScheduler({...reportScheduler, reportType: e.target.value})}
              >
                <option>Daily Production Report</option>
                <option>Weekly Summary</option>
                <option>Monthly Analysis</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300 dark:text-slate-300 text-slate-600">Schedule</Label>
              <select 
                className="w-full bg-slate-800 dark:bg-slate-800 bg-white border border-slate-600 dark:border-slate-600 border-slate-300 text-white dark:text-white text-slate-900 rounded-md px-3 py-2"
                value={reportScheduler.schedule}
                onChange={(e) => setReportScheduler({...reportScheduler, schedule: e.target.value})}
              >
                <option>Daily at 6:00 AM</option>
                <option>Weekly on Monday</option>
                <option>Monthly on 1st</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300 dark:text-slate-300 text-slate-600">Recipients</Label>
              <Input 
                className="bg-slate-800 dark:bg-slate-800 bg-white border-slate-600 dark:border-slate-600 border-slate-300 text-white dark:text-white text-slate-900" 
                placeholder="admin@company.com"
                value={reportScheduler.recipients}
                onChange={(e) => setReportScheduler({...reportScheduler, recipients: e.target.value})}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                className="bg-[#0088a9] hover:bg-[#007b98] text-white font-medium py-2 px-4 rounded-[8px] shadow-md transition-all duration-200"
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Schedule Report
              </Button>
              <Button 
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                onClick={handleSendTestEmail}
                disabled={loading || !reportScheduler.recipients}
              >
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Send Test Email
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="bg-slate-900/95 dark:bg-slate-900/95 bg-white/95 border-slate-700 dark:border-slate-700 border-slate-300">
          <CardHeader>
            <CardTitle className="text-cyan-300 dark:text-cyan-300 text-slate-700 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security & Access Control
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300 dark:text-slate-300 text-slate-600">Session Timeout (minutes)</Label>
                <Input 
                  className="bg-slate-800 dark:bg-slate-800 bg-white border-slate-600 dark:border-slate-600 border-slate-300 text-white dark:text-white text-slate-900" 
                  defaultValue="30"
                  type="number"
                  value={securitySettings.sessionTimeout}
                  onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeout: parseInt(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300 dark:text-slate-300 text-slate-600">Password Policy</Label>
                <select 
                  className="w-full bg-slate-800 dark:bg-slate-800 bg-white border border-slate-600 dark:border-slate-600 border-slate-300 text-white dark:text-white text-slate-900 rounded-md px-3 py-2"
                  value={securitySettings.passwordPolicy}
                  onChange={(e) => setSecuritySettings({...securitySettings, passwordPolicy: e.target.value})}
                >
                  <option>Standard</option>
                  <option>High Security</option>
                  <option>Enterprise</option>
                </select>
              </div>
            </div>
            <Button 
              className="bg-[#0088a9] hover:bg-[#007b98] text-white font-medium py-2 px-4 rounded-[8px] shadow-md transition-all duration-200"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Update Security Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </WaterSystemLayout>
  );
}