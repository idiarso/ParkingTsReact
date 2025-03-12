import React, { useMemo, useState, useEffect } from 'react';
import { 
  Grid, 
  Paper, 
  Typography, 
  Box,
  Button,
  ButtonGroup,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Menu,
  MenuItem,
  Tab,
  Tabs,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  DirectionsCar as VehicleIcon,
  Timer as SessionIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Refresh as RefreshIcon,
  ZoomIn as ZoomInIcon,
  Download as DownloadIcon,
  CompareArrows as CompareIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../store/reducers';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { format, subDays, startOfDay, endOfDay, isWithinInterval, subWeeks, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, differenceInMinutes } from 'date-fns';
import { SxProps, Theme } from '@mui/material/styles';

// Constants
const TOTAL_CAPACITY = 100;
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

// Types
interface Vehicle {
  id: string;
  type: string;
  createdAt: string;
  // Add any other required properties
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactElement<{ sx?: SxProps<Theme> }>;
  color: string;
  trend?: { value: number; previousValue: number };
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, trend }) => (
  <Paper
    sx={{
      p: 3,
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      height: '100%',
    }}
    elevation={2}
  >
    <Box
      sx={{
        backgroundColor: `${color}15`,
        borderRadius: '50%',
        p: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {React.cloneElement(icon, {
        sx: { fontSize: 40, color },
      })}
    </Box>
    <Box>
      <Typography variant="h6" color="text.secondary">
        {title}
      </Typography>
      <Typography variant="h4">{value}</Typography>
      {trend && <TrendIndicator {...trend} />}
    </Box>
  </Paper>
);

const ChartCard: React.FC<{ title: string; children: React.ReactNode; action?: React.ReactNode }> = ({
  title,
  children,
  action,
}) => (
  <Paper
    sx={{
      p: 3,
      height: '100%',
      minHeight: 400,
      display: 'flex',
      flexDirection: 'column',
    }}
    elevation={2}
  >
    <Typography variant="h6" color="text.secondary" gutterBottom>
      {title}
    </Typography>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      {action}
    </Box>
    {children}
  </Paper>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2">{label}</Typography>
        {payload.map((entry: any, index: number) => (
          <Typography key={index} sx={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? `$${entry.value.toFixed(2)}` : entry.value}
          </Typography>
        ))}
      </Paper>
    );
  }
  return null;
};

interface TrendIndicatorProps {
  value: number;
  previousValue: number;
}

const TrendIndicator: React.FC<TrendIndicatorProps> = ({ value, previousValue }) => {
  const percentChange = previousValue ? ((value - previousValue) / previousValue) * 100 : 0;
  const isPositive = percentChange > 0;
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
      {isPositive ? (
        <ArrowUpIcon sx={{ color: 'success.main' }} />
      ) : (
        <ArrowDownIcon sx={{ color: 'error.main' }} />
      )}
      <Typography
        variant="body2"
        sx={{ color: isPositive ? 'success.main' : 'error.main' }}
      >
        {Math.abs(percentChange).toFixed(1)}%
      </Typography>
    </Box>
  );
};

interface ComparisonPeriod {
  label: string;
  getValue: () => { start: Date; end: Date };
}

const comparisonPeriods: ComparisonPeriod[] = [
  {
    label: 'Day over Day',
    getValue: () => ({
      start: startOfDay(subDays(new Date(), 1)),
      end: endOfDay(subDays(new Date(), 1)),
    }),
  },
  {
    label: 'Week over Week',
    getValue: () => ({
      start: startOfWeek(subWeeks(new Date(), 1)),
      end: endOfWeek(subWeeks(new Date(), 1)),
    }),
  },
  {
    label: 'Month over Month',
    getValue: () => ({
      start: startOfMonth(subMonths(new Date(), 1)),
      end: endOfMonth(subMonths(new Date(), 1)),
    }),
  },
];

interface DrillDownDialogProps {
  open: boolean;
  onClose: () => void;
  data: any;
  title: string;
  date: string | null;
  sessions: any[];
  vehicles: any[];
}

const DrillDownDialog: React.FC<DrillDownDialogProps> = ({
  open,
  onClose,
  data,
  title,
  date,
  sessions,
  vehicles,
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [comparisonPeriod, setComparisonPeriod] = useState<ComparisonPeriod>(comparisonPeriods[0]);
  
  const dailyStats = useMemo(() => {
    if (!date) return null;
    
    const dayStart = startOfDay(new Date(date));
    const dayEnd = endOfDay(new Date(date));
    
    const daySessions = sessions.filter(session => {
      const sessionDate = new Date(session.entryTime);
      return isWithinInterval(sessionDate, { start: dayStart, end: dayEnd });
    });

    // Calculate peak hours
    const hourlyCount = Array(24).fill(0);
    daySessions.forEach(session => {
      const hour = new Date(session.entryTime).getHours();
      hourlyCount[hour]++;
    });
    const peakHour = hourlyCount.indexOf(Math.max(...hourlyCount));
    
    // Calculate average duration
    const durations = daySessions
      .filter(s => s.exitTime)
      .map(s => differenceInMinutes(new Date(s.exitTime), new Date(s.entryTime)));
    const avgDuration = durations.length ? 
      durations.reduce((sum, d) => sum + d, 0) / durations.length : 0;

    // Vehicle type distribution for the day
    const vehicleTypes = daySessions.reduce((acc: { [key: string]: number }, session) => {
      const vehicle = vehicles.find(v => v.id === session.vehicleId);
      if (vehicle) {
        acc[vehicle.type] = (acc[vehicle.type] || 0) + 1;
      }
      return acc;
    }, {});
    
    return {
      totalSessions: daySessions.length,
      completedSessions: daySessions.filter(s => s.exitTime).length,
      avgDuration: format(new Date(0, 0, 0, 0, avgDuration), 'HH:mm'),
      totalRevenue: daySessions.reduce((sum, s) => sum + (s.totalAmount || 0), 0),
      peakHour: format(new Date(0, 0, 0, peakHour), 'HH:00'),
      peakHourCount: hourlyCount[peakHour],
      vehicleTypes,
      occupancyRate: (daySessions.length / TOTAL_CAPACITY) * 100,
    };
  }, [date, sessions, vehicles]);

  const comparisonStats = useMemo(() => {
    if (!date || !comparisonPeriod) return null;

    const { start, end } = comparisonPeriod.getValue();
    const comparisonSessions = sessions.filter(session =>
      isWithinInterval(new Date(session.entryTime), { start, end })
    );

    return {
      totalSessions: comparisonSessions.length,
      completedSessions: comparisonSessions.filter(s => s.exitTime).length,
      totalRevenue: comparisonSessions.reduce((sum, s) => sum + (s.totalAmount || 0), 0),
    };
  }, [date, sessions, comparisonPeriod]);

  const handleExport = () => {
    if (!data) return;
    
    const csvContent = [
      ['Hour', 'Revenue'],
      ...data.map((row: any) => [row.hour, row.revenue]),
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue-${date}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {title}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <ButtonGroup size="small">
              {comparisonPeriods.map((period) => (
                <Button
                  key={period.label}
                  variant={comparisonPeriod === period ? 'contained' : 'outlined'}
                  onClick={() => setComparisonPeriod(period)}
                >
                  {period.label}
                </Button>
              ))}
            </ButtonGroup>
            <Tooltip title="Export Data">
              <IconButton onClick={handleExport}>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent>
        {dailyStats && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12}>
              <Tabs value={tabValue} onChange={(_, newValue: number) => setTabValue(newValue)}>
                <Tab label="Revenue Chart" />
                <Tab label="Daily Statistics" />
                <Tab label="Vehicle Analysis" />
              </Tabs>
            </Grid>
            {tabValue === 0 ? (
              <Grid item xs={12}>
                <Box sx={{ height: 400, mt: 2 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis tickFormatter={(value) => `$${value}`} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        name="Revenue"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>
            ) : tabValue === 1 ? (
              <Grid item xs={12}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Total Sessions
                      </Typography>
                      <Typography variant="h4">
                        {dailyStats.totalSessions}
                      </Typography>
                      {comparisonStats && (
                        <TrendIndicator
                          value={dailyStats.totalSessions}
                          previousValue={comparisonStats.totalSessions}
                        />
                      )}
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Peak Hour
                      </Typography>
                      <Typography variant="h4">
                        {dailyStats.peakHour}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {dailyStats.peakHourCount} sessions
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Average Duration
                      </Typography>
                      <Typography variant="h4">
                        {dailyStats.avgDuration}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Occupancy Rate
                      </Typography>
                      <Typography variant="h4">
                        {dailyStats.occupancyRate.toFixed(1)}%
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Grid>
            ) : (
              <Grid item xs={12}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Vehicle Type Distribution
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={Object.entries(dailyStats.vehicleTypes).map(([type, count]) => ({
                              name: type,
                              value: count,
                            }))}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {Object.keys(dailyStats.vehicleTypes).map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip content={<CustomTooltip />} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </Paper>
                  </Grid>
                </Grid>
              </Grid>
            )}
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default function Dashboard() {
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    subDays(new Date(), 7),
    new Date(),
  ]);
  const [drillDownData, setDrillDownData] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const sessions = useSelector((state: RootState) => state.parkingSessions.sessions);
  const vehicles = useSelector((state: RootState) => state.vehicles.vehicles);

  const activeSessions = sessions.filter(
    (session) => !session.exitTime
  ).length;

  const totalRevenue = sessions.reduce(
    (sum, session) => sum + (session.totalAmount || 0),
    0
  );

  // Process revenue data by day with date range filter
  const revenueData = useMemo(() => {
    if (!dateRange[0] || !dateRange[1]) return [];

    const start = startOfDay(dateRange[0]);
    const end = endOfDay(dateRange[1]);
    const days: Date[] = [];
    let currentDate = start;

    while (currentDate <= end) {
      days.push(new Date(currentDate));
      currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
    }

    return days.map(date => {
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const dayRevenue = sessions
        .filter(session => {
          const sessionDate = new Date(session.entryTime);
          return isWithinInterval(sessionDate, { start: dayStart, end: dayEnd });
        })
        .reduce((sum, session) => sum + (session.totalAmount || 0), 0);

      return {
        name: format(date, 'EEE'),
        revenue: dayRevenue,
        date: format(date, 'yyyy-MM-dd'),
      };
    });
  }, [sessions, dateRange]);

  // Get hourly data for drill-down
  const getHourlyData = (date: string) => {
    const targetDate = new Date(date);
    const start = startOfDay(targetDate);
    const end = endOfDay(targetDate);

    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: `${String(i).padStart(2, '0')}:00`,
      revenue: 0,
    }));

    sessions
      .filter(session => {
        const sessionDate = new Date(session.entryTime);
        return isWithinInterval(sessionDate, { start, end });
      })
      .forEach(session => {
        const sessionDate = new Date(session.entryTime);
        const hour = sessionDate.getHours();
        hourlyData[hour].revenue += session.totalAmount || 0;
      });

    return hourlyData;
  };

  const handleDateRangeChange = (newRange: [Date | null, Date | null]) => {
    setDateRange(newRange);
  };

  const handleBarClick = (data: any) => {
    const hourlyData = getHourlyData(data.date);
    setDrillDownData(hourlyData);
    setSelectedDate(data.date);
  };

  // Process vehicle type distribution
  const vehicleTypeData = useMemo(() => {
    const typeCount = vehicles.reduce((acc: { [key: string]: number }, vehicle) => {
      acc[vehicle.type] = (acc[vehicle.type] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(typeCount).map(([type, count]) => ({
      type,
      count,
    }));
  }, [vehicles]);

  // Calculate parking space utilization
  const parkingSpaceData = [
    { name: 'Occupied', value: activeSessions },
    { name: 'Available', value: TOTAL_CAPACITY - activeSessions },
  ];

  // Calculate monthly growth
  const monthlyGrowth = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const lastMonth = currentMonth - 1;

    const currentMonthRevenue = sessions
      .filter(session => new Date(session.entryTime).getMonth() === currentMonth)
      .reduce((sum, session) => sum + (session.totalAmount || 0), 0);

    const lastMonthRevenue = sessions
      .filter(session => new Date(session.entryTime).getMonth() === lastMonth)
      .reduce((sum, session) => sum + (session.totalAmount || 0), 0);

    const growth = lastMonthRevenue ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;
    return growth.toFixed(1);
  }, [sessions]);

  // Calculate trends for stats
  const trends = useMemo(() => {
    const currentDate = new Date();
    const previousDate = subDays(currentDate, 1);
    
    const currentDaySessions = sessions.filter(session => 
      isWithinInterval(new Date(session.entryTime), {
        start: startOfDay(currentDate),
        end: endOfDay(currentDate),
      })
    );
    
    const previousDaySessions = sessions.filter(session => 
      isWithinInterval(new Date(session.entryTime), {
        start: startOfDay(previousDate),
        end: endOfDay(previousDate),
      })
    );

    return {
      activeSessions: {
        value: activeSessions,
        previousValue: previousDaySessions.filter(s => !s.exitTime).length,
      },
      vehicles: {
        value: vehicles.length,
        previousValue: vehicles.filter(v => 
          'createdAt' in v && new Date((v as { createdAt: string }).createdAt) < startOfDay(currentDate)
        ).length,
      },
      revenue: {
        value: totalRevenue,
        previousValue: previousDaySessions.reduce(
          (sum, session) => sum + (session.totalAmount || 0),
          0
        ),
      },
      growth: {
        value: parseFloat(monthlyGrowth),
        previousValue: 0, // You might want to calculate this based on historical data
      },
    };
  }, [sessions, vehicles, activeSessions, totalRevenue, monthlyGrowth]);

  const stats = [
    {
      title: 'Active Sessions',
      value: activeSessions,
      icon: <SessionIcon />,
      color: '#2196f3',
      trend: trends.activeSessions,
    },
    {
      title: 'Registered Vehicles',
      value: vehicles.length,
      icon: <VehicleIcon />,
      color: '#4caf50',
      trend: trends.vehicles,
    },
    {
      title: 'Total Revenue',
      value: `$${totalRevenue.toFixed(2)}`,
      icon: <MoneyIcon />,
      color: '#f44336',
      trend: trends.revenue,
    },
    {
      title: 'Monthly Growth',
      value: `${monthlyGrowth}%`,
      icon: <TrendingUpIcon />,
      color: '#ff9800',
      trend: trends.growth,
    },
  ];

  // Add real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Refresh data every minute
      // You would typically dispatch an action to fetch fresh data here
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Dashboard Overview
      </Typography>
      
      {/* Stats Cards with Trend Indicators */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {stats.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.title}>
            <StatCard {...stat}>
              {stat.trend && <TrendIndicator {...stat.trend} />}
            </StatCard>
          </Grid>
        ))}
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Revenue Trend */}
        <Grid item xs={12} md={8}>
          <ChartCard 
            title="Revenue Trend"
            action={
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Start Date"
                    value={dateRange[0]}
                    onChange={(date) => handleDateRangeChange([date, dateRange[1]])}
                  />
                  <DatePicker
                    label="End Date"
                    value={dateRange[1]}
                    onChange={(date) => handleDateRangeChange([dateRange[0], date])}
                  />
                </LocalizationProvider>
                <Tooltip title="Refresh">
                  <IconButton onClick={() => setDateRange([subDays(new Date(), 7), new Date()])}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name"
                  tickFormatter={(value) => value}
                />
                <YAxis 
                  tickFormatter={(value) => `$${value}`}
                />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  name="Revenue"
                  dataKey="revenue"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ 
                    r: 8,
                    onClick: (_, payload: any) => handleBarClick(payload.payload),
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>

        {/* Vehicle Type Distribution */}
        <Grid item xs={12} md={4}>
          <ChartCard title="Vehicle Type Distribution">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={vehicleTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  name="Vehicles"
                  dataKey="count" 
                  fill="#82ca9d"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>

        {/* Parking Space Utilization */}
        <Grid item xs={12} md={4}>
          <ChartCard title="Parking Space Utilization">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={parkingSpaceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {parkingSpaceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
      </Grid>

      {/* Updated Drill-down Dialog */}
      <DrillDownDialog
        open={Boolean(drillDownData)}
        onClose={() => {
          setDrillDownData(null);
          setSelectedDate(null);
        }}
        data={drillDownData}
        title={`Daily Analysis - ${selectedDate ? format(new Date(selectedDate), 'MMMM d, yyyy') : ''}`}
        date={selectedDate}
        sessions={sessions}
        vehicles={vehicles}
      />
    </Box>
  );
} 