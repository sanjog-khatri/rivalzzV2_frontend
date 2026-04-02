"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { SectionHeader, PageLoader, Empty } from "./UI";
import { QuestCard } from "./BattleCard";
import { RefreshCw, Filter } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

const authHeader = () => ({
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}`,
});

export default function QuestsTab() {
  const [challenges, setChallenges] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all"); // "all" or category _id
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load waiting challenges
  const loadChallenges = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch(`${API}/api/user/challenges/waiting`, {
        headers: authHeader(),
      });
      const data = await res.json();
      setChallenges(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load categories for filter
  const loadCategories = async () => {
    try {
      const res = await fetch(`${API}/api/user/categories`, {
        headers: authHeader(),
      });
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load categories", err);
    }
  };

  useEffect(() => {
    loadChallenges();
    loadCategories();
  }, []);

  const handleRefresh = () => loadChallenges(true);

  // Filter challenges based on selected category
  const filteredChallenges = selectedCategory === "all"
    ? challenges
    : challenges.filter((c) => c.category?._id === selectedCategory);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <SectionHeader eyebrow="Quests" title="Accept a Battle" />

        <div className="flex items-center gap-3">
          {/* Category Filter */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-card border border-border/50 text-xs font-mono px-3 py-1.5 rounded-none focus:outline-none focus:border-foreground transition-colors appearance-none pr-8"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>

          {/* Refresh Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2 text-xs"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <PageLoader />
      ) : filteredChallenges.length === 0 ? (
        <Empty 
          message={selectedCategory === "all" ? "No open quests" : "No quests in this category"} 
          sub="Check back soon or create one" 
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredChallenges.map((c) => (
            <QuestCard 
              key={c._id} 
              challenge={c} 
              onAccepted={loadChallenges} 
            />
          ))}
        </div>
      )}
    </div>
  );
}