"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { AppLayout } from "@/components/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Camera, Upload, X, Save, Lock, User, Mail, Phone, Calendar, Edit2, Check, Loader2 } from "lucide-react";
import ChatMessageService from "@/services/chat-message.service";

function SettingsContent() {
  const { user, updateUser, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "password">("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form states
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [mobile, setMobile] = useState("");
  const [bio, setBio] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setGender(user.gender || "");
      setDob(user.dob || "");
      setMobile(user.mobile || "");
      setBio(user.bio || "");
      if (user.profileImageUrl) {
        setProfileImageUrl(user.profileImageUrl.startsWith('http')
          ? user.profileImageUrl
          : `http://localhost:8083${user.profileImageUrl}`);
      }
    }
  }, [user]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError("Please select an image file");
        return;
      }
      setProfileImage(file);
      setProfileImageUrl(URL.createObjectURL(file));
      setError("");
    }
  };

  const handleImageRemove = () => {
    setProfileImage(null);
    setProfileImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      let profileImageUrlToSave = user?.profileImageUrl;

      // Upload new profile image if selected
      if (profileImage) {
        setUploading(true);
        try {
          const fileData = await ChatMessageService.uploadFile(profileImage);
          profileImageUrlToSave = fileData.fileUrl;
        } catch (uploadError) {
          setError("Failed to upload profile image. Please try again.");
          setLoading(false);
          setUploading(false);
          return;
        } finally {
          setUploading(false);
        }
      }

      // Update user profile
      await updateUser({
        name,
        gender,
        dob,
        mobile: mobile || undefined,
        bio: bio || undefined,
        profileImageUrl: profileImageUrlToSave || undefined
      });

      await refreshUser();
      setIsEditing(false);
      setProfileImage(null);
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8083/api/users/me/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to change password");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsChangingPassword(false);
      setSuccess("Password changed successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const getProfileImage = () => {
    if (profileImageUrl) {
      return profileImageUrl;
    }
    if (user?.profileImageUrl) {
      return user.profileImageUrl.startsWith('http')
        ? user.profileImageUrl
        : `http://localhost:8083${user.profileImageUrl}`;
    }
    return `https://api.dicebear.com/6.x/initials/svg?seed=${user?.name || 'User'}`;
  };

  return (
    <>
      <div className="flex h-full overflow-hidden">
        {/* Sidebar */}
        <Sidebar className="border-r w-64 shrink-0">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Settings</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveTab("profile")}
                      isActive={activeTab === "profile"}
                      className="w-full justify-start"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveTab("password")}
                      isActive={activeTab === "password"}
                      className="w-full justify-start"
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Change Password
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        {/* Main Content */}
        <div className="flex-1 overflow-auto bg-gradient-to-br from-background via-background to-primary/5">
          <div className="container mx-auto py-8 px-6 max-w-4xl">
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                Settings
              </h1>
              <p className="text-muted-foreground text-lg">
                Manage your account settings and preferences
              </p>
            </div>

            {(error || success) && (
              <div className={`mb-6 p-4 rounded-lg ${error
                ? "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
                : "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
                }`}>
                {error || success}
              </div>
            )}

            {activeTab === "profile" && (
              <Card className="border-2 shadow-xl bg-gradient-to-br from-card via-card to-primary/5">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        <User className="h-6 w-6 text-primary" />
                        Profile Information
                      </CardTitle>
                      <CardDescription className="text-base mt-1">
                        Your personal information and account details
                      </CardDescription>
                    </div>
                    {!isEditing && (
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(true)}
                        className="gap-2"
                      >
                        <Edit2 className="h-4 w-4" />
                        Edit Profile
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Profile Image */}
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <Avatar className="h-32 w-32 border-4 border-primary/20 ring-4 ring-primary/10 shadow-xl">
                        <AvatarImage src={getProfileImage()} alt={user?.name} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground text-3xl font-bold">
                          {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute bottom-0 right-0 p-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg transition-all hover:scale-110"
                        >
                          <Camera className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                    <div className="flex-1">
                      {isEditing && (
                        <>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            className="mb-2"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {profileImage ? "Change Image" : "Upload Image"}
                          </Button>
                          {profileImageUrl && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={handleImageRemove}
                              className="ml-2 text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            Upload a profile picture (max 5MB, JPG/PNG)
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Profile Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        Email
                      </Label>
                      {isEditing ? (
                        <Input value={user?.email || ""} disabled className="bg-muted" />
                      ) : (
                        <p className="text-sm font-medium">{user?.email || "Not set"}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        Name
                      </Label>
                      {isEditing ? (
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your name"
                        />
                      ) : (
                        <p className="text-sm font-medium">{user?.name || "Not set"}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        Gender
                      </Label>
                      {isEditing ? (
                        <Select value={gender} onValueChange={setGender}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MALE">Male</SelectItem>
                            <SelectItem value="FEMALE">Female</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm font-medium">{user?.gender || "Not specified"}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        Date of Birth
                      </Label>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={dob}
                          onChange={(e) => setDob(e.target.value)}
                        />
                      ) : (
                        <p className="text-sm font-medium">{user?.dob || "Not specified"}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        Mobile
                      </Label>
                      {isEditing ? (
                        <Input
                          type="tel"
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value)}
                          placeholder="1234567890"
                        />
                      ) : (
                        <p className="text-sm font-medium">{user?.mobile || "Not set"}</p>
                      )}
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Bio</Label>
                      {isEditing ? (
                        <Textarea
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="Tell us about yourself..."
                          rows={3}
                          maxLength={500}
                        />
                      ) : (
                        <p className="text-sm font-medium">{user?.bio || "No bio yet"}</p>
                      )}
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex gap-3 pt-4 border-t">
                      <Button
                        onClick={handleSaveProfile}
                        disabled={loading || uploading}
                        className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : loading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setProfileImage(null);
                          setProfileImageUrl(null);
                          if (user) {
                            setName(user.name || "");
                            setGender(user.gender || "");
                            setDob(user.dob || "");
                            setMobile(user.mobile || "");
                            setBio(user.bio || "");
                            if (user.profileImageUrl) {
                              setProfileImageUrl(user.profileImageUrl.startsWith('http')
                                ? user.profileImageUrl
                                : `http://localhost:8083${user.profileImageUrl}`);
                            }
                          }
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "password" && (
              <Card className="border-2 shadow-xl bg-gradient-to-br from-card via-card to-primary/5">
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Lock className="h-6 w-6 text-primary" />
                    Security Settings
                  </CardTitle>
                  <CardDescription className="text-base mt-1">
                    Change your password to keep your account secure
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!isChangingPassword ? (
                    <Button
                      variant="outline"
                      onClick={() => setIsChangingPassword(true)}
                      className="w-full"
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Change Password
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Current Password</Label>
                        <Input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter current password"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>New Password</Label>
                        <Input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Confirm New Password</Label>
                        <Input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                        />
                      </div>
                      <div className="flex gap-3 pt-2">
                        <Button
                          onClick={handleChangePassword}
                          disabled={loading}
                          className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Changing...
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Update Password
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsChangingPassword(false);
                            setCurrentPassword("");
                            setNewPassword("");
                            setConfirmPassword("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
