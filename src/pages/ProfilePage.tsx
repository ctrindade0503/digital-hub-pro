import { useNavigate } from "react-router-dom";
import { LogOut, User, Package, Settings, Activity, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import ProfileInfoTab from "@/components/profile/ProfileInfoTab";
import MyProductsTab from "@/components/profile/MyProductsTab";
import PreferencesTab from "@/components/profile/PreferencesTab";
import ActivityTab from "@/components/profile/ActivityTab";
import CommunitySettingsTab from "@/components/profile/CommunitySettingsTab";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  return (
    <div className="pb-32 min-h-screen bg-background">
      <header className="px-4 py-3 bg-card border-b border-border flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">Perfil</h1>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-destructive hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          Sair
        </Button>
      </header>

      <div className="px-4 mt-4">
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="w-full grid grid-cols-5 h-auto p-1">
            <TabsTrigger value="info" className="flex flex-col gap-0.5 py-2 px-1 text-xs">
              <User className="w-4 h-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="products" className="flex flex-col gap-0.5 py-2 px-1 text-xs">
              <Package className="w-4 h-4" />
              Produtos
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex flex-col gap-0.5 py-2 px-1 text-xs">
              <Activity className="w-4 h-4" />
              Atividade
            </TabsTrigger>
            <TabsTrigger value="community" className="flex flex-col gap-0.5 py-2 px-1 text-xs">
              <Users className="w-4 h-4" />
              Social
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex flex-col gap-0.5 py-2 px-1 text-xs">
              <Settings className="w-4 h-4" />
              Config
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <ProfileInfoTab />
          </TabsContent>
          <TabsContent value="products">
            <MyProductsTab />
          </TabsContent>
          <TabsContent value="activity">
            <ActivityTab />
          </TabsContent>
          <TabsContent value="community">
            <CommunitySettingsTab />
          </TabsContent>
          <TabsContent value="preferences">
            <PreferencesTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProfilePage;
