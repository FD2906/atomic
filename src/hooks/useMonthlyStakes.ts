import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, format } from "date-fns";

export const useMonthlyStakes = (userId: string | undefined) => {
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchMonthlyStakes = async () => {
      const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
      const { data } = await supabase
        .from("stakes")
        .select("amount")
        .eq("user_id", userId)
        .gte("date_created", monthStart);

      const total = (data || []).reduce((sum, s) => sum + Number(s.amount), 0);
      setMonthlyTotal(total);
      setLoading(false);
    };

    fetchMonthlyStakes();
  }, [userId]);

  return { monthlyTotal, loading };
};
