'use client';

import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  ComposedChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type GameCategory = 'Omaha Low Stakes' | 'Monday High Stakes' | 'Cash Games' | 'Tournaments' | 'Totals';

interface PokerStatsData {
  totals: any[][];
}

interface GameData {
  gameType: string;
  year: string;
  baseGameType: GameCategory;
  monthlyData: { month: string; value: number }[];
  rowIndex: number;
}

interface ProcessedData {
  month: string;
  [key: string]: number | string; // Dynamic keys for different game types and years
}

interface GameTypeInfo {
  type: string;
  index: number;
  category: GameCategory | null;
}

// Helper function to parse currency string to number
function parseCurrency(value: string): number {
  if (!value) return 0;
  // Remove ₪ symbol, spaces, and commas, then convert to number
  const cleanValue = value.replace(/[₪,\s]/g, '');
  console.log('Parsing currency:', { original: value, cleaned: cleanValue });
  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? 0 : parsed;
}

// Helper function to format currency
function formatCurrency(value: number | undefined): string {
  if (value === undefined || value === null) return '₪0';
  return `₪${value.toLocaleString()}`;
}

// Helper function to extract year from game type string
function extractYear(gameType: string): string {
  // First try to match year at the end of the string
  const endMatch = gameType.match(/\d{4}$/);
  if (endMatch) return endMatch[0];
  
  // Then try to match year anywhere in the string
  const anyMatch = gameType.match(/\d{4}/);
  if (anyMatch) return anyMatch[0];
  
  // For Cash Games, try to extract year from the next row
  if (gameType.includes('Cash Games')) {
    const currentYear = new Date().getFullYear().toString();
    return currentYear;
  }
  
  return '';
}

// Helper function to extract base game type without year
function extractBaseGameType(gameType: string): string {
  return gameType.replace(/\s+\d{4}$/, '');
}

// Helper function to map game type to category
function getGameCategory(gameType: string): GameCategory | '' {
  const type = gameType.toLowerCase().trim();
  if (type.includes('daily omaha low stakes')) return 'Omaha Low Stakes';
  if (type.includes('monday high stakes')) return 'Monday High Stakes';
  if (type.includes('cash games')) return 'Cash Games';
  if (type.includes('tournaments')) return 'Tournaments';
  if (type.includes('monthly totals') || type.includes('totals')) return 'Totals';
  return '';
}

// Add month name mapping
const MONTH_NAMES: Record<string, string> = {
  '1': 'Jan',
  '2': 'Feb',
  '3': 'Mar',
  '4': 'Apr',
  '5': 'May',
  '6': 'Jun',
  '7': 'Jul',
  '8': 'Aug',
  '9': 'Sep',
  '10': 'Oct',
  '11': 'Nov',
  '12': 'Dec'
};

export function PokerStatsCharts({ data }: { data: PokerStatsData }) {
  const [selectedGameTypes, setSelectedGameTypes] = useState<string[]>(['Totals']);
  const [selectedYears, setSelectedYears] = useState<string[]>(['All Years']);
  const [activeMonthlyTab, setActiveMonthlyTab] = useState("line");
  const [activeView, setActiveView] = useState<'chart' | 'table'>('chart');

  const processedData = useMemo(() => {
    if (!data.totals || data.totals.length < 2) {
      console.log('No totals data or insufficient rows');
      return { gameTypes: [], monthlyData: [], yearlyTotals: {}, globalTotals: {}, years: [] };
    }

    console.log('Raw totals data:', data.totals);

    // Extract all game types and their data
    const gameTypes = data.totals
      .map((row, index) => {
        const type = row[0]?.toString().trim() || '';
        const category = getGameCategory(type);
        if (category) {
          console.log(`Found game type: ${type} at index ${index}, category: ${category}`);
        }
        return { type, index, category } as GameTypeInfo;
      })
      .filter((info): info is GameTypeInfo & { category: GameCategory } => 
        info.type !== '' && 
        info.type !== 'Game Type' && 
        info.category !== null);

    // Add Tournaments data (rows 35-36, columns E-L)
    const tournamentsData = {
      type: 'Tournaments',
      index: 34, // 35-1 for zero-based index
      category: 'Tournaments' as GameCategory
    };
    gameTypes.push(tournamentsData);

    // Process monthly data for each game type
    const processedGames = gameTypes
      .map(({ type, index, category }) => {
        let monthlyData;
        
        if (category === 'Tournaments') {
          // Special handling for Tournaments data
          const tournamentsRow = data.totals[35]; // Row 36 in spreadsheet
          if (tournamentsRow) {
            monthlyData = Array(12).fill(0).map((_, monthIndex) => {
              const value = parseCurrency(tournamentsRow[monthIndex + 4]?.toString() || '₪0');
              return {
                month: (monthIndex + 1).toString(),
                value
              };
            });
          } else {
            monthlyData = Array(12).fill({ month: '0', value: 0 });
          }
        } else {
          // Regular processing for other game types
          const valuesRow = data.totals[index + 1];
          if (!valuesRow) {
            console.log(`No values row found for ${type} at index ${index + 1}`);
            return null;
          }

          monthlyData = valuesRow.slice(2, 14).map((value, monthIndex) => {
            const parsedValue = parseCurrency(value?.toString() || '₪0');
            return {
              month: (monthIndex + 1).toString(),
              value: parsedValue
            };
          });
        }

        const year = category === 'Tournaments' ? selectedYears[0] : extractYear(type);
        const gameType = category === 'Tournaments' ? `Tournaments ${year}` : type;

        return {
          gameType,
          year,
          baseGameType: category,
          monthlyData,
          rowIndex: index + 1
        };
      })
      .filter((game): game is GameData => game !== null);

    // Calculate yearly totals including Tournaments
    const yearlyTotals: { [key: string]: number } = {};
    processedGames.forEach(game => {
      yearlyTotals[game.gameType] = game.monthlyData.reduce((sum, month) => sum + month.value, 0);
    });

    // Add global totals by base game type
    const globalTotals: { [key in GameCategory]?: number } = {};
    processedGames.forEach(game => {
      const baseType = game.baseGameType;
      if (!globalTotals[baseType]) {
        globalTotals[baseType] = 0;
      }
      globalTotals[baseType] = (globalTotals[baseType] || 0) + (yearlyTotals[game.gameType] || 0);
    });

    // Add Totals to globalTotals
    globalTotals['Totals'] = Object.values(globalTotals).reduce((sum, value) => sum + (value || 0), 0);

    // Define fixed game types including Tournaments
    const uniqueGameTypes: GameCategory[] = [
      'Omaha Low Stakes',
      'Monday High Stakes',
      'Cash Games',
      'Tournaments',
      'Totals'
    ];

    // Get unique years from the data
    const years = Array.from(new Set(processedGames.map(game => game.year)))
      .filter(year => year !== '')
      .sort()
      .filter(year => year !== 'All Years'); // Ensure All Years doesn't come from data

    return {
      gameTypes: uniqueGameTypes,
      monthlyData: processedGames,
      yearlyTotals,
      globalTotals,
      years
    };
  }, [data.totals, selectedYears]);

  // Filter data based on selected game types and year
  const filteredData = useMemo(() => {
    let filtered = processedData.monthlyData;

    // Filter by years if specific years are selected
    if (!selectedYears.includes('All Years')) {
      filtered = filtered.filter(game => selectedYears.includes(game.year));
    }

    // Then filter by game types if any are selected
    if (selectedGameTypes.length > 0) {
      filtered = filtered.filter(game => {
        const isTotal = game.baseGameType === 'Totals';
        const isTotalSelected = selectedGameTypes.includes('Totals');
        
        if (selectedGameTypes.length === 1 && isTotalSelected) {
          return !isTotal;
        }
        
        return !isTotal && selectedGameTypes.includes(game.baseGameType);
      });
    }

    return filtered;
  }, [processedData.monthlyData, selectedGameTypes, selectedYears]);

  // Transform data for charts
  const chartData = useMemo(() => {
    const monthlyData: ProcessedData[] = Array.from({ length: 12 }, (_, i) => ({
      month: (i + 1).toString(),
      monthName: selectedYears.includes('All Years')
        ? MONTH_NAMES[(i + 1).toString()]
        : `${MONTH_NAMES[(i + 1).toString()]} ${selectedYears.length === 1 ? selectedYears[0].slice(-2) : ''}`
    }));

    // Add individual game data
    if (selectedYears.includes('All Years')) {
      // Group by base game type across years
      const groupedGames = new Map<string, number[]>();
      
      filteredData.forEach(game => {
        if (game.baseGameType !== 'Totals') {
          const baseType = game.baseGameType;
          if (!groupedGames.has(baseType)) {
            groupedGames.set(baseType, new Array(12).fill(0));
          }
          
          // Add values to the grouped totals
          game.monthlyData.forEach((month, index) => {
            const currentValues = groupedGames.get(baseType)!;
            currentValues[index] += month.value;
          });
        }
      });

      // Add grouped data to monthlyData
      groupedGames.forEach((values, baseType) => {
        values.forEach((value, index) => {
          monthlyData[index][baseType] = value;
        });
      });
    } else {
      // Regular processing for specific year
      filteredData.forEach(game => {
        if (game.baseGameType !== 'Totals') {
          game.monthlyData.forEach((month, index) => {
            monthlyData[index][game.gameType] = month.value;
          });
        }
      });
    }

    // Calculate Totals if selected
    if (selectedGameTypes.includes('Totals')) {
      monthlyData.forEach((monthData, index) => {
        const monthTotal = Object.entries(monthData)
          .filter(([key]) => 
            key !== 'month' && 
            key !== 'monthName' && 
            key !== 'Totals'
          )
          .reduce((sum, [_, value]) => sum + (value as number || 0), 0);

        monthData['Totals'] = monthTotal;
      });
    }

    return monthlyData;
  }, [filteredData, selectedGameTypes, selectedYears]);

  // Calculate yearly totals for display
  const displayTotals = useMemo(() => {
    const totals: { [key: string]: number } = {};
    
    // Calculate totals for each game type
    filteredData.forEach(game => {
      if (game.baseGameType !== 'Totals') {
        const gameTotal = game.monthlyData.reduce((sum, month) => sum + month.value, 0);
        totals[game.gameType] = gameTotal;
      }
    });

    // Calculate Totals regardless of selection
    totals['Totals'] = Object.values(totals).reduce((sum, value) => sum + value, 0);

    return totals;
  }, [filteredData]);

  // Generate colors for different game types
  const gameColors = useMemo(() => {
    const colors: Record<GameCategory, string> = {
      'Omaha Low Stakes': '#8884d8',
      'Monday High Stakes': '#82ca9d',
      'Cash Games': '#ffc658',
      'Tournaments': '#e5989b',
      'Totals': '#ff7300'
    };
    return colors;
  }, []);

  // Get unique game types for chart rendering
  const chartGameTypes = useMemo(() => {
    const types = new Set<string>();
    
    if (selectedYears.includes('All Years')) {
      // Use base game types for all years view
      filteredData.forEach(game => {
        if (game.baseGameType !== 'Totals') {
          types.add(game.baseGameType);
        }
      });
    } else {
      // Use full game types (with years) for specific year view
      filteredData.forEach(game => {
        if (game.baseGameType !== 'Totals') {
          types.add(game.gameType);
        }
      });
    }
    
    if (selectedGameTypes.includes('Totals')) {
      types.add('Totals');
    }
    
    return Array.from(types);
  }, [filteredData, selectedGameTypes, selectedYears]);

  // Helper function to get color for a game type
  const getGameColor = (gameType: string): string => {
    if (gameType === 'Totals') return gameColors['Totals'];
    const baseType = gameType.replace(/ \d{4}.*$/, '').trim();
    return gameColors[baseType as GameCategory] || '#000000';
  };

  return (
    <div className="space-y-8">
      {/* Game Type and Year Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Game Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {/* Game Types Filter */}
            <div className="flex flex-wrap gap-2">
              {processedData.gameTypes
                .filter(gameType => gameType !== 'Totals')
                .map(gameType => (
                  <button
                    key={gameType}
                    onClick={() => {
                      setSelectedGameTypes(prev =>
                        prev.includes(gameType)
                          ? prev.filter(t => t !== gameType)
                          : [...prev, gameType]
                      );
                    }}
                    className={`px-4 py-2 rounded-full ${
                      selectedGameTypes.includes(gameType)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary'
                    }`}
                  >
                    {gameType}
                  </button>
              ))}
            </div>

            {/* Totals Filter - Separated and Highlighted */}
            <div className="border-l-2 border-primary/20 pl-4">
              <button
                onClick={() => {
                  setSelectedGameTypes(prev =>
                    prev.includes('Totals')
                      ? prev.filter(t => t !== 'Totals')
                      : [...prev, 'Totals']
                  );
                }}
                className={`px-4 py-2 rounded-full font-semibold ${
                  selectedGameTypes.includes('Totals')
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/70'
                }`}
              >
                Totals
              </button>
            </div>

            {/* Years Filter */}
            {processedData.years.length > 0 && (
              <div className="flex items-center gap-2 border-l-2 border-primary/20 pl-4">
                <button
                  onClick={() => setSelectedYears(['All Years'])}
                  className={`px-3 py-1.5 rounded-full text-sm ${
                    selectedYears.includes('All Years')
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary'
                  }`}
                >
                  All Years
                </button>
                {processedData.years.map(year => (
                  <button
                    key={year}
                    onClick={() => {
                      setSelectedYears(prev => {
                        if (prev.includes('All Years')) {
                          return [year];
                        }
                        if (prev.includes(year)) {
                          const newYears = prev.filter(y => y !== year);
                          return newYears.length === 0 ? ['All Years'] : newYears;
                        }
                        return [...prev, year];
                      });
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm ${
                      selectedYears.includes(year)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Totals Display */}
      <div className="space-y-8">
        {/* Totals Section - Highlighted */}
        <div className="flex justify-center">
          <div className="bg-secondary/50 p-6 rounded-lg border-2 border-primary/20 w-[400px]">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Total Earnings</h2>
              <p className={`text-4xl font-bold ${
                displayTotals['Totals'] >= 0 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {formatCurrency(displayTotals['Totals'])}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {selectedYears.includes('All Years') 
                  ? 'All Time Total' 
                  : `Total for ${selectedYears.length === 1 
                      ? selectedYears[0] 
                      : selectedYears.sort().join(', ')}`}
              </p>
            </div>
          </div>
        </div>

        {/* Individual Game Types */}
        {['Omaha Low Stakes', 'Monday High Stakes', 'Cash Games'].map(baseGameType => {
          const gamesOfType = filteredData.filter(game => 
            game.baseGameType === baseGameType && 
            game.baseGameType !== 'Totals'
          );
          
          if (gamesOfType.length === 0) return null;

          return (
            <div key={baseGameType}>
              <h3 className="text-lg font-semibold mb-2">{baseGameType}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {gamesOfType.map(game => (
                  <Card key={game.gameType} className="h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{game.gameType}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className={`text-2xl font-bold ${
                        processedData.yearlyTotals[game.gameType] >= 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {formatCurrency(processedData.yearlyTotals[game.gameType])}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* View Toggle and Content */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Monthly Performance</CardTitle>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveView('chart')}
              className={`px-4 py-2 rounded-full ${
                activeView === 'chart'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary'
              }`}
            >
              Graph
            </button>
            <button
              onClick={() => setActiveView('table')}
              className={`px-4 py-2 rounded-full ${
                activeView === 'table'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary'
              }`}
            >
              Table
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {activeView === 'chart' ? (
            <Tabs value={activeMonthlyTab} onValueChange={setActiveMonthlyTab}>
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="line">Line</TabsTrigger>
                <TabsTrigger value="bar">Bar</TabsTrigger>
                <TabsTrigger value="cumulative">Cumulative</TabsTrigger>
              </TabsList>

              <TabsContent value="line" className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 80, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#a1a1aa" opacity={0.2} />
                    <XAxis
                      dataKey="monthName"
                      stroke="#71717a"
                      fontSize={12}
                      tickLine={false}
                      axisLine={{ stroke: '#a1a1aa', strokeWidth: 1 }}
                    />
                    <YAxis
                      tickFormatter={(value) => `₪${value.toLocaleString()}`}
                      stroke="#71717a"
                      fontSize={12}
                      tickLine={false}
                      axisLine={{ stroke: '#a1a1aa', strokeWidth: 1 }}
                      label={{ 
                        value: 'Amount (₪)', 
                        angle: -90, 
                        position: 'insideLeft', 
                        offset: -20,
                        style: { fill: '#71717a', fontSize: 12 }
                      }}
                    />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(label) => label}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '6px',
                        padding: '8px',
                        border: '1px solid #e4e4e7',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ 
                        paddingTop: '20px',
                        fontSize: '12px'
                      }}
                      iconType="circle"
                      iconSize={8}
                    />
                    {chartGameTypes.map(gameType => (
                      <Line
                        key={gameType}
                        type="monotone"
                        dataKey={gameType}
                        name={gameType === 'Totals' ? 'Totals' : getGameCategory(gameType)}
                        stroke={getGameColor(gameType)}
                        strokeWidth={2}
                        dot={{ r: 4, strokeWidth: 2 }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>

              <TabsContent value="bar" className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 80, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#a1a1aa" opacity={0.2} />
                    <XAxis
                      dataKey="monthName"
                      stroke="#71717a"
                      fontSize={12}
                      tickLine={false}
                      axisLine={{ stroke: '#a1a1aa', strokeWidth: 1 }}
                    />
                    <YAxis
                      tickFormatter={(value) => `₪${value.toLocaleString()}`}
                      stroke="#71717a"
                      fontSize={12}
                      tickLine={false}
                      axisLine={{ stroke: '#a1a1aa', strokeWidth: 1 }}
                      label={{ 
                        value: 'Amount (₪)', 
                        angle: -90, 
                        position: 'insideLeft', 
                        offset: -20,
                        style: { fill: '#71717a', fontSize: 12 }
                      }}
                    />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(label) => label}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '6px',
                        padding: '8px',
                        border: '1px solid #e4e4e7',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ 
                        paddingTop: '20px',
                        fontSize: '12px'
                      }}
                      iconType="circle"
                      iconSize={8}
                    />
                    {chartGameTypes
                      .filter(gameType => gameType !== 'Totals') // Exclude Totals from stacked bars
                      .map(gameType => (
                        <Bar
                          key={gameType}
                          dataKey={gameType}
                          name={getGameCategory(gameType)}
                          fill={getGameColor(gameType)}
                          stackId="stack"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={50}
                        />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </TabsContent>

              <TabsContent value="cumulative" className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    margin={{ top: 20, right: 30, left: 80, bottom: 20 }}
                    data={chartData.map((month, index) => {
                      const cumulativeData: any = { 
                        month: month.month, 
                        monthName: month.monthName 
                      };
                      
                      chartGameTypes.forEach(gameType => {
                        cumulativeData[gameType] = chartData
                          .slice(0, index + 1)
                          .reduce((sum, m) => sum + (m[gameType] as number || 0), 0);
                      });
                      
                      return cumulativeData;
                    })}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#a1a1aa" opacity={0.2} />
                    <XAxis
                      dataKey="monthName"
                      stroke="#71717a"
                      fontSize={12}
                      tickLine={false}
                      axisLine={{ stroke: '#a1a1aa', strokeWidth: 1 }}
                    />
                    <YAxis
                      tickFormatter={(value) => `₪${value.toLocaleString()}`}
                      stroke="#71717a"
                      fontSize={12}
                      tickLine={false}
                      axisLine={{ stroke: '#a1a1aa', strokeWidth: 1 }}
                      label={{ 
                        value: 'Cumulative Amount (₪)', 
                        angle: -90, 
                        position: 'insideLeft', 
                        offset: -20,
                        style: { fill: '#71717a', fontSize: 12 }
                      }}
                    />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(label) => label}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '6px',
                        padding: '8px',
                        border: '1px solid #e4e4e7',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ 
                        paddingTop: '20px',
                        fontSize: '12px'
                      }}
                      iconType="circle"
                      iconSize={8}
                    />
                    {chartGameTypes.map(gameType => (
                      <Line
                        key={gameType}
                        type="monotone"
                        dataKey={gameType}
                        name={gameType === 'Totals' ? 'Totals' : getGameCategory(gameType)}
                        stroke={getGameColor(gameType)}
                        strokeWidth={2}
                        dot={{ r: 4, strokeWidth: 2 }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>
            </Tabs>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  {chartGameTypes.map(gameType => {
                    const displayName = gameType === 'Totals' 
                      ? 'Totals' 
                      : selectedYears.includes('All Years')
                        ? gameType // Use base game type for All Years
                        : getGameCategory(gameType); // Use category for specific years
                    return (
                      <TableHead 
                        key={gameType} 
                        className={`text-right ${
                          gameType === 'Totals' 
                            ? 'bg-secondary/50 font-semibold text-primary border-l-2 border-primary/20' 
                            : ''
                        }`}
                      >
                        {displayName}
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {chartData.map((month, index) => {
                  // Calculate row total
                  const rowTotal = chartGameTypes
                    .filter(gameType => gameType !== 'Totals')
                    .reduce((sum, gameType) => sum + (month[gameType] as number || 0), 0);

                  // Check if all values in this row are zero (including the total)
                  const allZeros = chartGameTypes.every(
                    gameType => (month[gameType] as number || 0) === 0
                  ) && rowTotal === 0;
                  
                  // Skip rendering this row if all values are zero
                  if (allZeros) return null;

                  return (
                    <TableRow key={index}>
                      <TableCell>{month.monthName}</TableCell>
                      {chartGameTypes.map(gameType => (
                        <TableCell
                          key={gameType}
                          className={`text-right ${
                            gameType === 'Totals'
                              ? 'bg-secondary/50 font-semibold border-l-2 border-primary/20'
                              : ''
                          } ${
                            (month[gameType] as number) >= 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {formatCurrency(month[gameType] as number || 0)}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
                {/* Grand Total Row */}
                <TableRow className="font-bold border-t-2 bg-secondary/50">
                  <TableCell className="text-lg font-sans tracking-tight">
                    <span className="bg-gradient-to-r from-primary/80 to-primary bg-clip-text text-transparent font-semibold">
                      Grand Total
                    </span>
                  </TableCell>
                  {chartGameTypes.map(gameType => {
                    const total = chartData.reduce(
                      (sum, month) => sum + (month[gameType] as number || 0),
                      0
                    );
                    return (
                      <TableCell
                        key={gameType}
                        className={`text-right text-lg ${
                          gameType === 'Totals'
                            ? 'bg-secondary/70 border-l-2 border-primary/20'
                            : ''
                        } ${
                          total >= 0 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        } border-t-2 border-primary/20`}
                      >
                        <span className="font-mono tracking-tight font-semibold">
                          {formatCurrency(total)}
                        </span>
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 