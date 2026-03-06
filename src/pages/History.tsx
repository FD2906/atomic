import { motion } from "framer-motion";
import { TrendingUp, Heart, Check, X } from "lucide-react";

const History = () => {
  const mockHistory = [
    { name: "Morning Run", status: "completed", stake: 1000, charity: "MIND", days: "14/14" },
    { name: "Read 30 Mins", status: "failed", stake: 500, charity: "WWF", days: "8/14" },
    { name: "Meditation", status: "completed", stake: 500, charity: "Shelter", days: "7/7" },
  ];

  return (
    <div className="px-4 pt-6 space-y-6">
      <h1 className="text-xl font-bold font-heading">History</h1>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="glass-card rounded-xl p-3 text-center">
          <p className="text-lg font-bold font-heading text-primary">3</p>
          <p className="text-[10px] text-muted-foreground">Total</p>
        </div>
        <div className="glass-card rounded-xl p-3 text-center">
          <p className="text-lg font-bold font-heading text-success">2</p>
          <p className="text-[10px] text-muted-foreground">Completed</p>
        </div>
        <div className="glass-card rounded-xl p-3 text-center">
          <p className="text-lg font-bold font-heading text-destructive">1</p>
          <p className="text-[10px] text-muted-foreground">Failed</p>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {mockHistory.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card rounded-xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                item.status === "completed" ? "bg-success/10" : "bg-destructive/10"
              }`}>
                {item.status === "completed" ? (
                  <Check className="w-5 h-5 text-success" />
                ) : (
                  <X className="w-5 h-5 text-destructive" />
                )}
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
    </div>
  );
};

export default History;
