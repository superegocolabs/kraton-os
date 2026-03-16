import { motion } from "framer-motion";
import { Users, Mail, Building2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Client = Tables<"clients">;

interface ClientListProps {
  clients: Client[];
  isLoading: boolean;
  onSelect: (id: string) => void;
}

const statusColors: Record<string, string> = {
  lead: "bg-primary/20 text-primary",
  active: "bg-green-500/20 text-green-400",
  inactive: "bg-muted text-muted-foreground",
  archived: "bg-muted text-muted-foreground",
};

export function ClientList({ clients, isLoading, onSelect }: ClientListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-lg bg-card border border-border animate-pulse" />
        ))}
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="text-center py-16">
        <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground font-body">No clients yet. Add your first client to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {clients.map((client, i) => (
        <motion.button
          key={client.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: i * 0.03 }}
          onClick={() => onSelect(client.id)}
          className="w-full text-left bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors duration-150 group"
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h3 className="text-sm font-display font-semibold text-foreground group-hover:text-primary transition-colors duration-150 truncate">
                {client.name}
              </h3>
              <div className="flex items-center gap-4 mt-1.5">
                {client.email && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground font-body truncate">
                    <Mail className="h-3 w-3 shrink-0" /> {client.email}
                  </span>
                )}
                {client.company && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground font-body truncate">
                    <Building2 className="h-3 w-3 shrink-0" /> {client.company}
                  </span>
                )}
              </div>
            </div>
            <span className={`text-[10px] uppercase tracking-wider font-body font-medium px-2 py-0.5 rounded ${statusColors[client.status] ?? statusColors.lead}`}>
              {client.status}
            </span>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
