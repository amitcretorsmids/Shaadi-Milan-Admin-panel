// constants/locations.ts
import cities from './location.json';

export type City = { id: string; name: string; state: string };

// Unique, sorted state list
export const STATES: string[] = [...new Set(cities.map((c: City) => c.state))].sort();

// State → city names map (replaces DISTRICTS)
export const DISTRICTS: Record<string, string[]> = cities.reduce(
  (acc: Record<string, string[]>, city: City) => {
    if (!acc[city.state]) acc[city.state] = [];
    acc[city.state].push(city.name);
    return acc;
  },
  {}
);