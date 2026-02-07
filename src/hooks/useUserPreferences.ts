import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface UserPreferences {
  id: string;
  user_id: string;
  language: string;
  theme: string;
  notifications_enabled: boolean;
  email_notifications: boolean;
}

export const useUserPreferences = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["user_preferences", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("user_preferences" as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        // Create default preferences
        const { data: newData, error: insertError } = await supabase
          .from("user_preferences" as any)
          .insert({ user_id: user.id } as any)
          .select()
          .single();
        if (insertError) throw insertError;
        return newData as unknown as UserPreferences;
      }
      return data as unknown as UserPreferences;
    },
    enabled: !!user,
  });

  const updatePreferences = useMutation({
    mutationFn: async (updates: Partial<UserPreferences>) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("user_preferences" as any)
        .update(updates as any)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_preferences", user?.id] });
      toast({ title: "Preferências atualizadas!" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar preferências", variant: "destructive" });
    },
  });

  return { preferences: query.data, isLoading: query.isLoading, updatePreferences };
};
