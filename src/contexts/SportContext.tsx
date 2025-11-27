import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type Sport = 'soccer' | 'futsal';

interface SportContextType {
  sport: Sport | null;
  setSport: (sport: Sport) => void;
  isFirstTime: boolean;
  completeSportSelection: () => void;
  getSportSpecificActions: () => SportAction[];
  getSportSpecificStats: () => SportStat[];
}

interface SportAction {
  id: string;
  name: string;
  color: string;
  sportSpecific?: boolean;
}

interface SportStat {
  id: string;
  name: string;
  category: 'offensive' | 'defensive' | 'general';
  sportSpecific?: boolean;
}

const SportContext = createContext<SportContextType | undefined>(undefined);

export const useSport = () => {
  const context = useContext(SportContext);
  if (!context) {
    throw new Error('useSport must be used within a SportProvider');
  }
  return context;
};

interface SportProviderProps {
  children: ReactNode;
}

export const SportProvider: React.FC<SportProviderProps> = ({ children }) => {
  const [sport, setSportState] = useState<Sport | null>(null);
  const [isFirstTime, setIsFirstTime] = useState(true);

  useEffect(() => {
    const savedSport = localStorage.getItem('statsor_sport');
    const sportSelectionCompleted = localStorage.getItem('statsor_sport_selection_completed');
    
    if (savedSport && sportSelectionCompleted) {
      setSportState(savedSport as Sport);
      setIsFirstTime(false);
    }
  }, []);

  const setSport = (newSport: Sport) => {
    setSportState(newSport);
    localStorage.setItem('statsor_sport', newSport);
  };

  const completeSportSelection = () => {
    setIsFirstTime(false);
    localStorage.setItem('statsor_sport_selection_completed', 'true');
  };

  const getSportSpecificActions = (): SportAction[] => {
    const commonActions = [
      { id: 'goal_favor', name: 'Goal For', color: 'bg-green-500 hover:bg-green-600 text-white' },
      { id: 'goal_against', name: 'Goal Against', color: 'bg-red-500 hover:bg-red-600 text-white' },
      { id: 'assist', name: 'Assist', color: 'bg-blue-500 hover:bg-blue-600 text-white' },
      { id: 'foul_favor', name: 'Foul For', color: 'bg-yellow-500 hover:bg-yellow-600 text-white' },
      { id: 'foul_against', name: 'Foul Against', color: 'bg-orange-500 hover:bg-orange-600 text-white' },
      { id: 'shot_goal', name: 'Shot on Goal', color: 'bg-purple-500 hover:bg-purple-600 text-white' },
      { id: 'shot_out', name: 'Shot Off Target', color: 'bg-gray-500 hover:bg-gray-600 text-white' },
      { id: 'corner_favor', name: 'Corner For', color: 'bg-indigo-500 hover:bg-indigo-600 text-white' },
      { id: 'corner_against', name: 'Corner Against', color: 'bg-pink-500 hover:bg-pink-600 text-white' },
    ];

    const soccerSpecific = [
      { id: 'offside', name: 'Offside', color: 'bg-amber-500 hover:bg-amber-600 text-white', sportSpecific: true },
      { id: 'penalty_favor', name: 'Penalty For', color: 'bg-emerald-500 hover:bg-emerald-600 text-white', sportSpecific: true },
      { id: 'penalty_against', name: 'Penalty Against', color: 'bg-rose-500 hover:bg-rose-600 text-white', sportSpecific: true },
    ];

    const futsalSpecific = [
      { id: 'double_penalty_goal', name: 'Double Penalty Goal', color: 'bg-violet-500 hover:bg-violet-600 text-white', sportSpecific: true },
      { id: 'accumulated_foul', name: 'Accumulated Foul', color: 'bg-teal-500 hover:bg-teal-600 text-white', sportSpecific: true },
      { id: 'time_out', name: 'Time Out', color: 'bg-slate-500 hover:bg-slate-600 text-white', sportSpecific: true },
      { id: 'flying_goalkeeper', name: 'Flying Goalkeeper', color: 'bg-cyan-500 hover:bg-cyan-600 text-white', sportSpecific: true },
    ];

    if (sport === 'soccer') {
      return [...commonActions, ...soccerSpecific];
    } else if (sport === 'futsal') {
      return [...commonActions, ...futsalSpecific];
    }

    return commonActions;
  };

  const getSportSpecificStats = (): SportStat[] => {
    const commonStats = [
      { id: 'goals', name: 'Goals', category: 'offensive' as const },
      { id: 'assists', name: 'Assists', category: 'offensive' as const },
      { id: 'shots', name: 'Shots', category: 'offensive' as const },
      { id: 'passes', name: 'Passes', category: 'general' as const },
      { id: 'fouls_committed', name: 'Fouls Committed', category: 'defensive' as const },
      { id: 'fouls_received', name: 'Fouls Received', category: 'defensive' as const },
      { id: 'yellow_cards', name: 'Yellow Cards', category: 'general' as const },
      { id: 'red_cards', name: 'Red Cards', category: 'general' as const },
    ];

    const soccerSpecific = [
      { id: 'offsides', name: 'Offsides', category: 'offensive' as const, sportSpecific: true },
      { id: 'penalties_scored', name: 'Penalties Scored', category: 'offensive' as const, sportSpecific: true },
      { id: 'clean_sheets', name: 'Clean Sheets', category: 'defensive' as const, sportSpecific: true },
    ];

    const futsalSpecific = [
      { id: 'double_penalty_goals', name: 'Double Penalty Goals', category: 'offensive' as const, sportSpecific: true },
      { id: 'accumulated_fouls', name: 'Accumulated Fouls', category: 'defensive' as const, sportSpecific: true },
      { id: 'flying_goalkeeper_goals', name: 'Flying GK Goals', category: 'offensive' as const, sportSpecific: true },
      { id: 'time_outs_used', name: 'Time Outs Used', category: 'general' as const, sportSpecific: true },
    ];

    if (sport === 'soccer') {
      return [...commonStats, ...soccerSpecific];
    } else if (sport === 'futsal') {
      return [...commonStats, ...futsalSpecific];
    }

    return commonStats;
  };

  const value: SportContextType = {
    sport,
    setSport,
    isFirstTime,
    completeSportSelection,
    getSportSpecificActions,
    getSportSpecificStats
  };

  return (
    <SportContext.Provider value={value}>
      {children}
    </SportContext.Provider>
  );
};