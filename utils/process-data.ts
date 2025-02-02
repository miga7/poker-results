export type GameData = {
  date: string
  dailyOmaha: number
  mondayHigh: number
  cashGames: number
  monthlyTotal: number
}

export const processData = () => {
  const data2023: GameData[] = [
    { date: "Jan 23", dailyOmaha: 1430, mondayHigh: 2377, cashGames: 2799, monthlyTotal: 6592 },
    { date: "Feb 23", dailyOmaha: 1471, mondayHigh: -1327, cashGames: 1539, monthlyTotal: 1407 },
    { date: "Mar 23", dailyOmaha: -449, mondayHigh: 1828, cashGames: -1295, monthlyTotal: 83 },
    { date: "Apr 23", dailyOmaha: 822, mondayHigh: 1747, cashGames: 1735, monthlyTotal: 4521 },
    { date: "May 23", dailyOmaha: 752, mondayHigh: 4895, cashGames: 3562, monthlyTotal: 9214 },
    { date: "Jun 23", dailyOmaha: 922, mondayHigh: 6932, cashGames: 1694, monthlyTotal: 8648 },
    { date: "Jul 23", dailyOmaha: 1243, mondayHigh: 4696, cashGames: 3371, monthlyTotal: 9310 },
    { date: "Aug 23", dailyOmaha: -800, mondayHigh: -2020, cashGames: 4364, monthlyTotal: 744 },
    { date: "Sep 23", dailyOmaha: -862, mondayHigh: -1200, cashGames: -1056, monthlyTotal: -3118 },
    { date: "Oct 23", dailyOmaha: -2, mondayHigh: 4233, cashGames: 3029, monthlyTotal: 7260 },
    { date: "Nov 23", dailyOmaha: 276, mondayHigh: 3566, cashGames: 4203, monthlyTotal: 8045 },
    { date: "Dec 23", dailyOmaha: 444, mondayHigh: 0, cashGames: 3209, monthlyTotal: 3653 },
  ]

  const data2024: GameData[] = [
    { date: "Jan 24", dailyOmaha: 1419, mondayHigh: 4590, cashGames: 911, monthlyTotal: 6920 },
    { date: "Feb 24", dailyOmaha: 2599, mondayHigh: 2656, cashGames: 5895, monthlyTotal: 11150 },
    { date: "Mar 24", dailyOmaha: -3200, mondayHigh: 867, cashGames: -4245, monthlyTotal: -6578 },
    { date: "Apr 24", dailyOmaha: -1445, mondayHigh: -2499, cashGames: 2283, monthlyTotal: 838 },
  ]

  return { data2023, data2024 }
}

