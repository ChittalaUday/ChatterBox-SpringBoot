"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Upload, X } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import ChatMessageService from "@/services/chat-message.service"

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [mobile, setMobile] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let profileImageUrl = null;

      // Upload profile image if selected
      if (profileImage) {
        setUploading(true);
        try {
          const fileData = await ChatMessageService.uploadFile(profileImage);
          profileImageUrl = fileData.fileUrl;
        } catch (uploadError) {
          setError("Failed to upload profile image. Please try again.");
          setLoading(false);
          setUploading(false);
          return;
        } finally {
          setUploading(false);
        }
      }

      await register({
        name,
        email,
        password,
        gender,
        dob,
        role: "USER",
        mobile: mobile || undefined,
        profileImageUrl: profileImageUrl || undefined
      });

      router.push("/chat");
    } catch (err) {
      // Type guard to check if err is an Error object
      if (err instanceof Error) {
        setError(err.message || "Registration failed. Please try again.");
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card {...props} className="border-2 shadow-xl bg-gradient-to-br from-background via-background to-primary/5">
      <CardHeader className="space-y-1 pb-6">
        <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Create an account
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            {error && (
              <div className="text-red-500 text-sm mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 col-span-2">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Profile Image Upload */}
                <Field>
                  <FieldLabel>Profile Picture (Optional)</FieldLabel>
                  <div className="flex flex-col items-center flex-row  gap-4">
                    <div className="relative">
                      <Avatar className="h-24 w-24 border-4 border-primary/20 ring-4 ring-primary/10">
                        <AvatarImage
                          src={profileImageUrl || `https://api.dicebear.com/6.x/initials/svg?seed=${name || 'User'}`}
                          alt="Profile"
                        />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground text-2xl font-bold">
                          {name ? name.charAt(0).toUpperCase() : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      {profileImageUrl && (
                        <button
                          type="button"
                          onClick={handleImageRemove}
                          className="absolute -top-2 -right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="w-full">
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
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {profileImage ? "Change Image" : "Upload Image"}
                      </Button>
                      <FieldDescription className="mt-2 text-center">
                        Upload a profile picture (max 5MB, JPG/PNG)
                      </FieldDescription>
                    </div>
                  </div>
                </Field>

                <Field>
                  <FieldLabel htmlFor="name">Full Name</FieldLabel>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <FieldDescription>
                    Must be at least 8 characters long.
                  </FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="confirm-password">
                    Confirm Password
                  </FieldLabel>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <FieldDescription>Please confirm your password.</FieldDescription>
                </Field>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <Field>
                  <FieldLabel htmlFor="gender">Gender</FieldLabel>
                  <Select value={gender} onValueChange={setGender} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel htmlFor="dob">Date of Birth</FieldLabel>
                  <Input
                    id="dob"
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="mobile">Mobile (Optional)</FieldLabel>
                  <Input
                    id="mobile"
                    type="tel"
                    placeholder="1234567890"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                  />
                  <FieldDescription>
                    Optional mobile number for account recovery.
                  </FieldDescription>
                </Field>

                <div className="pt-4 space-y-4">
                  <Button
                    type="submit"
                    disabled={loading || uploading}
                    className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {uploading ? "Uploading Image..." : loading ? "Creating Account..." : "Create Account"}
                  </Button>

                  <FieldDescription className="text-center mt-4">
                    Already have an account?{" "}
                    <a href="/login" className="text-primary hover:underline font-medium">
                      Sign in
                    </a>
                  </FieldDescription>
                </div>
              </div>
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}