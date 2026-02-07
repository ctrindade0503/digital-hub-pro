import { useState, useRef } from "react";
import { Camera, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useProfile } from "@/hooks/useProfile";

const ProfileInfoTab = () => {
  const { profile, isLoading, updateProfile, uploadAvatar } = useProfile();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<{
    name: string;
    phone: string;
    nickname: string;
    bio: string;
  } | null>(null);

  const currentForm = form ?? {
    name: profile?.name || "",
    phone: (profile as any)?.phone || "",
    nickname: (profile as any)?.nickname || "",
    bio: (profile as any)?.bio || "",
  };

  const handleSave = () => {
    updateProfile.mutate({
      name: currentForm.name,
      phone: currentForm.phone,
      nickname: currentForm.nickname,
      bio: currentForm.bio,
    } as any);
    setForm(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadAvatar.mutate(file);
  };

  if (isLoading) return <div className="p-4 text-center text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <Avatar className="w-20 h-20">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
              {(profile?.name?.[0] || profile?.email?.[0] || "U").toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1.5"
          >
            <Camera className="w-4 h-4" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>
        <p className="text-sm text-muted-foreground">{profile?.email}</p>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Nome</Label>
          <Input
            value={currentForm.name}
            onChange={(e) => setForm({ ...currentForm, name: e.target.value })}
            placeholder="Seu nome completo"
          />
        </div>
        <div className="space-y-2">
          <Label>Telefone</Label>
          <Input
            value={currentForm.phone}
            onChange={(e) => setForm({ ...currentForm, phone: e.target.value })}
            placeholder="(00) 00000-0000"
          />
        </div>
        <div className="space-y-2">
          <Label>Apelido (exibido na comunidade)</Label>
          <Input
            value={currentForm.nickname}
            onChange={(e) => setForm({ ...currentForm, nickname: e.target.value })}
            placeholder="Como quer ser chamado"
          />
        </div>
        <div className="space-y-2">
          <Label>Sobre mim</Label>
          <Textarea
            value={currentForm.bio}
            onChange={(e) => setForm({ ...currentForm, bio: e.target.value })}
            placeholder="Uma breve descrição sobre você"
            rows={3}
          />
        </div>
      </div>

      <Button onClick={handleSave} disabled={updateProfile.isPending} className="w-full gap-2">
        <Save className="w-4 h-4" />
        {updateProfile.isPending ? "Salvando..." : "Salvar alterações"}
      </Button>
    </div>
  );
};

export default ProfileInfoTab;
