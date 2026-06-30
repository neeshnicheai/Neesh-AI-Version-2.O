import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
    ArrowLeft,
    Camera,
    Edit3,
    LogOut,
    Loader2,
    Save,
    X,
    User,
    Briefcase,
    MapPin,
    Phone,
    Mail,
    Calendar,
    FileText,
    Upload,
    Crown,
    Palette,
    Image as ImageIcon,
    Type,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, type UpdateProfileData } from "@/hooks/useProfile";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { toast } from "sonner";
import { NeeshLogo } from "@/components/NeeshLogo";

const ProfileSettings = () => {
    const { user, loading: authLoading, signOut } = useAuth();
    const { profile, loading: profileLoading, saving, updateProfile } = useProfile();
    const { subscription, isPro, updateBranding, loading: subLoading } = useSubscription();
    const navigate = useNavigate();

    const [isEditing, setIsEditing] = useState(false);
    const profileImageInputRef = useRef<HTMLInputElement>(null);
    const [brandingLogoUrl, setBrandingLogoUrl] = useState("");
    const [brandingText, setBrandingText] = useState("");
    const [savingBranding, setSavingBranding] = useState(false);
    const [formData, setFormData] = useState<UpdateProfileData>({
        name: "",
        occupation: "",
        bio: "",
        phone: "",
        location: "",
        profileImageUrl: "",
    });

    // Redirect if not logged in
    useEffect(() => {
        if (!authLoading && !user) {
            navigate("/login");
        }
    }, [user, authLoading, navigate]);

    // Populate form when profile loads
    useEffect(() => {
        if (profile) {
            setFormData({
                name: profile.name || "",
                occupation: profile.occupation || "",
                bio: profile.bio || "",
                phone: profile.phone || "",
                location: profile.location || "",
                profileImageUrl: profile.profileImageUrl || "",
            });
        }
    }, [profile]);

    // Populate branding form from subscription
    useEffect(() => {
        if (subscription) {
            setBrandingLogoUrl(subscription.customLogoUrl || "");
            setBrandingText(subscription.customBrandingText || "");
        }
    }, [subscription]);

    const handleSave = async () => {
        const result = await updateProfile(formData);
        if (result.success) {
            toast.success("Profile updated successfully!");
            setIsEditing(false);
        } else {
            toast.error("Failed to update profile. Please try again.");
        }
    };

    const handleCancel = () => {
        if (profile) {
            setFormData({
                name: profile.name || "",
                occupation: profile.occupation || "",
                bio: profile.bio || "",
                phone: profile.phone || "",
                location: profile.location || "",
                profileImageUrl: profile.profileImageUrl || "",
            });
        }
        setIsEditing(false);
    };

    const handleSignOut = async () => {
        const { error } = await signOut();
        if (error) {
            toast.error("Failed to sign out");
        } else {
            toast.success("Signed out successfully");
            navigate("/login");
        }
    };

    const handleSaveBranding = async () => {
        setSavingBranding(true);
        try {
            const success = await updateBranding(brandingLogoUrl || undefined, brandingText || undefined);
            if (success) {
                toast.success("Branding updated! Your published blogs will reflect these changes.");
            } else {
                toast.error("Failed to update branding.");
            }
        } catch {
            toast.error("Failed to update branding.");
        } finally {
            setSavingBranding(false);
        }
    };

    const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Please upload a valid image file.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image too large. Please upload under 5MB.");
            return;
        }

        try {
            const { compressImage } = await import("@/lib/imageUtils");
            const compressed = await compressImage(file);

            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = () => reject(new Error("Failed to read image"));
                reader.readAsDataURL(compressed);
            });

            setFormData({ ...formData, profileImageUrl: base64 });
            toast.success("Image uploaded! Click Save to apply.");
        } catch (err) {
            console.error("Profile image upload failed:", err);
            toast.error("Failed to process image.");
        }

        // Reset input so same file can be re-uploaded
        if (profileImageInputRef.current) {
            profileImageInputRef.current.value = "";
        }
    };

    const loading = authLoading || profileLoading;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    const displayName = profile?.name || user.email?.split("@")[0] || "User";
    const initials = displayName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    const memberSince = profile?.createdAt
        ? new Date(profile.createdAt).toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
        })
        : "";

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="bg-card border-b border-border/50 sticky top-0 z-40 shadow-sm">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate("/dashboard")}
                                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                            </button>
                            <div>
                                <h1 className="font-display text-lg font-bold text-foreground">
                                    Profile Settings
                                </h1>
                                <p className="text-xs text-muted-foreground">
                                    Manage your account information
                                </p>
                            </div>
                        </div>
                        <NeeshLogo size="md" />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-6 py-8 max-w-3xl">
                {/* Profile Card */}
                <div className="bg-card border border-border/30 rounded-lg overflow-hidden shadow-sm mb-6">
                    {/* Cover gradient */}
                    <div className="h-32 bg-gradient-to-r from-primary/20 via-accent/10 to-primary/5 relative" />

                    {/* Avatar + Basic Info */}
                    <div className="px-6 pb-6 -mt-16 relative">
                        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                            {/* Avatar */}
                            <div className="relative group">
                                <div className="w-28 h-28 rounded-full border-4 border-card bg-muted flex items-center justify-center overflow-hidden shadow-md">
                                    {profile?.profileImageUrl || formData.profileImageUrl ? (
                                        <img
                                            src={profile?.profileImageUrl || formData.profileImageUrl}
                                            alt={displayName}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-3xl font-bold text-primary/60">
                                            {initials}
                                        </span>
                                    )}
                                </div>
                                {isEditing && (
                                    <>
                                        <input
                                            ref={profileImageInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleProfileImageUpload}
                                        />
                                        <button
                                            onClick={() => profileImageInputRef.current?.click()}
                                            className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
                                        >
                                            <Camera className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Name & Role */}
                            <div className="flex-1 min-w-0 pb-1">
                                <h2 className="text-xl font-bold text-foreground truncate">
                                    {displayName}
                                </h2>
                                {profile?.occupation && (
                                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                        <Briefcase className="w-3.5 h-3.5" />
                                        {profile.occupation}
                                    </p>
                                )}
                                {profile?.location && (
                                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                        <MapPin className="w-3.5 h-3.5" />
                                        {profile.location}
                                    </p>
                                )}
                            </div>

                            {/* Edit/Save Buttons */}
                            <div className="flex items-center gap-2">
                                {isEditing ? (
                                    <>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleCancel}
                                            disabled={saving}
                                        >
                                            <X className="w-4 h-4 mr-1" />
                                            Cancel
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={handleSave}
                                            disabled={saving}
                                        >
                                            {saving ? (
                                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                            ) : (
                                                <Save className="w-4 h-4 mr-1" />
                                            )}
                                            {saving ? "Saving..." : "Save Changes"}
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsEditing(true)}
                                    >
                                        <Edit3 className="w-4 h-4 mr-1" />
                                        Edit Profile
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Details Sections */}
                <div className="bg-card border border-border/30 rounded-lg shadow-sm overflow-hidden">
                    {/* Personal Information */}
                    <div className="p-6">
                        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
                            Personal Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Full Name */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5" />
                                    Full Name
                                </Label>
                                {isEditing ? (
                                    <Input
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({ ...formData, name: e.target.value })
                                        }
                                        placeholder="Enter your full name"
                                    />
                                ) : (
                                    <p className="text-sm text-foreground py-2 px-3 bg-muted/50 rounded min-h-[40px] flex items-center">
                                        {profile?.name || "—"}
                                    </p>
                                )}
                            </div>

                            {/* Email (read-only) */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                    <Mail className="w-3.5 h-3.5" />
                                    Email Address
                                </Label>
                                <p className="text-sm text-foreground py-2 px-3 bg-muted/50 rounded min-h-[40px] flex items-center">
                                    {user.email}
                                </p>
                            </div>

                            {/* Occupation */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                    <Briefcase className="w-3.5 h-3.5" />
                                    Occupation
                                </Label>
                                {isEditing ? (
                                    <Input
                                        value={formData.occupation}
                                        onChange={(e) =>
                                            setFormData({ ...formData, occupation: e.target.value })
                                        }
                                        placeholder="e.g. Product Designer"
                                    />
                                ) : (
                                    <p className="text-sm text-foreground py-2 px-3 bg-muted/50 rounded min-h-[40px] flex items-center">
                                        {profile?.occupation || "—"}
                                    </p>
                                )}
                            </div>

                            {/* Location */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5" />
                                    Location
                                </Label>
                                {isEditing ? (
                                    <Input
                                        value={formData.location}
                                        onChange={(e) =>
                                            setFormData({ ...formData, location: e.target.value })
                                        }
                                        placeholder="e.g. San Francisco, CA"
                                    />
                                ) : (
                                    <p className="text-sm text-foreground py-2 px-3 bg-muted/50 rounded min-h-[40px] flex items-center">
                                        {profile?.location || "—"}
                                    </p>
                                )}
                            </div>

                            {/* Phone */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                    <Phone className="w-3.5 h-3.5" />
                                    Phone Number
                                </Label>
                                {isEditing ? (
                                    <Input
                                        value={formData.phone}
                                        onChange={(e) =>
                                            setFormData({ ...formData, phone: e.target.value })
                                        }
                                        placeholder="e.g. +1 (555) 123-4567"
                                    />
                                ) : (
                                    <p className="text-sm text-foreground py-2 px-3 bg-muted/50 rounded min-h-[40px] flex items-center">
                                        {profile?.phone || "—"}
                                    </p>
                                )}
                            </div>

                            {/* Member Since (read-only) */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5" />
                                    Member Since
                                </Label>
                                <p className="text-sm text-foreground py-2 px-3 bg-muted/50 rounded min-h-[40px] flex items-center">
                                    {memberSince || "—"}
                                </p>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Bio */}
                    <div className="p-6">
                        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
                            About
                        </h3>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5" />
                                Bio
                            </Label>
                            {isEditing ? (
                                <Textarea
                                    value={formData.bio}
                                    onChange={(e) =>
                                        setFormData({ ...formData, bio: e.target.value })
                                    }
                                    placeholder="Tell us a little about yourself..."
                                    rows={4}
                                    className="resize-none"
                                />
                            ) : (
                                <p className="text-sm text-foreground py-2 px-3 bg-muted/50 rounded min-h-[80px]">
                                    {profile?.bio || "No bio added yet."}
                                </p>
                            )}
                        </div>
                    </div>

                    {isEditing && (
                        <>
                            <Separator />

                            {/* Profile Image Upload */}
                            <div className="p-6">
                                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
                                    Profile Image
                                </h3>
                                <div className="space-y-3">
                                    <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                        <Camera className="w-3.5 h-3.5" />
                                        Upload Image
                                    </Label>
                                    <div
                                        onClick={() => profileImageInputRef.current?.click()}
                                        className="border-2 border-dashed border-border/50 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                                    >
                                        <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                                        <p className="text-sm text-muted-foreground">
                                            Click to upload a profile image
                                        </p>
                                        <p className="text-xs text-muted-foreground/70 mt-1">
                                            PNG, JPG, GIF up to 5MB
                                        </p>
                                    </div>
                                    {formData.profileImageUrl && (
                                        <div className="flex items-center gap-2">
                                            <div className="w-10 h-10 rounded-full overflow-hidden border border-border">
                                                <img
                                                    src={formData.profileImageUrl}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <span className="text-xs text-muted-foreground">Current image</span>
                                            <button
                                                onClick={() => setFormData({ ...formData, profileImageUrl: "" })}
                                                className="ml-auto text-xs text-destructive hover:underline"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Pro Branding Section */}
                {isPro && (
                    <div className="mt-6 bg-card border border-blue-500/20 rounded-lg shadow-sm overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
                                    <Crown className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                                        White-Label Branding
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        Replace &quot;Powered by Neesh AI&quot; on your published blogs
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                        <ImageIcon className="w-3.5 h-3.5" />
                                        Custom Logo URL
                                    </Label>
                                    <Input
                                        value={brandingLogoUrl}
                                        onChange={(e) => setBrandingLogoUrl(e.target.value)}
                                        placeholder="https://example.com/your-logo.png"
                                    />
                                    {brandingLogoUrl && (
                                        <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Preview</p>
                                            <img src={brandingLogoUrl} alt="Logo preview" className="h-8 w-auto object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                        <Type className="w-3.5 h-3.5" />
                                        Custom Branding Text
                                    </Label>
                                    <Input
                                        value={brandingText}
                                        onChange={(e) => setBrandingText(e.target.value)}
                                        placeholder="e.g. Powered by Your Brand"
                                    />
                                </div>
                            </div>

                            {/* Branding Preview */}
                            <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-border/30">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">Blog Footer Preview</p>
                                <div className="flex items-center justify-center gap-3 py-3">
                                    {brandingLogoUrl && (
                                        <img src={brandingLogoUrl} alt="Brand" className="h-5 w-auto object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                    )}
                                    {brandingText ? (
                                        <span className="text-sm text-muted-foreground font-medium">{brandingText}</span>
                                    ) : !brandingLogoUrl ? (
                                        <div className="flex items-center gap-2 opacity-60">
                                            <span className="text-xs text-muted-foreground">Powered by</span>
                                            <NeeshLogo size="sm" />
                                        </div>
                                    ) : null}
                                </div>
                            </div>

                            <Button
                                className="mt-4 w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                                onClick={handleSaveBranding}
                                disabled={savingBranding}
                            >
                                {savingBranding ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Palette className="w-4 h-4 mr-2" />
                                )}
                                {savingBranding ? "Saving..." : "Save Branding"}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Danger Zone — Sign Out */}
                <div className="mt-6 bg-card border border-destructive/20 rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-semibold text-foreground">
                                Sign Out
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Sign out of your account on this device
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                            onClick={handleSignOut}
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Sign Out
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProfileSettings;
