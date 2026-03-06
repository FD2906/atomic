import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

interface HistoryItem {
  id: string;
  name: string;
  status: string;
  stake: number;
  charity: string;
  days: string;
}

const History = () => {
  const { user } = useAuth("/login");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [summary, setSummary] = useState({ total: 0, completed: 0, failed: 0 });

  useEffect(() => {
    if (!user) return;

    const fetchHistory = async () => {
      const { data } = await supabase
        .from("habits")
        .select("*, stakes(amount, status, charities(name))")
        .eq("user_id", user.id)
        .in("status", ["completed", "failed"]);

      const items: HistoryItem[] = (data || []).map((h: any) => {
        const stake = h.stakes?.[0];
        const startDate = new Date(h.start_date);
        const endDate = h.end_date ? new Date(h.end_date) : startDate;
        const totalDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return {
          id: h.id,
          name: h.title,
          status: h.status,
          stake: stake?.amount || 0,
          charity: stake?.charities?.name || "Charity",
          days: `${totalDays}/${totalDays}`,
        };
      });

      setHistory(items);
      setSummary({
        total: items.length,
        completed: items.filter((i) => i.status === "completed").length,
        failed: items.filter((i) => i.status === "failed").length,
      });
    };

    fetchHistory();
  }, [user]);

  return (
    <div className="px-4 pt-6 space-y-6">
      <h1 className="text-xl font-bold font-heading">History</h1>

      <div className="grid grid-cols-3 gap-2">
        <div className="glass-card rounded-xl p-3 text-center">
          <p className="text-lg font-bold font-heading text-primary">{summary.total}</p>
          <p className="text-[10px] text-muted-foreground">Total</p>
        </div>
        <div className="glass-card rounded-xl p-3 text-center">
          <p className="text-lg font-bold font-heading text-success">{summary.completed}</p>
          <p className="text-[10px] text-muted-foreground">Completed</p>
        </div>
        <div className="glass-card rounded-xl p-3 text-center">
          <p className="text-lg font-bold font-heading text-destructive">{summary.failed}</p>
          <p className="text-[10px] text-muted-foreground">Failed</p>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="glass-card rounded-xl p-6 text-center">
          <p className="text-sm text-muted-foreground">No completed or failed habits yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.status === "completed" ? "bg-success/10" : "bg-destructive/10"}`}>
                  {item.status === "completed" ? <Check className="w-5 h-5 text-success" /> : <X className="w-5 h-5 text-destructive" />}
                </div>
                <div>
                  <p className="font-semibold font-heading text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.days} days · {item.charity}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold font-heading">£{(item.stake / 100).toFixed(0)}</p>
                <p className={`text-[10px] ${item.status === "completed" ? "text-success" : "text-destructive"}`}>
                  {item.status === "completed" ? "Returned" : "Donated"}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
